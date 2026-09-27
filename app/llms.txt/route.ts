import { getLlmsText } from "@/lib/agent-catalog"

// The llms.txt index: purpose, install once, per-item endpoints, one line per item.
// /llms-full.txt has every item in full.
// Built once at build time; the catalog only changes with a deploy.
export const dynamic = "force-static"

export function GET() {
  return new Response(getLlmsText(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
