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
// would otherwise push the catalog ~750px down. The reader's own toggle wins and is
// remembered across visits (a returning reader who collapsed it once has installed).
const narrowQuery = "(max-width: 760px)"
const storageKey = "jbm:install-once"

// Storage can throw (private windows, blocked site data); the default then applies.
function readStored(): boolean | null {
  try {
    const value = window.localStorage.getItem(storageKey)
    return value === "open" ? true : value === "closed" ? false : null
  } catch {
    return null
  }
}
function writeStored(open: boolean) {
  try {
    window.localStorage.setItem(storageKey, open ? "open" : "closed")
  } catch {
    // Not remembered; this visit still honours the toggle.
  }
}
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
  const stored = useSyncExternalStore(noop, readStored, () => null)
  const [toggled, setToggled] = useState<boolean | null>(null)
  const open = toggled ?? stored ?? !narrow
  // Only the reader's own toggles count: React changing the `open` prop also fires
  // `toggle`, but then the element already matches the computed state. Before hydration
  // settles, `open` still holds the server default, so a toggle from the pre-paint script
  // must not be mistaken for the reader's.
  const onToggle = (next: boolean) => {
    if (!hydrated || next === open) return
    setToggled(next)
    writeStored(next)
  }
  return { open, hydrated, onToggle }
}

// The prerendered HTML cannot know the reader's stored choice or screen width, so this runs
// while the HTML is parsed, right after the <details>, and applies the same rule as
// useInstallOpen (stored choice, else closed on phones) before first paint. data-prepaint tells
// the phone CSS the state is already right, so the body is not held back until hydration.
const prepaintScript = `(function(s){var d=s&&s.previousElementSibling;if(!d||d.tagName!=="DETAILS")return;var v=null;try{v=localStorage.getItem(${JSON.stringify(
  storageKey
)})}catch(e){}d.open=v==="open"?true:v==="closed"?false:!matchMedia(${JSON.stringify(
  narrowQuery
)}).matches;d.setAttribute("data-prepaint","")})(document.currentScript)`

/**
 * Parser-blocking inline script in the server HTML only: a script React creates on the client
 * never runs, so client renders emit an inert text/plain copy (same as the bench's host script).
 */
function PrepaintScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: prepaintScript }}
    />
  )
}

export function InstallOnce() {
  const { open, hydrated, onToggle } = useInstallOpen()
  const url = registryUrlTemplate(useOrigin())
  const entry = `"@jbm": "${url}"`
  return (
    <>
      <details
        className="install-once"
        open={open}
        data-hydrated={hydrated || undefined}
        onToggle={(event) => onToggle(event.currentTarget.open)}
        // The pre-paint script may have changed `open` and added data-prepaint.
        suppressHydrationWarning
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
                <CodeLines
                  code={`{\n  "registries": {\n    ${entry}\n  }\n}`}
                />
              </code>
            </pre>
          </div>
        </div>
      </details>
      <PrepaintScript />
    </>
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
