import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  categorySlug,
  getGalleryItem,
  getGalleryItems,
  isPlayerPreview,
  supportsOrientation,
} from "@/components/gallery/item-meta"
import { AddCommand } from "@/components/gallery/install"
import { CodeBlock } from "@/components/gallery/code-block"
import { QaBench } from "@/components/gallery/qa-bench"
import { ItemApi } from "@/components/gallery/item-api"
import { BundlePage, type BundleNotice } from "@/components/gallery/not-found"
import { itemAlternateTypes } from "@/lib/agent-catalog"
import { getContract, getContracts } from "@/lib/contracts"
import { siteOrigin } from "@/lib/site"

type Props = { params: Promise<{ name: string }> }

// One static QA page per gallery item. Bundles (ui-bits) have no QA page: /c/<bundle> renders a
// noindex page that explains them and links to their members. Any other name is the 404
// (proxy.ts sends it to app/global-not-found.tsx, which names the missing item).
export const dynamicParams = false

const bundleNames = () =>
  getContracts()
    .filter((contract) => contract.entry === "bundle")
    .map((contract) => contract.name)

function bundleNotice(name: string): BundleNotice {
  const contract = getContract(name)
  return {
    name: contract.name,
    title: contract.title,
    description: contract.description,
    pageReason: contract.pageReason ?? "",
    // Several exports can come from one item; list each item once.
    members: [
      ...new Set(
        contract.api.flatMap((entry) =>
          entry.kind === "re-export" ? [entry.from] : []
        )
      ),
    ].map((member) => {
      const { title, description } = getContract(member)
      return { name: member, title, description }
    }),
  }
}

export function generateStaticParams() {
  return [
    ...getGalleryItems().map(({ name }) => name),
    ...bundleNames(),
  ].map((name) => ({ name }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  const item = getGalleryItem(name)
  if (!item) {
    if (!bundleNames().includes(name)) return {}
    const bundle = getContract(name)
    return {
      title: `${bundle.title} (bundle) · jbm-ui`,
      description: bundle.description,
      // Not an item page: keep it out of search results, but let crawlers follow member links.
      robots: { index: false, follow: true },
      alternates: { types: itemAlternateTypes(name, bundle.title) },
    }
  }
  return {
    title: `${item.title} · jbm-ui`,
    description: item.description,
    // A page's alternates replace the root's, so repeat the agent catalogs beside the
    // item's own Markdown and JSON.
    alternates: {
      canonical: `${siteOrigin()}/c/${item.name}`,
      types: itemAlternateTypes(item.name, item.title),
    },
  }
}

// Contract links on the production origin resolve on this deployment, so previews stay local.
const localHref = (url: string) =>
  url.startsWith("https://jbm-ui.bns.studio/")
    ? url.slice("https://jbm-ui.bns.studio".length)
    : url

export default async function ItemPage({ params }: Props) {
  const { name } = await params
  if (bundleNames().includes(name))
    return <BundlePage bundle={bundleNotice(name)} />
  const item = getGalleryItem(name)
  if (!item) notFound()
  const player = isPlayerPreview(item.name)
  const contract = getContract(item.name)
  const { examples } = contract
  const references = [
    { label: "Docs", links: contract.docs ?? [] },
    { label: "Schema", links: contract.schemas ?? [] },
  ].filter((row) => row.links.length > 0)
  const categoryHref = `/?cat=${categorySlug(item.category)}`

  return (
    <main className="site-shell item-page item-qa" id="main" tabIndex={-1}>
      <header className="item-topbar">
        <Link className="wordmark" href="/" aria-label="jbm-ui gallery">
          jbm<span aria-hidden="true">—</span>ui
        </Link>
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb">
            <li>
              <Link href="/">Gallery</Link>
            </li>
            <li>
              <Link href={categoryHref}>{item.category}</Link>
            </li>
            <li aria-current="page">{item.title}</li>
          </ol>
        </nav>
      </header>

      {/* Compact intro: the title and its tag line share a row so the bench fits the first
          viewport; Install, Usage, and the API follow the bench. */}
      <div className="item-head">
        <div className="item-title-row">
          <h1>{item.title}</h1>
          <ul className="card-tags item-tags" aria-label="Category and preview capabilities">
            <li>{item.category}</li>
            {item.capabilities.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>
        <p className="item-description">{item.description}</p>
      </div>

      <section
        className="item-bench"
        tabIndex={-1}
        aria-label={`${item.title} preview`}
      >
        <QaBench
          name={item.name}
          title={item.title}
          player={player}
          orientationAware={supportsOrientation(item.name)}
        />
      </section>

      <div className="item-docs">
        <section aria-labelledby="install-heading">
          <h2 id="install-heading">Install</h2>
          {!item.inRegistry && (
            <p>
              Documentation entry, not a registry item. Its shadow and border
              tokens install with <code>@jbm/{item.installName}</code>.
            </p>
          )}
          <AddCommand name={item.installName} />
          <p>
            Needs the <code>@jbm</code> entry in <code>components.json</code>;
            see <Link href="/#install-once-heading">Install once</Link>.
          </p>
          {item.registryDependencies.length > 0 && (
            <p>
              Also installs{" "}
              {item.registryDependencies.map((dependency, i) => (
                <span key={dependency}>
                  {i > 0 && ", "}
                  <code>{dependency}</code>
                </span>
              ))}
              .
            </p>
          )}
          {item.needsRemotion && (
            <p>
              Needs Remotion: render inside a Remotion{" "}
              <code>{"<Composition>"}</code> or <code>{"<Player>"}</code>, not
              a plain React tree. Timing values are in seconds.
            </p>
          )}
          <ul className="item-links">
            {item.inRegistry ? (
              <li>
                <a href={`/r/${item.name}.json`}>Registry JSON (source) ↗</a>
              </li>
            ) : (
              <li>
                <a href="/docs/surface-depth.md">Surface depth design note</a>
              </li>
            )}
            <li>
              <Link href={`/#${item.name}`}>Gallery card</Link>
            </li>
            <li>
              <a href={`/catalog/${item.name}.md`}>Agent Markdown</a>
            </li>
            <li>
              <a href={`/catalog/${item.name}.json`}>Agent JSON</a>
            </li>
          </ul>
          {references.length > 0 && (
            <dl className="item-refs">
              {references.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>
                    <ul>
                      {row.links.map((link) => (
                        <li key={link.url}>
                          <a href={localHref(link.url)}>
                            {link.title}
                            {localHref(link.url).startsWith("/") ? "" : " ↗"}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>
        {examples.length > 0 && (
          <section aria-labelledby="usage-heading">
            <h2 id="usage-heading">Usage</h2>
            {examples.map((example, index) => (
              <figure className="item-example" key={index}>
                {example.title && (
                  <figcaption id={`example-${index}`}>{example.title}</figcaption>
                )}
                <CodeBlock
                  code={example.code}
                  title={
                    example.title ??
                    (examples.length > 1
                      ? `${item.title} ${index + 1}`
                      : item.title)
                  }
                />
              </figure>
            ))}
          </section>
        )}
      </div>

      <ItemApi contract={contract} />

      <footer>
        Made for tacosdedatos. Built to be used again.
        <a href="/r/registry.json">Registry index (JSON) ↗</a>
      </footer>
    </main>
  )
}
