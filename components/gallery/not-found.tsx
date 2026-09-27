"use client"

import Link from "next/link"
import { createContext, useContext } from "react"
import { AddCommand } from "./install"

// Branded 404s. The site-wide page (app/not-found.tsx) and /c/<name> (app/c/[name]/not-found.tsx)
// share the item-page chrome. A bundle such as ui-bits has no QA page of its own, so its
// /c/<name> explains what it is and links to the items it re-exports.

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
    <main className="site-shell item-page not-found" id="main">
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
export function SiteNotFound({ name }: { name?: string }) {
  return (
    <Shell crumb="Not found">
      <div className="item-head">
        <h1>Nothing is filed here</h1>
        <p className="item-description">
          {name ? (
            <>
              No gallery item is named <code>{name}</code>.{" "}
            </>
          ) : (
            "This address does not match a page in the gallery. "
          )}
          Every component has a QA page at <code>/c/&lt;name&gt;</code>; browse
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

function BundlePage({ bundle }: { bundle: BundleNotice }) {
  return (
    <Shell crumb={bundle.title}>
      <div className="item-head">
        <h1>{bundle.title} has no page of its own</h1>
        <p className="item-description">
          <code>@jbm/{bundle.name}</code> is a bundle: one install that brings
          in {bundle.members.length} items and re-exports them from a single
          file. {bundle.description}
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

// not-found.tsx receives no params, and useParams() makes the prerender bail out to client
// rendering, so app/c/[name]/layout.tsx hands the name down through context instead.
const ItemNameContext = createContext<string | undefined>(undefined)

export function ItemNameProvider({
  name,
  children,
}: {
  name: string
  children: React.ReactNode
}) {
  return <ItemNameContext value={name}>{children}</ItemNameContext>
}

/** /c/<name> 404: explains bundles, and names the missing item otherwise. */
export function ItemNotFound({ bundles }: { bundles: BundleNotice[] }) {
  const name = useContext(ItemNameContext)
  const bundle = bundles.find((entry) => entry.name === name)
  return bundle ? <BundlePage bundle={bundle} /> : <SiteNotFound name={name} />
}
