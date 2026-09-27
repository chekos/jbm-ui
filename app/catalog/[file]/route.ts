import {
  getCatalogItemJson,
  getCatalogItemNames,
  getItemMarkdown,
} from "@/lib/agent-catalog"

// Per-item agent endpoints: /catalog/<name>.json and /catalog/<name>.md, one pair per
// contract (components, bundles, and doc entries). Any other file name is a 404.
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return getCatalogItemNames().flatMap((name) => [
    { file: `${name}.json` },
    { file: `${name}.md` },
  ])
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  const match = /^(.+)\.(json|md)$/.exec(file)
  if (match?.[2] === "json") {
    const body = getCatalogItemJson(match[1])
    if (body) return Response.json(body)
  } else if (match?.[2] === "md") {
    const body = getItemMarkdown(match[1])
    if (body)
      return new Response(body, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      })
  }
  return new Response("Not found\n", { status: 404 })
}
