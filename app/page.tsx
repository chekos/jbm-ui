import { Gallery } from "@/components/gallery/gallery"
import Link from "next/link"

export default function Page() {
  return (
    <main className="site-shell" id="main">
      <header className="site-header">
        <Link className="wordmark" href="/">
          jbm<span>—</span>ui
        </Link>
        <a href="https://github.com/chekos/jbm-ui">GitHub ↗</a>
      </header>
      <section className="intro">
        <p className="eyebrow">The tacosdedatos component collection</p>
        <h1>
          Small pieces.
          <br />
          <span>Clearer stories.</span>
        </h1>
        <p className="intro-copy">
          A shared visual language for the web and video. Browse the primitives,
          play with motion, and bring the source into your next project.
        </p>
        <div className="intro-meta">
          <span>React + Remotion</span>
          <span>Copy into your project</span>
          <span>Cream, ink & vermilion</span>
        </div>
      </section>
      <Gallery />
      <footer>
        Made for tacosdedatos. Built to be used again.
        <a href="/r/registry.json">Explore the registry ↗</a>
      </footer>
    </main>
  )
}
