# Refining physical illustration motion

A recognizable object is the beginning. Believable motion comes from showing what causes it to move, what holds it in place, and what it cannot pass through. Stylized geometry can simplify the physics while preserving those relationships.

## Describe the action before choosing transforms

Write a sentence with an actor, a contact point, and an action: “A hand holds the folder while the front falls toward the viewer; fingers grip the sheet near its upper short edge and pull it up and left while turning it upright.”

Use that sentence to identify the moving parts, hinges, grip points, contacts, and obstacles. A rotation around an element's center is an implementation default, not evidence that the object should move that way. Translate a requested angle into an explicit axis, direction, pivot, and visible endpoint before editing code. If those are ambiguous, show a small sketch or ask one focused question instead of repeatedly implementing different interpretations.

## Define endpoints and constraints

Specify what is visible at each endpoint. A control's 0% is the start of the illustrated action, not necessarily a physically closed or inactive object. The folder's paper edge remains visible at 0%; at 100%, the sheet stands upright.

Separate invariants from adjustable choices:

- Invariants: sheet dimensions, writing aligned to the short edges, bottom fold clearance, attached label, visible folded corner.
- Adjustable choices: grip trajectory, sideways travel, amount of perspective, rotation timing, and final position.

Do not fix an impossible trajectory with clipping. Occlusion by the folder's front is correct; hiding a corner that passes through the folder's bottom conceals a geometry error.

## Make attached details obey the same surface

Labels, writing, folds, and borders provide evidence of orientation. Keep them attached to the object as it moves. The folder label compresses and shears with its front panel; the paper's writing and folded corner rotate with the sheet. Check both the silhouette and the interior marks: a plausible outline can still contain contradictory perspective cues.

## Build a path, not an isolated transform

Choose a meaningful control point, such as the fingers' grip or a hinge. Describe its path through space and derive the object's pose around it. Rotation and translation usually work together. As a rectangular sheet turns from its long edge toward its short edge, its lower corner sweeps downward unless the hand lifts it enough to clear the fold.

A small deterministic approximation is often sufficient. Folder currently combines a rigid rotation with clearance-derived lift and a shallow lateral curve. It does not simulate fingers or full 3D physics. Preserve the physical relationships that viewers can see rather than adding complexity they cannot perceive.

Keep spatial paths separate from temporal easing. A slider or video timeline should produce the same pose for the same progress. Add acceleration and settling only after the path itself makes sense.

## Refine one cause at a time

Use feedback to identify the underlying relationship, then make the smallest change that corrects it. Preserve accepted decisions. The folder iteration established front-edge perspective, attached label distortion, sheet orientation, writing direction, lift clearance, final angle, and lateral travel in succession.

The order matters: establish silhouette and orientation, then contact and trajectory, then perspective details and timing. Do not treat every correction as an invitation to redesign the whole illustration.

## Verify the journey as well as the destination

Scrub forward and backward through the actual preview. Inspect the start, intermediate poses, endpoint, and points where a corner changes which edge is lowest. Check narrow layouts and the deployed result. A good endpoint does not prove a good transition.

Use tests for physical invariants that can regress: no corner crosses the fold, the sheet stays in bounds, lift does not reverse unexpectedly, and invalid progress remains safe. Avoid tests that merely duplicate the implementation formula. Visual review is still needed for perceived weight, grip, balance, and whether the motion communicates the intended action.

## Know what “finished” means

Technical checks establish that the component works. The last-mile review establishes that its parts tell the same story. Look for contradictory cues: text floating on a moving surface, a rigid sheet apparently growing, a corner passing through a boundary, or a pickup with no lateral pull.

Stop when the action reads clearly, accepted details remain intact, and further changes no longer resolve a specific visible inconsistency. Small corrections earn their place by improving that coherence, not by adding more motion.
