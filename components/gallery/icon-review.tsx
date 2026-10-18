"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { renderToStaticMarkup } from "react-dom/server"
import {
  JbmIcon,
  type IconName,
  type IconTreatment,
} from "@/registry/jbm/ui/icons"
import { color } from "@/registry/jbm/lib/tokens"
import {
  decisions,
  emptyReview,
  parseReview,
  reviewNames,
  reviewPacket,
  REVIEW_VERSION,
  type Decision,
  type Review,
} from "@/lib/icon-review"
import styles from "./icon-review.module.css"

function download(text: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function IconReview() {
  const [review, setReview] = useState<Review>(emptyReview)
  const [ready, setReady] = useState(false)
  const [saved, setSaved] = useState("Loading saved notes…")
  const [notice, setNotice] = useState("")
  const [treatment, setTreatment] = useState<IconTreatment>("outline")
  const [surface, setSurface] = useState("cream")
  const [size, setSize] = useState(24)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<IconName>("folder")
  useEffect(() => {
    // Restore only after hydration; persistence happens in user event handlers, never on mount.
    try {
      const raw = localStorage.getItem(REVIEW_VERSION)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronizes browser-only storage after hydration
      if (raw) setReview(parseReview(raw))
      setSaved(
        raw
          ? "Restored notes from this browser"
          : "Notes save in this browser only"
      )
    } catch {
      setSaved(
        "Saved notes could not be loaded. Export your feedback before leaving."
      )
    }
    setReady(true)
  }, [])
  function update(next: Review) {
    setReview(next)
    setNotice("")
    try {
      localStorage.setItem(
        REVIEW_VERSION,
        JSON.stringify({ version: REVIEW_VERSION, review: next })
      )
      setSaved("Saved in this browser · not sent")
    } catch {
      setSaved("Browser storage unavailable. Download feedback before leaving.")
    }
  }
  const dark = surface === "ink"
  const ink = dark ? color.bg : color.ink
  const paper = color.accent
  const packet = reviewPacket(review)
  const filtered = reviewNames.filter((name) =>
    name.includes(query.toLowerCase().trim())
  )
  const reviewed = reviewNames.filter(
    (name) => review.icons[name].decision !== "Unreviewed"
  ).length
  const icon = (name: IconName, px = size, variant = treatment) => (
    <JbmIcon
      name={name}
      size={px}
      treatment={variant}
      color={ink}
      paperColor={paper}
    />
  )

  return (
    <main id="main" tabIndex={-1} className={styles.studio}>
      <header className={styles.header}>
        <Link href="/" aria-label="JBM gallery" className={styles.brand}>
          jbm—ui
        </Link>
        <span>ICON STUDIO / PILOT 01</span>
        <a href="#feedback">
          Your feedback <span aria-hidden="true">↗</span>
        </a>
      </header>
      <section className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>SMALL MARKS. OUR OWN HAND.</p>
          <h1>
            A little language
            <br />
            for the things we do.
          </h1>
          <p>
            Twelve icons for making, learning, and moving things forward. Try
            them small. See them in use. Tell us what belongs.
          </p>
        </div>
        <div
          className={styles.hero}
          aria-label="Folder, notebook and agent icon specimens"
        >
          <JbmIcon
            name="folder"
            size={88}
            treatment="paper"
            paperColor={color.accent}
          />
          <JbmIcon name="notebook" size={72} />
          <JbmIcon name="agent" size={64} />
        </div>
      </section>
      <section aria-labelledby="compare-title" className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>01 / DIRECTION</span>
          <h2 id="compare-title">One geometry. Two treatments.</h2>
        </div>
        <div className={styles.directions}>
          {(["outline", "paper"] as const).map((variant) => (
            <button
              key={variant}
              className={styles.direction}
              aria-pressed={treatment === variant}
              onClick={() => setTreatment(variant)}
            >
              <span className={styles.directionIcons}>
                {(["folder", "notebook", "dataset", "agent"] as const).map(
                  (name) => (
                    <JbmIcon
                      key={name}
                      name={name}
                      size={40}
                      treatment={variant}
                      paperColor={color.accent}
                    />
                  )
                )}
              </span>
              <strong>
                {variant === "outline" ? "A — Outline" : "B — Paper"}
              </strong>
              <span>
                {variant === "outline"
                  ? "Quiet, transparent, at home beside text. My starting recommendation."
                  : "Flat color inside enclosed shapes. A little more illustration in the interface."}
              </span>
            </button>
          ))}
        </div>
        <p className={styles.hint}>
          Open marks such as arrows and checks stay the same. Selecting a
          preview does not record a preference; choose that below.
        </p>
      </section>
      <section aria-labelledby="set-title" className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>02 / THE SET</span>
          <h2 id="set-title">Look close. Then look small.</h2>
        </div>
        <div className={styles.toolbar}>
          <label>
            Find an icon
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="folder, code, agent…"
            />
          </label>
          <label>
            Size
            <select
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            >
              {[16, 20, 24, 32, 48].map((px) => (
                <option key={px} value={px}>
                  {px} px
                </option>
              ))}
            </select>
          </label>
          <label>
            Surface
            <select
              value={surface}
              onChange={(event) => setSurface(event.target.value)}
            >
              <option value="cream">Cream</option>
              <option value="ink">Ink</option>
            </select>
          </label>
        </div>
        <div
          className={styles.grid}
          data-surface={surface}
          style={{ color: ink, background: dark ? color.ink : color.card }}
        >
          {filtered.map((name) => (
            <button
              key={name}
              className={styles.tile}
              aria-pressed={selected === name}
              onClick={() => setSelected(name)}
            >
              <span>{icon(name)}</span>
              <span>{name}</span>
            </button>
          ))}
          {!filtered.length && (
            <p className={styles.empty}>No matching icons. Try another name.</p>
          )}
        </div>
        <div className={styles.inspector}>
          <div className={styles.enlarged}>
            {
              <JbmIcon
                name={selected}
                size={112}
                treatment={treatment}
                paperColor={color.accent}
              />
            }
          </div>
          <div>
            <p className={styles.eyebrow}>SELECTED / {selected}</p>
            <div className={styles.sizeRow}>
              {[16, 20, 24, 32].map((px) => (
                <div key={px}>
                  <JbmIcon
                    name={selected}
                    size={px}
                    treatment={treatment}
                    paperColor={color.accent}
                  />
                  <span>{px}</span>
                </div>
              ))}
            </div>
            <button
              className={styles.action}
              onClick={() =>
                download(
                  renderToStaticMarkup(
                    <JbmIcon
                      name={selected}
                      size={size}
                      color={ink}
                      treatment={treatment}
                      paperColor={paper}
                      label={selected}
                    />
                  ),
                  `jbm-${selected}-${treatment}.svg`,
                  "image/svg+xml"
                )
              }
            >
              Download {selected} SVG <span aria-hidden="true">↓</span>
            </button>
          </div>
          <div className={styles.context}>
            <span className={styles.eyebrow}>IN CONTEXT / SIZE 20</span>
            <span className={styles.mockButton}>
              <JbmIcon name="play" size={20} /> Start lesson
            </span>
            <span className={styles.mockRow}>
              <JbmIcon
                name="folder"
                size={20}
                treatment={treatment}
                paperColor={color.accent}
              />{" "}
              Research notes <JbmIcon name="arrow-right" size={20} />
            </span>
            <span className={styles.mockRow}>
              <JbmIcon name="check" size={20} /> Changes saved
            </span>
          </div>
        </div>
      </section>
      <section
        id="feedback"
        aria-labelledby="feedback-title"
        className={styles.section}
      >
        <div className={styles.sectionTitle}>
          <span>03 / ONE FEEDBACK ROUND</span>
          <h2 id="feedback-title">
            Give me the direction.
            <br />
            I’ll handle the details.
          </h2>
        </div>
        <p>
          Choose an overall direction, flag any icons that need work, and add
          what you want next. Leave anything you have no opinion on untouched.
          Copy or download the packet and send it in our chat.
        </p>
        <p role="status" className={styles.hint}>
          {saved}
        </p>
        <fieldset disabled={!ready} className={styles.feedbackFields}>
          <legend className={styles.srOnly}>Icon review</legend>
          <div className={styles.preferences}>
            {(
              [
                [
                  "direction",
                  "Overall direction",
                  [
                    "Undecided",
                    "A — Outline",
                    "B — Paper",
                    "Outline for controls, paper for features",
                    "Neither — see notes",
                  ],
                ],
                [
                  "weight",
                  "Stroke weight",
                  ["Undecided", "Keep this weight", "Lighter", "Heavier"],
                ],
                [
                  "personality",
                  "Personality",
                  [
                    "Undecided",
                    "Keep this balance",
                    "More character",
                    "More restrained",
                  ],
                ],
              ] as const
            ).map(([key, title, options]) => (
              <label key={key}>
                {title}
                <select
                  value={review[key]}
                  onChange={(event) =>
                    update({ ...review, [key]: event.target.value })
                  }
                >
                  {options.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <div className={styles.reviewList}>
            {reviewNames.map((name, i) => (
              <div className={styles.reviewRow} key={name}>
                <div className={styles.reviewName}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <JbmIcon name={name} size={24} />
                  <strong>{name}</strong>
                </div>
                <label>
                  <span className={styles.srOnly}>Decision for {name}</span>
                  <select
                    value={review.icons[name].decision}
                    onChange={(event) =>
                      update({
                        ...review,
                        icons: {
                          ...review.icons,
                          [name]: {
                            ...review.icons[name],
                            decision: event.target.value as Decision,
                          },
                        },
                      })
                    }
                  >
                    {decisions.map((decision) => (
                      <option key={decision}>{decision}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={styles.srOnly}>Notes for {name}</span>
                  <input
                    value={review.icons[name].note}
                    onChange={(event) =>
                      update({
                        ...review,
                        icons: {
                          ...review.icons,
                          [name]: {
                            ...review.icons[name],
                            note: event.target.value,
                          },
                        },
                      })
                    }
                    placeholder="What should change? (optional)"
                  />
                </label>
              </div>
            ))}
          </div>
          <div className={styles.textFields}>
            {(
              [
                [
                  "useCases",
                  "Where should these go first?",
                  "A product, page, workflow, or kind of content…",
                ],
                [
                  "missing",
                  "What icons are missing?",
                  "The things you reach for most…",
                ],
                [
                  "notes",
                  "Anything else to guide the next pass?",
                  "Favorites, references, shapes to avoid, or a different direction…",
                ],
              ] as const
            ).map(([key, title, placeholder]) => (
              <label key={key}>
                {title}
                <textarea
                  rows={3}
                  value={review[key]}
                  placeholder={placeholder}
                  onChange={(event) =>
                    update({ ...review, [key]: event.target.value })
                  }
                />
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.exportBar}>
          <p>{reviewed} / 12 reviewed · Unreviewed does not mean approved.</p>
          <div>
            <button
              disabled={!ready}
              className={styles.primary}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(packet)
                  setNotice("Copied. Paste the packet in our chat.")
                } catch {
                  setNotice(
                    "Clipboard unavailable. Download the packet or select the text below."
                  )
                }
              }}
            >
              Copy feedback
            </button>
            <button
              disabled={!ready}
              className={styles.action}
              onClick={() =>
                download(packet, "jbm-icons-feedback.md", "text/markdown")
              }
            >
              Download feedback
            </button>
          </div>
        </div>
        <p role="status">{notice}</p>
        <details className={styles.packet}>
          <summary>Read your feedback packet</summary>
          <textarea
            aria-label="Feedback packet"
            readOnly
            value={packet}
            rows={18}
          />
        </details>
      </section>
      <footer className={styles.footer}>
        <span>Built to be used again.</span>
        <Link href="/c/icons">Component API & installation →</Link>
      </footer>
    </main>
  )
}
