"""Build the capsule hand rig in Blender, pose it, and export its projected landmarks.

Run headless from the repo root (see ../README.md):

    blender -b --factory-startup -P tools/blender/hand/rig.py -- --pose grip

Writes to tools/blender/hand/out/: <pose>.json (every bone projected into Hand path units, with
depth), <pose>.png (a shaded preview, parts tinted: thumb red, index blue, middle green, pen yellow),
and with --blend, <pose>.blend (the posed rig, for posing by hand in the Blender UI; re-export with
--from-blend). --draw also traces the visible contours (lineart.py) to <pose>.lines.svg and
assembles a Hand path on the shared wrist cut, with the pen's placement, in <pose>.hand.json and
<pose>.hand.svg.
"""

import argparse
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lineart  # noqa: E402
from mathutils import Euler, Matrix, Vector

HERE = Path(__file__).resolve().parent
FINGERS = ("index", "middle", "ring", "little")
JOINTS = ("mcp", "pip", "dip", "tip")
THUMB_JOINTS = ("cmc", "mcp", "ip", "tip")
# The camera frames the Hand's 30x29 viewBox (path units 10.7-73.2 across, 10.9-71.3 down).
FRAME = {"center": (42, 41), "size": 64, "pixels": 1280}


def world(point, depth=0.0):
    """Hand path units (x right, y down, optional depth) to Blender world (x, depth, -y)."""
    return Vector((point[0], point[2] if len(point) > 2 else depth, -point[1]))


def path(v):
    return [round(v.x, 3), round(-v.z, 3)]


def args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(prog="rig.py")
    parser.add_argument("--pose", required=True)
    parser.add_argument("--out", default=str(HERE / "out"))
    parser.add_argument(
        "--fit3d", nargs="+", metavar="BONE", help="solve these bones and the pen so the pose's touches hold"
    )
    parser.add_argument("--view", type=float, nargs=3, metavar="DEG", help="override the pose's view")
    parser.add_argument("--look", type=float, nargs=3, metavar="XYZ", help="override the pose's look")
    parser.add_argument("--draw", action="store_true", help="also trace the visible lines to <pose>.lines.svg")
    parser.add_argument("--blend", action="store_true", help="also save the posed rig")
    parser.add_argument(
        "--fit",
        nargs="+",
        metavar="BONE",
        help="solve these bones' angles toward the pose's reference landmarks and print them",
    )
    parser.add_argument(
        "--from-blend", action="store_true", help="export out/<pose>.blend as posed in the UI"
    )
    return parser.parse_args(argv)


def hull_object(name, centers, r, bone, rig):
    """A mesh of the convex hull of spheres at centers: a capsule for two, the palm for more."""
    bm = bmesh.new()
    template = bmesh.new()
    bmesh.ops.create_icosphere(template, subdivisions=3, radius=r)
    points = [v.co.copy() for v in template.verts]
    template.free()
    verts = [bm.verts.new(c + p) for c in centers for p in points]
    hull = bmesh.ops.convex_hull(bm, input=verts)
    doomed = {v for v in hull["geom_interior"] + hull["geom_unused"] if isinstance(v, bmesh.types.BMVert)}
    bmesh.ops.delete(bm, geom=list(doomed), context="VERTS")
    return mesh_object(name, bm, bone, rig)


def mesh_object(name, bm, bone, rig):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.vertex_groups.new(name=bone).add(range(len(mesh.vertices)), 1.0, "REPLACE")
    if rig:
        obj.parent = rig
        obj.modifiers.new("Armature", "ARMATURE").object = rig
    return obj


