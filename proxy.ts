import { NextResponse, type NextRequest } from "next/server"
import {
  canonicalItemName,
  catalogNotFoundJson,
  catalogNotFoundMarkdown,
  docGuides,
  docsNotFoundMarkdown,
  itemNames,
} from "@/lib/agent-routes"

// Agent endpoints answer unknown names in their own format before the static files are consulted
// (the per-item and guide routes are fully prerendered with dynamicParams = false):
//   /catalog/Folder.md → 308 /catalog/folder.md (any casing of a known item)
//   /catalog/zzz.md    → 404 Markdown naming the nearest item
//   /catalog/zzz.json  → 404 JSON { error, didYouMean, index: "/llms.txt" }
//   /docs/zzz.md       → 404 Markdown listing the published guides
// Item pages get the same casing redirect, and an unknown name a 404 page that names it (a nested
// not-found.tsx gets no params and is not server-rendered for these prerendered pages):
//   /c/Folder → 308 /c/folder
//   /c/foldr  → 404, rewritten to app/c-missing/[name]: names “foldr” and the closest item pages
// Handling them here keeps them out of the static cache, where case-insensitive disks would let
// Folder.md shadow folder.md.
const items = new Set(itemNames)
const guides = new Set(docGuides.map((doc) => doc.slug))
const markdown = { "Content-Type": "text/markdown; charset=utf-8" }

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const [, section, rawFile] = /^\/(catalog|docs|c)\/([^/]+)$/.exec(pathname) ?? []
  if (!section) return NextResponse.next()
  let file = rawFile
  try {
    file = decodeURIComponent(rawFile)
  } catch {}

  if (section === "c") {
    if (items.has(file)) return NextResponse.next()
    const canonical = canonicalItemName(file)
    if (canonical) {
      const url = request.nextUrl.clone()
      url.pathname = `/c/${canonical}`
      return NextResponse.redirect(url, 308)
    }
    const url = request.nextUrl.clone()
    url.pathname = `/c-missing/${encodeURIComponent(file.slice(0, 128))}`
    return NextResponse.rewrite(url, { status: 404 })
  }

  if (section === "docs") {
    const slug = /^([a-z0-9-]+)\.md$/.exec(file)?.[1]
    if (slug && guides.has(slug)) return NextResponse.next()
    return new NextResponse(docsNotFoundMarkdown(), { status: 404, headers: markdown })
  }

  const [, name = file, extension = ""] = /^(.+)\.(json|md)$/i.exec(file) ?? []
  const format = extension.toLowerCase()
  if (format && extension === format && items.has(name)) return NextResponse.next()
  const canonical = format ? canonicalItemName(name) : undefined
  if (canonical) {
    const url = request.nextUrl.clone()
    url.pathname = `/catalog/${canonical}.${format}`
    return NextResponse.redirect(url, 308)
  }
  return format === "json"
    ? NextResponse.json(catalogNotFoundJson(name), { status: 404 })
    : new NextResponse(catalogNotFoundMarkdown(name), { status: 404, headers: markdown })
}

export const config = {
  matcher: ["/catalog/:file", "/docs/:file", "/c/:name"],
}
