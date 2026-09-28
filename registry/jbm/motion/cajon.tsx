import { color, font, sansWidth, stroke } from "../lib/tokens"
import { unit, type Box, type Pt } from "../lib/geometry"
import { FolderOutline, folderScaleForDrawer, folderShape, oklab, oklabHex } from "../ui/folder"

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
  /** Rise, in parent SVG units, from one folder to the next one back. Defaults to tab height plus a band of back panel (the tab and band stay visible up to six folders; more folders pack into the same rise, so the stack never grows past six folders' height). */
  depthSpacing?: number
  /** stair: every tab at its folder's left edge, so the tabs climb as folders narrow toward the back. stagger3: tabs cycle left, center, right. */
  tabLayout?: "stair" | "stagger3"
  /** Tab name size in parent SVG units; the tab height and sublabel size follow it. */
  labelSize?: number
}

/** Light at the back of the drawer when k is not given. */
export const backLight = 0.72

const card = oklab(color.card),
  cream = oklab(color.bg),
  ink = oklab(color.ink),
  accent = oklab(color.accent)
const rule = oklab(color.line),
  graphite = oklab(color.dim)
/** Interior shade t of the way from Pencil Rule (0) to Graphite (1), mixed in OKLab. */
const interior = (t: number) =>
  oklabHex([0, 1, 2].map((i) => rule[i] + (graphite[i] - rule[i]) * t) as [number, number, number])
/** The drawer's inside planes: back wall darkest, the side wall facing the light palest. */
export const drawerInside = {
  back: interior(0.5),
  floor: interior(0.35),
  left: interior(0.2),
  right: interior(0),
}
/** The inside of an ajar vermilion folder: the accent mixed a third of the way to ink in OKLab. */
const accentShade = oklabHex(
  [0, 1, 2].map((i) => accent[i] + (ink[i] - accent[i]) / 3) as [number, number, number]
)

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
  return oklabHex([card[0] + (ink[0] - card[0]) * t, tint(1), tint(2)])
}

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })
const graphemes = (text: string) =>
  Array.from(segmenter.segment(text), (s) => s.segment)

/**
 * A tab name in `room` units at `size`: whole when it fits, or when a barely visible squeeze (down
 * to 0.94) is enough; otherwise cut to end in an ellipsis at full width. Glyphs are never
 * visibly condensed.
 */
