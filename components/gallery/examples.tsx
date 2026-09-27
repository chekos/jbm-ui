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

export const snippets: Record<string, string> = {
  "scene-geometry": `import { pointOn, pathTilt } from "@/jbm/lib/geometry"\n\nconst path = [{ x: 40, y: 170 }, { x: 220, y: 50 }, { x: 460, y: 130 }]\nconst at = pointOn(path, 0.5)\nconst angle = pathTilt(path, 0.5)`,
  ticket:
    'import { Ticket } from "@/jbm/ui/ticket"\n\n<Ticket header="ADMIT ONE · OCT 2026" stub="Tu nombre · Tu comunidad" tone="accent">\n  <h3>Un lugar para crear.</h3>\n  <p>Trae tu curiosidad.</p>\n</Ticket>\n\n// Work order: compose the same header and stub slots.\n<Ticket header="orden de trabajo" stub={<>Hecho es:<br />Las pruebas pasan.</>}>\n  <h3>Migrar los pagos</h3>\n  <p>Del cliente anterior al nuevo.</p>\n</Ticket>',
  "chat-bubble":
    'import { ChatBubble } from "@/jbm/ui/chat-bubble"\n\n<ChatBubble speaker="Tú" side="end" tone="accent">\n  Una pieza a la vez.\n</ChatBubble>',
  document:
    'import { Document } from "@/jbm/ui/document"\n\n<Document label="idea.md" accent style={{ width: 180 }} />',
  folder:
    'import { Folder } from "@/jbm/ui/folder"\n\n<Folder label="Ideas" open={0.6} />\n// open: 0 (closed) to 1 (open); no internal timer.',
  "score-scale":
    'import { ScoreScale } from "@/jbm/ui/score-scale"\n\n<ScoreScale label="Claridad" value={6} min={0} max={10}\n  labels={["Por explorar", "Lista para compartir"]} />\n// Read-only meter; clamps values to the range.',
  "comparison-bars":
    'import { ComparisonBars } from "@/jbm/ui/comparison-bars"\n\n<ComparisonBars max={100} items={[\n  { label: "Contexto", value: 42 },\n  { label: "Una idea clara", value: 90, highlight: true },\n]} />\n// Values must be nonnegative; max must cover all values.',
  clock:
    'import { Clock } from "@/jbm/ui/clock"\n\n<Clock hours={8} minutes={30} size={64} />\n// Explicit time keeps rendering deterministic. No autoplay.',
  rule: 'import { Rule } from "@/jbm/ui/rule"\n\n<Rule label="El siguiente capítulo" accent strong />',
  "action-link":
    'import { ActionLink } from "@/jbm/ui/action-link"\n\n<ActionLink href="/ideas">Explora las ideas</ActionLink>',
  "index-row":
    'import { IndexRow } from "@/jbm/ui/index-row"\n\n<IndexRow index="01" title="El contexto" evidence="Empieza con una pregunta." href="/contexto" active />',
  "figure-caption":
    'import { FigureCaption } from "@/jbm/ui/figure-caption"\n\n<figure>\n  <img src="/chart.png" alt="Descripción del gráfico" />\n  <FigureCaption index="01" provenance="Fuente: nuestro estudio">\n    Menos ruido. Más señal.\n  </FigureCaption>\n</figure>',
  "scroll-stack":
    'import { ScrollStack } from "@/jbm/ui/scroll-stack";\nimport { Card } from "@/jbm/ui/card"; // install @jbm/card separately\n\n<ScrollStack height={480} distance={120}>\n  <Card>First idea</Card>\n  <Card dark>Another idea</Card>\n  <YourComponent />\n</ScrollStack>\n\n// Each direct child is one item; group related content in a div.\n// Omit height for page scrolling; avoid overflow ancestors in page mode.\n// top: sticky inset; minScale: outgoing scale (0.5–1).\n// reducedMotion: true renders a plain list; defaults to system preference.\n// Oversized content automatically uses the list so it stays readable.\n// Keep child backgrounds opaque for a solid stack.',
  "flip-text":
    'import { FlipText } from "@/jbm/ui/flip-text";\n\n<FlipText duration={450} style={{ fontSize: 48 }}>Una idea viva.</FlipText>\n// Hover individual letters. Click, tap, Enter, or Space flips all.\n// A button: do not nest inside another button or link.\n// Respects prefers-reduced-motion; reducedMotion can override it.',
  "text-fill":
    'import { TextFill } from "@/jbm/ui/text-fill";\n\n<TextFill text="Una idea toma forma." progress={0.5} />\n// progress: 0–1. Set reducedMotion to show the complete text.\n// Customize dimColor, accentColor, textColor, and style.',
  "scroll-text-fill":
    'import { ScrollTextFill } from "@/jbm/ui/scroll-text-fill";\n\n<ScrollTextFill\n  text="Una idea toma forma. Letra por letra."\n  height={320}\n  distance={640}\n  style={{ fontSize: 40 }}\n/>\n// Self-contained scroll region; respects prefers-reduced-motion.',
  "ui-button":
    'import { UiButton } from "@/jbm/ui/ui-button"\n\n<UiButton w={220} h={70} tone="accent" />',
  "ui-input":
    'import { UiInput } from "@/jbm/ui/ui-input"\n\n<UiInput w={220} h={70} cursorOn />',
  "ui-card":
    'import { UiCard } from "@/jbm/ui/ui-card"\n\n<UiCard w={220} h={170} />',
  "phone-frame":
    'import { PhoneFrame } from "@/jbm/ui/phone-frame"\n\n<PhoneFrame w={420} h={780}>{children}</PhoneFrame>',
  badge:
    'import { Badge } from "@/jbm/ui/badge"\n\n<Badge kind="check" size={44} />',
  "token-glyph":
    'import { TokenGlyph } from "@/jbm/ui/token-glyph"\n\n<TokenGlyph kind="color" size={150} />',
  piece:
    'import { Piece } from "@/jbm/ui/piece"\n\n<Piece kind="button" w={220} />',
  "replay-button":
    'import { ReplayButton } from "@/jbm/ui/replay-button"\n\n<ReplayButton\n  progress={progress} // 0–1 from your animation\n  charging={isPlaying}\n  onReplay={restartAnimation}\n  label="Replay animation"\n/>',
  label:
    'import { Label } from "@/jbm/ui/label"\n\n<Label>Una idea a la vez</Label>',
  big: 'import { Big } from "@/jbm/ui/big"\n\n<Big size={76}>Ideas que se entienden.</Big>',
  card: 'import { Card } from "@/jbm/ui/card"\nimport { color } from "@/jbm/lib/tokens"\nimport { Big } from "@/jbm/ui/big" // install @jbm/big separately\n\n<Card dark><Big color={color.bg}>Surface</Big></Card>',
  chip: 'import { Chip } from "@/jbm/ui/chip"\n\n<Chip accent>Accent</Chip>\n<Chip mono>Mono</Chip>',
  "stat-card":
    'import { StatCard } from "@/jbm/ui/stat-card"\n\n<StatCard label="Contexto" value="1M" sub="tokens" />\n<StatCard row label="Latencia" value="0.8s" w={620} h={140} />',
  callout:
    'import { Callout } from "@/jbm/ui/callout"\n\n<Callout variant="note">Al final, cómo se usa.</Callout>',
  "bullet-list":
    'import { BulletList } from "@/jbm/ui/bullet-list"\n\n<BulletList items={["El contexto", "La pregunta"]} />',
  brand:
    'import { Brand } from "@/jbm/ui/brand"\n\n<Brand tagline="Ideas, datos y código." />',
  paper:
    'import { Paper, Sticker } from "@/jbm/ui/paper"\n\n<Sticker size={72} rotate={-5}>¿otra vez?</Sticker>\n<Paper tone="paper" w={300} h={200} rotate={-2} />',
  "ui-bits":
    'import { PhoneFrame, UiCard, UiInput, UiButton } from "@/jbm/ui/ui-bits"\n\n<PhoneFrame w={420} h={780}>\n  <UiCard w={290} />\n  <UiInput w={290} h={92} />\n  <UiButton w={290} h={92} tone="ink" />\n</PhoneFrame>',
  "rebuild-screens":
    'import { RebuildScreens } from "@/jbm/motion/rebuild-screens"\n\n<RebuildScreens w={936} h={1000}\n  pieces={[{ kind: "button", at: 1 }, { kind: "input", at: 2.8 }, { kind: "card", at: 5.3 }]}\n  again={[12.9, 14.5]} sticker={{ text: "¿otra vez?", at: 13 }} />',
  catalog:
    'import { Catalog } from "@/jbm/motion/catalog"\n\n<Catalog w={936} at={3.2} title="catálogo"\n  items={[{ kind: "button", label: "botón", at: 7.4 }]}\n  tokens={[{ kind: "color", label: "color", at: 18.2 }]} />',
  propagate:
    'import { Propagate } from "@/jbm/motion/propagate"\n\n<Propagate w={936} h={1040} at={0.9} targets={6}\n  label={{ text: "una sola fuente de verdad", at: 4 }}\n  bug={5.8} fix={6.6} fixed={7.7} recolor={10.5} recolored={11.7} />',
  shelf:
    'import { Shelf, Twice } from "@/jbm/motion/shelf"\n\n<Shelf w={936} items={[{ text: "shadcn/ui", at: 3.4 }, { text: "jbm-ui", at: 7.7, tone: "accent" }]} />\n<Twice w={936} at={13.1} second={14.6} strike={14.8} />',
  "scene-spec":
    'import { SceneFromSpec } from "@/jbm/motion/compile"\n\n<SceneFromSpec spec={scenes.scenes[0]} orientation="landscape" host={{ resolve: phrase => timings[phrase] }} />\n// Set composition: { layout: "headline-illustration", safeArea: "full" }.\n// variants.vertical overrides blocks, headlineRatio, gap, or subjectScale. See docs/scene-spec.md.',
  scene:
    'import { Scene } from "@/jbm/motion/scene"\nimport { Big } from "@/jbm/ui/big" // install @jbm/big separately\n\n<Scene><Big>Una idea a la vez.</Big></Scene>',
  pop: 'import { Stagger } from "@/jbm/motion/pop"\nimport { Chip } from "@/jbm/ui/chip" // install @jbm/chip separately\n\n<Stagger at={0.2} step={0.35}>\n  {["Idea", "Datos"].map(text => <Chip key={text}>{text}</Chip>)}\n</Stagger>',
  counter:
    'import { Counter } from "@/jbm/motion/counter"\n\n<Counter n={1024} at={0.2} dur={1.5} />',
  "prob-bar":
    'import { ProbBar } from "@/jbm/motion/prob-bar"\n\n<ProbBar label="Confianza" p={0.86} at={0.2} />',
  "code-card":
    'import { CodeCard } from "@/jbm/motion/code-card"\n\n<CodeCard title="hello.ts" charsPerSecond={32} lines={[\n  { t: "const idea = \\\"simple\\\"", at: 0.2 },\n]} />',
  captions:
    'import { Captions } from "@/jbm/motion/captions"\n\n<Captions words={[\n  { w: "Una", s: 0, e: 0.7 },\n  { w: "idea.", s: 0.7, e: 1.5, emph: true },\n]} />',
  "motion-hooks":
    'import { useSec, useIn, useFade, useProgress } from "@/jbm/motion/hooks"\n\nconst seconds = useSec();\nconst entrance = useIn(0.2);\nconst opacity = useFade(0.2);\nconst progress = useProgress(0.2, 100, 1.5);',
  tokens:
    'import { color, font } from "@/jbm/lib/tokens";\n\n<div style={{ color: color.ink, fontFamily: font.sans }} />',
}
