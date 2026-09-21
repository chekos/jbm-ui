import * as React from "react"
import { color, font } from "../lib/tokens"
import { ActionLink } from "./action-link"

export type IndexRowProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "title"
> & {
  index: React.ReactNode
  title: React.ReactNode
  evidence?: React.ReactNode
  href?: string
  active?: boolean
}

/** A compact numbered record. Link only the title so evidence may contain its own links. */
export function IndexRow({
  index,
  title,
  evidence,
  href,
  active = false,
  style,
  ...props
}: IndexRowProps) {
  return (
    <div
      {...props}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 18,
        padding: "22px 0",
        borderBottom: `1px solid ${color.line}`,
        fontFamily: font.sans,
        color: color.ink,
        ...style,
      }}
    >
      <span
        style={{
          flexShrink: 0,
          fontFamily: font.mono,
          fontSize: 14,
          fontWeight: 600,
          color: active ? color.accent : color.dim,
        }}
      >
        {index}
      </span>
      <div style={{ minWidth: 0, flex: 1, overflowWrap: "anywhere" }}>
        {href ? (
          <ActionLink
            href={href}
            aria-current={active ? "step" : undefined}
            style={{
              fontSize: 22,
              paddingBlock: 0,
              ...(active ? { color: color.accent } : {}),
            }}
          >
            {title}
          </ActionLink>
        ) : (
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              lineHeight: 1.25,
              color: active ? color.accent : color.ink,
            }}
          >
            {title}
          </div>
        )}
        {evidence && (
          <div
            style={{
              marginTop: 8,
              fontSize: 15,
              lineHeight: 1.55,
              color: color.dim,
            }}
          >
            {evidence}
          </div>
        )}
      </div>
    </div>
  )
}
