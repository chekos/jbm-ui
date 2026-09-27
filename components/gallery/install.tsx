"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { registryUrlTemplate, siteOrigin } from "@/lib/site"
import { addCommand } from "./item-meta"

export { addCommand, needsRemotion, registryDependencies } from "./item-meta"

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
const canonicalOrigin = siteOrigin()

// The server renders the canonical origin; after hydration a preview deploy or
// local dev server swaps in its own origin so the copied entry works there.
function useOrigin() {
  return useSyncExternalStore(
    noop,
    () => window.location.origin,
    () => canonicalOrigin
  )
}

// Install once is a disclosure: open on wide screens, closed on phones where it
// would otherwise push the catalog ~750px down. The reader's own toggle wins.
const narrowQuery = "(max-width: 760px)"
function subscribeNarrow(onChange: () => void) {
  const list = window.matchMedia(narrowQuery)
  list.addEventListener("change", onChange)
  return () => list.removeEventListener("change", onChange)
}

function useInstallOpen() {
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(narrowQuery).matches,
    () => false
  )
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
  const [toggled, setToggled] = useState<boolean | null>(null)
  return { open: toggled ?? !narrow, hydrated, setToggled }
}

export function InstallOnce() {
  const { open, hydrated, setToggled } = useInstallOpen()
  const url = registryUrlTemplate(useOrigin())
  const entry = `"@jbm": "${url}"`
  return (
    <details
      className="install-once"
      open={open}
      data-hydrated={hydrated || undefined}
      onToggle={(event) => setToggled(event.currentTarget.open)}
    >
      <summary>
        <h2>Install once</h2>
      </summary>
      <div className="install-once-body">
        <div className="install-once-copy">
          <p>
            Add the <code>@jbm</code> entry inside <code>registries</code> in
            your project’s <code>components.json</code>, keeping any entries
            already there. After that, every card’s{" "}
            <code>npx shadcn@latest add</code> command works.
          </p>
          <p>
            Files install to <code>src/jbm/</code>. Import them as{" "}
            <code>@/jbm/…</code>, which needs the <code>@/*</code> →{" "}
            <code>./src/*</code> path alias in <code>tsconfig.json</code>.
          </p>
        </div>
        <div className="install-once-code">
          <pre tabIndex={0}>
            <code>{`{\n  "registries": {\n    ${entry}\n  }\n}`}</code>
          </pre>
          <CopyButton
            text={entry}
            label="Copy the @jbm registries entry"
            copied="Copied the @jbm registries entry."
          >
            Copy @jbm entry
          </CopyButton>
        </div>
      </div>
    </details>
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
