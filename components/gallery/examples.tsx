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

export const snippets: Record<string, string> = {
  "ui-button": '<UiButton w={220} h={70} tone="accent" />',
  "ui-input": "<UiInput w={220} h={70} cursorOn />",
  "ui-card": "<UiCard w={220} h={170} />",
  "phone-frame": "<PhoneFrame w={420} h={780}>{children}</PhoneFrame>",
  badge: '<Badge kind="check" size={44} />',
  "token-glyph": '<TokenGlyph kind="color" size={150} />',
  piece: '<Piece kind="button" w={220} />',
  "replay-button":
    '<ReplayButton\n  progress={progress} // 0–1 from your animation\n  charging={isPlaying}\n  onReplay={restartAnimation}\n  label="Replay animation"\n/>',
  label: "<Label>Una idea a la vez</Label>",
  big: "<Big size={76}>Ideas que se entienden.</Big>",
  card: "<Card dark><Big color={color.bg}>Surface</Big></Card>",
  chip: "<Chip accent>Accent</Chip>\n<Chip mono>Mono</Chip>",
  "stat-card":
    '<StatCard label="Contexto" value="1M" sub="tokens" />\n<StatCard row label="Latencia" value="0.8s" w={620} h={140} />',
  callout: '<Callout variant="note">Al final, cómo se usa.</Callout>',
  "bullet-list": '<BulletList items={["El contexto", "La pregunta"]} />',
  brand: '<Brand tagline="Ideas, datos y código." />',
  paper:
    '<Sticker size={72} rotate={-5}>¿otra vez?</Sticker>\n<Paper tone="paper" w={300} h={200} rotate={-2} />',
  "ui-bits":
    '<PhoneFrame w={420} h={780}>\n  <UiCard w={290} />\n  <UiInput w={290} h={92} />\n  <UiButton w={290} h={92} tone="ink" />\n</PhoneFrame>',
  "rebuild-screens":
    '<RebuildScreens w={936} h={1000}\n  pieces={[{ kind: "button", at: 1 }, { kind: "input", at: 2.8 }, { kind: "card", at: 5.3 }]}\n  again={[12.9, 14.5]} sticker={{ text: "¿otra vez?", at: 13 }} />',
  catalog:
    '<Catalog w={936} at={3.2} title="catálogo"\n  items={[{ kind: "button", label: "botón", at: 7.4 }]}\n  tokens={[{ kind: "color", label: "color", at: 18.2 }]} />',
  propagate:
    '<Propagate w={936} h={1040} at={0.9} targets={6}\n  label={{ text: "una sola fuente de verdad", at: 4 }}\n  bug={5.8} fix={6.6} fixed={7.7} recolor={10.5} recolored={11.7} />',
  shelf:
    '<Shelf w={936} items={[{ text: "shadcn/ui", at: 3.4 }, { text: "jbm-ui", at: 7.7, tone: "accent" }]} />\n<Twice w={936} at={13.1} second={14.6} strike={14.8} />',
  "scene-spec":
    '<SceneFromSpec spec={scenes.scenes[0]} orientation="landscape" host={{ resolve: phrase => timings[phrase] }} />\n// Set composition: { layout: "headline-illustration", safeArea: "full" }.\n// variants.vertical overrides blocks, headlineRatio, gap, or subjectScale. See docs/scene-spec.md.',
  scene: "<Scene><Big>Una idea a la vez.</Big></Scene>",
  pop: '<Stagger at={0.2} step={0.35}>\n  {["Idea", "Datos"].map(text => <Chip key={text}>{text}</Chip>)}\n</Stagger>',
  counter: "<Counter n={1024} at={0.2} dur={1.5} />",
  "prob-bar": '<ProbBar label="Confianza" p={0.86} at={0.2} />',
  "code-card":
    '<CodeCard title="hello.ts" charsPerSecond={32} lines={[\n  { t: "const idea = \\\"simple\\\"", at: 0.2 },\n]} />',
  captions:
    '<Captions words={[\n  { w: "Una", s: 0, e: 0.7 },\n  { w: "idea.", s: 0.7, e: 1.5, emph: true },\n]} />',
  "motion-hooks":
    "const seconds = useSec();\nconst entrance = useIn(0.2);\nconst opacity = useFade(0.2);\nconst progress = useProgress(0.2, 100, 1.5);",
  tokens:
    'import { color, font, stage } from "@/lib/tokens";\n\n<div style={{ color: color.ink, fontFamily: font.sans }} />',
}
