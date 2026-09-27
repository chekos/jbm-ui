import { ReplayDemo } from "./replay-demo"
import { color } from "@/registry/jbm/lib/tokens"
import { Big } from "@/registry/jbm/ui/big"
import { Brand } from "@/registry/jbm/ui/brand"
import { BulletList } from "@/registry/jbm/ui/bullet-list"
import { Callout } from "@/registry/jbm/ui/callout"
import { Card } from "@/registry/jbm/ui/card"
import { Chip } from "@/registry/jbm/ui/chip"
import { Label } from "@/registry/jbm/ui/label"
import { StatCard } from "@/registry/jbm/ui/stat-card"
import { Paper, Sticker, Caption } from "@/registry/jbm/ui/paper"
import {
  Piece,
  UiButton,
  UiInput,
  UiCard,
  PhoneFrame,
  Badge,
  TokenGlyph,
} from "@/registry/jbm/ui/ui-bits"

export const examples = {
  "scene-geometry": (
    <svg
      viewBox="0 0 500 220"
      width={500}
      style={{ maxWidth: "100%" }}
      aria-label="A path and its shared contact points"
      role="img"
    >
      <path
        d="M40 170L220 50L460 130"
        fill="none"
        stroke={color.ink}
        strokeWidth={2}
      />
      {[
        [40, 170],
        [220, 50],
        [460, 130],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} fill={color.accent} />
      ))}
    </svg>
  ),
  "replay-button": <ReplayDemo />,
  label: <Label>Una idea a la vez</Label>,
  big: (
    <Big size={76}>
      Ideas que
      <br />
      <span style={{ color: color.accent }}>se entienden.</span>
    </Big>
  ),
  card: (
    <div style={{ display: "flex", gap: 24 }}>
      <Card style={{ width: 290 }}>
        <Label>Light</Label>
        <Big size={48}>Canvas</Big>
      </Card>
      <Card dark style={{ width: 290 }}>
        <Label style={{ color: color.soft }}>Dark</Label>
        <Big size={48} color={color.bg}>
          Surface
        </Big>
      </Card>
    </div>
  ),
  chip: (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", maxWidth: 550 }}>
      <Chip>Default</Chip>
      <Chip accent>Accent</Chip>
      <Chip solid>Solid</Chip>
      <Chip mono>Mono</Chip>
    </div>
  ),
  "stat-card": (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <StatCard label="Contexto" value="1M" sub="tokens" w={620} h={245} />
      <StatCard row label="Latencia" value="0.8s" sub="p50" w={620} h={140} />
    </div>
  ),
  callout: (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 20,
      }}
    >
      <Callout>Primero, el problema.</Callout>
      <Callout variant="ink">Luego, la idea.</Callout>
      <Callout variant="note">Al final, cómo se usa.</Callout>
    </div>
  ),
  "bullet-list": (
    <div style={{ display: "flex", gap: 60 }}>
      <BulletList
        size={28}
        items={["El contexto", "La pregunta", "La respuesta"]}
      />
      <BulletList
        size={28}
        marker="dot"
        items={["Simple", "Reusable", "Consistente"]}
      />
    </div>
  ),
  brand: <Brand tagline="Ideas, datos y código." size={64} />,
  paper: (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <Paper w={200} h={130} rotate={-3} style={{ padding: 20 }}>
        <Caption size={24}>papel</Caption>
      </Paper>
      <Sticker size={40} rotate={-5}>
        ¿otra vez?
      </Sticker>
      <Sticker tone="ink" size={28} rotate={2}>
        catálogo
      </Sticker>
    </div>
  ),
  "ui-button": <UiButton w={360} h={110} tone="accent" />,
  "ui-input": <UiInput w={420} h={120} />,
  "ui-card": <UiCard w={360} h={280} />,
  "phone-frame": <PhoneFrame w={200} h={360} />,
  badge: (
    <div style={{ display: "flex", gap: 40 }}>
      <Badge kind="check" size={100} />
      <Badge kind="x" size={100} tone="ink" />
    </div>
  ),
  "token-glyph": (
    <div style={{ display: "flex", gap: 30 }}>
      {(["color", "type", "space"] as const).map((kind) => (
        <TokenGlyph key={kind} kind={kind} size={150} />
      ))}
    </div>
  ),
  piece: (
    <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
      {(["button", "input", "card"] as const).map((kind) => (
        <Piece key={kind} kind={kind} w={180} />
      ))}
    </div>
  ),
  "ui-bits": (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <PhoneFrame w={200} h={360} gap={14}>
        <UiCard w={130} h={100} />
        <UiInput w={130} h={40} />
        <UiButton w={130} h={40} />
      </PhoneFrame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          alignItems: "center",
        }}
      >
        <UiButton w={180} h={56} tone="accent" />
        <div style={{ display: "flex", gap: 12 }}>
          <Badge kind="check" size={40} />
          <Badge kind="x" size={40} tone="ink" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <TokenGlyph kind="color" size={70} />
          <TokenGlyph kind="type" size={70} />
          <TokenGlyph kind="space" size={70} />
        </div>
      </div>
    </div>
  ),
}

export { snippets } from "./demo-data"
