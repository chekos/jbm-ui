import { SceneFromSpec } from "./jbm/motion/compile"
import type { ScenesFile } from "./jbm/motion/spec"
import { Counter } from "./jbm/motion/counter"
import { ProbBar } from "./jbm/motion/prob-bar"
import { Captions } from "./jbm/motion/captions"
import { Escritorio, escritorioLayout } from "./jbm/motion/escritorio"
import { Mano, pointOn } from "./jbm/motion/mano"
import { Burbuja } from "./jbm/motion/burbuja"
import { PaperTape } from "./jbm/ui/paper-tape"
import { ClippedNote } from "./jbm/ui/clipped-note"
import { PunchedTag } from "./jbm/ui/punched-tag"
import { PaperLine } from "./jbm/ui/paper-line"
import { Stamp } from "./jbm/ui/stamp"
import { Frontmatter } from "./jbm/ui/frontmatter"
import { FolderContents } from "./jbm/ui/folder-contents"
import {
  FolderCarry,
  folderGrip,
  tableFolderGeometry,
} from "./jbm/ui/folder-carry"

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
  const from = tableFolderGeometry({ x: 0, y: 0 }, 100)
  const to = tableFolderGeometry({ x: 180, y: 0 }, 160)
  return (
    <>
      <svg viewBox="0 0 1000 800">
        <Escritorio {...desk} />
        <Mano at={pointOn(layout.anchors.folders, 0)} pose="pinch" />
        <FolderCarry
          from={from}
          to={to}
          path={[folderGrip(from), folderGrip(to)]}
          progress={0.5}
        />
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
      <PaperTape
        length={240}
        markers={[{ id: "stop", at: 100, label: "Review" }]}
        attachments={[
          { id: "note", at: 180, content: <ClippedNote>Review</ClippedNote> },
        ]}
      />
      <PunchedTag>Model</PunchedTag>
      <PaperLine text="A whole idea" reveal={0.5} />
      <Stamp text="REVIEWED" press={1} />
      <Frontmatter rows={[{ key: "name", value: "example" }]} stacked />
      <FolderContents entries={[{ id: "assets", label: "assets/" }]} open={1} />
    </>
  )
}
