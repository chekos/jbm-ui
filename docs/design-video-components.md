# Paper and filing illustrations

These components adapt the Agent Skills and Opus 5.5 films in `chekos/design` into independently installable React primitives. All inputs are controlled: the caller supplies progress and owns playback, reduced-motion preferences, and scene timing. The gallery uses keyboard-operable sliders without autoplay.

## Paper coordinates

Install `@jbm/paper-tape`. `length` is the amount of paper fed out, in pixels; `window` bounds the visible run. `paperAt(length, at)` converts a position on the paper to its distance from the source. Writing, checkpoint markers, and arbitrary React attachments use that same coordinate system. Increase length to feed paper; do not animate the marks separately. Only visible marks are rendered, so a long process does not accumulate offscreen SVG nodes. The viewport clips attachments at its boundaries.

`@jbm/tape-marker`, `@jbm/paper-clip`, `@jbm/clipped-note`, and `@jbm/punched-tag` are separate objects. The note composes `Paper` and `PaperClip`; all paper surfaces reuse the shared paper shadow. Marker and attachment IDs must be unique within one tape.

## Ink and metadata

`@jbm/paper-line` accepts normalized `reveal`, `lift`, and `strike` controls, plus independent `dotted`, `accent`, and `mono` options. Reveal preserves complete graphemes and reserves the full text footprint. A visually hidden copy supplies the complete text to assistive technology. Use short lines for the single strike-through stroke.

`@jbm/stamp` takes arbitrary text and a normalized `press`. It represents an ink impression, not a validation result. `@jbm/frontmatter` provides semantic key/value rows, YAML delimiters, optional emphasis/dimming, and an explicit stacked layout for narrow compositions.

The gallery's Ticket example demonstrates a work order using the existing header and stub slots. Named sheets can likewise compose Paper and Frontmatter without adding another surface primitive.

## Folder contents and transport

`Folder` accepts optional SVG children in its 260×220 space, between the back and front panels. Existing calls retain the original sheet. `@jbm/folder-contents` composes this slot with rigid nested folders and documents. `open`, per-entry `reveal`, per-entry `documentReveal`, and group `lift` are independent controls. Empty entries and an empty sheet label produce an empty folder. More entries tighten packing instead of changing the folder's size. Hidden geometry is complete and clipped at the container bottom.

`@jbm/folder-carry` exports `tableFolderGeometry`, `folderGrip`, and `carriedFolderGeometry`. A transport path should begin and end at the corresponding `folderGrip` points. A drawer can supply its own `x`, `y`, `w`, `h`, `tabX`, and `tabWidth`. Optional tab dimensions interpolate too, avoiding an endpoint shape change when carrying between scales.

Install `@jbm/mano` separately to add a hand. Its optional `anchor` is in the Hand artwork's 30×29 coordinate system; `{ x: 6, y: 10 }` places the pinch opening at `at`. Rotation occurs around that contact point. Omit `anchor` to preserve the existing placement behavior.

## Thread and video print

`@jbm/hilo` is the ink thread from the Doorways film: an SVG `<g>` tied from `from` to `to` in the parent SVG's units. It has no arrowheads. `curve="s"` leaves and arrives level (a line of writing tied to a folder tab); `curve="arc"` bows sideways by `bend`. `draw` lays it by arc length. With `snapAt`, the same `draw` first lays the thread (0 → snapAt) and then snaps it (snapAt → 1): the thread parts at `breakAt`, the two ends recoil about a fifth of its length apart (never more than 90 units), and curled fibers peel off each end according to `fray`. `slack` sags a tied thread and lets snapped ends hang. Both ends stay tied: the first piece always starts at `from`, and once laid the last piece ends at `to`, with the anchor tangents unchanged. `notch` bridges the gap tip to tip with a vermilion bar, the only accent the thread draws. `hiloGeometry` returns the exact cubics it draws.

`@jbm/video-print` composes `Paper` and `PunchedTag` unchanged. The 16:9 frame is a pale sketch (tinted fill, ink outline, head and shoulders), never a solid block. The ink scrub bar advances with `scrub` and leaves a tick at each mark it reaches. `link` hangs a mono URL tag over the bottom edge, meaning the page was opened. `videoPrintLayout(props, at)` returns the mark points on the rule and the tag hole in stage coordinates, so a Hilo can tie on as the tick appears.

## Verification

Run `node --test scripts/design-video-components.test.mjs scripts/thread-components.test.mjs` for isolated installation, paper-coordinate and bounded-rendering checks, grapheme behavior, carry/contact invariants, pinned thread ends, snap continuity, and scrub marks. `pnpm consumer:check` exercises the components through both source copying and real registry installation.

Inspect open/closed folders, extracted documents, zero/one/crowded contents, horizontal/vertical tape, and separate control combinations at desktop and mobile widths. Check caption playback too: emphasized words now move vertically without scaling into their neighbors.

Source references: Design's `2026-09-23-opus-5-5-explainer/src/scenes/objetos.tsx` and `2026-09-21-agent-skills-explainer-video/storyboard-anaquel/desk/`. The registry deliberately removes those films' localization and narration dependencies.