def build(spec):
    """Armature + one capsule mesh per bone, in rest pose."""
    r = spec["radius"]
    data = bpy.data.armatures.new("Hand")
    rig = bpy.data.objects.new("Hand", data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")

    root = data.edit_bones.new("hand")
    root.head = world(spec["pivot"])
    root.tail = root.head + Vector((0, 0, 10))  # straight up: local X, Y, Z = world X, Z, -Y

    segments = {}
    for name in FINGERS:
        finger = spec["fingers"][name]
        head = world(finger["mcp"])
        parent = root
        for i, length in enumerate(finger["lengths"], 1):
            bone = data.edit_bones.new(f"{name}.{i}")
            bone.head, bone.tail = head, head + Vector((0, 0, length))
            bone.parent, bone.use_connect = parent, i > 1
            segments[bone.name] = (bone.head.copy(), bone.tail.copy())
            head, parent = bone.tail.copy(), bone

    thumb = spec["thumb"]
    direction = (world(thumb["direction"]) - world((0, 0, 0))).normalized()
    head, parent = world(thumb["cmc"]), root
    for i, length in enumerate(thumb["lengths"]):
        bone = data.edit_bones.new(f"thumb.{i}")
        bone.head, bone.tail = head, head + direction * length
        bone.parent, bone.use_connect = parent, i > 0
        bone.roll = 0
        segments[bone.name] = (bone.head.copy(), bone.tail.copy())
        head, parent = bone.tail.copy(), bone
    bpy.ops.object.mode_set(mode="OBJECT")

    for i, (bone, (a, b)) in enumerate(segments.items()):
        # A hair thinner per bone, so coincident joint spheres don't z-fight in the preview.
        hull_object(bone, (a, b), r * (1 - 0.015 * (i % 3)), bone, rig)
    palm = spec["palm"]
    hull_object("palm", [world(p) for p in palm["points"]], palm["radius"], "hand", rig)
    return rig


def apply_pose(rig, pose):
    """Joint angles in degrees, XYZ Euler in each bone's own axes (X flexes toward the palm)."""
    for pbone in rig.pose.bones:
        pbone.rotation_mode = "XYZ"
        pbone.rotation_euler = (0, 0, 0)
    for name, angles in pose.get("rotations", {}).items():
        targets = [b for b in rig.pose.bones if b.name == name or b.name.startswith(f"{name}.")]
        if name in FINGERS:  # a finger's single entry is [mcp, pip, dip] flexion
            for pbone, flex in zip(targets, angles):
                pbone.rotation_euler = Euler((math.radians(flex), 0, 0))
            continue
        for pbone in targets:
            pbone.rotation_euler = Euler([math.radians(a) for a in angles])
    if "look" in pose:
        apply_look(rig, pose["look"], pose.get("facing"))
    else:
        apply_view(rig, pose.get("view", (0, 0, 0)), pose.get("facing"))


def apply_look(rig, look, facing=None):
    """Point the camera along `look`, a direction in the hand's frame (x toward the little finger,
    y toward the wrist, depth toward the back of the hand), turning about the frame's centre."""
    mirror = Matrix.Diagonal((1, -1 if facing == "away" else 1, 1, 1))
    root = rig.pose.bones["hand"]
    rest = mirror @ root.matrix @ root.bone.matrix_local.inverted()
    d = (rest.to_3x3() @ Vector((look[0], look[2], -look[1]))).normalized()
    turn = d.rotation_difference(Vector((0, 1, 0))).to_matrix().to_4x4()
    centre = world(FRAME["center"])
    rig.matrix_world = Matrix.Translation(centre) @ turn @ Matrix.Translation(-centre) @ mirror
    bpy.context.view_layer.update()


def apply_view(rig, view, facing=None):
    """Turn the whole rig (hand and pen) about the frame's centre: [pitch, yaw, roll] in degrees
    about the screen's horizontal, vertical, and depth axes. Facing "away" shows the back of the
    hand, thumb still on the left (a mirrored hand)."""
    pitch, yaw, roll = (math.radians(a) for a in view)
    centre = world(FRAME["center"])
    turn = Matrix.Rotation(roll, 4, "Y") @ Matrix.Rotation(pitch, 4, "X") @ Matrix.Rotation(yaw, 4, "Z")
    mirror = Matrix.Diagonal((1, -1 if facing == "away" else 1, 1, 1))
    rig.matrix_world = Matrix.Translation(centre) @ turn @ Matrix.Translation(-centre) @ mirror
    bpy.context.view_layer.update()


def add_pen(pen, rig):
    """A capsule pen held in the hand's frame (path units plus depth, before facing and the root's
    turn), so it moves with the hand. Depth is negative on the palm side."""
    hull_object("pen", (world(pen["nib"]), world(pen["tail"])), pen["radius"], "hand", rig)


def point3(rig, joint):
    """A landmark in the hand's frame as (x, y, depth)."""
    finger, _, name = joint.partition(".")
    joints = THUMB_JOINTS if finger == "thumb" else JOINTS
    first = 0 if finger == "thumb" else 1
    i = joints.index(name)
    bone = rig.pose.bones[f"{finger}.{first + min(i, 2)}"]
    v = bone.tail if i == 3 else bone.head
    return Vector((v.x, -v.z, v.y))


def fit3d(rig, bones, pose):
    """Coordinate descent on the named bones' angles and the pen's two ends until every joint in
    the pose's `touch` list rests on the pen (its centre a finger radius plus the pen's radius from
    the pen's axis) on its `side` (a direction in the hand's frame: x toward the little finger, y
    toward the wrist, depth toward the back of the hand), near its `t` along the pen (0 at the
    nib), and the pen keeps its length. The pen stays where the pose puts it unless `pen_free`. Finger flexion stays within -10..110 degrees; no bone sinks into the pen."""
    pen = pose["pen"]
    touch = pose["touch"]
    prior = pose.get("prior", {})
    lean = Vector(pen["lean"]).normalized() if "lean" in pen else None
    reach = pen["radius"] + 3.2
    length = (Vector(pen["tail"]) - Vector(pen["nib"])).length
    ends = [Vector(pen["nib"]), Vector(pen["tail"])]
    free = []
    for spec in bones:
        name, _, axes = spec.partition(":")
        free.append((rig.pose.bones[name], ["xyz".index(a) for a in axes or "xyz"]))
    root = rig.pose.bones["hand"]
    turn = root.rotation_euler.copy()
    root.rotation_euler = (0, 0, 0)

    def along(q):
        a, b = ends
        t = max(0, min(1, (q - a).dot(b - a) / (b - a).length_squared))
        return t, (q - a.lerp(b, t)).length

    def error():
        bpy.context.view_layer.update()
        cost = ((ends[1] - ends[0]).length - length) ** 2
        for joint, want in touch.items():
            q = point3(rig, joint)
            t, d = along(q)
            cost += (d - reach) ** 2 + 20 * (t - want["t"]) ** 2
            # From the pen's axis the joint lies toward `side` (in the hand's frame).
            a, b = ends
            axis = (b - a).normalized()
            off = q - a.lerp(b, t)
            side = Vector(want["side"])
            side = side - axis * side.dot(axis)
            if off.length > 1e-6 and side.length > 1e-6:
                cost += 30 * (1 - off.normalized().dot(side.normalized()))
        for pbone in rig.pose.bones:
            finger = pbone.name.split(".")[0]
            if finger in FINGERS:
                flex = math.degrees(pbone.rotation_euler.x)
                cost += max(0, -15 - flex, flex - 95) ** 2 * 0.1
                want = prior.get(finger)
                if want:
                    cost += 0.002 * (flex - want[int(pbone.name.split(".")[1]) - 1]) ** 2
        if lean is not None:
            u = (ends[1] - ends[0]).normalized()
            cost += 30 * (1 - u.dot(lean))
            if pbone.name != "hand":
                for k in (0, 0.5, 1):
                    v = pbone.head.lerp(pbone.tail, k)
                    _, d = along(Vector((v.x, -v.z, v.y)))
                    cost += max(0, reach - 0.3 - d) ** 2 * 4
        return cost

    best = error()
    for step in (4.0, 2.0, 1.0, 0.5, 0.25, 0.125):
        rad = math.radians(step * 4)
        improved = True
        while improved:
            improved = False
            for pbone, axes in free:
                for axis in axes:
                    for sign in (1, -1):
                        pbone.rotation_euler[axis] += sign * rad
                        e = error()
                        if e < best - 1e-9:
                            best, improved = e, True
                            break
                        pbone.rotation_euler[axis] -= sign * rad
            for end in (ends if pose.get("pen_free") else []):
                for axis in range(3):
                    for sign in (1, -1):
                        end[axis] += sign * step
                        e = error()
                        if e < best - 1e-9:
                            best, improved = e, True
                            break
                        end[axis] -= sign * step
    error()
    for joint, want in touch.items():
        q = point3(rig, joint)
        t, d = along(q)
        a, b = ends
        axis = (b - a).normalized()
        side = Vector(want["side"])
        side = (side - axis * side.dot(axis)).normalized()
        off = (q - a.lerp(b, t)).normalized()
        print(f"rig.py:   {joint} at t {t:.2f} (wants {want['t']}), {d - reach:+.2f} from the pen's surface, "
              f"{math.degrees(math.acos(max(-1, min(1, off.dot(side))))):.0f} deg off its side")
    root.rotation_euler = turn
    bpy.context.view_layer.update()
    pen_fit = {"nib": [round(c, 2) for c in ends[0]], "tail": [round(c, 2) for c in ends[1]]}
    return {
        b.name: [round(math.degrees(a), 1) for a in b.rotation_euler] for b, _ in free
    }, pen_fit, math.sqrt(best)


def landmarks(rig):
    m = rig.matrix_world
    bones = {}
    for pbone in rig.pose.bones:
        head, tail = m @ pbone.head, m @ pbone.tail
        bones[pbone.name] = {
            "head": path(head),
            "tail": path(tail),
            "depth": [round(head.y, 3), round(tail.y, 3)],
        }
    points = {}
    for name in FINGERS:
        chain = [bones[f"{name}.{i}"] for i in (1, 2, 3)]
        for joint, p in zip(JOINTS, [c["head"] for c in chain] + [chain[-1]["tail"]]):
            points[f"{name}.{joint}"] = p
    chain = [bones[f"thumb.{i}"] for i in (0, 1, 2)]
    for joint, p in zip(THUMB_JOINTS, [c["head"] for c in chain] + [chain[-1]["tail"]]):
        points[f"thumb.{joint}"] = p
    depsgraph = bpy.context.evaluated_depsgraph_get()
    palm = bpy.data.objects["palm"].evaluated_get(depsgraph)
    outline = [path(palm.matrix_world @ v.co) for v in palm.data.vertices]
    return {"bones": bones, "points": points, "palm": outline}


def fit(rig, bones, reference):
    """Coordinate descent on the bones' Euler angles; returns their rotations in degrees."""
    targets = {k: v for k, v in reference.items() if not k.startswith("$")}

    def error():
        bpy.context.view_layer.update()
        points = landmarks(rig)["points"]
        return sum(math.dist(points[k], v) ** 2 for k, v in targets.items())

    # "index.1:x" frees only that bone's X angle; a bare name frees all three.
    free = []
    for spec in bones:
        name, _, axes = spec.partition(":")
        free.append((rig.pose.bones[name], ["xyz".index(a) for a in axes or "xyz"]))
    pbones = [pbone for pbone, _ in free]
    best, step = error(), math.radians(16)
    while step > math.radians(0.25):
        improved = False
        for pbone, axes in free:
            for axis in axes:
                for sign in (1, -1):
                    pbone.rotation_euler[axis] += sign * step
                    e = error()
                    if e < best - 1e-9:
                        best, improved = e, True
                        break
                    pbone.rotation_euler[axis] -= sign * step
        if not improved:
            step /= 2
    error()
    return {
        b.name: [round(math.degrees(a), 1) for a in b.rotation_euler] for b in pbones
    }, math.sqrt(best / len(targets))


def parts(rig, spec):
    """Every part of the posed hand as (name, sphere centres in world space, radius)."""
    m = rig.matrix_world
    r = spec["radius"]
    out = []
    for pbone in rig.pose.bones:
        if pbone.name != "hand":
            out.append((pbone.name, [m @ pbone.head, m @ pbone.tail], r))
    root = rig.pose.bones["hand"]
    carry = m @ root.matrix @ root.bone.matrix_local.inverted()
    out.append(("palm", [carry @ world(p) for p in spec["palm"]["points"]], spec["palm"]["radius"]))
    web = []
    for bone, end in spec.get("web", []):
        pbone = rig.pose.bones[bone]
        web.append(m @ (pbone.head if end == "head" else pbone.tail))
    if web:
        out.append(("web", web, r))
    return out


def draw(rig, spec, pose, out_svg):
    """Rebuild every part as a hull mesh at its posed place, then trace the visible lines."""
    for obj in [o for o in bpy.data.objects if o.type == "MESH"]:
        bpy.data.objects.remove(obj)
    shapes, joints, centres = [], {}, {}
    for name, pts, r in parts(rig, spec):
        hull_object(name, pts, r, name, None)
        shapes.append(lineart.Shape(name, [(v.x, -v.z) for v in pts], r))
        centres[name] = (pts, r)
    for a, (pa, ra) in centres.items():
        for b, (pb, _) in centres.items():
            if a != b:
                for v in pa:
                    if any((v - w).length < 0.01 for w in pb):
                        joints.setdefault(a, []).append(((v.x, -v.z), ra, b))
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    scene = bpy.context.scene

    def front_of(shape, p):
        hit, _, _, _, obj, _ = scene.ray_cast(depsgraph, Vector((p[0], -1000, -p[1])), Vector((0, 1, 0)))
        return obj.name if hit else None

    pieces = lineart.visible_pieces(shapes, front_of, joints)
    # Minimal contours: only the parts a pose names draw their lines inside the silhouette.
    keep = pose.get("lines")
    if keep is not None:
        pieces = [p for p in pieces if p[2] == "outline" or p[0].split(".")[0] in keep or p[0] in keep]
    finish(rig, spec, pose, shapes, pieces, out_svg)
    pen_d = ""
    if "pen" in pose:
        nib, tail = (m for m in (world(pose["pen"]["nib"]), world(pose["pen"]["tail"])))
        pv = [rig.matrix_world @ rig.pose.bones["hand"].matrix @ rig.pose.bones["hand"].bone.matrix_local.inverted() @ v for v in (nib, tail)]
        pen = lineart.Shape("pen", [(v.x, -v.z) for v in pv], pose["pen"]["radius"])
        pen_d = "".join(lineart.svg_d(seg) for seg in pen.segs)
        hull_object("pen", pv, pose["pen"]["radius"], "pen", None)
    xs = [x for sh in shapes for x in (min(p[0] for p in sh.hull) - sh.r, max(p[0] for p in sh.hull) + sh.r)]
    ys = [y for sh in shapes for y in (min(p[1] for p in sh.hull) - sh.r, max(p[1] for p in sh.hull) + sh.r)]
    x0, y0 = min(xs) - 12, min(ys) - 12
    w, h = max(xs) - x0 + 12, max(ys) - y0 + 12
    body = [f'<path d="{pen_d}" fill="#eee" stroke="#bbb" stroke-width="0.3"/>'] if pen_d else []
    colour = {"outline": "#111", "inner": "#c22"}
    for _, seg, kind in pieces:
        body.append(f'<path d="{lineart.svg_d(seg)}" fill="none" stroke="{colour[kind]}" stroke-width="0.6" stroke-linecap="round"/>')
    out_svg.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0:.2f} {y0:.2f} {w:.2f} {h:.2f}" width="800" height="{800 * h / w:.0f}">'
        f'<rect x="{x0:.2f}" y="{y0:.2f}" width="{w:.2f}" height="{h:.2f}" fill="#fff"/>{"".join(body)}</svg>\n'
    )
    return pieces


