"use client"

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import {
  TextFillDemo,
  ScrollTextFillDemo,
  FlipTextDemo,
} from "./text-fill-demo"
import { videoPrimitiveExamples } from "./video-primitives-demo"
import { editorialExamples } from "./editorial-demo"
import { ScrollStackDemo } from "./scroll-stack-demo"
import { SurfaceDepth } from "./surface-depth"
import { DesignVideoDemo, designNames } from "./design-video-demo"
import { DeskDemo, deskNames } from "./desk-demo"
import { ThreadDemo, threadNames } from "./thread-demo"
import { AddCommand, InstallOnce } from "./install"
import { CodeBlock } from "./code-block"
import { color } from "@/registry/jbm/lib/tokens"
import { examples } from "./examples"
import { categories, categoryDefinitions, type Category } from "./categories"
import {
  categorySlug,
  getGalleryItems,
  capabilityLabel,
  type GalleryItemMeta,
} from "./item-meta"
import { repoSourceUrl } from "@/lib/site"
import { InlineScript } from "./inline-script"

// One source of truth for cards, /c/<name> pages, llms.txt, and catalog.json.
const galleryItems = getGalleryItems()

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

type GalleryItem = GalleryItemMeta

const groups = categories.filter(
  (value): value is Exclude<Category, "All"> => value !== "All"
)
const slug = categorySlug
const plural = (count: number) => (count === 1 ? "item" : "items")

// Search covers names, copy, category, capability ids ("player", "replay", "controls") and their
// card labels ("adjustable"), and "remotion" for items that need the remotion package; every
// whitespace-separated term must match.
const searchText = new Map(
  galleryItems.map((item) => [
    item.name,
    [
      item.title,
      item.name,
      item.description,
      item.category,
      ...item.capabilities,
      ...item.capabilities.map((tag) => capabilityLabel[tag]),
      item.needsRemotion ? "remotion" : "",
    ]
      .join(" ")
      .toLowerCase(),
  ])
)

function matches(item: GalleryItem, filter: Category, query: string) {
  if (filter !== "All" && item.category !== filter) return false
  const text = searchText.get(item.name) ?? ""
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => text.includes(term))
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

// The index is prerendered without its query, so the server HTML holds every section (agents and
// no-JS readers get the whole collection) and React applies ?cat= and ?q= after hydration. This
// script runs while the HTML is parsed, right after the status row and before the results, and
// hides what the filter will remove before first paint, so a filtered link (/?cat=interactive)
// never shifts the page: it fills the <style> just before it with rules on each card's
// data-search text and each section's id, marks the matching filter chip, opens search on phones
// when there is a query, and writes a category's result count. Gallery clears the rules once
// React renders the same filter (usePrefilterCleanup).
const prefilterCategories = Object.fromEntries(
  groups.map((group) => [
    slug(group),
    [group, galleryItems.filter((item) => item.category === group).length],
  ])
)
const prefilterScript = `(function(s){var st=s&&s.previousElementSibling;if(!st||st.tagName!=="STYLE")return;var q=new URLSearchParams(location.search),c=${JSON.stringify(
  prefilterCategories
)},cat=q.get("cat"),g=c.hasOwnProperty(cat)?c[cat]:null,t=(q.get("q")||"").toLowerCase().split(/\\s+/).filter(Boolean),r=[];if(!g&&!t.length)return;if(g){r.push(".results>.gallery-section:not(#"+cat+"){display:none}.section-jump{visibility:hidden}");document.querySelectorAll(".filters button[data-cat]").forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-cat")===cat?"true":"false")});if(!t.length){var n=document.querySelector(".result-count");if(n)n.textContent=g[1]+" "+g[0]+" "+(g[1]===1?"item":"items")}}if(t.length){var a=t.map(function(x){return"[data-search*="+JSON.stringify(x)+"]"});r.push(a.map(function(x){return".component-card:not("+x+")"}).join(",")+"{display:none}.gallery-section:not(:has(.component-card"+a.join("")+")){display:none}");var tb=document.querySelector(".toolbar");if(tb)tb.setAttribute("data-search","open")}st.textContent=r.join("")})(document.currentScript)`

