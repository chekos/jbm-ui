import type { ItemContract } from "../schema"

export default {
  name: "ticket",
  entry: "component",
  title: "Ticket",
  description: "Admission-style surface with a colored header, flexible body, and perforated footer stub.",
  category: "UI",
  capabilities: ["controls"],
  api: [
    {
      export: "Ticket",
      kind: "component",
      summary:
        "A card-stock surface (shared card border, shadow, and radius tokens) with an optional ink or vermilion mono header band, a 24px-padded body for arbitrary children, and an optional stub below a dashed perforation line. Content semantics belong to the caller; div attributes pass through.",
      props: {
        header: "Optional header band content (12px mono, cream text). Omit (null/undefined) to hide the band.",
        stub: "Optional footer stub content (12px dim mono) below a dashed line. Omit to hide.",
        tone: "Header band fill: \"ink\" or the vermilion \"accent\".",
      },
    },
  ],
  stage: {
    mode: "fluid",
    reason:
      "Width fills the container; height follows content: header band (14px padding × 2 + one 12px mono line), body (24px padding × 2 + children), and stub (16px padding × 2 + 12px × 1.5 lines), plus the card border. Set style.width for a fixed ticket.",
  },
  examples: [
    {
      title: "Admission ticket",
      code: 'import { Ticket } from "@/jbm/ui/ticket"\n\n<Ticket header="ADMIT ONE · OCT 2026" stub="Tu nombre · Tu comunidad" tone="accent">\n  <h3>Un lugar para crear.</h3>\n  <p>Trae tu curiosidad.</p>\n</Ticket>',
    },
    {
      title: "Work order with the same slots",
      code: 'import { Ticket } from "@/jbm/ui/ticket"\n\n<Ticket header="orden de trabajo" stub={<>Hecho es:<br />Las pruebas pasan.</>}>\n  <h3>Migrar los pagos</h3>\n  <p>Del cliente anterior al nuevo.</p>\n</Ticket>',
    },
  ],
  qa: [
    "Toggle the Vermilion header control: the band switches between accent and ink while body and stub are unchanged.",
    "Check the rounded corners clip the header band and the dashed perforation spans the full width above the stub.",
    "Remove header or stub and confirm no empty band or dashed line remains.",
    "Check long content on a narrow screen wraps inside the ticket (overflowWrap anywhere) and the surface border and shadow match Card.",
  ],
  docs: [
    { title: "Visual primitives guide", url: "https://github.com/chekos/jbm-ui/blob/main/docs/visual-primitives.md" },
  ],
} satisfies ItemContract