# The shared wrist cut every Hand pose ends in (path units), right corner first.
WRIST = ((54.1, 60.1), (36.8, 64.8))


def to_view(p):
    """Hand path units to the Hand's 30x29 viewBox (the 0.48-scaled poses' transform)."""
    return [round((p[0] - 19) * 0.48 + 4, 3), round((p[1] - 13) * 0.48 + 1, 3)]


def finish(rig, spec, pose, shapes, pieces, out_svg):
    """Cut the traced hand at the wrist, place it on the shared wrist cut, and write the Hand path,
    the parts in front of the pen, and the pen's placement to <pose>.hand.json."""
    m = rig.matrix_world
    root = rig.pose.bones["hand"]
    carry = m @ root.matrix @ root.bone.matrix_local.inverted()
    px, py = spec["pivot"]
    p0, p1 = carry @ world((px, py)), carry @ world((px, py + 10))
    pivot = (p0.x, -p0.z)
    axis = lineart.unit((p1.x - p0.x, -(p1.z - p0.z)))  # toward the elbow
    across = (-axis[1], axis[0])
    width = lineart.norm(lineart.sub(*WRIST))

    def cut_at(s):
        c = lineart.add(pivot, lineart.mul(axis, s))
        a, b = lineart.sub(c, lineart.mul(across, 40)), lineart.add(c, lineart.mul(across, 40))
        # The material (toward the fingers) must lie on the left of a->b.
        probe = lineart.sub(c, lineart.mul(axis, 5))
        if lineart.cross(lineart.sub(b, a), lineart.sub(probe, a)) < 0:
            a, b = b, a
        return a, b, lineart.chord(pieces, a, b)

    look = (carry.to_3x3().inverted() @ Vector((0, 1, 0))).normalized()
    print(f"rig.py: the camera looks along ({look.x:+.2f} toward the little finger, {-look.z:+.2f} toward "
          f"the wrist, {look.y:+.2f} toward the back of the hand)")
    a, b, ends = cut_at(pose.get("cut", 3.0))
    first, last = ends
    print(f"rig.py: wrist cut {lineart.norm(lineart.sub(last, first)):.3f} wide (shared: {width:.3f})")
    segs, loose, tees = lineart.assemble(pieces, (first, last), rho=pose.get("fillet", 1.2))
    if loose:
        print(f"rig.py: {len(loose)} inner pieces reach no corner and are left out")
    # Rigid map: first -> the right wrist corner, last -> the left one.
    src = lineart.sub(last, first)
    dst = lineart.sub(WRIST[1], WRIST[0])
    angle = math.atan2(dst[1], dst[0]) - math.atan2(src[1], src[0])
    cs, sn = math.cos(angle), math.sin(angle)

    def f(p):
        q = lineart.sub(p, first)
        return (WRIST[0][0] + q[0] * cs - q[1] * sn, WRIST[0][1] + q[0] * sn + q[1] * cs)

    segs = [lineart.transform(sg, f, angle) for sg in segs]
    segs = [lineart.reverse(sg) for sg in reversed(segs)]
    segs = segs[1:] + segs[:1]
    # Snap the cut's ends onto the shared corners (the forearm is 17.93 across to within its
    # facets): the first segment leaves the right corner, the last line reaches the left one.
    segs[0] = lineart.with_end(segs[0], 0, WRIST[0])
    segs[-2] = lineart.with_end(segs[-2], 1, WRIST[1])
    segs[-1] = ("L", WRIST[1], WRIST[0])
    d = lineart.path_d(segs)
    front = []
    for sh in shapes:
        if sh.name in pose.get("front", []):
            front.append(lineart.path_d([lineart.transform(sg, f, angle) for sg in sh.segs]))
    result = {"d": d, "front": " ".join(front), "corners": [[round(c, 3) for c in f(t)] for t in tees]}
    if tees:
        print(f"rig.py: {len(tees)} T-junction corners:", result["corners"])
    if "pen" in pose:
        pen = pose["pen"]
        ends = [carry @ world(pen[k]) for k in ("nib", "tail")]
        nib3, tail3 = ends
        u3 = (tail3 - nib3).normalized()
        nib, tail = (f((v.x, -v.z)) for v in ends)
        axis2 = lineart.unit(lineart.sub(tail, nib))
        # The pen's drawn ends are its round caps: past the sphere centres by the radius, as seen.
        seen = math.hypot(u3.x, u3.z)
        tip = lineart.sub(nib, lineart.mul(axis2, pen["radius"] * seen))
        cap = lineart.add(tail, lineart.mul(axis2, pen["radius"] * seen))
        # The grip point: on the axis where the thumb and index tips hold it.
        ts = []
        for joint in ("thumb.tip", "index.tip"):
            v = rig.matrix_world @ point_world(rig, joint)
            q = f((v.x, -v.z))
            ts.append(lineart.dot(lineart.sub(q, nib), axis2))
        grip = lineart.add(nib, lineart.mul(axis2, sum(ts) / len(ts)))
        # Which parts lie in front of the pen where they cross it (the camera's first hit).
        hull_object("pen", [nib3, tail3], pen["radius"], "pen", None)
        bpy.context.view_layer.update()
        depsgraph = bpy.context.evaluated_depsgraph_get()
        over = set()
        for sh in shapes:
            for k in range(1, 200):
                p3 = nib3.lerp(tail3, k / 200)
                hit, _, _, _, obj, _ = bpy.context.scene.ray_cast(depsgraph, Vector((p3.x, -1000, p3.z)), Vector((0, 1, 0)))
                if hit and obj.name != "pen" and sh.name == obj.name:
                    over.add(sh.name)
        bpy.data.objects.remove(bpy.data.objects["pen"])
        result["pen"] = {
            "grip": to_view(grip), "nib": to_view(tip), "tail": to_view(cap),
            "tailLength": round(lineart.norm(lineart.sub(cap, grip)) * 0.48, 3),
            "over": sorted(over), "radius": round(pen["radius"] * 0.48, 3),
        }
        print("rig.py: parts in front of the pen:", sorted(over))
    out_json = out_svg.with_name(out_svg.name.replace(".lines.svg", ".hand.json"))
    out_json.write_text(json.dumps(result, indent=2) + "\n")
    # A preview in the Hand's own frame and weight.
    weight = 3 * 30 / 180 / 0.48
    pen = ""
    if "pen" in result:
        pn, pt = result["pen"]["nib"], result["pen"]["tail"]
        pg = result["pen"]["grip"]
        pen = (f'<line x1="{pn[0]}" y1="{pn[1]}" x2="{pt[0]}" y2="{pt[1]}" stroke="#bbb" stroke-width="2.6" '
               f'stroke-linecap="round"/><circle cx="{pg[0]}" cy="{pg[1]}" r="0.4" fill="#d22"/>')
    out_svg.with_name(out_svg.name.replace(".lines.svg", ".hand.svg")).write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -8 50 44" width="1000" height="880">'
        '<rect x="-12" y="-8" width="50" height="44" fill="#fbf8f1"/>'
        '<rect x="0" y="0" width="30" height="29" fill="none" stroke="#ddd" stroke-width="0.05"/>'
        f'{pen}<g transform="translate(4 1) scale(0.48) translate(-19 -13)"><path d="{d}" fill="#fff" '
        f'stroke="#111212" stroke-width="{weight:.4f}" stroke-linecap="round" stroke-linejoin="round"/></g></svg>\n'
    )


