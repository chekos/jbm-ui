"""Redraw the `write` Hand pose from its traced reference (#177).

    uvx --with scikit-image --with pillow --with numpy python tools/blender/hand/trace/skeleton.py \
        tools/blender/hand/reference/write.quiver.svg
    uvx --with numpy python tools/blender/hand/trace/write.py
    node tools/blender/hand/preview.mjs write

The reference (reference/write.quiver.svg, Quiver Arrow in Paper, page "hands", artboard "Hands v7
· write (Quiver Arrow)") is line art at the Hand's own weight: its stroke is the outline token at
scale 0.45. This script keeps its line centres exactly and only adds the Hand's construction: the
silhouette as one path from the right wrist corner round to the left one, every valley rounded
into a fillet, each inner line (the knuckle dividers, the thumb's top edge and web crease, its
underside) walked out and back from where it leaves the outline, and the few contours the pen hides
completed. Traced stretches become Catmull-Rom curves through their simplified points (tangent
continuous); fingertips are fitted circles. Writes out/write.hand.json (path, front, transform,
stroke, and Pluma's pen placement) and out/write.trace.svg (the path over the reference).
"""

import json
import math
from pathlib import Path

import numpy as np

HAND = Path(__file__).resolve().parent.parent
OUT = HAND / "out"
REF = HAND / "reference" / "write.quiver.svg"
B = [np.array(b) for b in json.loads((OUT / "write.quiver.branches.json").read_text())]
FILL = json.loads((OUT / "write.quiver.fill.json").read_text())

SCALE = 0.45  # the reference's stroke is the Hand's outline at this scale
PINCH_SLANT = 128.29  # Pluma pinch's nib direction at angle 0 (degrees): write matches it
FIL = 1.2  # how far each side of a valley is trimmed back for its fillet


# ----- polylines and curves -----
def cross(a, b):
    return float(a[0] * b[1] - a[1] * b[0])


def unit(v):
    v = np.asarray(v, float)
    return v / (np.hypot(*v) or 1)


def arclen(a):
    return np.concatenate([[0], np.cumsum(np.hypot(*np.diff(a, axis=0).T))])


