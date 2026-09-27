"use client"

import {
  createContext,
  Suspense,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { CopyButton } from "./code-block"

// Bench state in the address bar, shared by the motion benches (qa-bench-motion.tsx) and the
// controlled-illustration benches (BenchParams below). URLs are built from usePathname() and
// useSearchParams(), never from window.location during render: after a client navigation the
// router's values belong to the page being rendered, while window.location may still hold the
// previous item's address.

type Query = { toString(): string }

/** `pathname` plus `query`, with each key in `set` replaced (a null value removes the key). */
export function stateHref(
  pathname: string,
  query: Query,
  set: Record<string, string | null>
) {
  const next = new URLSearchParams(query.toString())
  for (const [key, value] of Object.entries(set))
    if (value === null) next.delete(key)
    else next.set(key, value)
  const search = next.toString()
  return `${pathname}${search ? `?${search}` : ""}`
}

/**
 * Mirrors `href` into the address bar with history.replaceState once it settles: debounced (Safari
 * throttles rapid history updates) and not while `paused`. A write only lands on the page that
 * rendered it: the pending timer is cleared on unmount, and a timer that fires after a navigation
 * finds another pathname and does nothing. Next.js syncs replaceState into useSearchParams.
 */
export function useMirrorUrl(href: string, pathname: string, paused = false) {
  useEffect(() => {
    if (paused) return
    const timer = setTimeout(() => {
      const { pathname: current, search, hash } = window.location
      if (current !== pathname || current + search === href) return
      try {
        window.history.replaceState(null, "", href + hash)
      } catch {
        // History updates can be refused (throttled or sandboxed); the bench still works.
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [href, pathname, paused])
}

/** "Copy link" for a bench state: the absolute URL is resolved when the button is pressed. */
export function CopyBenchLink({ href }: { href: string }) {
  return (
    <div className="bench-link">
      <CopyButton
        text={() => new URL(href, window.location.origin).href}
        label="Copy link to this bench state"
        copied="Link to this bench state copied"
      >
        Copy link
      </CopyButton>
    </div>
  )
}

type Store = {
  get(key: string): string | null
  set(key: string, value: string | null): void
}

const BenchParamsContext = createContext<Store | null>(null)

function BenchParamsFromUrl({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const query = useSearchParams()
  // Keys the reader changed on this page; everything else reads through to the URL.
  const [changed, setChanged] = useState<Record<string, string | null>>({})
  const href = stateHref(pathname, query, changed)
  useMirrorUrl(href, pathname)
  const store: Store = {
    get: (key) => (key in changed ? changed[key] : query.get(key)),
    set: (key, value) => setChanged((prev) => ({ ...prev, [key]: value })),
  }
  return (
    <BenchParamsContext.Provider value={store}>
      <div className="bench-toolbar">
        <CopyBenchLink href={href} />
      </div>
      {children}
    </BenchParamsContext.Provider>
  )
}

/**
 * URL state for a controlled illustration's /c/<name> bench: each control registered with
 * useBenchParam reads its value from the query (?open=0.5&pose=pinch), writes it back with
 * replaceState, and the toolbar's Copy link shares it. Defaults are left out of the URL.
 *
 * The page is prerendered, where the query is unknown, so the server HTML is the fallback: the
 * same toolbar and demo at their defaults, which the client replaces with the URL's values before
 * the first interaction. Index cards render the demos without this provider and keep local state.
 */
export function BenchParams({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <>
          <div className="bench-toolbar">
            <CopyBenchLink href="" />
          </div>
          {children}
        </>
      }
    >
      <BenchParamsFromUrl>{children}</BenchParamsFromUrl>
    </Suspense>
  )
}

type Codec<T> = {
  parse(text: string): T | undefined
  format(value: T): string
  equal(a: T, b: T): boolean
}

function codecFor<T extends number | boolean | string>(
  initial: T,
  allowed?: readonly T[]
): Codec<T> {
  if (typeof initial === "number")
    return {
      parse: (text) => {
        const n = Number(text)
        return (text.trim() !== "" && Number.isFinite(n) ? n : undefined) as
          T | undefined
      },
      // Two decimals cover every 0.01 slider step; whole-number ranges stay whole.
      format: (value) => String(Math.round((value as number) * 100) / 100),
      equal: (a, b) => Math.abs((a as number) - (b as number)) < 0.005,
    }
  if (typeof initial === "boolean")
    return {
      parse: (text) =>
        (text === "1" ? true : text === "0" ? false : undefined) as
          T | undefined,
      format: (value) => (value ? "1" : "0"),
      equal: (a, b) => a === b,
    }
  return {
    parse: (text) =>
      (!allowed || allowed.includes(text as T) ? text : undefined) as
        T | undefined,
    format: (value) => String(value),
    equal: (a, b) => a === b,
  }
}

/**
 * useState for one control, mirrored to `?<key>=` on a /c/<name> bench (plain local state on index
 * cards). Numbers are written with two decimals and booleans as 1/0; a value outside `allowed` is
 * ignored and a number outside `clamp` falls back to the nearest bound.
 */
type ParamOptions<T> = {
  allowed?: readonly T[]
  clamp?: readonly [number, number]
}
export function useBenchParam(
  key: string,
  initial: number,
  options?: ParamOptions<number>
): [number, (value: number) => void]
export function useBenchParam(
  key: string,
  initial: boolean
): [boolean, (value: boolean) => void]
export function useBenchParam<T extends string>(
  key: string,
  initial: T,
  options: ParamOptions<T>
): [T, (value: T) => void]
export function useBenchParam<T extends number | boolean | string>(
  key: string,
  initial: T,
  options: ParamOptions<T> = {}
): [T, (value: T) => void] {
  const store = useContext(BenchParamsContext)
  const [local, setLocal] = useState(initial)
  if (!store) return [local, setLocal]
  const codec = codecFor(initial, options.allowed)
  const text = store.get(key)
  let value = text === null ? undefined : codec.parse(text)
  if (
    value !== undefined &&
    options.allowed &&
    !options.allowed.includes(value)
  )
    value = undefined
  if (typeof value === "number" && options.clamp)
    value = Math.min(options.clamp[1], Math.max(options.clamp[0], value)) as T
  return [
    value ?? initial,
    (next: T) =>
      store.set(key, codec.equal(next, initial) ? null : codec.format(next)),
  ]
}
