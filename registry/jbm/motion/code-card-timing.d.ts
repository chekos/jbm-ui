export type CodeTypingLine = {
  characters: string[]
  start: number
  end: number
}
export function codeTypingSchedule(
  lines: { t: string; at: number }[],
  fps: number,
  charsPerSecond?: number
): CodeTypingLine[]
export function typedCode(
  line: CodeTypingLine,
  frame: number,
  fps: number,
  charsPerSecond?: number
): string
