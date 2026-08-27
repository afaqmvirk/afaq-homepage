import { useEffect, useRef } from "react";

export const SHOPIFY_ASCII_CANVAS_ID = "shopify-ascii-canvas";
export const SHOPIFY_ASCII_MEDIA = `canvas:${SHOPIFY_ASCII_CANVAS_ID}`;

const WIDTH = 720;
const HEIGHT = 540;
const FRAME_INTERVAL = 1000 / 24;
const ROTATION_SPEED = 0.00048;
const FULL_ROTATION = Math.PI * 2;
const CELL_WIDTH = 8;
const CELL_HEIGHT = 10;
const GRID_COLUMNS = WIDTH / CELL_WIDTH;
const GRID_ROWS = HEIGHT / CELL_HEIGHT;
const BAG_TOP = 1.86;
const BAG_BOTTOM = -2.5;
const BAG_TOP_DEPTH = 0.32;
const BAG_BOTTOM_DEPTH = 0.68;
const HORIZONTAL_SCALE = 86;
const VERTICAL_SCALE = 76;
const GLYPHS = " .:-=+*#%@";
const SALE_SOUND_URL = "/audio/shopify-sale-sound.mp3";
const SHOPIFY_S_PATH =
  "M11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01z";

type CellKind = "body" | "side" | "handle" | "logo";
type GridCell = {
  depth: number;
  kind: CellKind;
  light: number;
  seed: number;
};
type HandlePoint = {
  x: number;
  y: number;
  z: number;
  seed: number;
};
type LogoMask = {
  alpha: Uint8ClampedArray;
  width: number;
  height: number;
};
type SurfaceHit = {
  depth: number;
  kind: CellKind;
  modelX: number;
  normalX: number;
  normalZ: number;
};
type FrameCanvas = HTMLCanvasElement & { __crtFrameVersion?: number };

function playSaleSound(
  context: AudioContext,
  output: GainNode,
  sound: AudioBuffer,
  volume: number,
) {
  if (volume <= 0 || context.state !== "running") return;
  output.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), context.currentTime);
  const source = context.createBufferSource();
  source.buffer = sound;
  source.connect(output);
  source.start();
}

function bagHalfWidth(y: number) {
  const progress = (BAG_TOP - y) / (BAG_TOP - BAG_BOTTOM);
  return 1.58 + progress * 0.32;
}

function bagHalfDepth(y: number) {
  const progress = (BAG_TOP - y) / (BAG_TOP - BAG_BOTTOM);
  return BAG_TOP_DEPTH + progress * (BAG_BOTTOM_DEPTH - BAG_TOP_DEPTH);
}

function hash(seed: number) {
  const value = Math.sin(seed * 91.173) * 43758.5453;
  return value - Math.floor(value);
}

function createLogoMask(): LogoMask | null {
  const mask = document.createElement("canvas");
  mask.width = 220;
  mask.height = 280;
  const context = mask.getContext("2d");
  if (!context) return null;

  const shopifyS = new Path2D(SHOPIFY_S_PATH);
  const scale = 17.5;
  context.setTransform(
    scale,
    0,
    0,
    scale,
    mask.width / 2 - 8.7 * scale,
    mask.height / 2 - 14.3 * scale,
  );
  context.fillStyle = "#fff";
  context.fill(shopifyS);

  return {
    alpha: context.getImageData(0, 0, mask.width, mask.height).data,
    width: mask.width,
    height: mask.height,
  };
}

function isLogoCell(mask: LogoMask | null, modelX: number, modelY: number) {
  if (!mask) return false;

  const tilt = -0.12;
  const rawX = modelX * Math.cos(tilt) + modelY * Math.sin(tilt);
  const rawY = -modelX * Math.sin(tilt) + modelY * Math.cos(tilt);
  const pixelX = Math.floor((rawX / 2.9 + 0.5) * mask.width);
  const pixelY = Math.floor((0.5 - (rawY + 0.25) / 3.25) * mask.height);
  if (
    pixelX < 0 ||
    pixelX >= mask.width ||
    pixelY < 0 ||
    pixelY >= mask.height
  ) {
    return false;
  }

  return mask.alpha[(pixelY * mask.width + pixelX) * 4 + 3] > 96;
}

