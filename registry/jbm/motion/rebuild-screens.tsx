import * as React from "react";
import { interpolate, Easing } from "remotion";
import { useIn, useSec } from "./hooks";
import { Pop } from "./pop";
import { PhoneFrame, Piece, type PieceKind } from "../ui/ui-bits";
import { Sticker } from "../ui/paper";

/**
 * A phone screen that gets built piece by piece, then built AGAIN on a new screen, and again.
 * `pieces` enter on their own cue in the first screen; every cue in `again` adds a screen (offset, tilted,
 * in front) whose pieces are rebuilt in a quick stagger. The group re-centres as screens arrive.
 * `sticker` stamps a loud word over the pile. Sized by `w`/`h` (the block's box).
 */
export type ScreenPiece = { kind: PieceKind; at: number };

const ORDER: PieceKind[] = ["card", "input", "button"];

export function RebuildScreens({
  w,
  h,
  pieces,
  again = [],
  sticker,
  rebuildStep = 0.22,
}: {
  w: number;
  h: number;
  pieces: ScreenPiece[];
  again?: number[];
  sticker?: { text: string; at: number };
  rebuildStep?: number;
}) {
  const sec = useSec();
  const n = 1 + again.length;
  const pw = Math.min(470, Math.round(w * 0.5), Math.round(h * 0.47));
  const ph = Math.round(pw * 1.82);
  const dx = Math.round(pw * 0.42);
  const dy = Math.round(ph * 0.09);
  // How many screens have arrived (eased) drives the group's centring shift.
  const arrived = again.reduce((s, a) => s + interpolate(sec, [a, a + 0.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) }), 0);
  const groupW = pw + arrived * dx;
  const baseX = (w - groupW) / 2;
  const baseY = h - ph - (h - ph - arrived * dy) / 2 - 0; // pile grows upward; keep it vertically centred
  const cursorOn = Math.floor(sec * 2.2) % 2 === 0;
  const rot = [0, 4, -3, 5, -4];
  const pieceW = Math.round(pw * 0.7);
  const sorted = [...pieces].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));

  return (
    <div style={{ position: "relative", width: w, height: h }}>
      {Array.from({ length: n }).map((_, i) => {
        const startAt = i === 0 ? 0 : again[i - 1];
        return (
          <Screen key={i} first={i === 0} startAt={startAt} x={baseX + i * dx} y={baseY - i * dy} dx={dx} dy={dy}>
            <PhoneFrame w={pw} h={ph} rotate={rot[i % rot.length]} gap={Math.round(pw * 0.07)}>
              {sorted.map((pc) => {
                const at = i === 0 ? pc.at : startAt + 0.12 + pieces.findIndex((q) => q.kind === pc.kind) * rebuildStep;
                return (
                  <Pop key={pc.kind} at={at} from="scale" dist={0}>
                    <Piece kind={pc.kind} w={pieceW} cursorOn={cursorOn} />
                  </Pop>
                );
              })}
            </PhoneFrame>
          </Screen>
        );
      })}
      {sticker ? <Stamp at={sticker.at} text={sticker.text} left={Math.max(0, baseX - pw * 0.25)} top={Math.round(h * 0.06)} size={Math.round(pw * 0.22)} /> : null}
    </div>
  );
}

/** One screen of the pile: the first is always there, the others spring in from the upper right. */
function Screen({ first, startAt, x, y, dx, dy, children }: { first: boolean; startAt: number; x: number; y: number; dx: number; dy: number; children: React.ReactNode }) {
  const spring = useIn(startAt, { damping: 12, stiffness: 110 });
  const p = first ? 1 : spring;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: p,
        transform: `translate(${(1 - p) * dx * 1.2}px, ${(1 - p) * -dy * 2}px) scale(${0.8 + 0.2 * p})`,
        transformOrigin: "50% 80%",
      }}
    >
      {children}
    </div>
  );
}

/** Slams in: scale 1.6→1 with a slight settle, used for the loud word. */
export function Stamp({ at, text, left, top, size, rotate = -7 }: { at: number; text: string; left: number; top: number; size: number; rotate?: number }) {
  const p = useIn(at, { damping: 9, stiffness: 160 });
  const sc = interpolate(p, [0, 1], [1.7, 1]);
  return (
    <div style={{ position: "absolute", left, top, opacity: Math.min(1, p * 2), transform: `scale(${sc})`, transformOrigin: "50% 50%" }}>
      <Sticker size={size} rotate={rotate}>
        {text}
      </Sticker>
    </div>
  );
}
