import { Gallery } from "@/components/gallery/gallery"
import registry from "@/registry.json"

const itemCount = registry.items.length

export default function Page() {
  return (
    <main className="site-shell" id="main">
      <header className="site-header">
        <h1 className="wordmark" aria-label="jbm-ui">
          jbm<span aria-hidden="true">—</span>ui
        </h1>
        <p className="site-purpose">
          Cut-paper primitives and motion blocks for tacosdedatos explainers.
        </p>
        <p className="site-count">{itemCount} registry items</p>
        <a className="site-source" href="https://github.com/chekos/jbm-ui">
          GitHub ↗
        </a>
      </header>
      <Gallery />
      <footer>
        Made for tacosdedatos. Built to be used again.
        <a href="/r/registry.json">Registry index (JSON) ↗</a>
      </footer>
    </main>
  )
}
