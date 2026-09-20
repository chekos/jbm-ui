import { color, font } from "../lib/tokens";
import { useProgress } from "./hooks";
import { Pop } from "./pop";
import { Paper, type PaperTone } from "../ui/paper";
import { Piece, UiButton } from "../ui/ui-bits";

/**
 * A pile of library cards: each is a wide paper card with the library's name and a trio of tiny
 * pieces (its contents). Cards arrive on their own cue with alternating tilt so they read as a stack.
 */
export function Shelf({ w, items, cardH, gap = 22 }: { w: number; items: { text: string; at: number; tone?: PaperTone }[]; cardH?: number; gap?: number }) {
  const ch = cardH ?? Math.round(w * 0.16);
  const pw = Math.round(ch * 0.62);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap, width: w }}>
      {items.map((it, i) => {
        const tone = it.tone ?? "paper";
        return (
          <Pop key={i} at={it.at} from="left" dist={60}>
            <Paper tone={tone} w={w} h={ch} radius={Math.round(ch * 0.2)} rotate={[-1.2, 1, -0.8][i % 3]} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${Math.round(ch * 0.28)}px` }}>
              <div style={{ fontFamily: font.mono, fontSize: Math.round(ch * 0.36), fontWeight: 700, color: tone === "paper" ? color.ink : color.bg, whiteSpace: "nowrap" }}>{it.text}</div>
              <div style={{ display: "flex", alignItems: "center", gap: Math.round(ch * 0.12), transform: `scale(${1})` }}>
                <Piece kind="card" w={pw} />
                <Piece kind="input" w={pw} cursorOn={false} />
                <Piece kind="button" w={pw} tone={tone === "accent" ? "paper" : "accent"} />
              </div>
            </Paper>
          </Pop>
        );
      })}
    </div>
  );
}

/**
 * The closing gag: a button, then the same button again beside it, then a vermilion cross drawn
 * over the second one (tail to head, in two strokes).
 */
export function Twice({ w, at, second, strike, bw, bh }: { w: number; at: number; second: number; strike?: number; bw?: number; bh?: number }) {
  const gap = Math.round(w * 0.05);
  const B = bw ?? Math.min(420, Math.round((w - gap) / 2));
  const H = bh ?? Math.round(B * 0.34);
  const pad = 26;
  const d1 = useProgress(strike ?? second + 0.5, 1, 0.25);
  const d2 = useProgress((strike ?? second + 0.5) + 0.2, 1, 0.25);
  return (
    <div style={{ display: "flex", justifyContent: "center", gap, width: w, alignItems: "center", height: H + pad * 2 }}>
      <Pop at={at} from="scale" dist={0}>
        <UiButton w={B} h={H} tone="ink" />
      </Pop>
      <Pop at={second} from="scale" dist={0} style={{ position: "relative" }}>
        <UiButton w={B} h={H} tone="ink" />
        <svg width={B + pad * 2} height={H + pad * 2} viewBox={`0 0 ${B + pad * 2} ${H + pad * 2}`} style={{ position: "absolute", left: -pad, top: -pad, overflow: "visible" }}>
          <line x1={pad * 0.5} y1={pad * 0.3} x2={B + pad * 1.5} y2={H + pad * 1.7} stroke={color.accent} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d1} />
          <line x1={B + pad * 1.5} y1={pad * 0.3} x2={pad * 0.5} y2={H + pad * 1.7} stroke={color.accent} strokeWidth={16} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d2} />
        </svg>
      </Pop>
    </div>
  );
}
