# Physical illustration motion

The cross-project principles live in [Design's confirmed guidance](https://github.com/chekos/design/blob/main/DESIGN.md#let-the-objects-nature-guide-its-behavior). The approved wording is reproduced here for component work.

## Let the object's nature guide its behavior

Treat a visual element as the thing it represents. Calling something "paper" brings expectations about its material, orientation, how someone handles it, and how it interacts with surrounding objects. Its writing belongs to its surface; lifting it requires a plausible grip and path; its corners cannot pass through a folder. An arrow carries directionality, so its fill should follow that direction. Use these inherent properties to guide geometry and motion. Stylization can simplify reality while preserving the relationships that make the object feel coherent.

## Establish shared references before refining geometry

Create a clear vocabulary for the parts and movements being discussed. Label edges or corners A, B, C, and D; identify the front, back, hinge, and grip point. Specify which axis a rotation uses, which direction it travels, and what the starting and ending poses look like. Keep those labels attached to the object as it moves, so "edge A" stays unambiguous when "the top edge" changes. A small annotated sketch can establish this shared understanding faster than several rounds of implementation.

## Folder implementation

The front panel widens at the upper edge while its lower edge stays anchored. Its label compresses and shears with the surface. The sheet keeps its dimensions, folded corner and writing orientation while it rotates from landscape to upright, rises to clear the folder fold, and follows a shallow lateral path ending farther left. The paper remains partly visible at zero progress.

The motion is a deterministic illustration, not a complete physical simulation. Clearance comes from the trajectory rather than clipping away an impossible corner. Test the full progress range for fold clearance, bounds and non-reversing lift; inspect the deployed preview for whether the pickup reads naturally. Preserve keyboard controls and avoid autoplay.

Evidence: [PR #43](https://github.com/chekos/jbm-ui/pull/43).