def point_world(rig, joint):
    finger, _, name = joint.partition(".")
    joints = THUMB_JOINTS if finger == "thumb" else JOINTS
    first = 0 if finger == "thumb" else 1
    i = joints.index(name)
    bone = rig.pose.bones[f"{finger}.{first + min(i, 2)}"]
    return bone.tail if i == 3 else bone.head


def render(path_png):
    """A shaded preview from the drawing's camera, framed on the posed meshes."""
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    xs, ys = [], []
    for obj in scene.objects:
        if obj.type == "MESH":
            ev = obj.evaluated_get(depsgraph)
            for v in ev.data.vertices:
                w = ev.matrix_world @ v.co
                xs.append(w.x)
                ys.append(-w.z)
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = max(max(xs) - min(xs), max(ys) - min(ys), FRAME["size"] / 2) * 1.1
    cam = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam)
    cam.location = world((cx, cy), -200)
    cam.rotation_euler = (math.radians(90), 0, 0)  # looks along +Y; screen up is +Z
    cam_data.clip_end = 400
    scene.camera = cam
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.render.resolution_x = scene.render.resolution_y = FRAME["pixels"]
    scene.render.film_transparent = False
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "OBJECT"
    # Tell the parts apart: thumb red, index blue, middle green, pen yellow, the rest paper.
    tint = {"thumb": (0.85, 0.35, 0.3, 1), "index": (0.35, 0.5, 0.9, 1), "middle": (0.4, 0.75, 0.45, 1),
            "pen": (0.95, 0.8, 0.2, 1)}
    for obj in scene.objects:
        if obj.type == "MESH":
            obj.color = tint.get(obj.name.split(".")[0], (0.93, 0.9, 0.84, 1))
    shading.show_object_outline = True
    shading.object_outline_color = (0.07, 0.07, 0.07)
    scene.render.filepath = str(path_png)
    bpy.ops.render.render(write_still=True)