function createHandlePoints() {
  const points: HandlePoint[] = [];
  const tubeOffsets = [-0.13, -0.065, 0, 0.065, 0.13];
  const topDepth = bagHalfDepth(BAG_TOP);
  const handleDepths = [-topDepth - 0.025, topDepth + 0.025];
  let seed = 6000;

  for (let theta = 0; theta <= Math.PI; theta += 0.025) {
    for (const tubeOffset of tubeOffsets) {
      for (const z of handleDepths) {
        points.push({
          x: Math.cos(theta) * (1.02 + tubeOffset),
          y: 1.78 + Math.sin(theta) * (1.2 + tubeOffset),
          z,
          seed: seed++,
        });
      }
    }
  }

  return points;
}

function findBodySurface(
  projectedX: number,
  modelY: number,
  cosine: number,
  sine: number,
): SurfaceHit | null {
  if (modelY < BAG_BOTTOM || modelY > BAG_TOP) return null;
  const halfWidth = bagHalfWidth(modelY);
  const halfDepth = bagHalfDepth(modelY);
  const hits: SurfaceHit[] = [];
  const epsilon = 0.0001;

  if (Math.abs(sine) > epsilon) {
    for (const side of [-1, 1]) {
      const modelX = side * halfWidth;
      const depth = (projectedX * cosine - modelX) / sine;
      const modelZ = projectedX * sine + depth * cosine;
      if (Math.abs(modelZ) <= halfDepth + 0.01) {
        hits.push({
          depth,
          kind: "side",
          modelX,
          normalX: side,
          normalZ: 0,
        });
      }
    }
  }

  if (Math.abs(cosine) > epsilon) {
    for (const face of [-1, 1]) {
      const modelZ = face * halfDepth;
      const depth = (modelZ - projectedX * sine) / cosine;
      const modelX = projectedX * cosine - depth * sine;
      if (Math.abs(modelX) <= halfWidth + 0.01) {
        hits.push({
          depth,
          kind: "body",
          modelX,
          normalX: 0,
          normalZ: face,
        });
      }
    }
  }

  if (hits.length === 0) return null;
  return hits.reduce((nearest, hit) =>
    hit.depth > nearest.depth ? hit : nearest,
  );
}

function writeBodyToGrid(
  cells: Array<GridCell | null>,
  rotation: number,
  bob: number,
  logoMask: LogoMask | null,
) {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);

  for (let row = 0; row < GRID_ROWS; row += 1) {
    const screenY = row * CELL_HEIGHT + CELL_HEIGHT / 2;
    const modelY = (HEIGHT / 2 + 8 - screenY) / VERTICAL_SCALE - bob;
    if (modelY < BAG_BOTTOM || modelY > BAG_TOP) continue;

    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const screenX = column * CELL_WIDTH + CELL_WIDTH / 2;
      const projectedX = (screenX - WIDTH / 2) / HORIZONTAL_SCALE;
      const hit = findBodySurface(projectedX, modelY, cosine, sine);
      if (!hit) continue;

      const turnedNormalX = hit.normalX * cosine + hit.normalZ * sine;
      const turnedNormalZ = -hit.normalX * sine + hit.normalZ * cosine;
      const frontLogo = hit.normalZ > 0 && turnedNormalZ > 0.08;
      const hasLogo =
        frontLogo && isLogoCell(logoMask, hit.modelX, modelY);
      const light = Math.max(
        0.14,
        Math.min(
          1,
          0.24 + Math.max(0, turnedNormalZ) * 0.7 +
            Math.max(0, -turnedNormalX) * 0.12,
        ),
      );
      cells[row * GRID_COLUMNS + column] = {
        depth: hit.depth,
        kind: hasLogo ? "logo" : hit.kind,
        light: hasLogo ? 1 : light,
        seed: row * GRID_COLUMNS + column,
      };
    }
  }
}

function writeHandleToGrid(
  cells: Array<GridCell | null>,
  points: HandlePoint[],
  rotation: number,
  bob: number,
) {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);

  for (const point of points) {
    const projectedX = point.x * cosine + point.z * sine;
    const depth = -point.x * sine + point.z * cosine;
    const screenX = WIDTH / 2 + projectedX * HORIZONTAL_SCALE;
    const screenY = HEIGHT / 2 - (point.y + bob) * VERTICAL_SCALE + 8;
    const column = Math.floor(screenX / CELL_WIDTH);
    const row = Math.floor(screenY / CELL_HEIGHT);
    if (
      column < 0 ||
      column >= GRID_COLUMNS ||
      row < 0 ||
      row >= GRID_ROWS
    ) {
      continue;
    }

    const index = row * GRID_COLUMNS + column;
    const current = cells[index];
    if (current && current.depth >= depth) continue;
    cells[index] = {
      depth,
      kind: "handle",
      light: Math.max(0.24, Math.min(0.96, 0.58 + depth * 0.2)),
      seed: point.seed,
    };
  }
}

