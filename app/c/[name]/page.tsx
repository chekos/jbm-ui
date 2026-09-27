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
import { QaBench } from "@/components/gallery/qa-bench"

type Props = { params: Promise<{ name: string }> }

// One static QA page per gallery item; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return getGalleryItems().map(({ name }) => ({ name }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = getGalleryItem((await params).name)
  if (!item) return {}
  return {
    title: `${item.title} · jbm-ui`,
    description: item.description,
  }
}

const source = (path: string) =>
  `https://github.com/chekos/jbm-ui/blob/main/${path}`

export default async function ItemPage({ params }: Props) {
  const item = getGalleryItem((await params).name)
  if (!item) notFound()
  const player = isPlayerPreview(item.name)
  const categoryHref = `/?cat=${categorySlug(item.category)}`

  return (
    <main className="site-shell item-page" id="main">
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

      <div className="item-head">
        <h1>{item.title}</h1>
        <p className="item-description">{item.description}</p>
        <ul className="card-tags item-tags" aria-label="Category and preview capabilities">
          <li>
            <Link href={categoryHref}>{item.category}</Link>
          </li>
          {item.capabilities.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>

      <section
        id="components"
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
            <li>
              <a href={source(item.sourcePath)}>Source ↗</a>
            </li>
            {item.inRegistry ? (
              <li>
                <a href={`/r/${item.name}.json`}>Registry JSON ↗</a>
              </li>
            ) : (
              <li>
                <a href={source("docs/surface-depth.md")}>
                  Surface depth design note ↗
                </a>
              </li>
            )}
            <li>
              <Link href={`/#${item.name}`}>Gallery card</Link>
            </li>
          </ul>
        </section>
        {item.snippet && (
          <section aria-labelledby="usage-heading">
            <h2 id="usage-heading">Usage</h2>
            <pre tabIndex={0} aria-labelledby="usage-heading">
              <code>{item.snippet}</code>
            </pre>
          </section>
        )}
      </div>

      <footer>
        Made for tacosdedatos. Built to be used again.
        <a href="/r/registry.json">Registry index (JSON) ↗</a>
      </footer>
    </main>
  )
}
