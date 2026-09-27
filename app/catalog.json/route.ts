import { getCatalog } from "@/lib/agent-catalog"

// Built once at build time; the catalog only changes with a deploy.
export const dynamic = "force-static"

export function GET() {
  return Response.json(getCatalog())
}