def smooth(a, w=9):
    """Moving average over w points (about 0.45 units), ends kept: irons out skeleton noise."""
    a = np.asarray(a, float)
    if len(a) < 2 * w:
        return a
    out = a.copy()
    for j in (0, 1):
        out[w // 2:-(w // 2), j] = np.convolve(a[:, j], np.ones(w) / w, mode="valid")
    return out


def stretch(i, a, z):
    """Branch i's points from the one nearest a to the one nearest z, smoothed."""
    b = B[i]
    ia = int(np.argmin(np.hypot(*(b - a).T)))
    iz = int(np.argmin(np.hypot(*(b - z).T)))
    return smooth(b[ia:iz + 1] if ia <= iz else b[iz:ia + 1][::-1])


def trim(a, d0=0.0, d1=0.0):
    """Cut d0 off the start and d1 off the end (by arc length), interpolating the new ends."""
    s = arclen(a)
    at = lambda t: np.array([np.interp(t, s, a[:, 0]), np.interp(t, s, a[:, 1])])
    return np.vstack([at(d0), a[(s > d0) & (s < s[-1] - d1)], at(s[-1] - d1)])


def rdp(a, eps):
    d = a[-1] - a[0]
    v = a - a[0]
    dist = np.abs(d[0] * v[:, 1] - d[1] * v[:, 0]) / (np.hypot(*d) or 1)
    i = int(np.argmax(dist))
    if len(a) > 2 and dist[i] > eps:
        return np.vstack([rdp(a[:i + 1], eps)[:-1], rdp(a[i:], eps)])
    return a[[0, -1]]


def end_dir(a, which, span=1.5):
    """Direction of travel at a stretch's start (0) or end (1), averaged over `span` units."""
    a = np.asarray(a, float)[:: 1 if which == 0 else -1]
    j = min(len(a) - 1, max(1, int(np.searchsorted(arclen(a), span))))
    d = unit(a[j] - a[0])
    return d if which == 0 else -d


def spline(pts, t0=None, t1=None, eps=0.3):
    """Cubic segments (p0, c1, c2, p3) through the simplified points, tangent continuous; end
    tangents given or averaged over the stretch's last 1.5 units."""
    pts = np.asarray(pts, float)
    t0 = end_dir(pts, 0) if t0 is None else unit(t0)
    t1 = end_dir(pts, 1) if t1 is None else unit(t1)
    p = rdp(pts, eps)
    n = len(p)
    T = [(p[min(i + 1, n - 1)] - p[max(i - 1, 0)]) / 2 for i in range(n)]
    T[0], T[-1] = t0 * np.hypot(*(p[1] - p[0])), t1 * np.hypot(*(p[-1] - p[-2]))
    return [(p[i], p[i] + T[i] / 3, p[i + 1] - T[i + 1] / 3, p[i + 1]) for i in range(n - 1)]


def start_tan(segs):
    s = segs[0]
    return unit(s[1] - s[0])


def end_tan(segs):
    s = segs[-1]
    return unit(s[3] - s[2])


def bridge(p, tp, q, tq):
    """A corner fillet from p (leaving along tp) to q (arriving along tq): control points on the
    two tangent lines toward where they meet, so the round has no S-bend. Near-straight joins,
    whose tangent lines don't meet ahead of both ends, get handles a third of the gap long."""
    tp, tq, r = unit(tp), unit(tq), q - p
    den = -tp[0] * tq[1] + tp[1] * tq[0]
    if abs(den) > 1e-6:
        t = (-r[0] * tq[1] + r[1] * tq[0]) / den
        u = (tp[0] * r[1] - tp[1] * r[0]) / den
        if t > 0 and u > 0:
            return [(p, p + tp * t * 0.55, q - tq * u * 0.55, q)]
    d = np.hypot(*r) * 0.3
    return [(p, p + tp * d, q - tq * d, q)]


def rev(segs):
    return [(s[3], s[2], s[1], s[0]) for s in reversed(segs)]


def line(p, q):
    p, q = np.asarray(p, float), np.asarray(q, float)
    return [(p, p + (q - p) / 3, p + 2 * (q - p) / 3, q)]


# ----- circles -----
def circle_fit(pts):
    A = np.c_[2 * pts, np.ones(len(pts))]
    cx, cy, c = np.linalg.lstsq(A, (pts ** 2).sum(1), rcond=None)[0]
    return np.array([cx, cy]), math.sqrt(c + cx * cx + cy * cy)


def P(c, r, a):
    return c + r * np.array([math.cos(a), math.sin(a)])


def ang(c, p):
    return math.atan2(p[1] - c[1], p[0] - c[0])


def tan_dec(a):
    """Direction of travel round a circle with decreasing angle."""
    return np.array([math.sin(a), -math.cos(a)])


def arc(c, r, a0, a1):
    n = max(1, math.ceil(abs(a1 - a0) / (math.pi / 4)))
    out = []
    for i in range(n):
        u, v = a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n
        k = 4 / 3 * math.tan((v - u) / 4)
        D = lambda t: r * np.array([-math.sin(t), math.cos(t)])
        out.append((P(c, r, u), P(c, r, u) + k * D(u), P(c, r, v) - k * D(v), P(c, r, v)))
    return out


def below(a, ref):
    """a moved by whole turns to just below ref (for a decreasing-angle arc from ref)."""
    while a > ref:
        a -= 2 * math.pi
    while a < ref - 2 * math.pi:
        a += 2 * math.pi
    return a


def fillet_arc(z, r, p, q):
    """The short arc round z from p to q."""
    a0, a1 = ang(z, p), ang(z, q)
    while a1 - a0 > math.pi:
        a1 -= 2 * math.pi
    while a0 - a1 > math.pi:
        a1 += 2 * math.pi
    return arc(z, r, a0, a1)


def circle_fillet(c1, r1, c2, r2, rho, near):
    """A circle of radius rho outside both circles and touching each, on the side of `near`.
    Returns its centre and where it touches each."""
    d = np.hypot(*(c2 - c1))
    R1, R2 = r1 + rho, r2 + rho
    a = (R1 * R1 - R2 * R2 + d * d) / (2 * d)
    h = math.sqrt(max(0, R1 * R1 - a * a))
    e = unit(c2 - c1)
    n = np.array([-e[1], e[0]])
    z = min((c1 + e * a + n * h, c1 + e * a - n * h), key=lambda z: np.hypot(*(z - near)))
    return z, c1 + unit(z - c1) * r1, c2 + unit(z - c2) * r2


# ----- the reference's parts (branch numbers from skeleton.py's branches.png) -----
R_CORNER, L_CORNER = np.array([71.72, 66.35]), np.array([54.9, 74.35])  # the wrist cut's ends
side_top = np.array([69.2, 55.95])
little = stretch(0, (69.05, 54.9), (67.85, 44.0))  # little-finger knuckle, up to valley V1
ring = stretch(3, (67.85, 43.95), (63.7, 34.6))  # ring knuckle, V1 to V2
middle = stretch(2, (63.7, 34.6), (53.05, 24.75))  # middle knuckle and the back of the hand
index = stretch(1, (43.85, 19.95), (16.35, 43.95))  # index: top edge and tip
lower = stretch(0, (27.05, 52.3), (54.75, 74.25))  # thumb and palm underside to the wrist
tc, tr = circle_fit(np.vstack([B[i] for i in (8, 17, 18, 20)]))  # thumb tip
ic, ir = circle_fit(B[1][:40])  # index tip
mc, mr = circle_fit(np.vstack([B[5], B[22]]))  # middle fingertip, under the thumb

# Right side and knuckles, each valley rounded.
side = line(R_CORNER, side_top)
little_sp = spline(trim(little, 0.9, FIL))
ring_sp = spline(trim(ring, FIL, FIL))
middle_sp = spline(trim(middle, FIL, 0))
# Index: its traced top edge, then its tip circle round to J.
a_idx0 = ang(ic, (16.35, 43.95))
index[-1] = P(ic, ir, a_idx0)  # end exactly on the tip circle it runs into
index_sp = spline(index, t1=tan_dec(a_idx0))

# J: the index tip and the thumb tip meet in a round notch on the nib's side (the pen covers it).
zJ, footJ_index, footJ_thumb = circle_fillet(ic, ir, tc, tr, 1.0, np.array([21.5, 46.5]))
index_tip = arc(ic, ir, a_idx0, below(ang(ic, footJ_index), a_idx0))
notch_J = fillet_arc(zJ, 1.0, footJ_index, footJ_thumb)
# K: the thumb's side runs down to the middle fingertip.
zK, footK_thumb, footK_middle = circle_fillet(tc, tr, mc, mr, 1.0, np.array([21.5, 48.5]))
a_t0 = ang(tc, footJ_thumb)
a_t1 = below(ang(tc, footK_thumb), a_t0)
thumb_side = arc(tc, tr, a_t0, a_t1)
notch_K = fillet_arc(zK, 1.0, footK_thumb, footK_middle)
a_m0 = ang(mc, footK_middle)
a_m1 = below(ang(mc, (27.0, 52.3)), a_m0)
middle_tip = arc(mc, mr, a_m0, a_m1)
# L on to the wrist: the underside, straight for its last stretch into the corner.
low = trim(lower, FIL, 0)
cut_in = L_CORNER + unit(low[-8] - L_CORNER) * 1.6
low_sp = spline(np.vstack([low[np.hypot(*(low - L_CORNER).T) > 1.6], cut_in]), t1=unit(L_CORNER - cut_in))

# ----- inner lines, walked out and back -----
def divider(after, stretch_pts, tick):
    """A knuckle's contour carried back past its valley into the palm (a divider)."""
    head = trim(stretch_pts, 0, arclen(stretch_pts)[-1] - FIL)[::-1]
    tick = tick if np.hypot(*(tick[0] - stretch_pts[0])) < np.hypot(*(tick[-1] - stretch_pts[0])) else tick[::-1]
    out = spline(np.vstack([head, tick]), t0=-start_tan(after))
    return out + rev(out)


divider_V1 = divider(ring_sp, ring, B[9])
divider_V2 = divider(middle_sp, middle, B[10])
# The thumb's top edge: over its tip from J, along the traced edge, round the V, up the web crease.
edge = np.vstack([B[6], B[21], B[4][::-1]])
a_top = ang(tc, edge[0])
while a_top < a_t0:
    a_top += 2 * math.pi
a_edge = min(np.linspace(a_t0, a_top, 200), key=lambda a: abs(cross(-tan_dec(a), unit(edge[0] - P(tc, tr, a))))
             + (0 if np.dot(-tan_dec(a), edge[0] - P(tc, tr, a)) > 0 else 9))
thumb_top = arc(tc, tr, a_t0, a_edge)
edge_sp = spline(np.vstack([P(tc, tr, a_edge), edge]), t0=-tan_dec(a_edge))
thumb_edge = thumb_top + edge_sp + rev(edge_sp) + rev(thumb_top)
# The thumb's underside, in front of the middle fingertip, from K until it meets the outline.
under = B[7] if np.hypot(*(B[7][0] - footK_thumb)) < np.hypot(*(B[7][-1] - footK_thumb)) else B[7][::-1]
under_sp = spline(trim(np.vstack([footK_thumb, smooth(under[3:])]), 0, 0.35), t0=tan_dec(a_t1))
thumb_under = under_sp + rev(under_sp)

loop = (
    side + bridge(side_top, unit(side_top - R_CORNER), little_sp[0][0], start_tan(little_sp)) + little_sp
    + bridge(little_sp[-1][3], end_tan(little_sp), ring_sp[0][0], start_tan(ring_sp)) + divider_V1 + ring_sp
    + bridge(ring_sp[-1][3], end_tan(ring_sp), middle_sp[0][0], start_tan(middle_sp)) + divider_V2 + middle_sp
    # Under the pen the back of the hand runs on into the index knuckle.
    + bridge(middle_sp[-1][3], end_tan(middle_sp), index_sp[0][0], start_tan(index_sp)) + index_sp
    + index_tip + notch_J + thumb_edge + thumb_side + thumb_under + notch_K + middle_tip
    + bridge(middle_tip[-1][3], tan_dec(a_m1), low_sp[0][0], start_tan(low_sp)) + low_sp + line(cut_in, L_CORNER)
)


# ----- output -----
def num(v):
    s = f"{v:.3f}".rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s


def path_d(segs):
    out = [f"M{num(segs[0][0][0])} {num(segs[0][0][1])}"]
    for p0, c1, c2, p3 in segs:
        straight = all(abs(cross(p3 - p0, c - p0)) < 1e-9 for c in (c1, c2))
        out.append(f"L{num(p3[0])} {num(p3[1])}" if straight
                   else f"C{num(c1[0])} {num(c1[1])} {num(c2[0])} {num(c2[1])} {num(p3[0])} {num(p3[1])}")
    return " ".join(out) + " Z"


d = path_d(loop)
# In front of the pen: the thumb, bounded by its drawn contours (tip, top edge, underside).
body = np.vstack([P(tc, tr, a_edge), B[6], under[::-1], footK_thumb])
front = path_d(arc(tc, tr, 0, 2 * math.pi)) + " M" + " L".join(f"{num(x)} {num(y)}" for x, y in body) + " Z"

# The pen, on the reference's measured axis; the grip is where it crosses J's notch.
axis_pt, u_pen = np.array(FILL["point"]), unit(FILL["axis"])
on_axis = lambda q: axis_pt + u_pen * np.dot(np.asarray(q) - axis_pt, u_pen)
nib, grip, tail = on_axis((7.3, 56.8)), on_axis(zJ), np.array(FILL["ends"][1])
turn = PINCH_SLANT - math.degrees(math.atan2(*(nib - grip)[::-1]))
cs, sn = math.cos(math.radians(turn)), math.sin(math.radians(turn))
T = lambda p: SCALE * np.array([p[0] * cs - p[1] * sn, p[0] * sn + p[1] * cs])
ends = [T(s[i]) for s in loop for i in (0, 3)]
xs, ys = [q[0] for q in ends], [q[1] for q in ends]
tx, ty = (30 - max(xs) - min(xs)) / 2, (29 - max(ys) - min(ys)) / 2
view = lambda p: [round(float(T(p)[0] + tx), 3), round(float(T(p)[1] + ty), 3)]
result = {
    "d": d,
    "front": front,
    "transform": f"translate({tx:.3f} {ty:.3f}) rotate({turn:.2f}) scale({SCALE})",
    "stroke": f"+(VIEW_OUTLINE / {SCALE}).toFixed(4)",
    "pen": {"grip": view(grip), "nib": view(nib), "tailLength": round(float(np.hypot(*(tail - grip))) * SCALE, 3)},
}
(OUT / "write.hand.json").write_text(json.dumps(result, indent=2) + "\n")
ref = REF.read_text()
ref_body = ref[ref.index(">", ref.index("<svg")) + 1: ref.rindex("</svg>")]
(OUT / "write.trace.svg").write_text(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="1000" height="1000">'
    f'<rect width="80" height="80" fill="#fff"/><g opacity="0.3">{ref_body}</g>'
    f'<path d="{d}" fill="none" stroke="#06c" stroke-width="0.3" stroke-linejoin="round"/>'
    f'<path d="{front}" fill="#f0a" fill-opacity="0.15"/></svg>\n')
print(f"write.py: {len(loop)} segments; turned {turn:.2f} degrees; spans {max(xs) - min(xs):.2f} x {max(ys) - min(ys):.2f}")
