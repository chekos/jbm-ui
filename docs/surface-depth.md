# Surface depth

Raised surfaces combine a fine border, layered outer shadows, and a restrained inset highlight. Light comes from above: the upper inside edge catches light and the shadow falls below the surface. Aim for a crisp edge and soft depth without a thick outline or a broad gray halo.

## Source of truth

`registry/jbm/lib/tokens.ts` exports `shadow.card`, `shadow.cardDark`, and matching `surfaceBorder` recipes. `Card` consumes these tokens; `StatCard` and `CodeCard` inherit them through `Card`. Keep styles inline so copied registry components render consistently in a browser or Remotion. Do not duplicate shadow strings in individual components.

The outer layers increase their vertical offset and blur together (1, 3, 6, 12, and 24 pixels), with negative spread keeping the shadow close to the surface. Opacity decreases as the shadow gets softer. A one-pixel border defines the silhouette, while a subtle inset highlight defines the upper edge.

Use ink-tinted shadows on our cream canvas. Dark cards use a restrained cream highlight and stronger outer shadows; do not apply the bright light-card highlight to a dark surface. These are card surface recipes, not a global decoration for every element: text, chips, and transparent icon controls do not gain shadows by default.

## Review

Inspect the surface at its actual display scale, including scaled video previews. Check light Card, dark Card, StatCard, and CodeCard. Edges should remain readable without looking embossed, shadows should not be clipped by the host layout, and the highlight should support the edge rather than read as a separate stripe. Preserve the visible keyboard focus treatment of interactive controls.

## References

- [Steve Ruiz: border, box shadow, and a small inset highlight](https://x.com/steveruizok/status/1626605018848587776).
- [Brett: progressively layered material shadows](https://x.com/BrettFromDJ/status/1795942054733713473).

The recipes adapt these supplied visual references to this library's palette; they are not exact copies of either implementation.

## Interactive reference

The gallery's Foundations filter includes Surface depth: light/dark samples, the original surface for comparison, and independent border, inset, contact, and ambient controls. The current preview reads `shadowLayers` from the token module, which also composes the complete `shadow` recipes. Comparison-only historical styles stay in the gallery. Copy token usage installs `@jbm/tokens`; Surface depth is a documentation entry, not a separate registry package.
