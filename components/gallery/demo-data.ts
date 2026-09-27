// Server-safe preview routing (no React, no Remotion): which demo component renders an item.
// Usage snippets, categories, and capabilities live in the agent contracts (contracts/items).

/** Top-down desk pieces (DeskTop, Ejes, DeskProp), previewed by DeskSurfaceDemo via DeskDemo. */
export const deskSurfaceNames = ["desk-top", "ejes", "desk-prop"]

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
  "pluma",
  "bandeja",
  "escritorio",
  "burbuja",
  "folder",
  "score-scale",
  "clock",
  "ticket",
  "text-fill",
  ...deskSurfaceNames,
  "register",
  "slip",
  "paper",
  "tear",
]

/** Sheets under stress, previewed by PaperDemo: Paper (tension, tab) and Tear. */
export const paperNames = ["paper", "tear"]

/** Desk illustration pieces, previewed by DeskDemo. */
export const deskNames = [
  "cajon",
  "file-cabinet",
  "hand",
  "mano",
  "pluma",
  "bandeja",
  "tool-caddy",
  "escritorio",
  "burbuja",
  ...deskSurfaceNames,
]

/** Drawn writing registers and the slip, previewed by RegisterDemo. */
export const registerNames = ["register", "slip"]
