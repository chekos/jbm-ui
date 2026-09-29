"""Hidden-line drawing of a posed capsule rig, in exact lines and arcs.

Every part of the rig is the convex hull of equal spheres (a capsule is two, the palm several), so
its orthographic projection is the projected centres' convex hull offset by the radius: straight
edges joined by circular arcs. Each part's outline is split wherever it crosses another part's;
a piece outside every other part is on the hand's silhouette, and a piece inside another part is
drawn only when a ray from the camera shows its own part in front there. Pieces around a joint
two parts share (a knuckle both phalanges end in) are dropped: the bend reads from the silhouette.

Coordinates are Hand path units: x right, y down; depth grows away from the camera.
"""

import math

EPS = 1e-7
TAU = 2 * math.pi


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1])


def add(a, b):
    return (a[0] + b[0], a[1] + b[1])


def mul(a, k):
    return (a[0] * k, a[1] * k)


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1]


def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]


def norm(a):
    return math.hypot(a[0], a[1])


def unit(a):
    n = norm(a) or 1.0
    return (a[0] / n, a[1] / n)


def hull2(points):
    """Convex hull, counter-clockwise on screen (y down), without collinear points."""
    pts = sorted(set((round(p[0], 9), round(p[1], 9)) for p in points))
    if len(pts) <= 2:
        return pts

    def half(seq):
        h = []
        for p in seq:
            while len(h) > 1 and cross(sub(h[-1], h[-2]), sub(p, h[-2])) <= 1e-12:
                h.pop()
            h.append(p)
        return h

    lower, upper = half(pts), half(reversed(pts))
    return lower[:-1] + upper[:-1]


class Shape:
    """A part's projection: the hull of `centers` offset by `r`, with its outline as segments.

    Segments are ("L", a, b) or ("A", c, r, t0, t1) with t1 > t0; both run the same way round
    (increasing angle on screen), so the outline is one closed loop.
    """

    def __init__(self, name, centers, r):
        self.name = name
        self.r = r
        self.hull = hull2(centers)
        self.segs = []
        h = self.hull
        if len(h) == 1:
            self.segs.append(("A", h[0], r, 0.0, TAU))
            return
        n = len(h)
        normals = []
        for i in range(n):
            a, b = h[i], h[(i + 1) % n]
            d = unit(sub(b, a))
            # hull2 runs with positive cross products, so the outward normal is (d.y, -d.x).
            normals.append((d[1], -d[0]))
        for i in range(n):
            a, b = h[i], h[(i + 1) % n]
            nrm = normals[i]
            self.segs.append(("L", add(a, mul(nrm, r)), add(b, mul(nrm, r))))
            n2 = normals[(i + 1) % n]
            t0 = math.atan2(nrm[1], nrm[0])
            t1 = math.atan2(n2[1], n2[0])
            while t1 <= t0:
                t1 += TAU
            self.segs.append(("A", b, r, t0, t1))
        # The loop must advance with increasing angle round each arc: check the first line.
        if self.segs[0][0] == "L":
            a, b = self.segs[0][1], self.segs[0][2]
            arc = self.segs[1]
            start = add(arc[1], mul((math.cos(arc[3]), math.sin(arc[3])), r))
            assert norm(sub(start, b)) < 1e-6, (name, start, b)

    def distance(self, p):
        """Distance from p to the hull (0 inside it), less r: negative inside the shape."""
        h = self.hull
        if len(h) == 1:
            return norm(sub(p, h[0])) - self.r
        inside = True
        best = math.inf
        n = len(h)
        for i in range(n):
            a, b = h[i], h[(i + 1) % n]
            ab = sub(b, a)
            if n > 2 and cross(ab, sub(p, a)) < 0:
                inside = False
            t = max(0.0, min(1.0, dot(sub(p, a), ab) / (dot(ab, ab) or 1)))
            best = min(best, norm(sub(p, add(a, mul(ab, t)))))
        if n == 2:
            inside = False
        return (0.0 if inside else best) - self.r


