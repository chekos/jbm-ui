"use client"

import { useState, type ReactNode } from "react"
import dynamic from "next/dynamic"
import registry from "@/registry.json"
import { SurfaceDepth, surfaceUsage } from "./surface-depth"

const galleryItems = [
  registry.items[0],
  {
    name: "surface-depth",
    title: "Surface depth",
    description:
      "Fine borders, inset edge lighting, and layered shadows. Compare the original surface and inspect each layer.",
    files: [{ path: "registry/jbm/lib/tokens.ts" }],
  },
  ...registry.items.slice(1),
]
import { color } from "@/registry/jbm/lib/tokens"
import { examples, snippets } from "./examples"
import { categories, category, type Category } from "./categories"

const MotionPreview = dynamic(() => import("./motion-preview"), {
  ssr: false,
  loading: () => <p className="loading">Loading preview…</p>,
})

function Canvas({ children }: { children: ReactNode }) {
  return (
    <div className="preview-canvas">
      <div className="preview-stage">{children}</div>
    </div>
  )
}

function Install({ name }: { name: string }) {
  const [status, setStatus] = useState("")
  async function copy() {
    try {
      const config = JSON.stringify(
        { registries: { "@jbm": `${window.location.origin}/r/{name}.json` } },
        null,
        2
      )
      await navigator.clipboard.writeText(config)
      setStatus("Registry configuration copied.")
    } catch {
      setStatus(
        "Clipboard unavailable. Select and copy the configuration below."
      )
    }
  }
  return (
    <div className="install">
      <p>
        Merge this namespace into your project’s <code>components.json</code>,
        replacing <code>YOUR_GALLERY_URL</code> with this site’s origin.
      </p>
      <pre>
        <code>
          {
            '{ "registries": { "@jbm": "https://YOUR_GALLERY_URL/r/{name}.json" } }'
          }
        </code>
      </pre>
      <button onClick={copy}>Copy config for this site</button>
      <p role="status">{status}</p>
      <pre>
        <code>pnpm dlx shadcn@latest add @jbm/{name}</code>
      </pre>
    </div>
  )
}

export function Gallery() {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Category>("All")
  const items = galleryItems.filter(
    (item) =>
      (filter === "All" || category(item.name) === filter) &&
      `${item.title} ${item.name} ${item.description}`
        .toLowerCase()
        .includes(query.toLowerCase())
  )
  return (
    <>
      <div className="toolbar">
        <div className="filters" role="group" aria-label="Component category">
          {categories.map((value) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {value}
              <span>
                {value === "All"
                  ? galleryItems.length
                  : galleryItems.filter((item) => category(item.name) === value)
                      .length}
              </span>
            </button>
          ))}
        </div>
        <label className="search">
          <span className="sr-only">Search components</span>
          <input
            type="search"
            placeholder="Search components…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <p className="result-count" role="status">
        {items.length} {items.length === 1 ? "item" : "items"} in the collection
      </p>
      <div className="gallery-grid">
        {items.map((item, index) => (
          <article id={item.name} key={item.name} className="component-card">
            <div className="card-heading">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{category(item.name)}</span>
            </div>
            <div
              className={
                item.name === "surface-depth" ? "surface-preview" : "preview"
              }
            >
              {item.name === "surface-depth" ? (
                <SurfaceDepth />
              ) : item.name === "tokens" ? (
                <div className="swatches">
                  {Object.entries(color).map(([name, value]) => (
                    <div key={name}>
                      <span style={{ background: value }} />
                      <strong>{name}</strong>
                      <code>{value}</code>
                    </div>
                  ))}
                </div>
              ) : item.name in examples ? (
                <Canvas>{examples[item.name as keyof typeof examples]}</Canvas>
              ) : (
                <MotionPreview name={item.name} />
              )}
            </div>
            <div className="card-content">
              <h2>
                <a href={`#${item.name}`}>{item.title}</a>
              </h2>
              <p>{item.description}</p>
              <div className="card-links">
                <a
                  href={`https://github.com/chekos/jbm-ui/blob/main/${item.files[0].path}`}
                >
                  Source ↗
                </a>
                <a
                  href={`/r/${item.name === "surface-depth" ? "tokens" : item.name}.json`}
                >
                  Registry JSON ↗
                </a>
              </div>
              {item.name === "surface-depth" && (
                <p>
                  <a href="https://github.com/chekos/jbm-ui/blob/main/docs/surface-depth.md">
                    Surface depth design note ↗
                  </a>
                </p>
              )}
              <details>
                <summary>Usage & installation</summary>
                {"dependencies" in item &&
                item.dependencies?.includes("remotion") ? (
                  <p>
                    Render inside a Remotion composition or Player. Timing
                    values are in seconds.
                  </p>
                ) : null}
                <pre>
                  <code>
                    {item.name === "surface-depth"
                      ? surfaceUsage
                      : snippets[item.name]}
                  </code>
                </pre>
                <Install
                  name={item.name === "surface-depth" ? "tokens" : item.name}
                />
              </details>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 && (
        <div className="empty">
          <h2>No components found.</h2>
          <p>Try another name or browse the full collection.</p>
          <button
            onClick={() => {
              setQuery("")
              setFilter("All")
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  )
}
