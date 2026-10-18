# JBM icons

`JbmIcon` is a small interface mark, drawn on a 24×24 grid. It is distinct from the larger paper illustrations: a folder icon uses an optically simplified silhouette, not a scaled `Folder` scene. Install `@jbm/icons` and import from `@/jbm/ui/icons`.

## Drawing rules

- Use original minimal geometry. Keep strokes inside the viewBox, including round caps and joins.
- Use the shared outline token at two-thirds weight (2 units on the 24-unit grid). This is the icon scale; do not change the 3px illustration outline to match it.
- Enclosed silhouettes go in `body`; interior and open strokes go in `marks`. Only `body` receives the paper fill. Avoid overlapping edges, tight double contours and decorative detail that disappears at 16px.
- Outline icons inherit `currentColor` and have transparent interiors. Paper icons default to cream; choose an explicit `paperColor` for other backgrounds. The studio compares vermilion paper on cream and ink surfaces.
- Inspect 16, 20, 24 and 32px at actual size, plus enlarged contours. Small-size readability takes precedence over extra detail.
- Keep subjects independently usable. The icon component owns no animation, click behavior or button hit area.

## Accessible use

Beside visible text, omit `label`: the SVG is decorative and hidden from assistive technology. For a meaningful standalone image, supply `label`. For an icon-only button, give the **button** an accessible name and an appropriate hit target; labeling the SVG alone does not establish the control's behavior.

## Reviewing a set

`/icons` separates preview controls from recorded preferences. Changing treatment, size, surface, or selected icon does not imply approval. The review stores individual Keep / Revise / Unsure decisions and overall direction, weight, personality, intended uses, missing subjects and notes. Unreviewed is not approval.

Feedback stays in browser storage under a versioned key. It is not sent to a server. Copy or download the Markdown packet and share it explicitly in the working conversation. Browser storage is specific to the browser and origin; it does not synchronize across devices or preview/production URLs. When storage or clipboard access fails, the page provides a visible message and a download/readable-text fallback.

When processing a packet, preserve its version and icon names, collect all requested adjustments in one pass, and distinguish explicit decisions from unanswered fields. Resolve implementation details independently; return another concrete comparison only for conflicting direction or a materially new design choice. A pilot's availability in the registry is not evidence of the owner's aesthetic approval.

When geometry changes enough to invalidate prior judgments, advance the review version rather than relabeling old decisions as approval of new drawings. Keep the reviewed inventory synchronized with the published icon names; the test suite enforces this.