def point_at(seg, u):
    """Point at parameter u in [0, 1] along a segment."""
    if seg[0] == "L":
        return add(seg[1], mul(sub(seg[2], seg[1]), u))
    _, c, r, t0, t1 = seg
    t = t0 + (t1 - t0) * u
    return (c[0] + r * math.cos(t), c[1] + r * math.sin(t))


def inward(seg, u, shape):
    """Unit vector into the shape at parameter u."""
    if seg[0] == "A":
        return unit(sub(seg[1], point_at(seg, u)))
    d = unit(sub(seg[2], seg[1]))
    return (-d[1], d[0])


def params_on(seg, p):
    """Parameter of point p (assumed on the segment's line or circle), or None if off its span."""
    if seg[0] == "L":
        ab = sub(seg[2], seg[1])
        u = dot(sub(p, seg[1]), ab) / (dot(ab, ab) or 1)
    else:
        _, c, r, t0, t1 = seg
        t = math.atan2(p[1] - c[1], p[0] - c[0])
        while t < t0 - 1e-9:
            t += TAU
        while t > t1 + 1e-9:
            t -= TAU
        if t < t0 - 1e-9:
            return None
        u = (t - t0) / (t1 - t0)
    return u if -1e-9 <= u <= 1 + 1e-9 else None


def line_circle(a, b, c, r):
    d = sub(b, a)
    f = sub(a, c)
    A, B, C = dot(d, d), 2 * dot(f, d), dot(f, f) - r * r
    disc = B * B - 4 * A * C
    if disc < 0 or A < EPS:
        return []
    s = math.sqrt(disc)
    return [add(a, mul(d, (-B + k * s) / (2 * A))) for k in (-1, 1)]


def circle_circle(c1, r1, c2, r2):
    d = norm(sub(c2, c1))
    if d < EPS or d > r1 + r2 or d < abs(r1 - r2):
        return []
    a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
    h = math.sqrt(max(0.0, r1 * r1 - a * a))
    e = unit(sub(c2, c1))
    m = add(c1, mul(e, a))
    return [add(m, mul((-e[1], e[0]), h)), add(m, mul((e[1], -e[0]), h))]


def crossings(s1, s2):
    # Coincident carriers (a knuckle circle two parts share, a shared straight edge) split at
    # each other's ends, so the duplicate pieces line up and one of each can be dropped.
    if s1[0] == s2[0] == "A" and norm(sub(s1[1], s2[1])) < 1e-6 and abs(s1[2] - s2[2]) < 1e-6:
        return [u for u in (params_on(s1, point_at(s2, 0)), params_on(s1, point_at(s2, 1))) if u is not None]
    if s1[0] == s2[0] == "L":
        d1, d2 = sub(s1[2], s1[1]), sub(s2[2], s2[1])
        if abs(cross(unit(d1), unit(d2))) < 1e-9 and abs(cross(unit(d1), sub(s2[1], s1[1]))) < 1e-6:
            return [u for u in (params_on(s1, s2[1]), params_on(s1, s2[2])) if u is not None]
    if s1[0] == "L" and s2[0] == "L":
        a, b, c, d = s1[1], s1[2], s2[1], s2[2]
        den = cross(sub(b, a), sub(d, c))
        if abs(den) < EPS:
            return []
        t = cross(sub(c, a), sub(d, c)) / den
        pts = [add(a, mul(sub(b, a), t))]
    elif s1[0] == "L":
        pts = line_circle(s1[1], s1[2], s2[1], s2[2])
    elif s2[0] == "L":
        pts = line_circle(s2[1], s2[2], s1[1], s1[2])
    else:
        pts = circle_circle(s1[1], s1[2], s2[1], s2[2])
    out = []
    for p in pts:
        u1, u2 = params_on(s1, p), params_on(s2, p)
        if u1 is not None and u2 is not None:
            out.append(u1)
    return out


def sub_seg(seg, u0, u1):
    if seg[0] == "L":
        return ("L", point_at(seg, u0), point_at(seg, u1))
    _, c, r, t0, t1 = seg
    return ("A", c, r, t0 + (t1 - t0) * u0, t0 + (t1 - t0) * u1)


def seg_length(seg):
    if seg[0] == "L":
        return norm(sub(seg[2], seg[1]))
    return seg[2] * (seg[4] - seg[3])


