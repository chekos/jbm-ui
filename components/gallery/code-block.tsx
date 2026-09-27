"use client"

import { useEffect, useRef, useState } from "react"

// Copyable code for the gallery: every usage snippet on the index and on /c/<name> renders
// through CodeBlock, and the install surfaces reuse CopyButton. Code soft-wraps instead of
// scrolling sideways; a wrapped line hangs two characters past its own indentation so nested
// JSX stays readable at phone widths.

export function CopyButton({
  text,
  label,
  children,
  copied,
}: {
  /** The text to copy, or a function that returns it when the button is pressed. */
  text: string | (() => string)
  /** Accessible name; it must contain the visible label (WCAG 2.5.3). */
  label: string
  children: string
  /** Announced through the polite status after a successful copy, then cleared. */
  copied: string
}) {
  const [status, setStatus] = useState("")
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  async function copy() {
    clearTimeout(timer.current)
    try {
      await navigator.clipboard.writeText(
        typeof text === "function" ? text() : text
      )
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

/** One block per source line, carrying its indentation so a soft-wrapped line can hang under it. */
export function CodeLines({ code }: { code: string }) {
  return code.split("\n").map((line, index) => {
    const indent = /^[ \t]*/.exec(line)?.[0].replace(/\t/g, "  ").length ?? 0
    return (
      <span
        className="code-line"
        key={index}
        style={{ "--indent": `${indent}ch` } as React.CSSProperties}
      >
        {line}
      </span>
    )
  })
}

/**
 * A usage snippet with a Copy button. `title` names what the code shows ("Folder", or an
 * example's own caption); the button reads "Copy" and is announced as "Copy <title> example".
 */
export function CodeBlock({ code, title }: { code: string; title: string }) {
  return (
    <div className="code-block">
      <div className="code-block-actions">
        <CopyButton text={code} label={`Copy ${title} example`} copied="Copied">
          Copy
        </CopyButton>
      </div>
      <pre>
        <code>
          <CodeLines code={code} />
        </code>
      </pre>
    </div>
  )
}
