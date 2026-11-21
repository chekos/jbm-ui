"use client"

import { createLocalStorage } from "@ui-sdk/core"
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from "@ui-sdk/react/collapsible"
import { Toggle, ToggleGroup } from "@ui-sdk/react/toggle"
import { GallerySelect } from "./controls"
import { Textarea } from "@ui-sdk/react/textarea"
import { Input } from "@ui-sdk/react/input"
import { Button } from "@ui-sdk/react/button"
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
  type Review,
} from "@/lib/icon-review"
import styles from "./icon-review.module.css"

const reviewStorage = createLocalStorage(REVIEW_VERSION)

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
  const [selected, setSelected] = useState<IconName>("search")
  useEffect(() => {
    // Restore only after hydration; persistence happens in user event handlers, never on mount.
    try {
      if (!reviewStorage.available())
        throw new Error("Browser storage unavailable")
      const raw = reviewStorage.get()
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
    const written = reviewStorage.set(
      JSON.stringify({ version: REVIEW_VERSION, review: next })
    )
    setSaved(
      written
        ? "Saved in this browser · not sent"
        : "Browser storage unavailable. Download feedback before leaving."
    )
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
        <span>ICON STUDIO / REVISION 02</span>
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
          <JbmIcon name="folder" size={88} />
          <JbmIcon name="notebook" size={72} />
          <JbmIcon name="agent" size={64} />
        </div>
      </section>
      <section aria-labelledby="compare-title" className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>01 / DIRECTION</span>
          <h2 id="compare-title">More presence. A little more play.</h2>
        </div>
        <div className={styles.directions}>
          <div className={styles.direction}>
            <span className={styles.directionIcons}>
              {[24, 64].map((px) => (
                <svg
                  key={px}
                  width={px}
                  height={px}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label={`Previous search at ${px} pixels`}
                >
                  <path d="M17 10A7 7 0 1 1 3 10A7 7 0 1 1 17 10Z" />
                  <path d="M15 15L21 21" />
                </svg>
              ))}
            </span>
            <strong>Before — v1</strong>
            <span>
              Original search: 2-unit outline, smaller lens, longer handle.
            </span>
          </div>
          <div className={styles.direction}>
            <span className={styles.directionIcons}>
              {[24, 64].map((px) => (
                <JbmIcon
                  key={px}
                  name="search"
                  size={px}
                  label={`Revised search at ${px} pixels`}
                />
              ))}
            </span>
            <strong>After — v2</strong>
            <span>
              A 25% heavier outline across the set. Search gets a larger lens
              and a shorter handle.
            </span>
          </div>
        </div>
        <p className={styles.hint}>
          Outline is the chosen direction. Folder, notebook, and chart keep
          their approved silhouettes with the new weight. Other silhouettes are
          unchanged and remain unreviewed. Earlier notes stay saved separately;
          this form reviews v2.
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
            <Input
              type="search"
              value={query}
              onValueChange={(value) => setQuery(value)}
              placeholder="folder, code, agent…"
            />
          </label>
          <label>
            Treatment
            <GallerySelect
              label="Treatment"
              value={treatment}
              onValueChange={setTreatment}
              options={[
                { value: "outline", label: "Outline" },
                { value: "paper", label: "Paper" },
              ]}
            />
          </label>
          <label>
            Size
            <GallerySelect
              label="Size"
              value={size}
              onValueChange={setSize}
              options={[16, 20, 24, 32, 48].map((px) => ({
                value: px,
                label: `${px} px`,
              }))}
            />
          </label>
          <label>
            Surface
            <GallerySelect
              label="Surface"
              value={surface}
              onValueChange={setSurface}
              options={[
                { value: "cream", label: "Cream" },
                { value: "ink", label: "Ink" },
              ]}
            />
          </label>
        </div>
        <ToggleGroup
          value={[selected]}
          aria-label="Inspect icon"
          onValueChange={([next]) => {
            if (next) setSelected(next)
          }}
          className={styles.grid}
          data-surface={surface}
          style={{ color: ink, background: dark ? color.ink : color.card }}
        >
          {filtered.map((name) => (
            <Toggle key={name} className={styles.tile} value={name}>
              <span>{icon(name)}</span>
              <span>{name}</span>
            </Toggle>
          ))}
          {!filtered.length && (
            <p className={styles.empty}>No matching icons. Try another name.</p>
          )}
        </ToggleGroup>
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
            <Button
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
            </Button>
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
                <GallerySelect
                  label={title}
                  value={review[key]}
                  onValueChange={(next) => update({ ...review, [key]: next })}
                  options={options.map((option) => ({
                    value: option,
                    label: option,
                  }))}
                />
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
                  <GallerySelect
                    label={`${name} decision`}
                    value={review.icons[name].decision}
                    onValueChange={(next) =>
                      update({
                        ...review,
                        icons: {
                          ...review.icons,
                          [name]: {
                            ...review.icons[name],
                            decision: next,
                          },
                        },
                      })
                    }
                    options={decisions.map((decision) => ({
                      value: decision,
                      label: decision,
                    }))}
                  />
                </label>
                <label>
                  <span className={styles.srOnly}>Notes for {name}</span>
                  <Input
                    value={review.icons[name].note}
                    onValueChange={(value) =>
                      update({
                        ...review,
                        icons: {
                          ...review.icons,
                          [name]: {
                            ...review.icons[name],
                            note: value,
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
                <Textarea
                  rows={3}
                  value={review[key]}
                  placeholder={placeholder}
                  onValueChange={(value) => update({ ...review, [key]: value })}
                />
              </label>
            ))}
          </div>
        </fieldset>
        <div className={styles.exportBar}>
          <p>{reviewed} / 12 reviewed · Unreviewed does not mean approved.</p>
          <div>
            <Button
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
            </Button>
            <Button
              disabled={!ready}
              className={styles.action}
              onClick={() =>
                download(packet, "jbm-icons-feedback.md", "text/markdown")
              }
            >
              Download feedback
            </Button>
          </div>
        </div>
        <p role="status">{notice}</p>
        <Collapsible className={styles.packet}>
          <CollapsibleTrigger>Read your feedback packet</CollapsibleTrigger>
          <CollapsiblePanel keepMounted>
            <Textarea
              aria-label="Feedback packet"
              readOnly
              value={packet}
              rows={18}
            />
          </CollapsiblePanel>
        </Collapsible>
      </section>
      <footer className={styles.footer}>
        <span>Built to be used again.</span>
        <Link href="/c/icons">Component API & installation →</Link>
      </footer>
    </main>
  )
}