def visible_pieces(shapes, front_of, joints):
    """Split every outline where others cross it; keep what the camera sees.

    front_of(shape, point) -> the name of the part a camera ray through `point` hits first.
    joints: {shape name: [(centre, r), ...]} shared joint spheres to keep lines out of.
    Returns [(shape name, segment, "outline" | "inner")].
    """
    out = []
    for s in shapes:
        others = [o for o in shapes if o is not s]
        for seg in s.segs:
            cuts = {0.0, 1.0}
            for o in others:
                for oseg in o.segs:
                    for u in crossings(seg, oseg):
                        cuts.add(min(1.0, max(0.0, u)))
            cuts = sorted(cuts)
            for u0, u1 in zip(cuts, cuts[1:]):
                if u1 - u0 < 1e-6:
                    continue
                piece = sub_seg(seg, u0, u1)
                if seg_length(piece) < 1e-4:
                    continue
                m = point_at(piece, 0.5)
                covering = [o for o in others if o.distance(m) < -1e-6]
                if not covering:
                    if not any(q[2] == "outline" and on_piece(q[1], m) for q in out):
                        out.append((s.name, piece, "outline"))
                    continue
                # Inside the next phalanx at the knuckle they share: the end-on circle of a bone
                # pointing at the camera, never drawn.
                if any(norm(sub(m, c)) < r + 1e-3 and any(o.name == nb for o in covering)
                       for c, r, nb in joints.get(s.name, [])):
                    continue
                # The end cap round a shared joint is never a contour: it would hook the line's end.
                if piece[0] == "A" and any(norm(sub(piece[1], c)) < 1e-6 for c, r, nb in joints.get(s.name, [])):
                    continue
                probe = add(m, mul(inward(piece, 0.5, s), 0.15))
                if front_of(s, probe) == s.name and not any(on_piece(q[1], m) for q in out):
                    out.append((s.name, piece, "inner"))
    return out


def on_piece(seg, p, tol=1e-3):
    if seg[0] == "L":
        ab = sub(seg[2], seg[1])
        u = dot(sub(p, seg[1]), ab) / (dot(ab, ab) or 1)
        return 0 <= u <= 1 and norm(sub(point_at(seg, u), p)) < tol
    _, c, r, t0, t1 = seg
    if abs(norm(sub(p, c)) - r) > tol:
        return False
    u = params_on(seg, p) if t1 > t0 else None
    return u is not None


def svg_d(seg):
    """Path data for one segment, starting with its own move."""
    a = point_at(seg, 0)
    b = point_at(seg, 1)
    f = lambda v: f"{v:.3f}".rstrip("0").rstrip(".")
    if seg[0] == "L":
        return f"M{f(a[0])} {f(a[1])}L{f(b[0])} {f(b[1])}"
    _, c, r, t0, t1 = seg
    if t1 - t0 >= TAU - 1e-6:
        m = point_at(seg, 0.5)
        return f"M{f(a[0])} {f(a[1])}A{f(r)} {f(r)} 0 0 1 {f(m[0])} {f(m[1])}A{f(r)} {f(r)} 0 0 1 {f(a[0])} {f(a[1])}"
    large = 1 if t1 - t0 > math.pi else 0
    return f"M{f(a[0])} {f(a[1])}A{f(r)} {f(r)} 0 {large} 1 {f(b[0])} {f(b[1])}"


# ---------------------------------------------------------------------------------------------
# From visible pieces to one Hand path: wrist cut, fillets, spurs.


def seg_end(seg, which):
    return point_at(seg, 0 if which == 0 else 1)


def tangent(seg, u):
    """Unit direction of travel at parameter u."""
    if seg[0] == "L":
        return unit(sub(seg[2], seg[1]))
    _, c, r, t0, t1 = seg
    t = t0 + (t1 - t0) * u
    s = 1 if t1 > t0 else -1
    return (-math.sin(t) * s, math.cos(t) * s)


def reverse(seg):
    if seg[0] == "L":
        return ("L", seg[2], seg[1])
    _, c, r, t0, t1 = seg
    return ("A", c, r, t1, t0)


