import { getLlmsText } from "@/lib/agent-catalog"

// Built once at build time; the catalog only changes with a deploy.
export const dynamic = "force-static"

export function GET() {
  return new Response(getLlmsText(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
