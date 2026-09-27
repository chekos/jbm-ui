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

`Folder` has three tones: `accent` (vermilion), `ink`, and `card` (plain cream with ink text). Accent and ink print their label on the front panel, as before; the card tone prints it on the tab by default (`labelOn` chooses either placement for any tone). A tab label is never truncated: the tab widens to fit it, up to the body width, then the label compresses. An optional `sublabel` prints on the front panel and leans with it as the folder opens, using the exported `frontPlane` transform.

`Folder` accepts optional SVG children in its 260×220 space, between the back and front panels. Existing calls retain the original sheet. `@jbm/folder-contents` composes this slot with rigid nested folders and documents. `open`, per-entry `reveal`, per-entry `documentReveal`, and group `lift` are independent controls. Empty entries and an empty sheet label produce an empty folder. More entries tighten packing instead of changing the folder's size. Hidden geometry is complete and clipped at the container bottom.

`@jbm/folder-carry` exports `tableFolderGeometry`, `folderGrip`, and `carriedFolderGeometry`. A transport path should begin and end at the corresponding `folderGrip` points. A drawer can supply its own `x`, `y`, `w`, `h`, `tabX`, and `tabWidth`. Optional tab dimensions interpolate too, avoiding an endpoint shape change when carrying between scales. `fill` sets the carried folder's color (vermilion by default; pass `color.card` for a plain cream folder or `color.ink`), and the label switches to ink on cream fills unless `labelColor` says otherwise.

Install `@jbm/mano` separately to add a hand. Its optional `anchor` is in the Hand artwork's 30×29 coordinate system; `{ x: 6, y: 10 }` places the pinch opening at `at`. Rotation occurs around that contact point. Omit `anchor` to preserve the existing placement behavior.

## Verification

Run `node --test scripts/design-video-components.test.mjs` for isolated installation, paper-coordinate and bounded-rendering checks, grapheme behavior, and carry/contact invariants. `pnpm consumer:check` exercises the components through both source copying and real registry installation.

Inspect open/closed folders, extracted documents, zero/one/crowded contents, horizontal/vertical tape, and separate control combinations at desktop and mobile widths. Check caption playback too: emphasized words now move vertically without scaling into their neighbors.

Source references: Design's `2026-09-23-opus-5-5-explainer/src/scenes/objetos.tsx` and `2026-09-21-agent-skills-explainer-video/storyboard-anaquel/desk/`. The registry deliberately removes those films' localization and narration dependencies.