def arc_param(seg, p):
    """Parameter along an arc of any direction for a point on its circle (unclamped)."""
    _, c, r, t0, t1 = seg
    t = math.atan2(p[1] - c[1], p[0] - c[0])
    mid = (t0 + t1) / 2
    while t < mid - math.pi:
        t += TAU
    while t > mid + math.pi:
        t -= TAU
    return (t - t0) / (t1 - t0)


def param(seg, p):
    if seg[0] == "L":
        ab = sub(seg[2], seg[1])
        return dot(sub(p, seg[1]), ab) / (dot(ab, ab) or 1)
    return arc_param(seg, p)


def trim(seg, u0, u1):
    if seg[0] == "L":
        return ("L", point_at(seg, u0), point_at(seg, u1))
    _, c, r, t0, t1 = seg
    return ("A", c, r, t0 + (t1 - t0) * u0, t0 + (t1 - t0) * u1)


def offset_hits(s1, s2, rho):
    """Centres of circles of radius rho tangent to both segments' carriers, on their outer side
    (the right of travel: the material is on the left)."""
    def carrier(seg):
        if seg[0] == "L":
            d = unit(sub(seg[2], seg[1]))
            n = (d[1], -d[0])
            return ("L", add(seg[1], mul(n, rho)), add(seg[2], mul(n, rho)))
        _, c, r, t0, t1 = seg
        # Material inside a forward (increasing) arc, outside a backward one (a fillet).
        return ("C", c, r + rho if t1 > t0 else r - rho)

    a, b = carrier(s1), carrier(s2)
    if a[0] == "L" and b[0] == "L":
        p, q, u, v = a[1], a[2], b[1], b[2]
        den = cross(sub(q, p), sub(v, u))
        if abs(den) < EPS:
            return []
        t = cross(sub(u, p), sub(v, u)) / den
        return [add(p, mul(sub(q, p), t))]
    if a[0] == "L":
        return line_circle(a[1], a[2], b[1], b[2])
    if b[0] == "L":
        return line_circle(b[1], b[2], a[1], a[2])
    return circle_circle(a[1], a[2], b[1], b[2])


def foot(seg, z, rho):
    """Where a circle at z of radius rho touches the segment's carrier."""
    if seg[0] == "L":
        d = unit(sub(seg[2], seg[1]))
        n = (d[1], -d[0])
        return sub(z, mul(n, rho))
    _, c, r, t0, t1 = seg
    return add(c, mul(unit(sub(z, c)), r))


def fillet(s_in, s_out, x, rho):
    """Round the concave corner x between s_in (ending at x) and s_out (starting there).
    Returns (s_in trimmed, fillet arc, s_out trimmed, trimmed tail of s_in, trimmed head of s_out)
    or None when the radius does not fit."""
    best = None
    for z in offset_hits(s_in, s_out, rho):
        if norm(sub(z, x)) > rho * 4 + 2:
            continue
        y_in, y_out = foot(s_in, z, rho), foot(s_out, z, rho)
        u_in, u_out = param(s_in, y_in), param(s_out, y_out)
        if not (0.0 < u_in < 1.0 and 0.0 < u_out < 1.0):
            continue
        # The fillet runs with the material on its left: round z the other way from the shapes.
        a0 = math.atan2(y_in[1] - z[1], y_in[0] - z[0])
        a1 = math.atan2(y_out[1] - z[1], y_out[0] - z[0])
        while a1 > a0:
            a1 -= TAU
        if a0 - a1 > math.pi:
            continue
        cand = (trim(s_in, 0, u_in), ("A", z, rho, a0, a1), trim(s_out, u_out, 1),
                trim(s_in, u_in, 1), trim(s_out, 0, u_out))
        d = norm(sub(z, x))
        if best is None or d < best[0]:
            best = (d, cand)
    return best[1] if best else None