// Runs right after the results are parsed when the URL has a query: sets each chip's count and the
// result status to what React will render (the cards' data-search text decides), so the chip row
// keeps its width when React takes over.
const prefilterCountsScript = `(function(){var q=new URLSearchParams(location.search),raw=q.get("q")||"",t=raw.toLowerCase().split(/\\s+/).filter(Boolean);if(!t.length)return;var c=${JSON.stringify(
  prefilterCategories
)},cat=q.get("cat"),g=c.hasOwnProperty(cat)?c[cat]:null,all=0,n=0;function m(e){var x=e.getAttribute("data-search")||"";return t.every(function(w){return x.indexOf(w)>=0})}document.querySelectorAll(".results>.gallery-section").forEach(function(s){var k=0;s.querySelectorAll(".component-card").forEach(function(e){if(m(e))k++});all+=k;if(!g||s.id===cat)n+=k;var b=document.querySelector('.filters button[data-cat="'+s.id+'"] span');if(b)b.textContent=k});var a=document.querySelector('.filters button[data-cat=""] span');if(a)a.textContent=all;var r=document.querySelector(".result-count");if(r&&n)r.textContent=n+" "+(g?g[0]+" ":"")+(n===1?"item":"items")+" matching \u201c"+raw+"\u201d"})()`

/**
 * Clears the pre-paint filter rules once React has rendered the address bar's filter: hydration
 * renders the server's unfiltered snapshot first, so the rules stay until `search` matches.
 */
