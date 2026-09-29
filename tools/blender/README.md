# Blender authoring tools

Local authoring aids for illustrations that are hard to draw in 2D path math. Nothing here ships:
the registry never imports these files, and their output (`*/out/`) is gitignored. They need
[Blender](https://www.blender.org/) 4.2 or later on `PATH` (tested with 5.2) and, for the overlay
screenshot, Google Chrome.

## Capsule hand (`hand/`)

A rigged 3D hand built from the Hand component's own vocabulary: 6.4-wide round-tipped capsule
fingers, a rounded palm, and a pivot at the shared wrist cut. Its units are Hand path units (the
0.48-scaled authoring space in `registry/jbm/ui/hand.tsx`), and its camera is the drawing's, so a
posed rig projects straight onto the Hand's coordinates. It gives a pose correct occlusion, depth
order, and consistent proportions; the drawing still follows
[the illustration workflow](../../docs/illustration-workflow.md).

- `rig.json`: proportions (knuckle positions, phalanx lengths, thumb, palm).
- `poses.json`: each pose's joint angles in degrees, and the shipped pose's landmarks to compare
  against. A finger takes `[mcp, pip, dip]` flexion; any other bone takes XYZ Euler angles in its
  own axes. `"facing": "away"` shows the back of the hand, thumb still on the left.
- `rig.py`: builds, poses, renders, and exports the rig (run by Blender).
- `overlay.mjs`: draws the rig as capsules and overlays the shipped pose.

```sh
# Pose, render, and export (out/<pose>.json, out/<pose>.png); --blend also saves out/<pose>.blend.
blender -b --factory-startup -P tools/blender/hand/rig.py -- --pose grip --blend
# Solve joint angles toward the reference landmarks, then copy them into poses.json.
# "bone:xz" frees only those axes; a finger's bones are <finger>.1-3, the thumb's thumb.0-2.
blender -b --factory-startup -P tools/blender/hand/rig.py -- --pose grip --fit thumb.0 thumb.1 thumb.2:xz
# Pose by hand: open out/grip.blend, pose the armature, save, then export that pose.
blender -b -P tools/blender/hand/rig.py -- --pose grip --from-blend
# Compare with the shipped pose: out/<pose>.draft.svg, out/<pose>.overlay.svg and .png.
node tools/blender/hand/overlay.mjs grip
```

For a new pose, add an entry to `poses.json`, set its angles by intent (or pose it in the UI),
and read the draft: the capsules give each finger's axis, width, and front-to-back order. Redraw
it in the Hand's construction (one path, the shared outline, filleted valleys); never paste the
draft's overlapping capsules into the component.

The rig reaches the shipped `grip` (front view) and `type` (from above) with one set of
proportions, changing only joint angles: every landmark lies within 1.25 path units. The
remaining differences are the drawings' stylization: `type` sets its knuckles level where the
rig's follow the hand's arc, and `grip` drops the thumb below the fingertip row where a fist
wraps it over the middle phalanges.
