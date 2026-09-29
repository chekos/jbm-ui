# Illustration workflow

These guidelines apply to reference-based illustrations and interactions in the component library. They complement [physical illustration motion](physical-illustration-motion.md); concrete desk and hand contracts live in [desk illustrations](desk-components.md).

## Inspect the reference and the library first

Use `gh` to read issues, pull requests, comments, and available attachments before reaching for browser navigation. Open the actual reference image, including attached images; reading its description is insufficient.

Inspect existing component source and rendered gallery examples before designing. Identify which objects already exist, which need variants, and which interactions compose them. Match the reference's visual language and the library's line weight, palette, and simplicity. Do not equate resemblance to the subject with resemblance to the reference.

Draw every ink outline of a desk, paper, or thread object at the shared token, `stroke.outline` in `lib/tokens.ts` (3 stage px); art whose units scale against the stage (a viewBox, a scaled group) uses `outlineIn(units per px)`. Never hardcode an outline width. At that weight, parallel edges closer than about 4.5 units fuse into one bar: space stacked edges further apart instead of thinning one.

## Keep objects, variants, and motion separate

An independent physical object should remain usable on its own. A hand does not own a folder. Hand poses are variants; translation and rotation are separate transforms. A desk may include a file cabinet, but the cabinet and its drawer remain independently reusable.

Reuse existing components in composites. A highlighted chat message combines ChatBubble with the existing text highlighting behavior; it does not need another bubble implementation or an attached folder.

Give independent properties independent controls. Wood finish and cabinet side cannot share one checkbox. Controlled React illustrations use direct controls; add a Remotion Player only when the implementation actually requires its hooks.

## Simplify deliberately

Use simple geometric line art, flat fills, minimal contours, and recognizable silhouettes. Avoid realistic anatomy, wrinkles, incidental props, floating loading lines, or decoration borrowed from a reference scene without a role in the requested component. A desk can have an empty top; a caddy must read as a container on its own.

When a complex shape resists clean construction, use the available Paper/Quiver vector tools or generate a reference-guided image and vectorize it in Paper. The [capsule hand rig](../tools/blender/README.md) checks a hand pose's proportions and what overlaps what, but draw the pose itself as vector: an honest 3D trace of a grip does not read at size (#177), and the house hands fan their fingers open so each one reads. These are authoring aids, not acceptance criteria. Inspect and clean their output before publishing it. If simplification would materially change the requested object, discuss that choice with the user.

## Preserve physical relationships

Define the shared front plane, floor line, bounds, and direction of travel before arranging objects. Coplanar closed objects must fit without impossible overlaps. A cabinet belongs between the desk legs and beneath the apron; only a drawer moving toward the viewer may occlude objects behind it. Keep the fixed enclosure separate from the moving front in geometry and drawing order.

Construct complete objects even where they are hidden. A folder continues behind the drawer front; pulling it reveals the same full body rather than stretching or completing a truncated shape. Occlusion must follow depth throughout the motion, including intermediate states.

Content count changes packing, not furniture dimensions. One folder belongs at the front. Additional folders crowd toward the back; above six, tighter spacing and unreadable overlapping labels are preferable to a growing desk or drawer.

## Perform adversarial visual acceptance

Compare the actual rendered component with the source image and existing library. Actively look for reasons to reject it before delivery:

- Inspect normal viewing size and enlarged detail. Check every contour intersection for steps, gaps, unintended overlaps, thickness changes, and broken tangents. Rounded caps do not repair misaligned paths. At every hand pose's finger joins, dividers start on the outline's valley point, continue the finger's side, and share the outline's stroke width; fingers stay together unless a spread pose was requested.
- A curled or bent finger is a smooth arc at constant capsule width, never straight segments meeting at a knuckle angle, which reads as a kink. Fingers that curve side by side share one centre (concentric bands), so neighbours keep sharing a side and each divider stays on it.
- When a pose traces a reference, overlay the reference raster (scaled so its wrist matches the shared wrist cut) under thin outlines of the drawing and compare landmarks, not impressions. At the hand's heavy outline, a V between two contours narrower than about 35° fills solid with ink; open it or close it into a shared divider. Two strokes that leave one point tangentially (a scallop row meeting a divider, an arc peeling off an outline) fill the gap between them with an ink spur a stroke wide; round that cusp with a small fillet.
- Fix a join defect at the join: make the segments tangent-continuous, round a cusp with a small fillet, or remove a stub. Never rebuild an approved silhouette to avoid a join; overlay the approved version at the same scale and keep the outer silhouette within about 0.3 viewBox units except where a listed defect was removed. Separate strokes that meet collinearly double their antialiased edge into a visible step at 8×, so draw a pose's ink as one path, with interior lines retraced from the outline as spurs (they add no fill).
- Where two fingertips overlap, draw only the front finger's arc across the overlap and start the hidden finger's contour where it comes out from behind (a T-junction); drawing both arcs leaves a thin lens that fills with ink. Fingertip circles that nearly touch without overlapping leave a neck the fillet cannot open: overlap them (centres under about 5.5 of 6.4 apart) or part them clearly.
- The Hand's SVG clips at its 30×29 box: a pose traced from a reference keeps every contour, stroke included, inside it (lower a knuckle rather than let it clip). When a composite stops art at part of a hand (Pluma's pen at write's thumb and index), bound that part, wherever the art crosses it, by the hand's own drawn ink, fillets included, and test it; an undrawn boundary ends the art inside a finger.
- Two parallel ink edges less than the outline plus 2 units apart fuse into one bar twice the shared weight. Keep stacked edges, rims, and walls at least that far apart, or make them coincide exactly. A stack of translated slanted shapes fuses its sides into a comb; draw the sheets under the top one as near-edge bands with upright sides.
- An inner edge (a folder's closed flap) that shows only as a thin strip above the next object's edge reads as a seam or as that edge seen through, not as a panel: draw it side to side, and only where a tab height or more of panel shows under it clear of everything in front (Cajon, #172).
- Scale an inset to what it insets: a pressed key sinks a fraction of its own size, never a fixed amount that leaves a small key as a nub. Cap inner outlines at half the gap between neighbours when an object is drawn small.
- To stop a contour short of something drawn over it, cut the contour's ink with a mask; never paint a card-coloured knockout, which lands on the page outside the object.
- Stress marks such as creases are texture in the stock, not marks on the content: keep them short, radiating from their source, under the writing, and never meeting into an X or a check.
- Inspect endpoints, intermediate states, and extremes. Check hidden geometry, front/back ordering, clipping, and contact points throughout travel, not only in one attractive frame.
- Exercise each control independently, then meaningful combinations. Check zero, one, typical, and crowded counts; both sides; every pose; and desktop/mobile layouts and keyboard input.
- When a QA harness renders components with `renderToStaticMarkup`, give each render its own page: separately rendered roots repeat `useId` values, so masks and clip paths (Pluma's, for one) collide and the screenshot shows another instance's cut.
- Recheck the exported implementation after changing SVG paths, stroke weights, or transforms. A correct Paper preview does not prove the React version matches, and a small gallery thumbnail can hide broken joins.
- Fix visible defects before delivery. Passing tests or a build cannot establish visual quality. Describe precisely what was inspected rather than making a blanket quality claim.

Keep Paper artwork, published source, and generated registry artifacts consistent. Complete the repository checks and inspect the deployed result; distinguish a local fix, a merged change, and a verified live result.

These requirements were clarified through the corrections in [PR #55](https://github.com/chekos/jbm-ui/pull/55), [PR #57](https://github.com/chekos/jbm-ui/pull/57), and [PR #59](https://github.com/chekos/jbm-ui/pull/59).
