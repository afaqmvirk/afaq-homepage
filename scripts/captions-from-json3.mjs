/* eslint-env node */

import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath, rangeStartArg = "0", rangeEndArg = "Infinity", shiftArg = "0"] =
  process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error(
    "Usage: node scripts/captions-from-json3.mjs <input.json3> <output.json> [rangeStartSeconds] [rangeEndSeconds] [shiftSeconds]",
  );
  process.exit(1);
}

const rangeStart = Number(rangeStartArg);
const rangeEnd = rangeEndArg === "Infinity" ? Infinity : Number(rangeEndArg);
const shift = Number(shiftArg);

if (![rangeStart, shift].every(Number.isFinite) || Number.isNaN(rangeEnd)) {
  throw new Error("Caption range and shift arguments must be valid numbers.");
}

const source = JSON.parse(await readFile(inputPath, "utf8"));

const cleanText = (text) =>
  text
    .replace(/\s+/g, " ")
    .replace(/\buh+\b[,.!?]?/gi, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const sourceCues = (source.events ?? [])
  .map((event) => {
    const text = cleanText(
      (event.segs ?? []).map((segment) => segment.utf8 ?? "").join(""),
    );
    const start = Number(event.tStartMs ?? 0) / 1000;
    const duration = Number(event.dDurationMs ?? 0) / 1000;

    return { start, end: start + duration, text };
  })
  .filter(
    (cue) =>
      cue.text &&
      cue.text !== "\n" &&
      cue.end > rangeStart &&
      cue.start < rangeEnd,
  );

const cues = sourceCues
  .flatMap((cue, index) => {
    const nextStart = sourceCues[index + 1]?.start ?? rangeEnd;
    const start = Math.max(cue.start, rangeStart) - shift;
    const end = Math.min(cue.end, nextStart, rangeEnd) - shift;

    if (end <= start) return [];

    return [
      {
        start: Number(start.toFixed(3)),
        end: Number(end.toFixed(3)),
        text: cue.text,
      },
    ];
  })
  .filter((cue) => cue.end - cue.start >= 0.25);

await writeFile(
  outputPath,
  `${JSON.stringify({ cues }, null, 2)}\n`,
  "utf8",
);

console.log(`Wrote ${cues.length} cleaned, non-overlapping captions to ${outputPath}`);
