import { Rule } from "@/registry/jbm/ui/rule"
import { ActionLink } from "@/registry/jbm/ui/action-link"
import { IndexRow } from "@/registry/jbm/ui/index-row"
import { FigureCaption } from "@/registry/jbm/ui/figure-caption"
import { Card } from "@/registry/jbm/ui/card"
import { color, font } from "@/registry/jbm/lib/tokens"

export const editorialExamples = {
  rule: (
    <div style={{ display: "grid", gap: 36 }}>
      <Rule label="Una idea a la vez" accent strong />
      <Rule />
      <Rule label="El siguiente capítulo" strong />
    </div>
  ),
  "action-link": (
    <div style={{ display: "grid", justifyItems: "start", gap: 20 }}>
      <ActionLink href="#index-row">Explora las ideas</ActionLink>
      <ActionLink href="#figure-caption" arrow={false}>
        Lee la historia completa
      </ActionLink>
    </div>
  ),
  "index-row": (
    <div>
      <IndexRow
        index="01"
        title="Primero, el contexto."
        evidence="Una pregunta clara antes de abrir otra pestaña."
        href="#rule"
        active
      />
      <IndexRow
        index="02"
        title="Después, la evidencia."
        evidence="Datos, ejemplos y decisiones que se pueden revisar."
        href="#figure-caption"
      />
      <IndexRow index="03" title="Al final, una idea útil." />
    </div>
  ),
  "figure-caption": (
    <figure style={{ margin: 0 }}>
      <Card style={{ padding: 24, marginBottom: 24 }}>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 11,
            color: color.dim,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Del dato a la idea
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "end",
            gap: 12,
            height: 90,
            marginTop: 20,
          }}
          role="img"
          aria-label="Three illustrative bars of increasing height"
        >
          {[35, 60, 90].map((height, i) => (
            <div
              key={height}
              style={{
                height,
                flex: 1,
                borderRadius: "6px 6px 0 0",
                background: i === 2 ? color.accent : color.ink,
              }}
            />
          ))}
        </div>
      </Card>
      <FigureCaption index="01" provenance="JBM · Datos ilustrativos">
        Menos ruido. Más señal.
      </FigureCaption>
    </figure>
  ),
}
