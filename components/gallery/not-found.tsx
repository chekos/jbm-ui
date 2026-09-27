"use client"

import Link from "next/link"
import { AddCommand } from "./install"

// Branded 404s and the bundle notice. The site-wide 404 and the /c/<name> 404 (rendered by
// app/global-not-found.tsx and app/not-found.tsx) share the item-page chrome. A
// bundle such as ui-bits has no QA page of its own, so app/c/[name]/page.tsx renders BundlePage
// (noindex) to explain what it is and link to the items it re-exports.

export type BundleNotice = {
  name: string
  title: string
  description: string
  pageReason: string
  members: { name: string; title: string; description: string }[]
}

function Shell({
  crumb,
  children,
}: {
  crumb: string
  children: React.ReactNode
}) {
  return (
    <main className="site-shell item-page not-found" id="main" tabIndex={-1}>
      <header className="item-topbar">
        <Link className="wordmark" href="/" aria-label="jbm-ui gallery">
          jbm<span aria-hidden="true">—</span>ui
        </Link>
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb">
            <li>
              <Link href="/">Gallery</Link>
            </li>
            <li aria-current="page">{crumb}</li>
          </ol>
        </nav>
      </header>
      {children}
      <footer>
        Made for tacosdedatos. Built to be used again.
        <a href="/r/registry.json">Registry index (JSON) ↗</a>
      </footer>
    </main>
  )
}

const agentLinks = (
  <ul className="item-links" aria-label="Machine-readable catalog">
    <li>
      <a href="/llms.txt">llms.txt index</a>
    </li>
    <li>
      <a href="/catalog.json">catalog.json</a>
    </li>
    <li>
      <a href="/r/registry.json">Registry index</a>
    </li>
  </ul>
)

/** Site-wide 404: calm, one way back to the gallery, and the agent catalogs. */
export function SiteNotFound() {
  return (
    <Shell crumb="Not found">
      <div className="item-head">
        <h1>Nothing is filed here</h1>
        <p className="item-description">
          This address does not match a page in the gallery. Every component has a QA page at <code>/c/&lt;name&gt;</code>; browse
          them all, or search by name, in the gallery.
        </p>
        <p className="not-found-actions">
          <Link className="not-found-primary" href="/">
            Open the gallery
          </Link>
        </p>
      </div>
      <section className="not-found-agents" aria-labelledby="agents-heading">
        <h2 id="agents-heading">For agents</h2>
        <p>
          The same items as plain text and JSON, with install commands, props,
          and stage sizes.
        </p>
        {agentLinks}
      </section>
    </Shell>
  )
}

/** /c/<bundle>: what the bundle is, how to install it, and the item pages to open instead. */
export function BundlePage({ bundle }: { bundle: BundleNotice }) {
  return (
    <Shell crumb={bundle.title}>
      <div className="item-head">
        <h1>{bundle.title} has no QA page of its own</h1>
        <p className="item-description">
          <code>@jbm/{bundle.name}</code> is a bundle that re-exports{" "}
          {bundle.members.length} items from a single file. {bundle.description}
        </p>
      </div>
      <div className="item-docs">
        <section aria-labelledby="bundle-install-heading">
          <h2 id="bundle-install-heading">Install the bundle</h2>
          <AddCommand name={bundle.name} />
          <p>
            Needs the <code>@jbm</code> entry in <code>components.json</code>;
            see <Link href="/#install-once-heading">Install once</Link>.
          </p>
          <ul className="item-links">
            <li>
              <a href={`/catalog/${bundle.name}.md`}>Markdown</a>
            </li>
            <li>
              <a href={`/catalog/${bundle.name}.json`}>JSON</a>
            </li>
            <li>
              <a href={`/r/${bundle.name}.json`}>Registry JSON ↗</a>
            </li>
          </ul>
        </section>
        <section aria-labelledby="bundle-members-heading">
          <h2 id="bundle-members-heading">Open an item instead</h2>
          <p>{bundle.pageReason}</p>
          <ul className="not-found-members">
            {bundle.members.map((member) => (
              <li key={member.name}>
                <Link href={`/c/${member.name}`}>{member.title}</Link>
                <span>{member.description}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  )
}

export type ItemPageRef = { name: string; title: string }

/**
 * /c/<name> 404: names the missing item, then offers the closest item pages, a gallery search for
 * the same words, and the agent index. Server-rendered by app/global-not-found.tsx, which
 * ranks the matches.
 */
export function ItemNotFound({
  name,
  matches,
}: {
  name: string
  matches: ItemPageRef[]
}) {
  return (
    <Shell crumb="Not found">
      <div className="item-head">
        <h1 className="not-found-title">No gallery item is named “{name}”.</h1>
        <p className="item-description">
          {matches.length > 0
            ? "Check the spelling. These item pages have the closest names."
            : "No item page has a similar name. Search the gallery by title or description instead."}
        </p>
        {matches.length > 0 && (
          <ul className="not-found-members" aria-label="Closest item pages">
            {matches.map((match) => (
              <li key={match.name}>
                <Link href={`/c/${match.name}`}>{match.title}</Link>
                <code>/c/{match.name}</code>
              </li>
            ))}
          </ul>
        )}
        <p className="not-found-actions">
          <Link
            className="not-found-primary"
            href={`/?q=${encodeURIComponent(name)}`}
          >
            Search the gallery for “{name}”
          </Link>
          <Link href="/">Browse every item</Link>
        </p>
      </div>
      <section className="not-found-agents" aria-labelledby="agents-heading">
        <h2 id="agents-heading">For agents</h2>
        <p>
          Every item name with its install command, props, and stage size, as
          plain text and JSON. <code>/llms.txt</code> is the place to start.
        </p>
        {agentLinks}
      </section>
    </Shell>
  )
}
