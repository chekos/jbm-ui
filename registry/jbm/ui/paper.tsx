import * as React from "react";
import { color, font, sansWidth, shadowLayers } from "../lib/tokens";

/**
 * Paper cut-out primitives. A `Paper` is a flat shape that reads as a piece of card stock laid on the
 * cream canvas: a fine ink edge, no gradient, and the house layered shadow with a slightly longer drop
 * so it lifts off the page. `tone` picks the stock: cream paper, vermilion (sticky note), or ink.
 * Pure React; wrap in a motion `Pop` for entrances.
 */
export type PaperTone = "paper" | "accent" | "ink";
/** A sheet corner: top-left, top-right, bottom-right, bottom-left. */
export type PaperCorner = "tl" | "tr" | "br" | "bl";
/** A pestaña fixed behind the sheet's top edge; `reveal` slides it out from behind the sheet. */
export type PaperTab = {
  /** The tab's name, set in Geist 800. */
  label: string;
  /** 0 = hidden behind the sheet, 1 = fully out. Default 1. */
  reveal?: number;
  /** Distance from the sheet's left edge to the tab, in stage px. Default max(radius, 24). */
  offset?: number;
  /** Label size in stage px. Default 32 (the minimum for a 1080 stage). */
  size?: number;
};

export const paperShadow = [
  ...shadowLayers.card.contact,
  ...shadowLayers.card.ambient,
  "0 18px 28px -14px rgba(32,36,31,0.22)",
].join(", ");

export const paperFill = (tone: PaperTone) => (tone === "accent" ? color.accent : tone === "ink" ? color.ink : color.card);
export const paperInk = (tone: PaperTone) => (tone === "paper" ? color.ink : color.bg);

const unit = (n: number | undefined, fallback = 0) => (typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback);
const round = (n: number) => Math.round(n * 100) / 100;
const fine = (n: number) => Math.round(n * 10000) / 10000;

/** Default fray amplitude (stage px) shared by Paper's starting tear and Tear's seams. */
export const FRAY = 6;
/** Farthest a frayed edge strays from its seam line: 1.8 × amplitude. */
export const frayReach = (amplitude = FRAY) => 1.8 * Math.max(0, amplitude);

