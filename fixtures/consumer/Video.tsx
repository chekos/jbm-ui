import { SceneFromSpec } from "./jbm/motion/compile"
import type { ScenesFile } from "./jbm/motion/spec"
import { Counter } from "./jbm/motion/counter"
import { ProbBar } from "./jbm/motion/prob-bar"
import { Captions } from "./jbm/motion/captions"
import { Escritorio, escritorioLayout } from "./jbm/motion/escritorio"
import { Mano, pointOn } from "./jbm/motion/mano"
import { Burbuja } from "./jbm/motion/burbuja"

const file: ScenesFile = {
  scenes: [
    {
      id: "fixture",
      blocks: [
        {
          type: "code",
          at: 0,
          charsPerSecond: 24,
          lines: [{ text: "hello", at: 0 }],
        },
      ],
    },
  ],
}
export function Video() {
  const desk = {
    box: { x: 20, y: 30, w: 820, h: 580 },
    cabinet: true,
    folders: [{ name: "datos", accent: true }],
  } as const
  const layout = escritorioLayout(desk)
  return (
    <>
      <svg viewBox="0 0 1000 800">
        <Escritorio {...desk} />
        <Mano at={pointOn(layout.anchors.folders, 0)} pose="pinch" />
      </svg>
      <Burbuja words={["Analiza", "datos"]} highlight={[1]} progress={1} />
      <SceneFromSpec
        spec={file.scenes[0]}
        orientation="landscape"
        host={{ resolve: () => 0 }}
      />
      <Counter n={42} at={0} />
      <ProbBar label="Confidence" p={0.8} at={0} />
      <Captions words={[]} />
    </>
  )
}