function glyphForCell(cell: GridCell) {
  const dither = (hash(cell.seed) * 2 - 1) * 0.22;
  const intensity = Math.max(0.08, Math.min(1, cell.light * 0.78 + dither));
  const glyphIndex = Math.min(
    GLYPHS.length - 1,
    Math.max(1, Math.floor(intensity * GLYPHS.length)),
  );
  return GLYPHS[glyphIndex];
}

function colorForCell(cell: GridCell) {
  if (cell.kind === "logo") return "#f4f8e9";
  const lightness = 27 + cell.light * 34;
  const saturation = cell.kind === "side" ? 48 : 62;
  return `hsl(87 ${saturation}% ${lightness}%)`;
}

function drawGrid(
  context: CanvasRenderingContext2D,
  cells: Array<GridCell | null>,
) {
  for (let row = 0; row < GRID_ROWS; row += 1) {
    for (let column = 0; column < GRID_COLUMNS; column += 1) {
      const cell = cells[row * GRID_COLUMNS + column];
      if (!cell) continue;
      context.fillStyle = colorForCell(cell);
      context.fillText(
        glyphForCell(cell),
        column * CELL_WIDTH + CELL_WIDTH / 2,
        row * CELL_HEIGHT + CELL_HEIGHT / 2,
      );
    }
  }
}

export default function ShopifyAsciiCanvas({
  active,
  volume,
}: {
  active: boolean;
  volume: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
    if (active && volume > 0 && audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume().catch(() => undefined);
    }
  }, [active, volume]);

  useEffect(() => {
    const canvas = canvasRef.current as FrameCanvas | null;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context || !active) return;

    const cells = new Array<GridCell | null>(GRID_COLUMNS * GRID_ROWS).fill(null);
    const handlePoints = createHandlePoints();
    const logoMask = createLogoMask();
    const audioContext = new AudioContext();
    const soundOutput = audioContext.createGain();
    const soundRequestController = new AbortController();
    const saleSound = fetch(SALE_SOUND_URL, {
      signal: soundRequestController.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Shopify sale sound failed to load");
        return response.arrayBuffer();
      })
      .then((soundData) => audioContext.decodeAudioData(soundData))
      .catch(() => null);
    soundOutput.connect(audioContext.destination);
    audioContextRef.current = audioContext;
    void audioContext.resume().catch(() => undefined);
    const startedAt = performance.now();
    let completedRotations = 0;
    let animationFrame = 0;
    let lastFrame = 0;

    context.font = '700 10px "Courier New", Consolas, monospace';
    context.textAlign = "center";
    context.textBaseline = "middle";

    const draw = (now: number) => {
      animationFrame = requestAnimationFrame(draw);
      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;

      const elapsed = now - startedAt;
      const rotationProgress = elapsed * ROTATION_SPEED;
      const rotation = rotationProgress + 0.34;
      const nextCompletedRotations = Math.floor(rotationProgress / FULL_ROTATION);
      if (nextCompletedRotations > completedRotations) {
        completedRotations = nextCompletedRotations;
        if (volumeRef.current > 0) {
          const triggerSaleSound = () => {
            void saleSound.then((sound) => {
              if (sound) {
                playSaleSound(
                  audioContext,
                  soundOutput,
                  sound,
                  volumeRef.current,
                );
              }
            });
          };
          if (audioContext.state === "running") {
            triggerSaleSound();
          } else {
            void audioContext
              .resume()
              .then(triggerSaleSound)
              .catch(() => undefined);
          }
        }
      }
      const bob = Math.sin(elapsed * 0.00115) * 0.055;
      cells.fill(null);
      writeBodyToGrid(cells, rotation, bob, logoMask);
      writeHandleToGrid(cells, handlePoints, rotation, bob);

      context.fillStyle = "#020602";
      context.fillRect(0, 0, WIDTH, HEIGHT);
      context.font = '700 10px "Courier New", Consolas, monospace';
      drawGrid(context, cells);
      canvas.__crtFrameVersion = (canvas.__crtFrameVersion ?? 0) + 1;
    };

    animationFrame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrame);
      soundRequestController.abort();
      audioContextRef.current = null;
      void audioContext.close().catch(() => undefined);
    };
  }, [active]);

  return (
    <canvas
      id={SHOPIFY_ASCII_CANVAS_ID}
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: "-10000px",
        width: 1,
        height: 1,
        pointerEvents: "none",
      }}
    />
  );
}
