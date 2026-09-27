import { color, font } from "../lib/tokens"
import { unit, type Box, type Pt } from "../lib/geometry"
import { FolderOutline } from "../ui/folder"

export type DrawerFolder = {
  /** Tab name, drawn in full: the tab widens to fit it, then the name compresses. */
  name: string
  /** Vermilion fill with a cream name; ignores k. */
  accent?: boolean
  /** 0–1 lift out of the drawer; also brings k to 1 (a lifted folder gains light). */
  pulled?: number
  /** Light, 0.72 (back) to 1 (front). Defaults to a ramp by depth: 1 at the front, 0.72 at the back. */
  k?: number
  /** 0–1 front flap ajar: its top edge drops and leans toward the viewer. */
  open?: number
  /** 0–1: the name inks in from its anchor, grapheme by grapheme. Default 1. */
  reveal?: number
  /** Short line (a title) printed on the folder's back-panel band, under its name. */
  sublabel?: string
  /** 0–1: the sublabel inks in. Defaults to reveal. */
  sublabelReveal?: number
}
export type CajonProps = Partial<Box> & {
  folders: readonly DrawerFolder[]
  open?: number
  /** Rise, in parent SVG units, from one folder to the next one back. Defaults to tab height plus a band of back panel (the tab and band stay visible up to eight folders; more folders pack into the same rise). */
  depthSpacing?: number
  /** stair: every tab at its folder's left edge, so the tabs climb as folders narrow toward the back. stagger3: tabs cycle left, center, right. */
  tabLayout?: "stair" | "stagger3"
  /** Tab name size in parent SVG units; the tab height and sublabel size follow it. */
  labelSize?: number
}

/** Light at the back of the drawer when k is not given. */
export const backLight = 0.72