function usePrefilterCleanup(search: string) {
  const style = useRef<HTMLStyleElement>(null)
  useLayoutEffect(() => {
    if (search === window.location.search && style.current)
      style.current.textContent = ""
  }, [search])
  return style
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

function Preview({ item }: { item: GalleryItem }) {
  const { name } = item
  return (
    <div
      style={
        designNames.includes(name) ||
        threadNames.includes(name) ||
        name === "scroll-stack" ||
        name === "flip-text" ||
        name === "text-fill" ||
        name === "scroll-text-fill" ||
        name in editorialExamples ||
        name in videoPrimitiveExamples
          ? { aspectRatio: "auto", minHeight: 300 }
          : undefined
      }
      className={name === "surface-depth" ? "surface-preview" : "preview"}
    >
      {designNames.includes(name) ? (
        <DesignVideoDemo name={name} />
      ) : name === "scroll-stack" ? (
        <ScrollStackDemo />
      ) : name === "flip-text" ? (
        <FlipTextDemo />
      ) : name === "text-fill" ? (
        <TextFillDemo />
      ) : name === "scroll-text-fill" ? (
        <ScrollTextFillDemo />
      ) : name === "surface-depth" ? (
        <SurfaceDepth />
      ) : name === "tokens" ? (
        <div className="swatches">
          {Object.entries(color).map(([key, value]) => (
            <div key={key}>
              <span style={{ background: value }} />
              <strong>{key}</strong>
              <code>{value}</code>
            </div>
          ))}
        </div>
      ) : name in videoPrimitiveExamples ? (
        <div style={{ padding: 28, width: "100%", boxSizing: "border-box" }}>
          {videoPrimitiveExamples[name as keyof typeof videoPrimitiveExamples]}
        </div>
      ) : name in editorialExamples ? (
        <div style={{ padding: 28, width: "100%", boxSizing: "border-box" }}>
          {editorialExamples[name as keyof typeof editorialExamples]}
        </div>
      ) : deskNames.includes(name) ? (
        <DeskDemo name={name} />
      ) : threadNames.includes(name) ? (
        <ThreadDemo name={name} />
      ) : name in examples ? (
        <Canvas>{examples[name as keyof typeof examples]}</Canvas>
      ) : (
        <MotionPreview name={name} />
      )}
    </div>
  )
}

function ComponentCard({ item }: { item: GalleryItem }) {
  const { name } = item
  const documentation = name === "surface-depth"
  const tags = item.capabilities
  const dependencies = item.registryDependencies
  return (
    <article
      id={name}
      className="component-card"
      data-capabilities={tags.join(" ") || undefined}
      // What search matches, for the pre-paint filter (prefilterScript).
      data-search={searchText.get(name)}
    >
      <Preview item={item} />
      <div className="card-content">
        <div className="card-heading">
          <h3>
            <Link href={`/c/${name}`}>{item.title}</Link>
          </h3>
          {tags.length > 0 && (
            <p className="card-tags">
              <span className="sr-only">Preview: </span>
              {tags.map((tag, i) => (
                <span key={tag} data-capability={tag}>
                  {i > 0 && (
                    <span className="card-tag-separator" aria-hidden="true">
                      ·
                    </span>
                  )}
                  {capabilityLabel[tag]}
                  {i < tags.length - 1 && <span className="sr-only">, </span>}
                </span>
              ))}
            </p>
          )}
        </div>
        <p>{item.description}</p>
        <AddCommand name={item.installName} />
        <details>
          <summary>Usage</summary>
          {documentation && (
            <p>
              Documentation entry, not a registry item. Its shadow and border
              tokens install with <code>@jbm/tokens</code>.
            </p>
          )}
          {dependencies.length > 0 && (
            <p>
              Also installs{" "}
              {dependencies.map((dependency, i) => (
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
              <code>{"<Composition>"}</code> or <code>{"<Player>"}</code>, not a
              plain React tree. Timing values are in seconds.
            </p>
          )}
          <CodeBlock code={item.snippet} title={item.title} />
          <div className="card-links">
            {documentation ? (
              <a href="/docs/surface-depth.md">Design note</a>
            ) : (
              <a href={`/r/${name}.json`}>Registry JSON ↗</a>
            )}
            <a
              href={repoSourceUrl(item.sourcePath)}
              target="_blank"
              rel="noopener"
            >
              Source<span className="sr-only"> of {item.title} on GitHub</span>{" "}
              ↗
            </a>
          </div>
        </details>
      </div>
    </article>
  )
}

export function Gallery() {
  const search = useSyncExternalStore(subscribeUrl, readUrl, readServerUrl)
  const params = new URLSearchParams(search)
  const filter: Category =
    groups.find((value) => slug(value) === params.get("cat")) ?? "All"
  const query = params.get("q") ?? ""
  // On narrow screens (CSS only) search collapses to an icon button; a query
  // keeps it open. Wider screens always show the field and hide the button.
  const [searchOpen, setSearchOpen] = useState(false)
  // True right after Clear, until the next filter or query change.
  const [cleared, setCleared] = useState(false)
  const searchShown = searchOpen || query !== ""
  const prefilter = usePrefilterCleanup(search)
  const searchInput = useRef<HTMLInputElement>(null)
  const searchToggle = useRef<HTMLButtonElement>(null)
  const toolbar = useRef<HTMLDivElement>(null)
  const status = useRef<HTMLDivElement>(null)
  const results = useRef<HTMLDivElement>(null)

  // Height of everything stuck to the top of the viewport (toolbar, plus the
  // status row where it sticks too). Anchors and new result sets land below it.
  function stickyHeight() {
    const bar = toolbar.current
    if (!bar || getComputedStyle(bar).position !== "sticky") return 0
    const row = status.current
    const rowSticks = row && getComputedStyle(row).position === "sticky"
    return bar.offsetHeight + (rowSticks ? row.offsetHeight : 0)
  }

  // When the toolbar is stuck, a new result set starts at its top instead of mid-scroll.
  function update(nextFilter: Category, nextQuery: string) {
    setCleared(false)
    writeUrl(nextFilter, nextQuery)
    requestAnimationFrame(() => {
      const top = results.current?.getBoundingClientRect().top ?? 0
      if (top < stickyHeight())
        results.current?.scrollIntoView({ block: "start" })
    })
  }
  const setFilter = (value: Category) => update(value, query)
  const setQuery = (value: string) => update(filter, value)
  // Both Clear buttons unmount once nothing is filtered, so focus would fall to <body>
  // (WCAG 2.4.3). Hand it to search: the mobile toggle where the field is collapsed, the
  // field on wider screens. The status region announces the reset.
  function clear() {
    update("All", "")
    setCleared(true)
    requestAnimationFrame(() => {
      const toggle = searchToggle.current
      if (toggle?.checkVisibility()) toggle.focus()
      else searchInput.current?.focus()
    })
  }

  function openSearch() {
    setSearchOpen(true)
    // The input mounts visible on the next frame.
    requestAnimationFrame(() => {
      searchInput.current?.focus()
      searchInput.current?.select()
    })
  }

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
      setSearchOpen(true)
      requestAnimationFrame(() => {
        searchInput.current?.focus()
        searchInput.current?.select()
      })
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // Anchors and focus scroll clear of the sticky bars (WCAG 2.4.11). The first
  // measurement happens after the browser has already jumped to a #hash, so
  // re-scroll to it once the real height is known, and again when late layout
  // (fonts, dynamic previews) settles — unless the reader has scrolled since.
  useEffect(() => {
    const bar = toolbar.current
    const row = status.current
    if (!bar || !row) return
    const root = document.documentElement
    const measure = () => {
      root.style.setProperty("--toolbar-h", `${bar.offsetHeight}px`)
      root.style.setProperty("--sticky-h", `${stickyHeight()}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    observer.observe(row)

    let userScrolled = false
    const stop = () => (userScrolled = true)
    const intents = ["wheel", "touchstart", "keydown", "pointerdown"] as const
    intents.forEach((type) =>
      window.addEventListener(type, stop, { once: true, passive: true })
    )
    const toHash = () => {
      if (userScrolled) return
      const id = decodeURIComponent(window.location.hash.slice(1))
      const target = id && document.getElementById(id)
      if (target) target.scrollIntoView({ block: "start", behavior: "instant" })
    }
    const frame = requestAnimationFrame(toHash)
    const settled = setTimeout(toHash, 600)
    document.fonts?.ready.then(toHash)
    window.addEventListener("load", toHash, { once: true })
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(settled)
      userScrolled = true
      intents.forEach((type) => window.removeEventListener(type, stop))
      window.removeEventListener("load", toHash)
      root.style.removeProperty("--toolbar-h")
      root.style.removeProperty("--sticky-h")
    }
  }, [])

  const items = galleryItems.filter((item) => matches(item, filter, query))
  const visibleGroups = groups.filter((group) =>
    items.some((item) => item.category === group)
  )
  const active = filter !== "All" || query !== ""
  const everywhere =
    filter !== "All"
      ? galleryItems.filter((item) => matches(item, "All", query)).length
      : 0
  const where = filter === "All" ? "the collection" : filter
  const summary =
    items.length === 0
      ? // Announced for screen readers; the empty state below shows the same words.
        `No “${query}” in ${where}. ${
          everywhere > 0
            ? `${everywhere} ${plural(everywhere)} match in other categories.`
            : ""
        }`.trim()
      : `${cleared ? "Filters cleared. " : ""}${items.length} ${filter === "All" ? "" : filter + " "}${plural(items.length)}${
          query ? ` matching “${query}”` : active ? "" : " in the collection"
        }`
  // Chip counts follow the query: how many matches each category holds right now.
  const count = (value: Category) =>
    galleryItems.filter((item) => matches(item, value, query)).length

  return (
    <>
      <InstallOnce />
      <div
        className="toolbar"
        ref={toolbar}
        data-search={searchShown ? "open" : "closed"}
        // The pre-paint filter opens search on phones when the URL has a query.
        suppressHydrationWarning
      >
        <div className="toolbar-row">
          <div className="filters" role="group" aria-label="Component category">
            {categories.map((value) => (
              <button
                key={value}
                aria-pressed={filter === value}
                data-cat={value === "All" ? "" : slug(value)}
                onClick={() => setFilter(value)}
                // The pre-paint filter marks the chip in the URL before hydration.
                suppressHydrationWarning
              >
                {value}
                <span suppressHydrationWarning>{count(value)}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className="search-toggle"
            ref={searchToggle}
            aria-label="Search components"
            aria-expanded={searchShown}
            aria-controls="gallery-search"
            onClick={() => {
              if (!searchShown) openSearch()
              else if (query === "") setSearchOpen(false)
              else searchInput.current?.focus()
            }}
          >
            <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
              <circle
                cx="8.5"
                cy="8.5"
                r="5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
              />
              <path
                d="M12.5 12.5 17 17"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <label className="search">
            <span className="sr-only">Search components</span>
            <input
              id="gallery-search"
              ref={searchInput}
              type="search"
              placeholder="Search name or tag…"
              aria-keyshortcuts="/"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Escape" &&
                  query === "" &&
                  searchToggle.current?.checkVisibility()
                ) {
                  setSearchOpen(false)
                  searchToggle.current?.focus()
                }
              }}
            />
            <kbd aria-hidden="true">/</kbd>
          </label>
        </div>
      </div>
      <div className="toolbar-status" ref={status}>
        {/* One visible message: while nothing matches, the empty state says it and this
            live region only announces it. */}
        <p
          className={
            items.length === 0 ? "result-count sr-only" : "result-count"
          }
          role="status"
          suppressHydrationWarning
        >
          {summary}
        </p>
        {/* The empty state carries its own Clear; never show two. */}
        {active && items.length > 0 && (
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
      {/* Filled before first paint by prefilterScript, emptied once React has filtered. */}
      <style
        ref={prefilter}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: "" }}
      />
      <InlineScript html={prefilterScript} />
      <div id="components" className="results" tabIndex={-1} ref={results}>
        {groups.map((group) => {
          const members = items.filter((item) => item.category === group)
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
              <p className="section-description">
                {categoryDefinitions[group]}
              </p>
              <div className="gallery-grid">
                {members.map((item) => (
                  <ComponentCard key={item.name} item={item} />
                ))}
              </div>
            </section>
          )
        })}
        {items.length === 0 && (
          <div className="empty">
            <h2>
              No “{query}” in {where}.
            </h2>
            <p>
              {everywhere > 0
                ? `${everywhere} ${plural(everywhere)} match in other categories.`
                : "Try another name or tag, or browse the full collection."}
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
      <InlineScript html={prefilterCountsScript} />
    </>
  )
}
