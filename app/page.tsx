import { Gallery } from "@/components/gallery/gallery"
import Link from "next/link"
import registry from "@/registry.json"

const itemCount = registry.items.length

export default function Page() {
  return (
    <main className="site-shell" id="main" tabIndex={-1}>
      <header className="site-header">
        <h1 className="wordmark" aria-label="jbm-ui">
          jbm<span aria-hidden="true">—</span>ui
        </h1>
        <p className="site-purpose">
          Cut-paper primitives and motion blocks for tacosdedatos explainers.
        </p>
        <p className="site-count">{itemCount} registry items</p>
        <p>
          <Link href="/icons">Explore the icon studio →</Link>
        </p>
      </header>
      <Gallery />
      <footer>
        <p>Made for tacosdedatos. Built to be used again.</p>
        <nav aria-label="Machine-readable catalogs">
          For agents: <a href="/llms.txt">llms.txt</a> ·{" "}
          <a href="/catalog.json">catalog.json</a> ·{" "}
          <a href="/r/registry.json">registry.json</a>
        </nav>
      </footer>
    </main>
  )
}