type Lab = [number, number, number]
const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
const toSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
function oklab(hex: string): Lab {
  const [r, g, b] = [1, 3, 5].map((i) =>
    toLinear(parseInt(hex.slice(i, i + 2), 16) / 255)
  )
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
function hex([L, a, b]: Lab) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return (
    "#" +
    [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ]
      .map((c) =>
        Math.round(255 * Math.max(0, Math.min(1, toSrgb(c))))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
      .toUpperCase()
  )
}
const card = oklab(color.card),
  cream = oklab(color.bg),
  ink = oklab(color.ink)

/**
 * Folder fill for light k, mixed in OKLab from the palette tokens alone: k 1 is the card, lower k
 * moves lightness toward ink by (1 − k) while the hue warms toward cream; k 0 is ink. k 0.72 is the back.
 */
export function drawerLight(k: number): string {
  const t = 1 - (Number.isFinite(k) ? Math.max(0, Math.min(1, k)) : 1)
  const warm = Math.min(1, t / (1 - backLight))
  // Chroma warms from card toward cream (1.6× its offset) over the drawer's range, then yields to ink.
  const tint = (i: number) =>
    (card[i] + (cream[i] - card[i]) * warm * 1.6) * (1 - t) + ink[i] * t
  return hex([card[0] + (ink[0] - card[0]) * t, tint(1), tint(2)])
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
const graphemes = (text: string) =>
  Array.from(segmenter.segment(text), (s) => s.segment)

/** Fixed physical bounds. Index zero is nearest the drawer front. */
export function cajonLayout({
  x = 0,
  y = 0,
  w = 420,
  h = 420,
  folders,
  open = 1,
  depthSpacing,
  tabLayout = "stair",
  labelSize = 13,
}: CajonProps) {
  const p = unit(open)
  const front = y - 22 + 104 * p
  const width = w - 52
  const folderHeight = (width * 150) / 205
  const frontHeight = folderHeight + 8
  const size = Number.isFinite(labelSize) && labelSize > 0 ? labelSize : 13
  const tabHeight = (size * 27) / 13
  const tabSlope = (size * 17) / 13
  const pad = (size * 8) / 13
  const subSize = size * 0.8
  const hasSublabel = folders.some((f) => f.sublabel)
  // Under each tab: a band of back panel (it holds the sublabel), then the front flap's top edge,
  // then a lip of flap before the next folder forward.
  const band = Math.max(0.4 * tabHeight, hasSublabel ? subSize * 1.9 : 0)
  const lip = 0.3 * tabHeight
  const n = folders.length
  const step =
    depthSpacing !== undefined &&
    Number.isFinite(depthSpacing) &&
    depthSpacing >= 0
      ? depthSpacing
      : ((tabHeight + band + lip) * 7) / Math.max(7, n - 1)
  // The front folder rises 62 out of the drawer, more when its tab and band need the room.
  const rest = front + 32 - Math.max(62, tabHeight + band + lip) * p
  const laid = folders.map((f, i) => {
    // Perspective: a folder further back is narrower, never larger: each side moves in a quarter of its rise, at most a fifth of the width.
    const inset = Math.min(0.25 * i * step, 0.2 * width)
    const fw = width - 2 * inset
    const fh = (folderHeight * fw) / width
    const fx = x + 26 + inset
    const pulled = unit(f.pulled ?? 0)
    const top = rest - i * step * p - pulled * p * (fh + 24)
    const name = graphemes(f.name)
    const textWidth = 0.6 * size * name.length
    const tabWidth = Math.min(fw, textWidth + 2 * pad + tabSlope)
    const room = tabWidth - 2 * pad - tabSlope
    const tabX =
      tabLayout === "stagger3" ? fx + ((i % 3) * (fw - tabWidth)) / 2 : fx
    const baseline = top + (tabHeight * 16) / 27
    const midline = baseline - 0.35 * size
    // The sublabel starts under the name and shifts left (never past the folder edge) to fit.
    const subWidth = f.sublabel
      ? 0.56 * subSize * graphemes(f.sublabel).length
      : 0
    const subX = Math.max(fx + pad, Math.min(tabX + pad, fx + fw - pad - subWidth))
    const defaultK = n > 1 ? 1 - ((1 - backLight) * i) / (n - 1) : 1
    const k = unit(f.k ?? defaultK)
    return {
      x: fx,
      y: top,
      w: fw,
      h: fh,
      tabX,
      tabWidth,
      tabHeight,
      tabSlope,
      /** Tab grip point (center of the tab). */
      anchor: { x: tabX + tabWidth / 2, y: top + (tabHeight * 10) / 27 },
      label: {
        x: tabX + pad,
        y: baseline,
        mid: midline,
        end: tabX + tabWidth - tabSlope - pad,
        scale: textWidth > room + 1e-6 ? room / textWidth : 1,
      },
      /** Top edge of the front flap when closed. */
      flap: top + tabHeight + band,
      /** Sublabel baseline start and horizontal compression, on the band under the name. */
      sublabel: {
        x: subX,
        y: top + tabHeight + subSize * 1.15,
        scale: subWidth > 0 ? Math.min(1, (fx + fw - pad - subX) / subWidth) : 1,
      },
      light: k + (1 - k) * pulled,
    }
  })
  /** n thread endpoints on folder i's tab midline, from the name's first letter (where reveal starts) to the tab's straight edge. */
  const anchors = (i: number, count: number): Pt[] => {
    const f = laid[i]
    if (!f || !(count >= 1)) return []
    const c = Math.floor(count)
    return Array.from({ length: c }, (_, j) => ({
      x: f.label.x + (c > 1 ? ((f.label.end - f.label.x) * j) / (c - 1) : 0),
      y: f.label.mid,
    }))
  }
  return {
    x,
    y,
    w,
    h,
    front,
    frontHeight,
    depthSpacing: step,
    labelSize: size,
    band,
    folders: laid,
    anchors,
  }
}

/** Grapheme-by-grapheme ink: the next grapheme fades in, the rest is not drawn yet. */
function Inked({ text, reveal }: { text: string; reveal: number }) {
  const g = graphemes(text)
  const shown = unit(reveal) * g.length
  const whole = Math.floor(shown)
  const part = shown - whole
  return (
    <>
      {g.slice(0, whole).join("")}
      {part > 0 && whole < g.length && (
        <tspan fillOpacity={part}>{g[whole]}</tspan>
      )}
    </>
  )
}

/** A drawer alone. Complete folders are occluded by its front, never shortened. */
export function Cajon(props: CajonProps) {
  const l = cajonLayout(props)
  const size = l.labelSize,
    subSize = size * 0.8
  return (
    <g
      role="img"
      aria-label={`Filing drawer, ${props.folders.length} folders`}
      stroke={color.ink}
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <path
        d={`M${l.x + 20} ${l.y + 10}H${l.x + l.w - 20}L${l.x + l.w} ${l.front + 32}H${l.x}Z`}
        fill={color.ink}
      />
      {[...props.folders.keys()].reverse().map((i) => {
        const f = props.folders[i],
          q = l.folders[i]
        const fill = f.accent ? color.accent : drawerLight(q.light)
        const text = f.accent ? color.card : color.ink
        const ajar = unit(f.open ?? 0)
        const drop = ajar * 0.2 * q.h,
          lean = ajar * 0.03 * q.w
        const bottom = q.y + q.h
        const reveal = f.reveal ?? 1
        return (
          <g key={i} data-folder-index={i}>
            <FolderOutline {...q} fill={fill} />
            {f.sublabel && (
              <text
                transform={`translate(${q.sublabel.x} ${q.sublabel.y}) scale(${q.sublabel.scale} 1)`}
                fontFamily={font.sans}
                fontStyle="italic"
                fontSize={subSize}
                stroke="none"
                fill={text}
              >
                <Inked text={f.sublabel} reveal={f.sublabelReveal ?? reveal} />
              </text>
            )}
            {ajar > 0 ? (
              <>
                {/* The opening: the folder's shaded inside between the flap's closed and ajar edges. */}
                <rect
                  x={q.x}
                  y={q.flap}
                  width={q.w}
                  height={drop}
                  fill={f.accent ? color.accent2 : drawerLight(q.light - 0.14)}
                  stroke="none"
                />
                <path
                  d={`M${q.x} ${bottom}L${q.x - lean} ${q.flap + drop}H${q.x + q.w + lean}L${q.x + q.w} ${bottom}Z`}
                  fill={fill}
                />
              </>
            ) : (
              <path d={`M${q.x + 5} ${q.flap}H${q.x + q.w - 5}`} fill="none" />
            )}
            <text
              transform={`translate(${q.label.x} ${q.label.y}) scale(${q.label.scale} 1)`}
              fontFamily={font.mono}
              fontSize={size}
              stroke="none"
              fill={text}
            >
              <Inked text={f.name} reveal={reveal} />
            </text>
          </g>
        )
      })}
      <path
        d={`M${l.x + 20} ${l.y + 10}L${l.x} ${l.front + 32}V${l.front + 32 + l.frontHeight}L${l.x + 20} ${l.y + 10 + l.frontHeight}ZM${l.x + l.w - 20} ${l.y + 10}L${l.x + l.w} ${l.front + 32}V${l.front + 32 + l.frontHeight}L${l.x + l.w - 20} ${l.y + 10 + l.frontHeight}Z`}
        fill={color.bg}
      />
      <rect
        x={l.x}
        y={l.front + 32}
        width={l.w}
        height={l.frontHeight}
        rx={2}
        fill={color.card}
      />
      <rect
        x={l.x + l.w / 2 - 36}
        y={l.front + 63}
        width={72}
        height={25}
        rx={3}
        fill={color.bg}
      />
      <path
        d={`M${l.x + l.w / 2 - 27} ${l.front + 72}h54v10h-54Z`}
        fill={color.ink}
      />
    </g>
  )
}
