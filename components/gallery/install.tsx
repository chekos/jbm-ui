"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import registry from "@/registry.json"

type RegistryItem = {
  name: string
  dependencies?: string[]
  registryDependencies?: string[]
}

const items = new Map<string, RegistryItem>(
  (registry.items as RegistryItem[]).map((item) => [item.name, item])
)

/** True when the item, or anything it installs, depends on Remotion. */
export function needsRemotion(name: string, seen = new Set<string>()): boolean {
  if (seen.has(name)) return false
  seen.add(name)
  const item = items.get(name)
  if (!item) return false
  if (item.dependencies?.includes("remotion")) return true
  return (item.registryDependencies ?? []).some((dependency) =>
    needsRemotion(dependency.replace(/^@jbm\//, ""), seen)
  )
}

export function registryDependencies(name: string): string[] {
  return items.get(name)?.registryDependencies ?? []
}

export function addCommand(name: string) {
  return `npx shadcn@latest add @jbm/${name}`
}

function CopyButton({
  text,
  label,
  children,
  copied,
}: {
  text: string
  label: string
  children: string
  copied: string
}) {
  const [status, setStatus] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  async function copy() {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(text)
      setStatus(copied)
      timer.current = setTimeout(() => setStatus(""), 4000)
    } catch {
      setStatus("Clipboard unavailable. Select the text and copy it.")
    }
  }
  return (
    <>
      <button
        type="button"
        className="copy-button"
        aria-label={label}
        onClick={copy}
      >
        {children}
      </button>
      <span className="copy-status" role="status" aria-live="polite">
        {status}
      </span>
    </>
  )
}

const noop = () => () => {}

function useOrigin() {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => ""
  )
}

export function InstallOnce() {
  const origin = useOrigin()
  const url = `${origin || "https://<this-site>"}/r/{name}.json`
  const entry = `"@jbm": "${url}"`
  return (
    <section className="install-once" aria-labelledby="install-once-heading">
      <div className="install-once-copy">
        <h2 id="install-once-heading">Install once</h2>
        <p>
          Add the <code>@jbm</code> entry inside <code>registries</code> in your
          project’s <code>components.json</code>, keeping any entries already
          there. After that, every card’s <code>npx shadcn@latest add</code>{" "}
          command works.
        </p>
        <p>
          Files install to <code>src/jbm/</code>. Import them as{" "}
          <code>@/jbm/…</code>, which needs the <code>@/*</code> →{" "}
          <code>./src/*</code> path alias in <code>tsconfig.json</code>.
        </p>
      </div>
      <div className="install-once-code">
        <pre>
          <code>{`{\n  "registries": {\n    ${entry}\n  }\n}`}</code>
        </pre>
        <div className="copy-row">
          <CopyButton
            text={entry}
            label="Copy the @jbm registries entry"
            copied="Copied the @jbm registries entry."
          >
            Copy @jbm entry
          </CopyButton>
        </div>
      </div>
    </section>
  )
}

export function AddCommand({ name }: { name: string }) {
  const command = addCommand(name)
  return (
    <div className="add-command">
      <code>{command}</code>
      <CopyButton
        text={command}
        label={`Copy install command for @jbm/${name}`}
        copied={`Copied install command for @jbm/${name}.`}
      >
        Copy
      </CopyButton>
    </div>
  )
}
