# Desk illustrations

These components are controlled React illustrations. Their gallery previews use direct controls, without video players or scene props.

## Reuse and composition

- `Hand` is static artwork with six poses: `open`, `point`, `pinch`, `grip`, `type`, and `hold`. `Mano` adds placement and rotation; neither owns a folder, a pen, or a timeline.
- `pinch` is also the pen grip. `Pluma` draws a pen held in it and exports `plumaNib`, the nib point for the same props, so writing (a `PaperLine` reveal, a thread's start) follows the pen. There is no separate pen pose.
- `Mano`'s `arm` draws a sleeve from the frame edge (or a given point) to the wrist, so a hand never floats unattached. `cuff="accent"` marks the viewer's own hand in vermilion; `cuff="ink"` is the neutral band.
- `Cajon` is the drawer; its folders are the shared `FolderOutline`, not a separate folder drawing. `FileCabinet` supplies its enclosure. `Escritorio` is an empty desk with an optional `FileCabinet`.
- `Bandeja` is a paper tray. `ToolCaddy` is an empty divided organizer. Neither adds a loading/cost line or labels unrelated to the object.
- `Burbuja` composes `ChatBubble` and `TextFill`. Selected word indices receive a controlled highlight; ordinary HTML handles wrapping. It has no folder or connector.

## Top-down desk

`Escritorio` is a front elevation. `DeskTop` is the same desk seen from above: an empty cream surface that sheets, axes, and props lie on. Its `box` is fixed; `edge` (0–1) is a camera tilt that reveals the front edge band inside that box, and `drawer` reserves a region on one edge (a panel with a recessed opening, empty until a consumer composes `Cajon` or folders there). `light` is the visual language's depth-as-light rule: it scales the OKLab lightness of every fill (`deskShade`), never the ink.

`Ejes` are two ink axes, independent of the desk. `h` and `v` draw each axis on its own; labels name the half-planes (top and bottom flank the horizontal axis at its left end, left and right flank the vertical axis at its top end) and arrive as their axis reaches them. `quiet` shrinks them in place. `focus` calls out one or more quadrants with an ink outline or a light fill; focus outlines keep clear of the labels as one aligned set, giving up the same strips in both quadrants that share an edge. `center` moves the crossing, but only as far as the labels allow (`ejesLayout(...).range`). `focusTone="accent"` is the only vermilion and is opt-in, for the one beat whose script names it (the answer quadrant in *pregunta*). `ejesLayout` returns the quadrant boxes for placing a sheet under each reader.

`DeskProp` is a free-standing keycap, keyboard, or mug, placed by its centre with `scale` and `rotate`. It owns no hand: `deskPropLayout(...).contact` is where a fingertip or grip lands, so `Mano` composes on top. `press` sinks the keycap or the listed keyboard keys: the face insets and takes a light ink wash. The ink stroke stays 2 units at any scale.

## Physical geometry

Folder count never changes the desk or drawer dimensions. Folder index zero is at the front. In an open `Cajon` each folder further back sits one `depthSpacing` higher and slightly narrower (the inset follows how far back it sits: its rise over the rise of eight folders, up to a fifth of the width at the back wall, whatever the label size; never larger), so the folders fan as a stair. Drawers wider than 420 units scale their walls, travel, rise, and handle with the width. The default spacing is the tab height plus a band of back panel and a lip of the front flap: up to eight folders, every tab name and the band under it (which carries the optional `sublabel`) stay visible. More folders share the rise of eight, and overlapping labels are then intentional. A `FileCabinet` keeps its drawer packed under the enclosure top (48 units of rise, tabs staggered with `tabLayout: "stagger3"`), unless the caller passes its own spacing.

Depth reads as light. Each folder's `k` defaults to a ramp from 1 at the front to 0.72 at the back (`backLight`), and `drawerLight(k)` turns it into a fill mixed in OKLab from the card, cream, and ink tokens only. Lifting a folder (`pulled`) brings it to full light. Vermilion appears only on a folder marked `accent`.

Tab names are set in Geist 800 (sublabels in Geist italic) and drawn whole: the tab widens to fit the name (`sansWidth` from the tokens), up to the folder width, and only then does the name compress horizontally. `reveal` inks the name in grapheme by grapheme from its first letter. `cajonLayout(props).anchors(i, n)` spreads `n` thread endpoints along the tab midline for connectors, starting just before the name so a knot never covers its first letter; a tab inside the closed drawer keeps its endpoints at the drawer's rim, and `folders[i].visible` says how much of the tab shows. A folder's `open` stands its front flap ajar: the folder rises (by the flap's drop plus a lip, never far enough to cover the tab behind it) so the shaded opening shows above whatever is in front of it, the flap's top edge drops and leans past the body, and its bottom corners stay fixed.

Every folder has a complete body, including the portion hidden behind the drawer front. Pulling translates that entire body without changing its width or height. Front surfaces occlude the stored body; lifting exposes it progressively.

Desk finish, cabinet visibility, and cabinet side are independent properties. The desk surface remains empty. Consumers can compose other objects explicitly.

The closed cabinet sits between the inner leg edges, below the apron, and on the same floor line as the desk. Its enclosure stays behind the desk frame; only the drawer moves toward the viewer. Changing the drawer opening never moves the enclosure or changes its dimensions.

The open palm keeps its four fingers together with a relaxed thumb. Poses change the silhouette; placement and rotation remain separate transforms.

The newer poses reuse the original family instead of new anatomy: `grip` is the pointing hand with the index curled into a fourth knuckle and the thumb folded in under it, leaving a slot where a sheet or tab edge sits (a C-grip), `type` is the open palm with the thumb tucked away and the fingers bent down onto rounded pads above a knuckle line (turned 180°, fingertips on keys), and `hold` is a side-on fist whose stacked fingers wrap a mug handle. Every pose keeps the wrist at the bottom of the 30×29 box and the same outline weight; `handWrist` records each wrist edge.

The sleeve is attached geometry, not a second object: its wrist end lies on the pose's wrist edge and it runs along that edge's normal, so it follows every pose and rotation. Pass the stage as `arm.frame` so the sleeve ends exactly at the frame edge; without it the sleeve runs 8 × the hand size and the SVG viewport clips it. A `from` point keeps a straight forearm stub at the wrist (it carries the cuff as a full, square band) and then bends at constant width, with a rounded elbow, to end on that point. On `open` and `type` the sleeve's thumb-side corner continues the hand contour. The pen is drawn behind the hand: the nib leaves past the thumb tip and the barrel shows above the knuckles; the pen's card halo and the hand's card knock-out ring (`Hand`'s `halo`) keep their contours apart where they cross, and a custom `nibOffset` turns the hand with the pen.

At finger joins, the outer contour and interior dividers must meet on the same centerline with the same stroke width. Inspect these intersections enlarged: rounded caps alone do not fix misaligned paths or a sudden change in thickness.

## Visual review

Compare artwork against the issue reference and the existing Folder, Document, ChatBubble, and TextFill before accepting it. Use the library's simple geometric line art: solid fills, a clear outline, minimal interior detail. Anatomical rendering, wrinkles, and decorative scene furniture do not fit this system.

Inspect closed, intermediate, and open drawer states; full-range folder lifts; counts 0, 1, 6, 8, and 12 with and without titles; name reveal from blank to named; the front flap ajar; both tab layouts; every hand pose, with and without an arm, at several rotations; the pen nib against `plumaNib`; both desk finishes and cabinet sides; and highlight progress 0–1. For the top-down pieces, inspect flat and tilted desks with each drawer edge, axes at 0, partial, and full draw from both origins, full and quiet labels, every focus tone including all four quadrants, and each prop at its scale and rotation extremes. Verify desktop and narrow layouts and keyboard controls. Test object completeness, occlusion, and independent controls, not just whether a frame renders.
