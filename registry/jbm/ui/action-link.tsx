"use client"

import * as React from "react"
import { color, font } from "../lib/tokens"

export type ActionLinkProps = React.ComponentPropsWithRef<"a"> & {
  arrow?: boolean
}

/** A real anchor, with a decorative arrow and stable hover/focus emphasis. */
export function ActionLink({
  arrow = true,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  ...props
}: ActionLinkProps) {
  const [hovered, setHovered] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  return (
    <a
      {...props}
      onMouseEnter={(event) => {
        setHovered(true)
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        setHovered(false)
        onMouseLeave?.(event)
      }}
      onFocus={(event) => {
        setFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setFocused(false)
        onBlur?.(event)
      }}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 10,
        maxWidth: "100%",
        paddingBlock: 6,
        fontFamily: font.sans,
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.4,
        color: hovered || focused ? color.accent : color.ink,
        textDecoration: "underline",
        textDecorationThickness: hovered || focused ? 2 : 1,
        textUnderlineOffset: 5,
        outlineOffset: 5,
        overflowWrap: "anywhere",
        ...style,
      }}
    >
      <span style={{ minWidth: 0 }}>{children}</span>
      {arrow && (
        <span aria-hidden="true" style={{ flexShrink: 0 }}>
          ↗
        </span>
      )}
    </a>
  )
}
