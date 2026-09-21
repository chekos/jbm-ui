"use client"

import { useState } from "react"
import { ScrollStack } from "@/registry/jbm/ui/scroll-stack"
import { Card } from "@/registry/jbm/ui/card"
import { Chip } from "@/registry/jbm/ui/chip"
import { color } from "@/registry/jbm/lib/tokens"

export function ScrollStackDemo() {
  const [plain, setPlain] = useState(false)
  const [count, setCount] = useState(0)
  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          padding: "16px 24px",
          fontSize: 12,
          display: "flex",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Scroll to stack ↓ · Keyboard: ↓ / ↑</span>
        <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={plain}
            onChange={(event) => setPlain(event.target.checked)}
          />
          Plain list
        </label>
      </div>
      <ScrollStack
        height={400}
        distance={100}
        reducedMotion={plain ? true : undefined}
        label="Scroll stack demo"
      >
        <Card style={{ padding: 28 }}>
          <span style={{ color: color.dim, fontSize: 12 }}>
            01 / A SHARED SURFACE
          </span>
          <h4
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.05,
              margin: "16px 0",
            }}
          >
            Una idea toma forma.
          </h4>
          <p style={{ margin: 0, fontSize: 15 }}>
            Our Card, with its own border, spacing, and layered shadow.
          </p>
        </Card>
        <Card dark style={{ padding: 28, color: color.bg }}>
          <span style={{ color: color.soft, fontSize: 12 }}>
            02 / STILL INTERACTIVE
          </span>
          <h4
            style={{
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1.1,
              margin: "16px 0",
            }}
          >
            The content stays yours.
          </h4>
          <button
            onClick={() => setCount((value) => value + 1)}
            style={{
              background: color.bg,
              color: color.ink,
              border: 0,
              borderRadius: 8,
              padding: "10px 14px",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Add an idea · {count}
          </button>
        </Card>
        <div
          style={{
            background: color.accent,
            color: color.bg,
            borderRadius: 16,
            padding: 28,
          }}
        >
          <span style={{ fontSize: 12 }}>03 / ANY COMPONENT</span>
          <h4
            style={{
              fontSize: 32,
              fontWeight: 800,
              lineHeight: 1.05,
              margin: "16px 0",
            }}
          >
            No card required.
          </h4>
          <p style={{ fontSize: 15 }}>
            A custom layout, a chart, an image, or a group of components.
          </p>
          <Chip
            size={14}
            style={{ background: color.bg, whiteSpace: "normal" }}
          >
            One wrapper. Your content.
          </Chip>
        </div>
      </ScrollStack>
    </div>
  )
}
