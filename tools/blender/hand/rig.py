"""Build the capsule hand rig in Blender, pose it, and export its projected landmarks.

Run headless from the repo root (see ../README.md):

    blender -b --factory-startup -P tools/blender/hand/rig.py -- --pose grip

Writes to tools/blender/hand/out/: <pose>.json (every bone projected into Hand path units, with
depth), <pose>.png (a shaded preview from the drawing's camera), and with --blend, <pose>.blend
(the posed rig, for posing by hand in the Blender UI; re-export with --from-blend).
"""

import argparse
import json
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Vector

HERE = Path(__file__).resolve().parent
FINGERS = ("index", "middle", "ring", "little")
JOINTS = ("mcp", "pip", "dip", "tip")
THUMB_JOINTS = ("cmc", "mcp", "ip", "tip")
# The camera frames the Hand's 30x29 viewBox (path units 10.7-73.2 across, 10.9-71.3 down).
FRAME = {"center": (42, 41), "size": 64, "pixels": 1280}


def world(point, depth=0.0):
    """Hand path units (x right, y down) to Blender world (x, depth, -y)."""
    return Vector((point[0], depth, -point[1]))


def path(v):
    return [round(v.x, 3), round(-v.z, 3)]


def args():
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(prog="rig.py")
    parser.add_argument("--pose", required=True)
    parser.add_argument("--out", default=str(HERE / "out"))
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
    direction = world(thumb["direction"]).normalized()
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
    # Facing "away" shows the back of the hand, thumb still on the left (a mirrored hand).
    rig.scale = (1, -1 if pose.get("facing") == "away" else 1, 1)
    bpy.context.view_layer.update()


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


def render(path_png):
    scene = bpy.context.scene
    cx, cy = FRAME["center"]
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = FRAME["size"]
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
    shading.color_type = "SINGLE"
    shading.single_color = (0.93, 0.9, 0.84)
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
    if opts.fit:
        rotations, rms = fit(rig, opts.fit, poses[opts.pose].get("reference", {}))
        print(f"rig.py: fitted (rms {rms:.2f}):", json.dumps(rotations))
    result = {"pose": opts.pose, **landmarks(rig)}
    (out / f"{opts.pose}.json").write_text(json.dumps(result, indent=2) + "\n")
    if not bpy.context.scene.camera:
        render(out / f"{opts.pose}.png")
    else:
        bpy.context.scene.render.filepath = str(out / f"{opts.pose}.png")
        bpy.ops.render.render(write_still=True)
    if opts.blend:
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(out / f"{opts.pose}.blend"))
    print(f"rig.py: wrote {out / opts.pose}.json and .png")


main()
