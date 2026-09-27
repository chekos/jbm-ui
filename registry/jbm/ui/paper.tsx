import * as React from "react";
import { color, font, shadowLayers } from "../lib/tokens";

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
 * A deterministic torn edge along the horizontal line `y`, from x = 0 to x = width: small irregular
 * teeth about `step` px apart riding a gentle wander. The same seed, y, width, and amplitude always
 * return the same points, so Paper's starting tear and Tear's seam at that y share one profile.
 * Every point stays within frayReach(amplitude) of y; the first and last points sit on x = 0 and x = width.
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
  const n = Math.max(2, Math.round(w / Math.max(4, step)));
  const dx = w / n;
  const line = Number.isFinite(y) ? y : 0;
  const key = Math.round(line);
  const phase = hash(seed, key, -1) * Math.PI * 2;
  const points: { x: number; y: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const jitter = k === 0 || k === n ? 0 : (hash(seed, key, 2 * k) - 0.5) * 0.6 * dx;
    const tooth = (k % 2 ? 0.4 : -0.4) + (hash(seed, key, 2 * k + 1) - 0.5) * 1.2;
    const wander = 0.8 * Math.sin(phase + (k * dx) / 38) * (0.6 + 0.4 * Math.sin(phase * 0.7 + (k * dx) / 91));
    points.push({ x: round(k * dx + jitter), y: round(line + amp * (tooth + wander)) });
  }
  return points;
}

/** Tension geometry: crease length (0–1 of the way to the centre) and how far the starting tear has run. */
export function paperTension(tension: number) {
  const t = unit(tension);
  return { crease: Math.min(1, t / 0.8), tear: Math.max(0, (t - 0.6) / 0.4) };
}

const allCorners: PaperCorner[] = ["tl", "tr", "br", "bl"];
const cornerAt: Record<PaperCorner, [number, number]> = { tl: [0, 0], tr: [1, 0], br: [1, 1], bl: [0, 1] };

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
  /** 0–1: creases run from the pulled corners toward the centre (full at 0.8); above 0.6 a tear starts at the seam. */
  tension?: number;
  /** Corners being pulled; each grows one crease toward the centre. Default all four. */
  pull?: PaperCorner[];
  /** Where the starting tear opens: y in stage px from the top edge. Default half the height; null for no tear. */
  seam?: number | null;
  /** The edge the tear starts from. */
  seamSide?: "left" | "right";
  /** Fray pattern of the starting tear; use the same seed as Tear to continue the same edge. */
  seed?: number;
  /** A real pestaña fixed behind the top edge. */
  tab?: PaperTab;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
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
  // children, the tab behind that, and creases and tear lips on an overlay above the writing.
  const inset = edge ? -2 : 0;
  const seamPx = seam === null ? null : typeof seam === "number" && Number.isFinite(seam) ? seam : typeof h === "number" ? h / 2 : undefined;
  const seamCss = seamPx === undefined ? "50%" : `${round(seamPx ?? 0)}px`;
  const tearOn = seam !== null && stress.tear > 0;
  const depthMax = typeof w === "number" && w > 0 ? Math.min(w * 0.18, 140) : 72;
  const depth = depthMax * stress.tear;
  const gap = 7 * stress.tear;
  const left = seamSide !== "right";
  let lips: { upper: [number, number][]; lower: [number, number][] } | null = null;
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
    const open = (d: number) => gap * (1 - d / depth);
    lips = {
      upper: spine.map((p) => [round(p.d), round(p.dy - open(p.d))]),
      lower: spine.map((p) => [round(p.d), round(p.dy + open(p.d))]),
    };
    const at = ([d, dy]: [number, number]) => `${left ? `${d}px` : `calc(100% - ${d}px)`} calc(${seamCss} + ${dy}px)`;
    const mouth = [...lips.lower.map(at), ...lips.upper.slice(0, -1).reverse().map(at)];
    clipPath = left
      ? `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${mouth.join(", ")})`
      : `polygon(0 0, 100% 0, ${[...lips.upper.map(at), ...lips.lower.slice(0, -1).reverse().map(at)].join(", ")}, 100% 100%, 0 100%)`;
  }
  const creaseInk = paperInk(tone);
  const cornerInset = Math.round(Math.max(0, radius) * (1 - Math.SQRT1_2)) + (edge ? 2 : 0);
  const tabSize = tab ? Math.max(1, tab.size ?? 32) : 0;
  const tabRadius = Math.min(12, Math.max(0, radius), tabSize * 0.4);
  const tuck = 14;
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
        ...style,
      }}
    >
      {tab && (
        <div
          style={{
            position: "absolute",
            left: (tab.offset ?? Math.max(radius, 24)) + inset,
            bottom: `calc(100% + ${-inset - tuck}px)`,
            transform: `translateY(${round((1 - unit(tab.reveal, 1)) * 100)}%)`,
            zIndex: -2,
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
          {tab.label}
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
          clipPath,
        }}
      />
      {children}
      {(stress.crease > 0 || lips) && (
        <div aria-hidden style={{ position: "absolute", inset, pointerEvents: "none" }}>
          {/* Creases start where each corner's diagonal meets the rounded contour, inside the edge. */}
          <svg
            style={{
              position: "absolute",
              left: cornerInset,
              top: cornerInset,
              width: `calc(100% - ${2 * cornerInset}px)`,
              height: `calc(100% - ${2 * cornerInset}px)`,
              overflow: "visible",
            }}
          >
            {stress.crease > 0 &&
              allCorners
                .filter((c) => pull.includes(c))
                .map((c) => {
                  const [x, y] = cornerAt[c];
                  const reach = stress.crease * 0.5;
                  return (
                    <line
                      key={c}
                      x1={`${x * 100}%`}
                      y1={`${y * 100}%`}
                      x2={`${round((x + (0.5 - x) * 2 * reach) * 100)}%`}
                      y2={`${round((y + (0.5 - y) * 2 * reach) * 100)}%`}
                      stroke={creaseInk}
                      strokeOpacity={0.28}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  );
                })}
          </svg>
          {lips && edge && (
            <svg
              width={1}
              height={1}
              style={{ position: "absolute", left: left ? 0 : "100%", top: seamCss, overflow: "visible" }}
            >
              {[lips.upper, lips.lower].map((lip, i) => (
                <polyline
                  key={i}
                  points={lip.map(([d, dy], j) => `${round((left ? 1 : -1) * (j === 0 ? Math.max(d, 1) : d))},${dy}`).join(" ")}
                  fill="none"
                  stroke={edgeColor}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          )}
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
