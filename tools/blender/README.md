# Blender authoring tools

Local authoring aids for illustrations that are hard to draw in 2D path math. Nothing here ships:
the registry never imports these files, and their output (`*/out/`) is gitignored. They need
[Blender](https://www.blender.org/) 4.2 or later on `PATH` (tested with 5.2) and, for screenshots,
Google Chrome.

## Capsule hand (`hand/`)

A rigged 3D hand built from the Hand component's own vocabulary: 6.4-wide round-tipped capsule
fingers, a rounded palm ending in a short round forearm 17.93 across (the shared wrist cut's
width), and a pivot at the wrist. Its units are Hand path units (the 0.48-scaled authoring space in
`registry/jbm/ui/hand.tsx`), so a posed rig projects straight onto the Hand's coordinates.

- `rig.json`: proportions (knuckles, phalanx lengths, thumb, palm, the web between thumb and index).
- `poses.json`: each pose's joint angles in degrees and view, plus either the shipped pose's
  landmarks to compare against (`reference`) or a held object to fit to (`pen`, `touch`).
- `rig.py` (run by Blender): builds, poses, fits, renders, and traces the rig.
- `lineart.py`: hidden-line tracing in exact lines and arcs, and assembly into one Hand path.
- `overlay.mjs`: the rig's capsules over the shipped pose, with each landmark's offset.
- `preview.mjs`: the real Hand and Pluma rendered with a traced pose swapped in (a patched copy of
  the registry under `out/`), beside pinch.

### Posing

A finger takes `[mcp, pip, dip]` flexion; any other bone takes XYZ Euler angles in its own axes.
`"facing": "away"` shows the back of the hand, thumb still on the left (a mirrored hand). The view
is `look`, the camera's direction in the hand's frame (x toward the little finger, y toward the
wrist, depth toward the back of the hand), or `view`, [pitch, yaw, roll] degrees about the screen.

```sh
# Pose, render, and export (out/<pose>.json, out/<pose>.png); --blend also saves out/<pose>.blend.
blender -b --factory-startup -P tools/blender/hand/rig.py -- --pose grip --blend
# Solve joint angles toward the reference landmarks, then copy them into poses.json.
# "bone:xz" frees only those axes; a finger's bones are <finger>.1-3, the thumb's thumb.0-2.
blender -b --factory-startup -P tools/blender/hand/rig.py -- --pose grip --fit thumb.0 thumb.1 thumb.2:xz
# Solve bones (and, with "pen_free", the pen) so each `touch` joint rests on the pen on its side.
blender -b --factory-startup -P tools/blender/hand/rig.py -- --pose write --fit3d thumb.0 thumb.1 thumb.2
# Pose by hand: open out/grip.blend, pose the armature, save, then export that pose.
blender -b -P tools/blender/hand/rig.py -- --pose grip --from-blend
# Compare with the shipped pose: out/<pose>.draft.svg, out/<pose>.overlay.svg and .png.
node tools/blender/hand/overlay.mjs grip
```

### Tracing

`--draw` rebuilds every part as the hull of its spheres at its posed place. Each part's projection
is then exact: its sphere centres' convex hull offset by the radius. The tracer splits every
outline where another crosses it and keeps what the camera sees (ray casts decide which part is in
front). It drops a bone's end-on circle inside the next phalanx, and draws interior lines only for
the parts a pose lists in `lines`. The assembly cuts the silhouette at the forearm, places it on the
shared wrist cut, rounds every corner with a fillet, and walks each interior line out and back from
where it leaves the outline, as the Hand's hand-drawn poses do.

```sh
blender -b --factory-startup -P tools/blender/hand/rig.py -- --pose write --draw
node tools/blender/hand/preview.mjs write   # out/write.pluma.png
```

### What it is good for

The rig reaches the shipped `grip` (front view) and `type` (from above) with one set of
proportions, changing only joint angles: every landmark lies within 1.25 path units. Use it to
check proportions, occlusion, and what overlaps what.

It is not a way to draw a hand pose. The house hands are cartoons: `pinch` fans the fingers open so
each one reads, and an honest projection of a 3D grip loses that (the `write` experiment for #177
traced a correct tripod that did not read at 150–180 px). Draw hands as vector in the library's
construction, using the rig only as a reference. The tracer is best kept for non-anatomical objects
built from capsules and rounded hulls, where the projection is the drawing.
