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
}

export const snippets: Record<string, string> = {
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
