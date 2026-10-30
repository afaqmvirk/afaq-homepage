import { spawnSync } from "node:child_process";
import { open, readdir, rename, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Requires FFmpeg on PATH. Repackage only: preserve every encoded audio/video
// packet, move playback metadata to the front, and reduce per-packet chunk tables.
const root = fileURLToPath(new URL("../", import.meta.url));

function ffmpeg(args) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-nostdin", ...args], {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || "FFmpeg failed");
  return result.stdout.trim();
}

async function inspect(file) {
  const bytes = (await stat(file)).size;
  const handle = await open(file, "r");
  const atoms = new Map();
  try {
    for (let offset = 0; offset < bytes;) {
      const header = Buffer.alloc(16);
      const { bytesRead } = await handle.read(header, 0, 16, offset);
      if (bytesRead < 8) throw new Error(`Truncated MP4: ${file}`);
      let size = header.readUInt32BE(0);
      if (size === 1) size = Number(header.readBigUInt64BE(8));
      if (size === 0) size = bytes - offset;
      if (size < 8 || offset + size > bytes) throw new Error(`Invalid MP4: ${file}`);
      atoms.set(header.toString("ascii", 4, 8), { offset, size });
      offset += size;
    }
  } finally {
    await handle.close();
  }
  if (!atoms.has("moov") || !atoms.has("mdat")) throw new Error(`Missing MP4 atoms: ${file}`);
  return { bytes, metadata: atoms.get("moov").size,
    fastStart: atoms.get("moov").offset < atoms.get("mdat").offset };
}

function streamHashes(file) {
  return ffmpeg(["-i", file, "-map", "0", "-c", "copy", "-f", "streamhash", "-"]);
}

for (const directory of ["channels", "previews"]) {
  const folder = path.join(root, "public", directory);
  for (const name of (await readdir(folder)).filter((name) => name.endsWith(".mp4")).sort()) {
    const file = path.join(folder, name);
    const temporary = `${file}.optimizing.mp4`;
    const before = await inspect(file);
    try {
      ffmpeg(["-y", "-i", file, "-map", "0", "-c", "copy", "-chunk_duration", "1000000",
        "-movflags", "+faststart", temporary]);
      const after = await inspect(temporary);
      if (!after.fastStart) throw new Error(`Fast-start missing: ${name}`);
      if (streamHashes(file) !== streamHashes(temporary)) {
        throw new Error(`Encoded audio/video changed: ${name}`);
      }
      const improved = !before.fastStart || after.bytes < before.bytes;
      if (improved) await rename(temporary, file);
      console.log(JSON.stringify({ file: `${directory}/${name}`, changed: improved,
        before, after: improved ? after : before, encodedStreamsIdentical: true }));
    } finally {
      await rm(temporary, { force: true });
    }
  }
}
