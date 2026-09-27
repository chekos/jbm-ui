// Guides published at /docs/<slug>.md (app/docs/[file]/route.ts). The source repository is
// private, so agents read the guides from the site. `pnpm contracts:build` copies every guide a
// contract links, plus the agent contract and the scene-spec guide, into contracts/generated/docs.json.
import generated from "@/contracts/generated/docs.json"
import { siteOrigin } from "@/lib/site"

export type PublishedDoc = {
  slug: string
  title: string
  /** Absolute URL on the production origin. */
  url: string
  markdown: string
}

const docs = generated.docs as PublishedDoc[]
const bySlug = new Map(docs.map((doc) => [doc.slug, doc]))

export function getPublishedDocs(): PublishedDoc[] {
  return docs
}

export function getPublishedDoc(slug: string): PublishedDoc | undefined {
  return bySlug.get(slug)
}

/** Site URL for a published guide on this deployment's origin. */
export const docUrl = (slug: string, origin = siteOrigin()) =>
  `${origin}/docs/${slug}.md`