function fitName(name: string, size: number, room: number): { text: string; scale: number } {
  const full = sansWidth(name, size)
  if (full <= room + 1e-6) return { text: name, scale: 1 }
  if (full * 0.94 <= room) return { text: name, scale: room / full }
  const g = graphemes(name)
  let n = g.length - 1
  while (n > 1 && sansWidth(g.slice(0, n).join("").trimEnd() + "…", size) > room) n--
  return { text: g.slice(0, n).join("").trimEnd() + "…", scale: 1 }
}

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
  // Furniture (walls, travel, rise, handle) grows with drawers wider than the 420-unit reference;
  // narrower drawers, such as a cabinet's, keep the reference sizes.
  const sc = Number.isFinite(w) && w > 420 ? w / 420 : 1
  const front = y - 22 * sc + 104 * sc * p
  /** Top edge of the drawer front: everything below it is inside the drawer. */
  const frontTop = front + 32 * sc
  // The front folder is Folder's body at folderScaleForDrawer(w): loose and filed folders match.
  const width = folderShape.body.w * folderScaleForDrawer(w)
  const folderHeight = (width * folderShape.body.h) / folderShape.body.w
  const frontHeight = folderHeight + 8 * sc
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
  // The drawer's depth, as rise: eight folders' tabs and bands (seven steps) would reach its back
  // wall; perspective narrows folders along it.
  const natural = tabHeight + band + lip
  const fullRise = natural * 7
  // Count changes packing, not furniture: up to six folders stand a tab and band apart; more
  // share the rise of six (five steps), so a crowded drawer packs tighter instead of growing.
  // A given spacing is capped too: the stack never rises past the drawer front's height, and
  // above six folders it packs into six folders' rise like the default.
  const packed = (natural * 5) / Math.max(5, n - 1)
  const step =
    depthSpacing !== undefined &&
    Number.isFinite(depthSpacing) &&
    depthSpacing >= 0
      ? Math.min(
          depthSpacing,
          frontHeight / Math.max(1, n - 1),
          n > 6 ? packed : Infinity
        )
      : packed
  // The front folder rises 62 out of the drawer, more when its tab and band need the room. Closed,
  // it sits an outline below the front's top edge, so its tab's top edge never retraces the rim.
  const rest =
    frontTop + stroke.outline * (1 - p) - Math.max(62 * sc, tabHeight + band + lip) * p
  const laid = folders.map((f, i) => {
    // Perspective: a folder further back is narrower, never larger. The inset follows how far
    // back the folder sits in the drawer (its rise over the drawer's full depth), up to a fifth
    // of the width at the back wall, whatever the label size.
    const inset = Math.min(1, (i * step) / fullRise) * 0.2 * width
    const fw = width - 2 * inset
    const fh = (folderHeight * fw) / width
    const fx = x + 26 * sc + inset
    const pulled = unit(f.pulled ?? 0)
    // An ajar flap drops a fifth of the height and leans out. The folder rises so the opening
    // shows above the folder (or drawer front) in front of it: by the drop plus a lip, but never
    // so far that it covers the tab of the folder behind it.
    const ajar = unit(f.open ?? 0)
    const drop = ajar * 0.2 * fh
    // The flap's top edge drops straight down: it is never wider than its folder.
    const lean = 0
    const rise = Math.min(drop + ajar * lip, i < n - 1 ? Math.max(0, step - tabHeight) : Infinity)
    // A lifted folder's bottom stays 14 units behind the drawer front's rim, never floating
    // clear of it: the lift is capped at what keeps it there.
    const seated = rest - i * step * p - p * rise
    const lift = Math.min(pulled * p * (fh + 24 * sc), Math.max(0, seated + fh - (frontTop + 14 * sc)))
    const top = seated - lift
    const textWidth = sansWidth(f.name, size)
    const tabWidth = Math.min(fw, textWidth + 2 * pad + tabSlope)
    const room = tabWidth - 2 * pad - tabSlope
    // A name longer than the widest tab ends in an ellipsis; glyphs are never squeezed.
    const shown = fitName(f.name, size, room)
    const tabX =
      tabLayout === "stagger3" ? fx + ((i % 3) * (fw - tabWidth)) / 2 : fx
    const baseline = top + (tabHeight * 16) / 27
    const midline = baseline - 0.35 * size
    // The sublabel starts under the name and shifts left (never past the folder edge) to fit.
    const subWidth = f.sublabel ? sansWidth(f.sublabel, subSize, true) : 0
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
        text: shown.text,
        scale: shown.scale,
      },
      /** Top edge of the front flap when closed. */
      flap: top + tabHeight + band,
      /** The ajar flap: how far its top edge drops and how far each side leans out. */
      opening: { drop, lean },
      /** 0–1: how much of the tab shows above the drawer front (0 once it is inside). */
      visible: Math.max(0, Math.min(1, (frontTop - top) / tabHeight)),
      /**
       * Sublabel baseline start, horizontal compression, and whether it prints (false when a
       * crowded drawer packs the folder in front over its band).
       */
      sublabel: {
        x: subX,
        y: top + tabHeight + subSize * 1.15,
        scale: subWidth > 0 ? Math.min(1, (fx + fw - pad - subX) / subWidth) : 1,
        width: subWidth > 0 ? Math.min(subWidth, fx + fw - pad - subX) : 0,
        visible: true,
      },
      /**
       * Whether the closed front flap's top edge draws: only where a tab height or more of flap
       * shows under it, clear of everything in front (see flapEdge).
       */
      rule: false,
      /** 0–1 ink of the closed flap's top edge: 0 over a strip thinner than a tab, 1 from 1.5 tabs. */
      flapEdge: 0,
      light: k + (1 - k) * pulled,
    }
  })
  // What stands in front of folder i at a given x: the drawer front and every folder nearer the
  // front (tab, then body top edge beside it). A sublabel prints only when that edge clears its
  // whole line; a partly covered line would leave fragments beside the next tab. The same edge
  // decides the closed flap's top edge (below).
  const coverAt = (i: number, a: number, b: number) => {
    let y = frontTop
    for (let j = 0; j < i; j++) {
      const g = laid[j]
      if (b <= g.x || a >= g.x + g.w) continue
      const tab = b > g.tabX && a < g.tabX + g.tabWidth
      const right = b > g.tabX + g.tabWidth
      const left = a < g.tabX
      if (tab) y = Math.min(y, g.y)
      if (right) y = Math.min(y, g.y + g.tabSlope)
      if (left) y = Math.min(y, g.y + g.tabHeight)
    }
    return y
  }
  laid.forEach((f, i) => {
    const s = folders[i].sublabel
    if (s) {
      const need = f.sublabel.y + subSize * 0.35
      f.sublabel.visible = coverAt(i, f.sublabel.x, f.sublabel.x + f.sublabel.width) >= need
    }
    // A closed flap's top edge reads as a front panel only over a strip of flap at least a tab
    // tall. The lip left under each folder of a fan, or the front folder's strip above the rim,
    // is thinner: there the edge reads as a seam across the body, or as the tab edge in front
    // showing through, so it is not drawn. Over the whole span the edge sits above what is in
    // front, so no folder ever covers part of it; it inks in from one tab of strip to one and a
    // half, so a folder lifting clear gains its edge smoothly.
    const strip = coverAt(i, f.x, f.x + f.w) - f.flap
    f.flapEdge = unit((strip - f.tabHeight) / (0.5 * f.tabHeight))
    f.rule = f.flapEdge > 0
  })
  /**
   * n thread endpoints on folder i's tab midline, from just before the name (clear of its first
   * letter, where reveal starts) to the tab's straight edge. Once a tab is inside the closed
   * drawer its endpoints drop no lower than the drawer's top rim, so threads never reach through
   * the front.
   */
  const anchors = (i: number, count: number): Pt[] => {
    const f = laid[i]
    if (!f || !(count >= 1)) return []
    const c = Math.floor(count)
    const x0 = f.tabX + pad * 0.45
    return Array.from({ length: c }, (_, j) => ({
      x: x0 + (c > 1 ? ((f.label.end - x0) * j) / (c - 1) : 0),
      y: Math.min(f.label.mid, frontTop),
    }))
  }
  // Front hardware, centred and near the top edge: a label holder, then the pull under it.
  const holder = { w: 60 * sc, h: 24 * sc }
  const pull = { w: 96 * sc, h: 14 * sc }
  const holderY = frontTop + 18 * sc
  const hardware = {
    holder: { x: x + (w - holder.w) / 2, y: holderY, ...holder },
    pull: { x: x + (w - pull.w) / 2, y: holderY + holder.h + 14 * sc, ...pull },
  }
  return {
    x,
    y,
    w,
    h,
    front,
    frontTop,
    frontHeight,
    /** The front's label holder and pull (flat rectangles), in parent units. */
    hardware,
    scale: sc,
    depthSpacing: step,
    labelSize: size,
    band,
    folders: laid,
    anchors,
  }
}

