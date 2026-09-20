/**
 * Build a sequential typing schedule. Anchors are earliest start times in seconds.
 * @param {{ t: string, at: number }[]} lines
 * @param {number} fps
 * @param {number} charsPerSecond
 */
export function codeTypingSchedule(lines, fps, charsPerSecond = 32) {
  if (!Number.isFinite(charsPerSecond) || charsPerSecond <= 0) {
    throw new RangeError("charsPerSecond must be a positive finite number");
  }
  let end = 0;
  return lines.map((line) => {
    const characters = Array.from(line.t);
    const start = Math.max(end, Math.round(line.at * fps));
    end = start + Math.ceil(characters.length * fps / charsPerSecond);
    return { characters, start, end };
  });
}

/**
 * @param {{ characters: string[], start: number, end: number }} line
 * @param {number} frame
 * @param {number} fps
 * @param {number} charsPerSecond
 */
export function typedCode(line, frame, fps, charsPerSecond = 32) {
  const count = frame >= line.end
    ? line.characters.length
    : Math.max(0, Math.floor((frame - line.start) * charsPerSecond / fps));
  return line.characters.slice(0, count).join("");
}
