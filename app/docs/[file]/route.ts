import { getPublishedDoc, getPublishedDocs } from "@/lib/docs"

// Guides as Markdown at /docs/<slug>.md: the source repository is private, so contract `docs`
// links and the agent catalogs point here. Content comes from contracts/generated/docs.json
// (`pnpm contracts:build`), prerendered per guide; proxy.ts answers unknown names with a Markdown
// 404 that lists the guides.
export const dynamic = "force-static"
export const dynamicParams = false

export function generateStaticParams() {
  return getPublishedDocs().map((doc) => ({ file: `${doc.slug}.md` }))
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  const doc = getPublishedDoc(file.replace(/\.md$/, ""))
  if (!doc) return new Response("Not found\n", { status: 404 })
  return new Response(doc.markdown, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
