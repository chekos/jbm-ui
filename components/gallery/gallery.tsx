"use client"

import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import dynamic from "next/dynamic"
import registry from "@/registry.json"
import {
  TextFillDemo,
  ScrollTextFillDemo,
  FlipTextDemo,
} from "./text-fill-demo"
import { videoPrimitiveExamples } from "./video-primitives-demo"
import { editorialExamples } from "./editorial-demo"
import { ScrollStackDemo } from "./scroll-stack-demo"
import { SurfaceDepth, surfaceUsage } from "./surface-depth"
import {
  DesignVideoDemo,
  designNames,
  designSnippets,
} from "./design-video-demo"
import { DeskDemo, deskNames, deskSnippets } from "./desk-demo"
import {
  AddCommand,
  InstallOnce,
  needsRemotion,
  registryDependencies,
} from "./install"

const galleryItems = [
  registry.items[0],
  {
    name: "surface-depth",
    title: "Surface depth",
    description:
      "Fine borders, inset edge lighting, and layered shadows. Compare the original surface and inspect each layer.",
    files: [{ path: "registry/jbm/lib/tokens.ts" }],
  },
  ...registry.items.slice(1).filter((item) => item.name !== "ui-bits"),
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

type GalleryItem = (typeof galleryItems)[number]

const groups = categories.filter(
  (value): value is Exclude<Category, "All"> => value !== "All"
)
const slug = (value: string) => value.toLowerCase().replaceAll(" ", "-")
const plural = (count: number) => (count === 1 ? "item" : "items")

function matches(item: GalleryItem, filter: Category, query: string) {
  return (
    (filter === "All" || category(item.name) === filter) &&
    `${item.title} ${item.name} ${item.description}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  )
}

// Previews rendered by MotionPreview (the Remotion Player fallback below).
const inPlayer = (name: string) =>
  !designNames.includes(name) &&
  !deskNames.includes(name) &&
  !(name in examples) &&
  !(name in editorialExamples) &&
  !(name in videoPrimitiveExamples) &&
  ![
    "scroll-stack",
    "flip-text",
    "text-fill",
    "scroll-text-fill",
    "surface-depth",
    "tokens",
  ].includes(name)
// Video-primitive demos that render their own inputs rather than a fixed example.
const interactivePrimitives = ["ticket", "folder", "score-scale", "clock"]

/** QA-bench signals for a card, derived from how its preview is rendered. */
function capabilities(item: GalleryItem) {
  const { name } = item
  const player = inPlayer(name)
  const tags: string[] = []
  if (
    designNames.includes(name) ||
    deskNames.includes(name) ||
    interactivePrimitives.includes(name) ||
    ["scroll-stack", "flip-text", "text-fill", "surface-depth"].includes(
      name
    ) ||
    name === "scene-spec"
  )
    tags.push("controls")
  if (name.startsWith("scroll-")) tags.push("scroll")
  // Scene is a static layout (a one-frame composition); every other Player preview replays.
  if ((player && name !== "scene") || name === "replay-button")
    tags.push("replay")
  // scene-spec compiles one spec into landscape and vertical stages side by side.
  if (name === "scene-spec") tags.push("portrait")
  if (
    player ||
    ("dependencies" in item && item.dependencies?.includes("remotion"))
  )
    tags.push("remotion")
  return tags.length ? tags : ["static"]
}

// The URL is the source of truth for the category filter and query (?cat=motion&q=card).
const urlEvent = "jbm:gallery-url"
function subscribeUrl(onChange: () => void) {
  window.addEventListener(urlEvent, onChange)
  window.addEventListener("popstate", onChange)
  return () => {
    window.removeEventListener(urlEvent, onChange)
    window.removeEventListener("popstate", onChange)
  }
}
const readUrl = () => window.location.search
const readServerUrl = () => ""

function writeUrl(filter: Category, query: string) {
  const url = new URL(window.location.href)
  if (filter === "All") url.searchParams.delete("cat")
  else url.searchParams.set("cat", slug(filter))
  if (query) url.searchParams.set("q", query)
  else url.searchParams.delete("q")
  window.history.replaceState(window.history.state, "", url)
  window.dispatchEvent(new Event(urlEvent))
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

export function Gallery() {
  const search = useSyncExternalStore(subscribeUrl, readUrl, readServerUrl)
  const params = new URLSearchParams(search)
  const filter: Category =
    groups.find((value) => slug(value) === params.get("cat")) ?? "All"
  const query = params.get("q") ?? ""
  const searchInput = useRef<HTMLInputElement>(null)
  const toolbar = useRef<HTMLDivElement>(null)
  const results = useRef<HTMLDivElement>(null)

  // When the toolbar is stuck, a new result set starts at its top instead of mid-scroll.
  function update(nextFilter: Category, nextQuery: string) {
    writeUrl(nextFilter, nextQuery)
    requestAnimationFrame(() => {
      const top = results.current?.getBoundingClientRect().top ?? 0
      if (top < (toolbar.current?.offsetHeight ?? 0))
        results.current?.scrollIntoView({ block: "start" })
    })
  }
  const setFilter = (value: Category) => update(value, query)
  const setQuery = (value: string) => update(filter, value)
  const clear = () => update("All", "")

  // "/" focuses search from anywhere except another text field.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        event.key !== "/" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTyping(event.target)
      )
        return
      event.preventDefault()
      searchInput.current?.focus()
      searchInput.current?.select()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // Anchors and focus scroll clear of the sticky toolbar (WCAG 2.4.11).
  useEffect(() => {
    const element = toolbar.current
    if (!element) return
    const root = document.documentElement
    const measure = () =>
      root.style.setProperty("--toolbar-h", `${element.offsetHeight}px`)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => {
      observer.disconnect()
      root.style.removeProperty("--toolbar-h")
    }
  }, [])

  const items = galleryItems.filter((item) => matches(item, filter, query))
  const visibleGroups = groups.filter((group) =>
    items.some((item) => category(item.name) === group)
  )
  const active = filter !== "All" || query !== ""
  const everywhere =
    filter !== "All"
      ? galleryItems.filter((item) => matches(item, "All", query)).length
      : 0
  const summary = `${items.length} ${filter === "All" ? "" : filter + " "}${plural(items.length)}${
    query ? ` matching “${query}”` : active ? "" : " in the collection"
  }`

  return (
    <>
      <InstallOnce />
      <div className="toolbar" ref={toolbar}>
        <div className="toolbar-row">
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
                    : galleryItems.filter(
                        (item) => category(item.name) === value
                      ).length}
                </span>
              </button>
            ))}
          </div>
          <label className="search">
            <span className="sr-only">Search components</span>
            <input
              ref={searchInput}
              type="search"
              placeholder="Search components…"
              aria-keyshortcuts="/"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd aria-hidden="true">/</kbd>
          </label>
        </div>
        <div className="toolbar-row toolbar-status">
          <p className="result-count" role="status">
            {summary}
          </p>
          {active && (
            <button className="toolbar-clear" onClick={clear}>
              Clear
            </button>
          )}
          {visibleGroups.length > 1 && (
            <nav className="section-jump" aria-label="Jump to section">
              {visibleGroups.map((group) => (
                <a key={group} href={`#${slug(group)}`}>
                  {group}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
      <div id="components" className="results" tabIndex={-1} ref={results}>
        {groups.map((group) => {
          const members = items.filter((item) => category(item.name) === group)
          if (!members.length) return null
          const id = slug(group)
          return (
            <section
              key={group}
              id={id}
              className="gallery-section"
              aria-labelledby={id + "-heading"}
            >
              <h2 id={id + "-heading"} className="section-heading">
                {group}
                <span className="sr-only">, </span>
                <span>
                  {members.length}
                  <span className="sr-only"> {plural(members.length)}</span>
                </span>
              </h2>
              {group === "UI Bits" && (
                <p className="section-description">
                  Paper illustrations of interface elements. Each component has
                  its own preview and installation.
                </p>
              )}
              <div className="gallery-grid">
                {members.map((item) => (
                  <article
                    id={item.name}
                    key={item.name}
                    className="component-card"
                  >
                    <ul className="card-tags" aria-label="Preview capabilities">
                      {capabilities(item).map((tag) => (
                        <li key={tag}>{tag}</li>
                      ))}
                    </ul>
                    <div
                      style={
                        designNames.includes(item.name) ||
                        item.name === "scroll-stack" ||
                        item.name === "flip-text" ||
                        item.name === "text-fill" ||
                        item.name === "scroll-text-fill" ||
                        item.name in editorialExamples ||
                        item.name in videoPrimitiveExamples
                          ? { aspectRatio: "auto", minHeight: 300 }
                          : undefined
                      }
                      className={
                        item.name === "surface-depth"
                          ? "surface-preview"
                          : "preview"
                      }
                    >
                      {designNames.includes(item.name) ? (
                        <DesignVideoDemo name={item.name} />
                      ) : item.name === "scroll-stack" ? (
                        <ScrollStackDemo />
                      ) : item.name === "flip-text" ? (
                        <FlipTextDemo />
                      ) : item.name === "text-fill" ? (
                        <TextFillDemo />
                      ) : item.name === "scroll-text-fill" ? (
                        <ScrollTextFillDemo />
                      ) : item.name === "surface-depth" ? (
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
                      ) : item.name in videoPrimitiveExamples ? (
                        <div
                          style={{
                            padding: 28,
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          {
                            videoPrimitiveExamples[
                              item.name as keyof typeof videoPrimitiveExamples
                            ]
                          }
                        </div>
                      ) : item.name in editorialExamples ? (
                        <div
                          style={{
                            padding: 28,
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          {
                            editorialExamples[
                              item.name as keyof typeof editorialExamples
                            ]
                          }
                        </div>
                      ) : deskNames.includes(item.name) ? (
                        <DeskDemo name={item.name} />
                      ) : item.name in examples ? (
                        <Canvas>
                          {examples[item.name as keyof typeof examples]}
                        </Canvas>
                      ) : (
                        <MotionPreview name={item.name} />
                      )}
                    </div>
                    <div className="card-content">
                      <h3>
                        <a href={`#${item.name}`}>{item.title}</a>
                      </h3>
                      <p>{item.description}</p>
                      <div className="card-links">
                        <a
                          href={`https://github.com/chekos/jbm-ui/blob/main/${item.files[0].path}`}
                        >
                          Source ↗
                        </a>
                        {item.name !== "surface-depth" && (
                          <a href={`/r/${item.name}.json`}>Registry JSON ↗</a>
                        )}
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
                        {item.name === "surface-depth" ? (
                          <p>
                            Documentation entry, not a registry item. Its shadow
                            and border tokens install with{" "}
                            <code>@jbm/tokens</code>.
                          </p>
                        ) : null}
                        <AddCommand
                          name={
                            item.name === "surface-depth" ? "tokens" : item.name
                          }
                        />
                        {registryDependencies(item.name).length > 0 && (
                          <p>
                            Also installs{" "}
                            {registryDependencies(item.name).map(
                              (dependency, i) => (
                                <span key={dependency}>
                                  {i > 0 && ", "}
                                  <code>{dependency}</code>
                                </span>
                              )
                            )}
                            .
                          </p>
                        )}
                        {needsRemotion(item.name) && (
                          <p>
                            Needs Remotion: render inside a Remotion{" "}
                            <code>{"<Composition>"}</code> or{" "}
                            <code>{"<Player>"}</code>, not a plain React tree.
                            Timing values are in seconds.
                          </p>
                        )}
                        <pre tabIndex={0}>
                          <code>
                            {item.name === "surface-depth"
                              ? surfaceUsage
                              : (designSnippets[item.name] ??
                                deskSnippets[item.name] ??
                                snippets[item.name])}
                          </code>
                        </pre>
                      </details>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )
        })}
        {items.length === 0 && (
          <div className="empty">
            <h2>
              No “{query}” in {filter === "All" ? "the collection" : filter}.
            </h2>
            <p>
              {everywhere > 0
                ? `${everywhere} ${plural(everywhere)} match in other categories.`
                : "Try another name, or browse the full collection."}
            </p>
            <div className="empty-actions">
              {everywhere > 0 && (
                <button onClick={() => setFilter("All")}>
                  Search all categories
                </button>
              )}
              <button onClick={clear}>Clear</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