const rect = ({ x, y, w, h }: Box) => ({ x, y, width: w, height: h })

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

/**
 * The open drawer's inside, between its card side panels, as flat planes mixed from Pencil Rule
 * toward Graphite: the back wall, the floor, and the two inner side walls, lighter than the back
 * (the right wall faces the top-left light). An empty drawer reads as an empty box, not a dark block, and the strips
 * beside the folders are wall, not ink bars.
 */
function DrawerInterior({ l }: { l: ReturnType<typeof cajonLayout> }) {
  const sc = l.scale
  const x0 = l.x + 20 * sc,
    x1 = l.x + l.w - 20 * sc,
    top = l.y + 10 * sc,
    bottom = l.frontTop
  const depth = bottom - top
  // Same gate as the side walls: until the well is deeper than one outline, its rim stroke would
  // only thicken the front's top edge.
  if (!(depth > stroke.outline)) return null
  // The back wall's foot, and how far each side wall's inner face spans at the floor.
  const foot = top + depth * 0.45
  const wall = 8 * sc
  const d = (...pts: [number, number][]) =>
    "M" + pts.map(([x, y]) => `${+x.toFixed(2)} ${+y.toFixed(2)}`).join("L") + "Z"
  return (
    <g>
      <g stroke="none">
        <path d={d([x0, top], [x1, top], [x1, foot], [x0, foot])} fill={drawerInside.back} />
        <path d={d([x0, foot], [x1, foot], [x1, bottom], [x0, bottom])} fill={drawerInside.floor} />
        <path d={d([x0, top], [x0 + wall, foot], [x0 + wall, bottom], [x0, bottom])} fill={drawerInside.left} />
        <path d={d([x1, top], [x1, bottom], [x1 - wall, bottom], [x1 - wall, foot])} fill={drawerInside.right} />
      </g>
      <path d={d([x0, top], [x1, top], [l.x + l.w, bottom], [l.x, bottom])} fill="none" />
    </g>
  )
}

