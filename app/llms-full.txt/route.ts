import { getLlmsFullText } from "@/lib/agent-catalog"

// Every item in full as plain text; /llms.txt is the short index.
// Built once at build time; the catalog only changes with a deploy.
export const dynamic = "force-static"

export function GET() {
  return new Response(getLlmsFullText(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