function hash(a: number, b: number, c: number) {
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul((b | 0) + 0x7f4a7c15, 0x85ebca6b) ^ Math.imul((c | 0) + 0x165667b1, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * A deterministic torn edge along the horizontal line `y`, from x = 0 to x = width: a slow wander
 * carrying fine, irregular grain (points at uneven spacing averaging about half of `step`) and the
 * odd fibre that sticks out further, the way paper tears, never a regular zig-zag. The same seed,
 * y, width, and amplitude always return the same points, so Paper's starting tear and Tear's seam at
 * that y share one profile. Every point stays within frayReach(amplitude) of y, and most within one
 * amplitude; the first and last points sit on x = 0 and x = width.
 */
export function frayEdge({
  width,
  y,
  seed = 1,
  amplitude = FRAY,
  step = 12,
}: {
  width: number;
  y: number;
  seed?: number;
  amplitude?: number;
  step?: number;
}): { x: number; y: number }[] {
  const w = Number.isFinite(width) ? Math.max(0, width) : 0;
  const amp = Number.isFinite(amplitude) ? Math.max(0, amplitude) : 0;
  const reach = frayReach(amp);
  const pace = Math.max(4, Number.isFinite(step) ? step : 12);
  const line = Number.isFinite(y) ? y : 0;
  const key = Math.round(line);
  const phase = hash(seed, key, -1) * Math.PI * 2;
  // Slow wander: two long waves, so a seam drifts rather than oscillates.
  const wander = (x: number) => 0.62 * (0.65 * Math.sin(phase + x / 53) + 0.35 * Math.sin(phase * 1.7 + x / 23));
  const points: { x: number; y: number }[] = [{ x: 0, y: round(line + amp * wander(0)) }];
  let x = 0;
  for (let k = 1; x < w; k++) {
    // Uneven spacing between 0.25 and 0.8 of the step: grain, not teeth.
    x += pace * (0.25 + 0.55 * hash(seed, key, 3 * k));
    if (x > w - pace * 0.2) x = w;
    const grain = (hash(seed, key, 3 * k + 1) - 0.5) * 0.5;
    // About one point in ten is a fibre: a short spike to one side.
    const f = hash(seed, key, 3 * k + 2);
    const fibre = f < 0.1 && x < w ? (f < 0.05 ? -1 : 1) * (0.35 + 0.35 * hash(seed, key, 1000 + k)) : 0;
    const dy = Math.max(-reach, Math.min(reach, amp * (wander(x) + grain + fibre)));
    points.push({ x: round(x), y: round(line + dy) });
  }
  return points;
}

/**
 * Tension geometry: crease growth (0–1 of each crease's full length, reached at 0.8) and how far the
 * starting tear has run (0 until 0.6, then a square-root ease, so the notch is already half its
 * depth at 0.7 and whole at 1).
 */
export function paperTension(tension: number) {
  const t = unit(tension);
  return { crease: Math.min(1, t / 0.8), tear: Math.sqrt(Math.max(0, (t - 0.6) / 0.4)) };
}

const allCorners: PaperCorner[] = ["tl", "tr", "br", "bl"];
const cornerAt: Record<PaperCorner, [number, number]> = { tl: [0, 0], tr: [1, 0], br: [1, 1], bl: [0, 1] };

/** Longest crease, as a share of the crease box's shorter side (12–15% of it). */
const CREASE_MAX = 0.14;
/** How far behind the corner the creases' common source sits, as a share of the shorter side. */
const CREASE_SOURCE = 0.05;

/**
 * The short fold lines one pulled corner sends into the sheet, in fractions of the crease box
 * (0–1 on each axis). Two per corner, deterministic in `seed`, turned 7–11° to either side of the
 * corner's diagonal, the second shorter. They radiate from a point just behind the corner, so both
 * start at the pulled corner (a few px apart on the rounded contour) and only spread from there:
 * no two share an end or meet. `aspect` is the box's height over its width, so the angles are true
 * on a sized sheet. The longest is CREASE_MAX of the shorter side, and `crease` (0–1) grows them.
 */
function creaseFan(corner: PaperCorner, crease: number, seed = 1, aspect = 1) {
  const [x, y] = cornerAt[corner];
  const ci = allCorners.indexOf(corner);
  const a = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  // Square-pixel frame: width 1, height aspect.
  const short = Math.min(1, a);
  const cx = x,
    cy = y * a;
  const vx = 0.5 - x,
    vy = (0.5 - y) * a;
  const vl = Math.hypot(vx, vy);
  const ux = vx / vl,
    uy = vy / vl;
  const sx = cx - ux * CREASE_SOURCE * short,
    sy = cy - uy * CREASE_SOURCE * short;
  const side = hash(seed, ci, 91) < 0.5 ? -1 : 1;
  const g = unit(crease);
  const main = CREASE_MAX * short * (0.86 + 0.14 * hash(seed, ci, 93));
  const rays = [
    { turn: side * (7 + 4 * hash(seed, ci, 92)), len: main, delay: 0 },
    { turn: -side * (7 + 4 * hash(seed, ci, 94)), len: main * (0.62 + 0.15 * hash(seed, ci, 95)), delay: 0.2 },
  ];
  return rays
    .map((r) => {
      const grow = Math.min(1, Math.max(0, (g - r.delay) / (1 - r.delay)));
      const rad = (r.turn * Math.PI) / 180;
      const dx = ux * Math.cos(rad) - uy * Math.sin(rad);
      const dy = ux * Math.sin(rad) + uy * Math.cos(rad);
      // Enter the box where the ray has crossed both edges at this corner, then step in.
      const tx = Math.abs(dx) > 1e-9 ? (cx - sx) / dx : 0;
      const ty = Math.abs(dy) > 1e-9 ? (cy - sy) / dy : 0;
      const t0 = Math.max(tx, ty);
      const at = (t: number) => [fine((sx + dx * t) / 1), fine((sy + dy * t) / a)] as [number, number];
      const len = r.len * grow;
      return { from: at(t0), to: at(t0 + len), grow: len > 0.004 * short ? grow : 0 };
    })
    .filter((r) => r.grow > 0);
}

export function Paper({
  tone = "paper",
  w,
  h,
  radius = 22,
  rotate = 0,
  edge = true,
  shadow = true,
  tension = 0,
  pull = allCorners,
  seam,
  seamSide = "left",
  seed = 1,
  tab,
  style,
  children,
}: {
  tone?: PaperTone;
  w?: number;
  h?: number;
  radius?: number;
  rotate?: number;
  edge?: boolean;
  shadow?: boolean;
  /** 0–1: short creases fan in from the pulled corners (full at 0.8, never meeting); from 0.6 a frayed notch tears at the seam. */
  tension?: number;
  /** Corners being pulled; each fans two or three short creases inward. Default all four. */
  pull?: PaperCorner[];
  /** Where the starting tear opens: y in stage px from the top edge. Default half the height; null for no tear. */
  seam?: number | null;
  /** The edge the tear starts from. */
  seamSide?: "left" | "right";
  /** Fray pattern of the starting tear and of the crease fans; use the same seed as Tear to continue the same edge. */
  seed?: number;
  /** A real pestaña fixed behind the top edge. */
  tab?: PaperTab;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const uid = `pc${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stress = paperTension(tension);
  const edgeColor = tone === "paper" ? color.ink : paperFill(tone);
  if (!(stress.crease > 0) && !tab) {
    return (
      <div
        style={{
          width: w,
          height: h,
          background: paperFill(tone),
          border: edge ? `2px solid ${edgeColor}` : "none",
          borderRadius: radius,
          boxShadow: shadow ? paperShadow : "none",
          boxSizing: "border-box",
          transform: rotate ? `rotate(${rotate}deg)` : undefined,
          position: "relative",
          ...style,
        }}
      >
        {children}
      </div>
    );
  }

  // Layered sheet: the root keeps the size, transform, and shadow (a box-shadow never paints inside
  // its box, so the tear shows what lies under the sheet); the fill and edge sit on a layer behind the
  // children with the creases just above it, the tab behind that, and the tear lips on an overlay
  // above the writing.
  const inset = edge ? -2 : 0;
  const seamPx = seam === null ? null : typeof seam === "number" && Number.isFinite(seam) ? seam : typeof h === "number" ? h / 2 : undefined;
  const seamCss = seamPx === undefined ? "50%" : `${round(seamPx ?? 0)}px`;
  const tearOn = seam !== null && stress.tear > 0;
  // A short notch: the lip reaches about a seventh of the sheet in, never a long spike.
  const depthMax = typeof w === "number" && w > 0 ? Math.min(w * 0.14, 90) : 64;
  const depth = depthMax * stress.tear;
  // Half the mouth at the edge: the notch is 24px open at tension 1 and already 17px at 0.7. It
  // narrows fast past the margin (over the writing it stays inside a band gap) and runs out as a
  // hairline crack.
  const gap = 12 * stress.tear;
  const left = seamSide !== "right";
  let lips: { upper: [number, number][]; lower: [number, number][]; top: [number, number][]; shade: [number, number][] } | null = null;
  let clipPath: string | undefined;
  if (tearOn && depth > 0.5) {
    const width = typeof w === "number" && w > 0 ? w : depthMax * 2;
    const base = seamPx ?? -1;
    // Distance from the torn edge, ascending. On the right edge of a sized sheet the profile is the
    // right end of the same seam, so Tear continues it exactly.
    const mirror = !left && typeof w === "number" && w > 0;
    const raw = frayEdge({ width, y: base, seed }).map((p) => ({ d: mirror ? width - p.x : p.x, dy: p.y - base }));
    if (mirror) raw.reverse();
    const along = raw.filter((p) => p.d < depth);
    const next = raw.find((p) => p.d >= depth);
    const last = along[along.length - 1];
    const tipDy = next && last && next.d !== last.d ? last.dy + ((next.dy - last.dy) * (depth - last.d)) / (next.d - last.d) : (last?.dy ?? 0);
    const spine = [...along, { d: depth, dy: tipDy }];
    // A wedge cut into the sheet: widest at the edge, closing to a point at the tip, each lip
    // carrying the seam's fray like Tear's parted strips.
    const open = (d: number) => gap * (1 - d / depth) ** 1.6;
    // Fibres: now and then a lip pulls back a little further from the seam, so the two sides are
    // not a smooth mirror. The midline between the lips stays exactly on the seam, so Tear
    // continues the same edge.
    const key = Math.round(base);
    const fibre = (i: number) =>
      i === 0 || i === spine.length - 1 ? 0 : FRAY * Math.min(1, 2 * stress.tear) * 0.3 * hash(seed, key, 500 + i) * (1 - spine[i].d / depth);
    // Each lip is a 2px edge on the sheet's side of the cut: its stroke centre sits the half-mouth
    // plus 1px from the seam. Below a 2px mouth the two strokes run together on the seam as one
    // 2px crack, and the clip closes with them, so the crack is never split by a hairline.
    const reachOf = (half: number) => (half >= 2 ? half + 1 : half > 1 ? 3 * (half - 1) : 0);
    const halves = spine.map((p, i) => open(p.d) + fibre(i));
    const line = (sign: number) => spine.map((p, i) => [round(p.d), round(p.dy + sign * reachOf(halves[i]))] as [number, number]);
    const mouth = (sign: number) => spine.map((p, i) => [round(p.d), round(p.dy + sign * Math.max(0, reachOf(halves[i]) - 1))] as [number, number]);
    const top = mouth(-1),
      bottom = mouth(1);
    // The upper lip's shadow on whatever lies under the sheet (the light is top-left): a thin
    // band inside the mouth, so the notch reads as a hole cut into the sheet, not a shape on it.
    const cast = 3.5 * Math.min(1, 2 * stress.tear);
    const shade = top.map(([d, dy], i) => [d, round(dy + Math.min(cast, (bottom[i][1] - dy) * 0.45))] as [number, number]);
    lips = { upper: line(-1), lower: line(1), top, shade };
    // The mouth is cut from the whole sheet (fill, writing, and overlay), in the root's own box.
    // The rest of the clip reaches far past the box so the shadow and tab are never clipped.
    const at = ([d, dy]: [number, number]) => `${left ? `${d}px` : `calc(100% - ${d}px)`} calc(${seamCss} + ${dy}px)`;
    const y0 = (lip: [number, number][]) => `calc(${seamCss} + ${lip[0][1]}px)`;
    const M = 4000;
    const far = [`-${M}px -${M}px`, `calc(100% + ${M}px) -${M}px`];
    clipPath = left
      ? `polygon(${[
          ...far,
          `calc(100% + ${M}px) calc(100% + ${M}px)`,
          `-${M}px calc(100% + ${M}px)`,
          `-${M}px ${y0(bottom)}`,
          ...bottom.map(at),
          ...lips.shade.slice(0, -1).reverse().map(at),
          `-${M}px ${y0(lips.shade)}`,
        ].join(", ")})`
      : `polygon(${[
          ...far,
          `calc(100% + ${M}px) ${y0(lips.shade)}`,
          ...lips.shade.map(at),
          ...bottom.slice(0, -1).reverse().map(at),
          `calc(100% + ${M}px) ${y0(bottom)}`,
          `calc(100% + ${M}px) calc(100% + ${M}px)`,
          `-${M}px calc(100% + ${M}px)`,
        ].join(", ")})`;
  }
  const creaseInk = paperInk(tone);
  const cornerInset = Math.round(Math.max(0, radius) * (1 - Math.SQRT1_2)) + (edge ? 2 : 0);
  const box = (n: number | undefined) => (typeof n === "number" && n > 2 * cornerInset ? n - 2 * cornerInset : undefined);
  const bw = box(w);
  const bh = box(h);
  const creases =
    stress.crease > 0
      ? allCorners.filter((c) => pull.includes(c)).flatMap((c) => creaseFan(c, stress.crease, seed, bw && bh ? bh / bw : 1))
      : [];
  const pct = (n: number) => `${round(n * 100)}%`;
  // On a sized sheet a label too long for the width between the left edge and the top-right
  // radius sets smaller, so the whole name fits; without a width the row ends it in an ellipsis.
  const wantSize = tab ? Math.max(1, tab.size ?? 32) : 0;
  const tabRoom = typeof w === "number" && w > 0 ? w - Math.max(radius, 0) : Infinity;
  // Tab width is linear in its size: label (em) + 2 × 0.55 em padding + the edges.
  const labelEm = tab ? sansWidth(tab.label, 1) : 0;
  const edges = edge ? 4 : 0;
  const tabSize =
    tab && wantSize * (labelEm + 1.1) + edges > tabRoom
      ? Math.max(1, Math.floor(((tabRoom - edges - 2) / (labelEm + 1.12)) * 10) / 10)
      : wantSize;
  const tabRadius = Math.min(12, Math.max(0, radius), tabSize * 0.4);
  const tuck = 14;
  // How much of the tab shows above the sheet at its reveal, and the label's opacity: nothing
  // until most of the capitals show (0.6 em of the line), then whole a quarter em later.
  const tabPad = Math.round(tabSize * 0.3);
  const tabH = (edge ? 4 : 0) + 2 * tabPad + tabSize + tuck;
  const tabShows = unit(tab?.reveal, 1) * tabH - tuck;
  const tabLabelOpacity = round(
    Math.min(1, Math.max(0, (tabShows - ((edge ? 2 : 0) + tabPad + 0.6 * tabSize)) / (0.25 * tabSize)))
  );
  return (
    <div
      style={{
        width: w,
        height: h,
        border: edge ? "2px solid transparent" : "none",
        borderRadius: radius,
        boxShadow: shadow ? paperShadow : "none",
        boxSizing: "border-box",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        position: "relative",
        isolation: "isolate",
        clipPath,
        ...style,
      }}
    >
      {tab && (
        // A row from the sheet's left edge to its top-right corner radius: the spacer gives way
        // first, so a long tab slides left to stay on the sheet; one wider than the row ends in an
        // ellipsis rather than overhanging the edge.
        <div
          style={{
            position: "absolute",
            left: inset,
            right: Math.max(radius, 0) + inset,
            bottom: `calc(100% + ${-inset - tuck}px)`,
            zIndex: -2,
            display: "flex",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: `0 1 ${tab.offset ?? Math.max(radius, 24)}px`, minWidth: 0 }} />
          <div
            style={{
              flex: "none",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              transform: `translateY(${round((1 - unit(tab.reveal, 1)) * 100)}%)`,
              padding: `${Math.round(tabSize * 0.3)}px ${Math.round(tabSize * 0.55)}px ${Math.round(tabSize * 0.3) + tuck}px`,
              background: paperFill(tone),
              border: edge ? `2px solid ${edgeColor}` : "none",
              borderRadius: `${tabRadius}px ${tabRadius}px 0 0`,
              boxShadow: shadow ? paperShadow : "none",
              boxSizing: "border-box",
              fontFamily: font.sans,
              fontWeight: 800,
              fontSize: tabSize,
              letterSpacing: -tabSize * 0.01,
              lineHeight: 1,
              color: paperInk(tone),
              whiteSpace: "nowrap",
            }}
          >
            {/* The label fades in as a whole once the tab shows it to cap height, so a half-drawn
                tab never leaves glyph tops as specks along the sheet's edge. */}
            <span style={{ opacity: tabLabelOpacity }}>{tab.label}</span>
          </div>
        </div>
      )}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset,
          zIndex: -1,
          background: paperFill(tone),
          border: edge ? `2px solid ${edgeColor}` : "none",
          borderRadius: radius,
          boxSizing: "border-box",
        }}
      />
      {creases.length > 0 && (
        // Creases are folds in the stock, not marks on it: they sit between the fill and the
        // writing, so ink and filled boxes lie over them and the page never reads as crossed out.
        // Each starts where its corner's diagonal meets the rounded contour and fades to nothing.
        <svg
          aria-hidden
          style={{
            position: "absolute",
            left: inset + cornerInset,
            top: inset + cornerInset,
            width: `calc(100% - ${2 * (inset + cornerInset)}px)`,
            height: `calc(100% - ${2 * (inset + cornerInset)}px)`,
            zIndex: -1,
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <defs>
            {creases.map((c, i) => (
              <linearGradient key={i} id={`${uid}c${i}`} gradientUnits="userSpaceOnUse" x1={pct(c.from[0])} y1={pct(c.from[1])} x2={pct(c.to[0])} y2={pct(c.to[1])}>
                <stop offset="0" stopColor={creaseInk} stopOpacity={0.3} />
                <stop offset="1" stopColor={creaseInk} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {creases.map((c, i) => (
            <line
              key={i}
              x1={pct(c.from[0])}
              y1={pct(c.from[1])}
              x2={pct(c.to[0])}
              y2={pct(c.to[1])}
              stroke={`url(#${uid}c${i})`}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}
        </svg>
      )}
      {children}
      {lips && (
        <div aria-hidden style={{ position: "absolute", inset, pointerEvents: "none" }}>
          <svg
            width={1}
            height={1}
            style={{ position: "absolute", left: left ? 0 : "100%", top: seamCss, overflow: "visible" }}
          >
            {/* The shadow band: the house desk in the sheet's shadow (the rule tone), opaque, so it
                reads the same on every stock and covers any writing at the lip. */}
            <polygon
              points={[...lips.top, ...[...lips.shade].reverse()]
                .map(([d, dy]) => `${round((left ? 1 : -1) * d)},${dy}`)
                .join(" ")}
              fill={color.line}
            />
            {edge &&
              [lips.upper, lips.lower].map((lip, i) => (
                <polyline
                  key={i}
                  points={lip.map(([d, dy], j) => `${round((left ? 1 : -1) * (j === 0 ? Math.max(d, 1) : d))},${dy}`).join(" ")}
                  fill="none"
                  // Ink lips on cream stock; on dark stock a cream hairline, so the cut's edges
                  // read against both the sheet and the page showing through the mouth.
                  stroke={tone === "paper" ? edgeColor : color.bg}
                  strokeWidth={tone === "paper" ? 2 : 1.25}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
          </svg>
        </div>
      )}
    </div>
  );
}

/** A slanted vermilion (or ink) sticky note with one line of display type. The loud word of a scene. */
export function Sticker({
  children,
  tone = "accent",
  size = 72,
  rotate = -5,
  mono,
  style,
}: {
  children: React.ReactNode;
  tone?: PaperTone;
  size?: number;
  rotate?: number;
  mono?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Paper tone={tone} rotate={rotate} radius={Math.round(size * 0.22)} edge={tone === "paper"} style={{ display: "inline-block", padding: `${Math.round(size * 0.18)}px ${Math.round(size * 0.4)}px`, ...style }}>
      <div style={{ fontFamily: mono ? font.mono : font.sans, fontSize: size, fontWeight: 800, letterSpacing: mono ? 0 : -size * 0.02, lineHeight: 1.05, color: paperInk(tone), whiteSpace: "nowrap" }}>{children}</div>
    </Paper>
  );
}

/** Small lowercase caption under an illustration: sans 600, ink. */
export function Caption({ children, size = 34, dim, style }: { children: React.ReactNode; size?: number; dim?: boolean; style?: React.CSSProperties }) {
  return <div style={{ fontFamily: font.sans, fontSize: size, fontWeight: 600, color: dim ? color.dim : color.ink, lineHeight: 1.2, textAlign: "center", ...style }}>{children}</div>;
}
