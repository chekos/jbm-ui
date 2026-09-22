# Illustration workflow

These guidelines apply to reference-based illustrations and interactions in the component library. They complement [physical illustration motion](physical-illustration-motion.md); concrete desk and hand contracts live in [desk illustrations](desk-components.md).

## Inspect the reference and the library first

Use `gh` to read issues, pull requests, comments, and available attachments before reaching for browser navigation. Open the actual reference image, including attached images; reading its description is insufficient.

Inspect existing component source and rendered gallery examples before designing. Identify which objects already exist, which need variants, and which interactions compose them. Match the reference's visual language and the library's line weight, palette, and simplicity. Do not equate resemblance to the subject with resemblance to the reference.

## Keep objects, variants, and motion separate

An independent physical object should remain usable on its own. A hand does not own a folder. Hand poses are variants; translation and rotation are separate transforms. A desk may include a file cabinet, but the cabinet and its drawer remain independently reusable.

Reuse existing components in composites. A highlighted chat message combines ChatBubble with the existing text highlighting behavior; it does not need another bubble implementation or an attached folder.

Give independent properties independent controls. Wood finish and cabinet side cannot share one checkbox. Controlled React illustrations use direct controls; add a Remotion Player only when the implementation actually requires its hooks.

## Simplify deliberately

Use simple geometric line art, flat fills, minimal contours, and recognizable silhouettes. Avoid realistic anatomy, wrinkles, incidental props, floating loading lines, or decoration borrowed from a reference scene without a role in the requested component. A desk can have an empty top; a caddy must read as a container on its own.

When a complex shape resists clean construction, use the available Paper/Quiver vector tools or generate a reference-guided image and vectorize it in Paper. These are authoring aids, not acceptance criteria. Inspect and clean their output before publishing it. If simplification would materially change the requested object, discuss that choice with the user.

## Preserve physical relationships

Define the shared front plane, floor line, bounds, and direction of travel before arranging objects. Coplanar closed objects must fit without impossible overlaps. A cabinet belongs between the desk legs and beneath the apron; only a drawer moving toward the viewer may occlude objects behind it. Keep the fixed enclosure separate from the moving front in geometry and drawing order.

Construct complete objects even where they are hidden. A folder continues behind the drawer front; pulling it reveals the same full body rather than stretching or completing a truncated shape. Occlusion must follow depth throughout the motion, including intermediate states.

Content count changes packing, not furniture dimensions. One folder belongs at the front. Additional folders crowd toward the back; above six, tighter spacing and unreadable overlapping labels are preferable to a growing desk or drawer.

## Perform adversarial visual acceptance

Compare the actual rendered component with the source image and existing library. Actively look for reasons to reject it before delivery:

- Inspect normal viewing size and enlarged detail. Check every contour intersection for steps, gaps, unintended overlaps, thickness changes, and broken tangents. Rounded caps do not repair misaligned paths. At the open palm's finger joins, dividers and outer contours share centerlines and stroke widths; fingers stay together unless a spread pose was requested.
- Inspect endpoints, intermediate states, and extremes. Check hidden geometry, front/back ordering, clipping, and contact points throughout travel, not only in one attractive frame.
- Exercise each control independently, then meaningful combinations. Check zero, one, typical, and crowded counts; both sides; every pose; and desktop/mobile layouts and keyboard input.
- Recheck the exported implementation after changing SVG paths, stroke weights, or transforms. A correct Paper preview does not prove the React version matches, and a small gallery thumbnail can hide broken joins.
- Fix visible defects before delivery. Passing tests or a build cannot establish visual quality. Describe precisely what was inspected rather than making a blanket quality claim.

Keep Paper artwork, published source, and generated registry artifacts consistent. Complete the repository checks and inspect the deployed result; distinguish a local fix, a merged change, and a verified live result.

These requirements were clarified through the corrections in [PR #55](https://github.com/chekos/jbm-ui/pull/55), [PR #57](https://github.com/chekos/jbm-ui/pull/57), and [PR #59](https://github.com/chekos/jbm-ui/pull/59).
