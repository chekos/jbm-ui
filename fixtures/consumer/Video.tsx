import { SceneFromSpec } from "./jbm/motion/compile"
import type { ScenesFile } from "./jbm/motion/spec"
import { Counter } from "./jbm/motion/counter"
import { ProbBar } from "./jbm/motion/prob-bar"
import { Captions } from "./jbm/motion/captions"

const file: ScenesFile = { scenes: [{ id: "fixture", blocks: [
  { type: "code", at: 0, charsPerSecond: 24, lines: [{ text: "hello", at: 0 }] },
] }] }
export function Video() {
  return <>
    <SceneFromSpec spec={file.scenes[0]} orientation="landscape" host={{ resolve: () => 0 }} />
    <Counter n={42} at={0} />
    <ProbBar label="Confidence" p={0.8} at={0} />
    <Captions words={[]} />
  </>
}