def clip_half(seg, a, b):
    """Parts of seg on the left of the directed line a->b (the kept side), as segments."""
    side = lambda p: cross(sub(b, a), sub(p, a))
    cuts = [0.0, 1.0]
    if seg[0] == "L":
        p, q = seg[1], seg[2]
        sp, sq = side(p), side(q)
        if sp * sq < 0:
            cuts.append(sp / (sp - sq))
    else:
        for p in line_circle(a, b, seg[1], seg[2]):
            u = arc_param(seg, p)
            if 0 < u < 1:
                cuts.append(u)
    cuts.sort()
    out = []
    for u0, u1 in zip(cuts, cuts[1:]):
        if u1 - u0 > 1e-9 and side(point_at(seg, (u0 + u1) / 2)) > 0:
            out.append(trim(seg, u0, u1))
    return out


def transform(seg, f, angle):
    """Apply the rigid map p -> f(p) (a rotation by angle plus a shift) to a segment."""
    if seg[0] == "L":
        return ("L", f(seg[1]), f(seg[2]))
    _, c, r, t0, t1 = seg
    return ("A", f(c), r, t0 + angle, t1 + angle)


def close(p, q, tol=1e-4):
    return norm(sub(p, q)) < tol


def chain_loop(outline):
    """Order outline pieces into closed loops by matching ends."""
    left = list(outline)
    loops = []
    while left:
        loop = [left.pop(0)]
        while True:
            end = seg_end(loop[-1][1], 1)
            nxt = next((i for i, p in enumerate(left) if close(seg_end(p[1], 0), end, 1e-3)), None)
            if nxt is None:
                break
            loop.append(left.pop(nxt))
        while True:
            start = seg_end(loop[0][1], 0)
            prv = next((i for i, p in enumerate(left) if close(seg_end(p[1], 1), start, 1e-3)), None)
            if prv is None:
                break
            loop.insert(0, left.pop(prv))
        loops.append(loop)
    return loops


def area(loop):
    pts = [seg_end(seg, 0) for _, seg in loop]
    return sum(cross(pts[i], pts[(i + 1) % len(pts)]) for i in range(len(pts))) / 2


def chord(pieces, a, b):
    """The outline's extent along the line a->b: the two outermost crossings, in order."""
    hits = []
    for _, seg, kind in pieces:
        if kind != "outline":
            continue
        if seg[0] == "L":
            den = cross(sub(seg[2], seg[1]), sub(b, a))
            if abs(den) < EPS:
                continue
            u = cross(sub(a, seg[1]), sub(b, a)) / den
            if 0 <= u <= 1:
                hits.append(point_at(seg, u))
        else:
            for p in line_circle(a, b, seg[1], seg[2]):
                if 0 <= arc_param(seg, p) <= 1:
                    hits.append(p)
    d = unit(sub(b, a))
    hits.sort(key=lambda p: dot(sub(p, a), d))
    return (hits[0], hits[-1]) if len(hits) >= 2 else None


