"use client"

import { useState, useSyncExternalStore } from "react"
import { registryUrlTemplate, siteOrigin } from "@/lib/site"
import { CodeLines, CopyButton } from "./code-block"
import { addCommand } from "./item-meta"

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
        <div className="code-block install-once-code">
          <div className="code-block-actions">
            <CopyButton
              text={entry}
              label="Copy @jbm entry for the components.json registries"
              copied="Copied"
            >
              Copy @jbm entry
            </CopyButton>
          </div>
          <pre>
            <code>
              <CodeLines code={`{\n  "registries": {\n    ${entry}\n  }\n}`} />
            </code>
          </pre>
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
