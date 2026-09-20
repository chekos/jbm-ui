import * as React from "react";
import { color } from "../lib/tokens";
import { useIn, useProgress, useSec } from "./hooks";
import { Pop } from "./pop";
import { Paper, Sticker, Caption } from "../ui/paper";
import { Badge, Piece, TokenGlyph, type PieceKind, type TokenKind } from "../ui/ui-bits";
import { Stamp } from "./rebuild-screens";

/**
 * A catalogue sheet: a large paper card with labelled slots. The top row holds interface pieces
 * (button, card, input), each arriving on its cue and getting a "tested" check a beat later. At
 * `tokensAt` the sheet unfolds downward to reveal a second row of design-token glyphs (color, type,
 * spacing) that fill on their own cues. A `stamp` sticker lands on the sheet.
 */
export type CatalogItem = { kind: PieceKind; label: string; at: number };
export type CatalogToken = { kind: TokenKind; label: string; at: number };

export function Catalog({
  w,
  at,
  title,
  items,
  tokens = [],
  tokensAt,
  stamp,
  checkDelay = 0.5,
}: {
  w: number;
  at: number;
  title?: string;
  items: CatalogItem[];
  tokens?: CatalogToken[];
  tokensAt?: number;
  stamp?: { text: string; at: number };
  checkDelay?: number;
}) {
  const sec = useSec();
  const pad = Math.round(w * 0.038);
  const gap = Math.round(w * 0.026);
  const cols = Math.max(items.length, tokens.length, 1);
  const slotW = Math.floor((w - pad * 2 - gap * (cols - 1)) / cols);
  const pieceW = Math.round(slotW * 0.8);
  const pieceH = Math.round(pieceW * 0.78); // the card, the tallest piece
  const capSize = Math.round(slotW * 0.13);
  const badge = Math.round(slotW * 0.19);
  const slotH = pieceH + capSize + Math.round(slotW * 0.3);
  const tokH = Math.round(slotW * 0.9);
  const cursorOn = Math.floor(sec * 2.2) % 2 === 0;
  const sheet = useIn(at, { damping: 13 });
  const unfoldAt = tokensAt ?? (tokens.length ? tokens[0].at - 0.6 : 1e6);
  const unfold = useProgress(unfoldAt, 1, 0.55); // no token row: unfoldAt is never reached
  const rowGap = Math.round(gap * 1.2);
  const tokenBlockH = rowGap + 3 + rowGap + tokH;

  return (
    <div style={{ position: "relative", width: w, opacity: sheet, transform: `translateY(${(1 - sheet) * 40}px)` }}>
      <Paper tone="paper" w={w} radius={30} style={{ padding: pad, paddingTop: title ? pad + 30 : pad }}>
        <div style={{ display: "flex", gap }}>
          {items.map((it, k) => (
            <Slot key={k} w={slotW} h={slotH} at={it.at}>
              <div style={{ position: "relative", height: pieceH, display: "flex", alignItems: "center" }}>
                <Piece kind={it.kind} w={pieceW} cursorOn={cursorOn} />
                <Pop at={it.at + checkDelay} from="scale" dist={0} style={{ position: "absolute", right: -badge * 0.4, top: (pieceH - Math.round(pieceW * (it.kind === "card" ? 0.78 : 0.32))) / 2 - badge * 0.4 }}>
                  <Badge kind="check" size={badge} />
                </Pop>
              </div>
              <Caption size={capSize}>{it.label}</Caption>
            </Slot>
          ))}
        </div>
        {tokens.length ? (
          <div style={{ height: tokenBlockH * unfold, overflow: "hidden", opacity: Math.min(1, unfold * 1.5) }}>
            <div style={{ height: rowGap }} />
            <div style={{ height: 0, borderTop: `3px dashed ${color.line}` }} />
            <div style={{ height: rowGap }} />
            <div style={{ display: "flex", gap }}>
              {tokens.map((tk, k) => (
                <Slot key={k} w={slotW} h={tokH} at={tk.at}>
                  <TokenGlyph kind={tk.kind} size={Math.round(slotW * 0.56)} />
                  <Caption size={capSize}>{tk.label}</Caption>
                </Slot>
              ))}
            </div>
          </div>
        ) : null}
      </Paper>
      {title ? (
        <div style={{ position: "absolute", left: pad * 0.6, top: -30 }}>
          <Sticker tone="ink" size={Math.round(w * 0.04)} rotate={-2}>
            {title}
          </Sticker>
        </div>
      ) : null}
      {stamp ? <Stamp at={stamp.at} text={stamp.text} left={w * 0.44} top={(title ? pad + 30 : pad) + slotH + tokenBlockH * unfold + pad - Math.round(w * 0.062) * 1.1} size={Math.round(w * 0.062)} rotate={4} /> : null}
    </div>
  );
}

/** Dashed slot on the sheet; its content pops in on `at`. */
function Slot({ w, h, at, children }: { w: number; h: number; at: number; children: React.ReactNode }) {
  return (
    <div style={{ width: w, height: h, boxSizing: "border-box", border: `3px dashed ${color.line}`, borderRadius: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <Pop at={at} from="up" dist={24} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(h * 0.06) }}>
        {children}
      </Pop>
    </div>
  );
}