/** A drawer alone. Complete folders are occluded by its front, never shortened. */
export function Cajon(props: CajonProps) {
  const l = cajonLayout(props)
  const size = l.labelSize,
    subSize = size * 0.8,
    sc = l.scale
  return (
    <g
      role="img"
      aria-label={`Filing drawer, ${props.folders.length} folders`}
      stroke={color.ink}
      strokeWidth={stroke.outline}
      strokeLinejoin="round"
    >
      <DrawerInterior l={l} />
      {[...props.folders.keys()].reverse().map((i) => {
        const f = props.folders[i],
          q = l.folders[i]
        const fill = f.accent ? color.accent : drawerLight(q.light)
        const text = f.accent ? color.card : color.ink
        const ajar = unit(f.open ?? 0)
        const { drop, lean } = q.opening
        const bottom = q.y + q.h
        const reveal = f.reveal ?? 1
        return (
          <g key={i} data-folder-index={i}>
            <FolderOutline {...q} fill={fill} />
            {f.sublabel && q.sublabel.visible && (
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
                  fill={f.accent ? accentShade : drawerLight(q.light - 0.14)}
                  stroke="none"
                />
                <path
                  d={`M${q.x} ${bottom}L${q.x - lean} ${q.flap + drop}H${q.x + q.w + lean}L${q.x + q.w} ${bottom}Z`}
                  fill={fill}
                />
              </>
            ) : q.rule ? (
              // Side to side, like Folder's front panel: a flap edge, never a floating rule.
              <path
                d={`M${q.x} ${q.flap}H${q.x + q.w}`}
                fill="none"
                strokeOpacity={q.flapEdge < 1 ? +q.flapEdge.toFixed(3) : undefined}
              />
            ) : null}
            <text
              transform={`translate(${q.label.x} ${q.label.y})${q.label.scale < 1 ? ` scale(${+q.label.scale.toFixed(4)} 1)` : ""}`}
              fontFamily={font.sans}
              fontWeight={800}
              fontSize={size}
              stroke="none"
              fill={text}
            >
              <Inked text={q.label.text} reveal={reveal} />
            </text>
          </g>
        )
      })}
      {/* Side walls, narrower at the back (the front is nearest the viewer). A closed drawer has
          none showing: drawn, they would retrace the front's top edge and thicken its ends. */}
      {l.frontTop - (l.y + 10 * sc) > stroke.outline && <path
        d={`M${l.x + 20 * sc} ${l.y + 10 * sc}L${l.x} ${l.frontTop}V${l.frontTop + l.frontHeight}L${l.x + 20 * sc} ${l.y + 10 * sc + l.frontHeight}ZM${l.x + l.w - 20 * sc} ${l.y + 10 * sc}L${l.x + l.w} ${l.frontTop}V${l.frontTop + l.frontHeight}L${l.x + l.w - 20 * sc} ${l.y + 10 * sc + l.frontHeight}Z`}
        fill={color.card}
      />}
      <rect
        x={l.x}
        y={l.frontTop}
        width={l.w}
        height={l.frontHeight}
        rx={2}
        fill={color.card}
      />
      <rect {...rect(l.hardware.holder)} fill={color.bg} />
      <rect {...rect(l.hardware.pull)} fill={color.ink} />
    </g>
  )
}
