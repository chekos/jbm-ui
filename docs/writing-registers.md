# Writing registers

`@jbm/register` and `@jbm/slip` draw writing as shapes instead of words. On a stage, paragraphs are never set as legible prose: the shape of the writing tells the viewer who the page is for. Both are controlled React illustrations; the caller owns playback and every value is a prop.

## The five registers

| kind | reads as | marks |
| --- | --- | --- |
| `mono` | steps with results (a tutorial) | a prompt chevron, an ink prompt bar, and an outlined result box per step |
| `plain` | short numbered lists (a how-to) | two columns of groups: an ink heading bar over three numbered dim items |
| `grid` | ruled tables (a reference) | outlined tables with an ink header band, three row rules, and one column rule |
| `prose` | sourced prose (an explanation) | a justified block of full-width lines with shorter paragraph ends, then source ticks with dim lines |
| `mixed` | one long page for everyone | several registers stacked on one sheet, separated by seams |

`n` counts the register's units: steps, list groups, tables, source ticks, or bands. More units pack tighter inside the same sheet; the sheet never grows. Vermilion appears only on the cells listed in `accent`.

## Shared geometry

`registerLayout(spec)` returns what the sheet draws, in sheet px from its outer top-left corner: every cell in reading order with its box, its lead point (the right end of its first mark), and, for source ticks, its anchor. Hosts attach to the same numbers:

- `registerAnchors(spec)`: prose source tick centres, where threads leave the page.
- `registerSeams(spec)`: on a mixed page, the y of each seam between bands, where a tear runs.
- `registerGap(spec)`: the box a gap opens, where a slip rests or lands.

`RegisterInk` draws the same writing as an SVG `<g>` for SVG scenes and torn pieces; `Register` puts it on a `Paper` sheet and lays `children` over it in the same coordinates.

## Reflow

A gap opens before row `gapAt` (a band index on a mixed page). `gap` is its full height and `reflow` how open it is. Marks are sized for the open gap at every reflow value, so reflow only moves writing; nothing stretches. Run `reflow` from 1 to 0 on the sheet a slip leaves, and from 0 to 1 on the sheet it lands on. Read the resting and landing boxes with `reflow: 1`, so they stay fixed while the gaps animate.

## The slip

A `Slip` is an independent paper strip with a few marks of one register, taped where it does not belong. `lift` peels the tape flap (fully by 0.4), raises and tilts the slip, and deepens its shadow; `offset` carries it. `dashed` flags it with a dashed ink outline. It owns no hand and no path: place it at the source gap, move `offset` along your path, and put `Mano` in its pinch pose at `slipGrip(props)`. Pass the source sheet's `scale` so the slip's bars match the page.

## Verification

`node --test scripts/registers.test.mjs` checks counts, bounds, gap arithmetic, seams, anchors, and the slip grip. Inspect every kind at its smallest and largest counts, reveal 0, ½, and 1, reflow at both ends, and lift and carry at their extremes on desktop and mobile, at 2× zoom.

Reference: the *lectores*, *hojas*, *pureza*, and *cierre* panels of Design's `2026-09-27-doorways-diataxis-explainer` storyboard.
