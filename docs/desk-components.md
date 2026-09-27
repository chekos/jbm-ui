# Desk illustrations

These components are controlled React illustrations. Their gallery previews use direct controls, without video players or scene props.

## Reuse and composition

- `Hand` is static artwork with `open`, `point`, and `pinch` poses. `Mano` adds placement and rotation; neither owns a folder or a timeline.
- `Cajon` is the drawer. `FileCabinet` supplies its enclosure. `Escritorio` is an empty desk with an optional `FileCabinet`.
- `Bandeja` is a paper tray. `ToolCaddy` is an empty divided organizer. Neither adds a loading/cost line or labels unrelated to the object.
- `Burbuja` composes `ChatBubble` and `TextFill`. Selected word indices receive a controlled highlight; ordinary HTML handles wrapping. It has no folder or connector.

## Top-down desk

`Escritorio` is a front elevation. `DeskTop` is the same desk seen from above: an empty cream surface that sheets, axes, and props lie on. Its `box` is fixed; `edge` (0–1) is a camera tilt that reveals the front edge band inside that box, and `drawer` reserves a region on one edge (a panel with a recessed opening, empty until a consumer composes `Cajon` or folders there). `light` is the visual language's depth-as-light rule: it scales the OKLab lightness of every fill (`deskShade`), never the ink.

`Ejes` are two ink axes, independent of the desk. `h` and `v` draw each axis on its own; labels name the half-planes (top and bottom flank the horizontal axis at its left end, left and right flank the vertical axis at its top end) and arrive as their axis reaches them. `quiet` shrinks them in place. `focus` calls out one or more quadrants with an ink outline or a light fill; a focus outline keeps clear of the labels by giving up a strip along their edge. `focusTone="accent"` is the only vermilion and is opt-in, for the one beat whose script names it (the answer quadrant in *pregunta*). `ejesLayout` returns the quadrant boxes for placing a sheet under each reader.

`DeskProp` is a free-standing keycap, keyboard, or mug, placed by its centre with `scale` and `rotate`. It owns no hand: `deskPropLayout(...).contact` is where a fingertip or grip lands, so `Mano` composes on top. `press` sinks the keycap or the listed keyboard keys. The ink stroke stays 2 units at any scale.

## Physical geometry

Folder count never changes the desk or drawer dimensions. Folder index zero is at the front. Up to six folders occupy the available depth; additional folders pack closer toward the back. Overlapping labels are intentional at high density.

Every folder has a complete body, including the portion hidden behind the drawer front. Pulling translates that entire body without changing its width or height. Front surfaces occlude the stored body; lifting exposes it progressively.

Desk finish, cabinet visibility, and cabinet side are independent properties. The desk surface remains empty. Consumers can compose other objects explicitly.

The closed cabinet sits between the inner leg edges, below the apron, and on the same floor line as the desk. Its enclosure stays behind the desk frame; only the drawer moves toward the viewer. Changing the drawer opening never moves the enclosure or changes its dimensions.

The open palm keeps its four fingers together with a relaxed thumb. Poses change the silhouette; placement and rotation remain separate transforms.

At finger joins, the outer contour and interior dividers must meet on the same centerline with the same stroke width. Inspect these intersections enlarged: rounded caps alone do not fix misaligned paths or a sudden change in thickness.

## Visual review

Compare artwork against the issue reference and the existing Folder, Document, ChatBubble, and TextFill before accepting it. Use the library's simple geometric line art: solid fills, a clear outline, minimal interior detail. Anatomical rendering, wrinkles, and decorative scene furniture do not fit this system.

Inspect closed, intermediate, and open drawer states; full-range folder lifts; counts 0, 1, 6, and 12; every hand pose; both desk finishes and cabinet sides; and highlight progress 0–1. For the top-down pieces, inspect flat and tilted desks with each drawer edge, axes at 0, partial, and full draw from both origins, full and quiet labels, every focus tone including all four quadrants, and each prop at its scale and rotation extremes. Verify desktop and narrow layouts and keyboard controls. Test object completeness, occlusion, and independent controls, not just whether a frame renders.