def main():
    opts = args()
    out = Path(opts.out)
    out.mkdir(parents=True, exist_ok=True)
    poses = json.loads((HERE / "poses.json").read_text())
    if opts.pose not in poses:
        sys.exit(f"unknown pose {opts.pose!r}; poses.json has {', '.join(poses)}")
    if opts.from_blend:
        bpy.ops.wm.open_mainfile(filepath=str(out / f"{opts.pose}.blend"))
        rig = bpy.data.objects["Hand"]
    else:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        rig = build(json.loads((HERE / "rig.json").read_text()))
        apply_pose(rig, poses[opts.pose])
    pose = poses[opts.pose]
    if opts.fit3d:
        rotations, pen_fit, cost = fit3d(rig, opts.fit3d, pose)
        pose = {**pose, "pen": {**pose["pen"], **pen_fit}}
        print(f"rig.py: fitted the grip (cost {cost:.2f}):", json.dumps(rotations), json.dumps(pen_fit))
    if "pen" in pose and not opts.from_blend:
        add_pen(pose["pen"], rig)
    if opts.view:
        apply_view(rig, opts.view, pose.get("facing"))
    if opts.look:
        apply_look(rig, opts.look, pose.get("facing"))
    if opts.fit:
        rotations, rms = fit(rig, opts.fit, poses[opts.pose].get("reference", {}))
        print(f"rig.py: fitted (rms {rms:.2f}):", json.dumps(rotations))
    result = {"pose": opts.pose, **landmarks(rig)}
    if opts.draw:
        pieces = draw(rig, json.loads((HERE / "rig.json").read_text()), pose, out / f"{opts.pose}.lines.svg")
        print(f"rig.py: traced {len(pieces)} visible pieces")
    (out / f"{opts.pose}.json").write_text(json.dumps(result, indent=2) + "\n")
    for obj in [o for o in bpy.data.objects if o.type == "CAMERA"]:
        bpy.data.objects.remove(obj)
    render(out / f"{opts.pose}.png")
    if opts.blend:
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(out / f"{opts.pose}.blend"))
    print(f"rig.py: wrote {out / opts.pose}.json and .png")


main()
