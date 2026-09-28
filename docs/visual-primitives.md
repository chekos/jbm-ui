# Visual primitives from Design

These components adapt visual ideas from the earlier Design productions to jbm-ui's Geist typography, cream/ink/vermilion palette, and shared surface tokens. The dated source videos remain in the Design workspace; they are references, not runtime dependencies.

| Component | Reference | Contract |
|---|---|---|
| Ticket | September recap, DevDay/Thesis tickets at 2:32 | Optional header and perforated footer stub around arbitrary React content; ink or accent header. |
| ChatBubble | Recap's Tical conversation and Instinct artwork | One message with optional speaker and tail; start/end alignment and paper/ink/accent tones. |
| Document | Organiza agentes, folded paper illustrations | SVG illustration. Labels longer than 16 characters truncate visually; the accessible name retains the full label. |
| Folder | Organiza agentes, opening folders; Doorways skill folders | SVG illustration with controlled `open` from 0 to 1. Finite values clamp; nonfinite values render closed. Tones `accent`, `ink`, and `card`; optional `sublabel`; the label prints on the front panel or, whole, on a widened tab. |
| ScoreScale | Jev's score explanation | Read-only meter; finite `value` clamps to `min`/`max`. Invalid ranges throw. End labels describe the range, not extra steps. |
| ComparisonBars | Jev's closing comparison | Nonnegative values on one zero-based scale. Default maximum fits the largest value (at least 1); explicit maximum must cover every value. Invalid values throw. Empty input renders no rows. |
| Clock | September recap's corner clock | Explicit hours/minutes, normalized across day boundaries; no system clock or timer. Custom label replaces the visible time. |

All seven live in `ui/` and use no Remotion imports or runtime dependencies beyond React and tokens. Drive Folder opening, ScoreScale values, or Clock time from your own state or timeline. Their gallery sliders demonstrate that contract without autoplay.

Document and Folder are illustrations, not file upload or folder navigation controls. Omit their label to make them decorative, or provide one to give the SVG an accessible name. Folder's accessible name includes its open/closed state. Supply surrounding text for information beyond the illustration.

ScoreScale is a meter, not a draggable input. ComparisonBars keeps labels and values in a definition list and hides decorative bars from assistive technology. Put units in `formatValue` and give the chart a visible heading or accessible name. Ticket and ChatBubble preserve ordinary content semantics; callers decide whether to place them in an article, list, or conversation.

ChatBubble's paper tone carries the shared ink outline around body and tail as one line: the tail is drawn over the bottom edge, a stock patch opens the edge where the tail leaves it, and each side leaves the edge through a small fillet. Keep the tail's outer side within a few degrees of vertical; a side that leans out past about 15° turns more than 100° at its fillet and hooks into a Z. Ink and vermilion bubbles are edged in their own fill, so every tone keeps one size.
