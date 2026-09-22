# Desk illustrations and interactions

Install `@jbm/escritorio` for the desk and its drawer, tray, caddy, tokens and geometry dependencies. Install `@jbm/mano` and `@jbm/burbuja` separately for the hand and message interaction. Each part also installs independently: `@jbm/cajon`, `@jbm/bandeja`, `@jbm/tool-caddy`.

These components are controlled React illustrations in the motion directory. They do not read a clock or import Remotion. A host can supply progress from a Remotion frame, a slider, or its own interaction state. The gallery uses a Remotion Player with explicit playback and a keyboard-operable frame inspector.

## Coordinates and composition

`Cajon`, `Mano`, `Bandeja`, `ToolCaddy`, and `Escritorio` return SVG groups. Place them in an SVG owned by the scene. `Burbuja` wraps the existing HTML `ChatBubble`; place it in a positioned HTML container over the SVG. Use the same coordinates and dimensions for both layers. If scaling, scale their common parent, not either layer alone.

Layout helpers return the geometry used to render the objects:

- `cajonLayout(props)` returns actual width, minimum occupied height and each tab's contact point. Width grows for long names; depth grows for up to twelve folders. The label stays 16 units tall. Lifted folders can extend above `y`, so reserve 90 units above the drawer for pickup. `open` and each folder's `pulled` are clamped to 0–1.
- `escritorioLayout(props)` (also exported as `layout`) returns the actual desk box and anchors for the drawer, folder tabs, tray floor, top sheet, each tool and incoming-message slot. The box can grow beyond the requested minimum to fit its contents. `spec.runners` adds instruments after `spec.tools`. `finish` is `paper` or `wood`; `drawerSide` is `start` or `end`.
- `bandejaLayout(props)` exposes the tray floor and the center of the top sheet. `layers` counts settled sheets; `landing` adds one incoming sheet. At the end of a landing, increment `layers` and reset `landing` in the same frame. `costLine` is the mark's distance above the tray, not a lid or a stack limit.
- `toolCaddyLayout(props)` returns the actual caddy width and each instrument's moving pickup point. Instruments have a `name`, `kind` (`ruler`, `stamp`, `knife`), and optional `pulled`. Use short names that fit the instrument handles.
- `burbujaLayout(props)` returns each word's rectangle and link anchor. Monospaced character cells make wrapping deterministic. Long words grow the requested minimum width rather than overflowing. The coordinates include arrival and departure offsets. The font must be loaded by the host, as for the rest of the library.

For a twelve-folder close-up, give the drawer its own shot. In a full desk shot, frame the complete box returned by the layout helper. On portrait canvases, center a single desk or show two clients vertically; do not squeeze two desks side by side. Reserve room above a drawer for a lifted folder and below a message for its tail. The gallery provides portrait previews for each part.

## Hand and carried objects

`Mano` pins its active contact to `at`, including during a change in grip or angle. `grip=0` points, intermediate values spread the fingers to reach, and `grip=1` closes them. Reverse the progression to release. `manoAnchor(grip)` exposes the corresponding coordinate in the hand's native 100-unit drawing.

Children use pixel offsets from `at`. They rotate and travel with the hand, between its back layer and foreground fingers; they retain their authored size when the hand size changes. Attach a held object's grip point at `(0, 0)`. Reparent the object into the scene on release using the same contact and rotation to avoid a jump. `pointOn(path, u)` travels by polyline distance, tolerates repeated points and clamps endpoints; `pathTilt` returns a restrained travel tilt.

## Message lifecycle

Supply `arrive`, `glow` and `link` independently. Arrival slides from `side` without bouncing. `highlight` contains zero-based word indices; duplicates and invalid indices are ignored. Glow progresses through valid words in the supplied order. Budget about 0.3 seconds per word in the host. The connector starts at the last valid highlighted word and lands exactly at `target`; optional `hook` adds an underline barb. Animate `link` from zero to one to reach a target and back to zero for a failed match. The host owns the target's response. `leave` defaults to zero, so a bubble stays until the scene explicitly dismisses it.

## Validation

`node --test scripts/desk-components.test.mjs` checks polyline edge cases, drawer capacity and bounds, shared desk anchors, deterministic word layout, link retraction, and hand contact/layer ordering. Run the standard registry and consumer checks after source changes. In the gallery inspect start, middle and end states in both orientations, the twelve-folder case, both drawer sides, the 48-pixel hand and a failed message match.
