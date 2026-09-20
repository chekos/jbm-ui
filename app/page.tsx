import { color, stage } from "@/registry/jbm/lib/tokens";
import { Label } from "@/registry/jbm/ui/label";
import { Big } from "@/registry/jbm/ui/big";
import { Card } from "@/registry/jbm/ui/card";
import { Chip } from "@/registry/jbm/ui/chip";
import { StatCard } from "@/registry/jbm/ui/stat-card";
import { Callout } from "@/registry/jbm/ui/callout";
import { BulletList } from "@/registry/jbm/ui/bullet-list";
import { Brand } from "@/registry/jbm/ui/brand";

/**
 * Preview of the ui/* primitives at video scale. Each frame is a 1920×1080 stage scaled to fit,
 * so what you see here is what Remotion renders. motion/* blocks need a Remotion timeline and are
 * not previewed here; run `pnpm registry:build` and `npx shadcn add @jbm/<name>` in a Remotion project.
 */
function Stage({ title, children, vertical = false }: { title: string; children: React.ReactNode; vertical?: boolean }) {
  const s = vertical ? stage.vertical : stage.landscape;
  const scale = vertical ? 0.28 : 0.5;
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 14, letterSpacing: 2, textTransform: "uppercase", color: color.dim, marginBottom: 12 }}>{title}</h2>
      <div style={{ width: s.w * scale, height: s.h * scale, overflow: "hidden", borderRadius: 12, border: `1px solid ${color.line}` }}>
        <div style={{ width: s.w, height: s.h, transform: `scale(${scale})`, transformOrigin: "top left", background: color.bg, position: "relative", padding: `${s.top}px ${s.pad}px` }}>
          {children}
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  return (
    <main style={{ padding: 48, maxWidth: 1100, margin: "0 auto" }}>
      <Brand tagline="jbm-ui — primitives for explainer videos" size={40} />
      <p style={{ color: color.dim, margin: "12px 0 40px", maxWidth: 640 }}>
        Everything below is a plain React component with inline styles; the same file renders in this page and inside a
        Remotion composition. Palette: cream, ink, vermilion.
      </p>

      <Stage title="Label + Big + Chip">
        <Label>Por qué</Label>
        <Big style={{ marginTop: 20 }}>
          Un modelo que <span style={{ color: color.accent }}>razona</span>
        </Big>
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          <Chip>plain</Chip>
          <Chip accent>accent</Chip>
          <Chip solid>solid</Chip>
          <Chip mono>mono</Chip>
        </div>
      </Stage>

      <Stage title="StatCard (grid and row) + Card">
        <div style={{ display: "flex", gap: 32 }}>
          <StatCard label="Contexto" value="1M" sub="tokens" />
          <StatCard label="Latencia" value="0.8s" sub="p50" valueColor={color.ink} />
          <Card dark style={{ width: 520, height: 300, padding: 40 }}>
            <Label style={{ color: color.soft }}>Dark card</Label>
            <Big size={64} color={color.bg} style={{ marginTop: 16 }}>
              Ink surface
            </Big>
          </Card>
        </div>
        <StatCard row label="Fila" value="936 × 180" sub="row mode" style={{ marginTop: 32 }} />
      </Stage>

      <Stage title="Callout + BulletList">
        <div style={{ display: "flex", gap: 48 }}>
          <BulletList items={["Primero, el problema", "Luego, la idea", "Al final, cómo se usa"]} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Callout>Accent callout</Callout>
            <Callout variant="ink">Ink callout</Callout>
            <Callout variant="note">Note callout</Callout>
          </div>
        </div>
      </Stage>

      <Stage title="Vertical safe area" vertical>
        <Label>Vertical</Label>
        <Big size={80} style={{ marginTop: 20 }}>
          Mismo componente, otro stage
        </Big>
        <BulletList items={["pad 72", "content 100–1440", "captions below"]} style={{ marginTop: 40 }} />
      </Stage>
    </main>
  );
}
