# Desk illustrations

These components are controlled React illustrations. Their gallery previews use direct controls, without video players or scene props.

## Reuse and composition

- `Hand` is static artwork with `open`, `point`, and `pinch` poses. `Mano` adds placement and rotation; neither owns a folder or a timeline.
- `Cajon` is the drawer; its folders are the shared `FolderOutline`, not a separate folder drawing. `FileCabinet` supplies its enclosure. `Escritorio` is an empty desk with an optional `FileCabinet`.
- `Bandeja` is a paper tray. `ToolCaddy` is an empty divided organizer. Neither adds a loading/cost line or labels unrelated to the object.
- `Burbuja` composes `ChatBubble` and `TextFill`. Selected word indices receive a controlled highlight; ordinary HTML handles wrapping. It has no folder or connector.

## Physical geometry

Folder count never changes the desk or drawer dimensions. Folder index zero is at the front. In an open `Cajon` each folder further back sits one `depthSpacing` higher and slightly narrower (each side moves in a quarter of its rise, at most a fifth of the width; never larger), so the folders fan as a stair. The default spacing is the tab height plus a band of back panel and a lip of the front flap: up to eight folders, every tab name and the band under it (which carries the optional `sublabel`) stay visible. More folders share the rise of eight, and overlapping labels are then intentional. A `FileCabinet` keeps its drawer packed under the enclosure top (48 units of rise, tabs staggered with `tabLayout: "stagger3"`), unless the caller passes its own spacing.

Depth reads as light. Each folder's `k` defaults to a ramp from 1 at the front to 0.72 at the back (`backLight`), and `drawerLight(k)` turns it into a fill mixed in OKLab from the card, cream, and ink tokens only. Lifting a folder (`pulled`) brings it to full light. Vermilion appears only on a folder marked `accent`.

Tab names are drawn whole: the tab widens to fit the name, up to the folder width, and only then does the name compress horizontally. `reveal` inks the name in grapheme by grapheme from its first letter, which is also the first point of `cajonLayout(props).anchors(i, n)`: `n` thread endpoints spread along the tab midline for connectors. A folder's `open` stands its front flap ajar: the flap's top edge drops and leans past the body over a shaded opening while its bottom corners stay fixed.

Every folder has a complete body, including the portion hidden behind the drawer front. Pulling translates that entire body without changing its width or height. Front surfaces occlude the stored body; lifting exposes it progressively.

Desk finish, cabinet visibility, and cabinet side are independent properties. The desk surface remains empty. Consumers can compose other objects explicitly.

The closed cabinet sits between the inner leg edges, below the apron, and on the same floor line as the desk. Its enclosure stays behind the desk frame; only the drawer moves toward the viewer. Changing the drawer opening never moves the enclosure or changes its dimensions.

The open palm keeps its four fingers together with a relaxed thumb. Poses change the silhouette; placement and rotation remain separate transforms.

At finger joins, the outer contour and interior dividers must meet on the same centerline with the same stroke width. Inspect these intersections enlarged: rounded caps alone do not fix misaligned paths or a sudden change in thickness.

## Visual review

Compare artwork against the issue reference and the existing Folder, Document, ChatBubble, and TextFill before accepting it. Use the library's simple geometric line art: solid fills, a clear outline, minimal interior detail. Anatomical rendering, wrinkles, and decorative scene furniture do not fit this system.

Inspect closed, intermediate, and open drawer states; full-range folder lifts; counts 0, 1, 6, 8, and 12 with and without titles; name reveal from blank to named; the front flap ajar; both tab layouts; every hand pose; both desk finishes and cabinet sides; and highlight progress 0–1. Verify desktop and narrow layouts and keyboard controls. Test object completeness, occlusion, and independent controls, not just whether a frame renders.