def assemble(pieces, cut, rho=1.2):
    """One closed run of segments: the silhouette on the kept (left) side of the directed cut,
    every corner but the cut's two rounded by a fillet, and every inner line walked out and back
    from the corner it leaves, starting where its own part's outline meets the fillet (so it leaves
    tangentially). Returns (segments, inner pieces nothing reached)."""
    a, b = cut
    clipped = []
    for name, seg, kind in pieces:
        for part in clip_half(seg, a, b):
            if seg_length(part) > 1e-4:
                clipped.append((name, part, kind))
    loops = chain_loop([(n, s) for n, s, k in clipped if k == "outline"])
    loops.sort(key=lambda lp: -sum(seg_length(s) for _, s in lp))
    main = loops[0]
    # Closed holes (a gap seen through the grip) keep their contours as inner lines; open
    # fragments lie on another part's edge and are already drawn by it.
    holes = [lp for lp in loops[1:] if close(seg_end(lp[0][1], 0), seg_end(lp[-1][1], 1), 1e-3)]
    inner = [(n, s) for n, s, k in clipped if k == "inner"] + [p for lp in holes for p in lp]
    start, end = seg_end(main[0][1], 0), seg_end(main[-1][1], 1)
    main.append(("cut", ("L", end, start)))

    n = len(main)
    names = [p[0] for p in main]
    segs = [p[1] for p in main]
    fil, heads, tails = [None] * n, [None] * n, [None] * n
    for i in range(n):
        j = (i + 1) % n
        if "cut" in (names[i], names[j]):
            continue
        t_in, t_out = tangent(segs[i], 1), tangent(segs[j], 0)
        if abs(cross(t_in, t_out)) < 1e-3 and dot(t_in, t_out) > 0:
            continue
        x = seg_end(segs[i], 1)
        for r in (rho, rho * 0.6, rho * 0.35):
            got = fillet(segs[i], segs[j], x, r)
            if got:
                segs[i], fil[i], segs[j], tail, head = got
                tails[i], heads[j] = (tail, x), (head, x)
                break

    nodes = []

    def node(p):
        for k, q in enumerate(nodes):
            if close(p, q, 2e-3):
                return k
        nodes.append(p)
        return len(nodes) - 1

    adj = {}
    for idx, (nm, seg) in enumerate(inner):
        u, v = node(seg_end(seg, 0)), node(seg_end(seg, 1))
        adj.setdefault(u, []).append((idx, nm, seg))
        adj.setdefault(v, []).append((idx, nm, reverse(seg)))
    used = set()

    def dfs(k, out, shape=None):
        for idx, nm, seg in adj.get(k, []):
            if idx in used or (shape and nm != shape):
                continue
            used.add(idx)
            out.append(seg)
            dfs(node(seg_end(seg, 1)), out)
            out.append(reverse(seg))

    result = []
    for i in range(n):
        if heads[i]:
            bit, x = heads[i]
            spur = []
            dfs(node(x), spur, names[i])
            if spur:
                result += [reverse(bit)] + spur + [bit]
        result.append(segs[i])
        if tails[i]:
            bit, x = tails[i]
            spur = []
            dfs(node(x), spur)  # whatever is left at this corner, of any part
            if spur:
                result += [bit] + spur + [reverse(bit)]
        if fil[i]:
            result.append(fil[i])
    # Lines that end on another line mid-way (a T-junction, the hidden part's contour coming out
    # from behind) are walked out and back from that point; the junction is a deliberate corner.
    corners = []
    progress = True
    while progress:
        progress = False
        for idx, (nm, seg) in enumerate(inner):
            if idx in used:
                continue
            for end in (seg_end(seg, 0), seg_end(seg, 1)):
                for k, host in enumerate(result):
                    u = param(host, end)
                    if not (1e-4 < u < 1 - 1e-4) or norm(sub(point_at(host, u), end)) > 2e-3:
                        continue
                    spur = []
                    dfs(node(end), spur)
                    if not spur:
                        continue
                    result[k:k + 1] = [trim(host, 0, u)] + spur + [trim(host, u, 1)]
                    corners.append(end)
                    progress = True
                    break
                if progress:
                    break
            if progress:
                break
    loose = [inner[i] for i in range(len(inner)) if i not in used]
    return result, loose, corners


def path_d(segs):
    """SVG path data for a closed run of segments."""
    f = lambda v: f"{v:.3f}".rstrip("0").rstrip(".") if abs(v) > 5e-4 else "0"
    a = point_at(segs[0], 0)
    out = [f"M{f(a[0])} {f(a[1])}"]
    for i, seg in enumerate(segs):
        b = point_at(seg, 1)
        last = i == len(segs) - 1
        if seg[0] == "L":
            out.append("Z" if last else f"L{f(b[0])} {f(b[1])}")
            continue
        _, c, r, t0, t1 = seg
        sweep = 1 if t1 > t0 else 0
        large = 1 if abs(t1 - t0) > math.pi else 0
        out.append(f"A{f(r)} {f(r)} 0 {large} {sweep} {f(b[0])} {f(b[1])}")
        if last:
            out.append("Z")
    return " ".join(out)


def with_end(seg, which, p):
    """A line with one end moved to p (the forearm's sides are lines)."""
    if seg[0] != "L" or norm(sub(seg[1 + which], p)) > 0.3:
        print(f"lineart: the wrist corner moves {norm(sub(point_at(seg, which), p)):.2f} to the shared cut")
    if seg[0] != "L":
        return seg
    return ("L", p, seg[2]) if which == 0 else ("L", seg[1], p)
