"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

type Sibling = { name: string; title: string; player: boolean }

type PagerProps = {
  category: string
  previous: Sibling
  next: Sibling
  position: number
  count: number
  /** True when this page's bench is a Player bench (the only kind with a strip view). */
  player: boolean
}

function PagerLinks({
  category,
  previous,
  next,
  position,
  count,
  strip,
}: PagerProps & { strip: boolean }) {
  // Only the view carries over, and only between Player benches: frame, orientation, and scene
  // options describe one item's timeline, so each item opens at its own defaults.
  const href = (sibling: Sibling) =>
    `/c/${sibling.name}${strip && sibling.player ? "?view=strip" : ""}`
  return (
    <nav className="item-pager" aria-label={`Items in ${category}`}>
      <Link
        href={href(previous)}
        aria-label={`Previous in ${category}: ${previous.title}`}
      >
        <span aria-hidden="true">←</span> {previous.title}
      </Link>
      <span className="item-pager-count">
        {position} of {count}
      </span>
      <Link
        href={href(next)}
        aria-label={`Next in ${category}: ${next.title}`}
      >
        {next.title} <span aria-hidden="true">→</span>
      </Link>
    </nav>
  )
}

function PagerFromUrl(props: PagerProps) {
  const query = useSearchParams()
  return (
    <PagerLinks {...props} strip={props.player && query.get("view") === "strip"} />
  )
}

/**
 * Previous / next item in the category. A QA pass in the strip view stays in the strip view; the
 * prerendered HTML links each item's default view until the query is read on the client.
 */
export function ItemPager(props: PagerProps) {
  return (
    <Suspense fallback={<PagerLinks {...props} strip={false} />}>
      <PagerFromUrl {...props} />
    </Suspense>
  )
}
