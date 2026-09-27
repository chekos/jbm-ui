// Server-safe preview routing (no React, no Remotion): which demo component renders an item.
// Usage snippets, categories, and capabilities live in the agent contracts (contracts/items).

/** Paper cut-out pieces from the Design videos, previewed by DesignVideoDemo. */
export const designNames = [
  "paper-tape",
  "tape-marker",
  "paper-clip",
  "clipped-note",
  "punched-tag",
  "paper-line",
  "stamp",
  "frontmatter",
  "folder-contents",
  "folder-carry",
]

/**
 * Controlled illustrations whose /c/<name> bench keeps its control values in the URL and offers
 * Copy link (useBenchParam in bench-url.tsx). Index cards keep local state.
 */
export const urlStateNames = [
  "clipped-note",
  "punched-tag",
  "paper-line",
  "stamp",
  "tape-marker",
  "paper-tape",
  "frontmatter",
  "folder-contents",
  "folder-carry",
  "cajon",
  "file-cabinet",
  "hand",
  "mano",
  "bandeja",
  "escritorio",
  "burbuja",
  "folder",
  "score-scale",
  "clock",
  "ticket",
  "text-fill",
  "hilo",
  "video-print",
]

/** Desk illustration pieces, previewed by DeskDemo. */
export const deskNames = [
  "cajon",
  "file-cabinet",
  "hand",
  "mano",
  "bandeja",
  "tool-caddy",
  "escritorio",
  "burbuja",
]

/** Thread and video print pieces from the Doorways film, previewed by ThreadDemo. */
export const threadNames = ["hilo", "video-print"]
