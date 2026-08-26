import { useEffect, useRef } from "react";
import type { InstancedMesh, MeshPhongMaterial, Scene } from "three";

export const PIPES_SCREENSAVER_CANVAS_ID = "pipes-screensaver-canvas";
export const PIPES_SCREENSAVER_MEDIA =
  "canvas:" + PIPES_SCREENSAVER_CANVAS_ID;
export const PIPES_SCREENSAVER_MUSIC = "/audio/electric-zoo.mp3";

const WIDTH = 720;
const HEIGHT = 540;
const FRAME_INTERVAL = 1000 / 24;
const PIPE_RADIUS = 0.2;
const BALL_RADIUS = PIPE_RADIUS * 1.5;
const CAMERA_FOV = 38;
const AMBIENT_CAMERA_DISTANCE = 14;
const AMBIENT_CAMERA_NEAR = 0.05;
const AMBIENT_GRID_STEP = 0.5;
const AMBIENT_PIPE_STEPS = 400;
const AMBIENT_STEP_INTERVAL = 15;
const AMBIENT_PIPE_START_DELAYS = [0, 450, 1100, 1900];
const AMBIENT_PIPE_START_DEPTHS = [2, 3, 0, -2];

const AMBIENT_DISSOLVE_START = 8200;
const LETTER_PHASE_START = 9800;
const LETTER_DISSOLVE_START = 21500;
const CYCLE_DURATION = 18500;

type P2 = [number, number];
type P3 = [number, number, number];
type Segment = {
  from: P3;
  to: P3;
  color: number;
  revealAt: number;
};
type Joint = {
  at: P3;
  radius: number;
  color: number;
  revealAt: number;
};
type Plan = { segments: Segment[]; joints: Joint[] };
type ThreeModule = Pick<
  typeof import("three"),
  | "AmbientLight"
  | "Color"
  | "CylinderGeometry"
  | "DirectionalLight"
  | "InstancedMesh"
  | "Matrix4"
  | "MeshBasicMaterial"
  | "MeshPhongMaterial"
  | "OrthographicCamera"
  | "PerspectiveCamera"
  | "PlaneGeometry"
  | "Quaternion"
  | "Scene"
  | "SphereGeometry"
  | "SRGBColorSpace"
  | "Vector3"
  | "WebGLRenderer"
>;
type FrameCanvas = HTMLCanvasElement & { __crtFrameVersion?: number };
type Batch = { mesh: InstancedMesh; revealTimes: number[] };

const glyphs: Record<string, P2[][]> = {
  A: [
    [
      [0, 0],
      [2, 6],
    ],
    [
      [2, 6],
      [4, 0],
    ],
    [
      [1, 2.8],
      [3, 2.8],
    ],
  ],
  F: [
    [
      [0, 0],
      [0, 6],
    ],
    [
      [0, 6],
      [4, 6],
    ],
    [
      [0, 3.25],
      [3.25, 3.25],
    ],
  ],
  Q: [
    [
      [1, 0],
      [0, 1],
      [0, 5],
      [1, 6],
      [3, 6],
      [4, 5],
      [4, 1],
      [3, 0],
      [1, 0],
    ],
    [
      [2.4, 1.4],
      [4.35, -0.55],
    ],
  ],
  V: [
    [
      [0, 6],
      [2, 0],
    ],
    [
      [2, 0],
      [4, 6],
    ],
  ],
  I: [
    [
      [0, 6],
      [4, 6],
    ],
    [
      [2, 6],
      [2, 0],
    ],
    [
      [0, 0],
      [4, 0],
    ],
  ],
  R: [
    [
      [0, 0],
      [0, 6],
    ],
    [
      [0, 6],
      [3, 6],
      [4, 5],
      [4, 3.8],
      [3, 3],
      [0, 3],
    ],
    [
      [2.2, 3],
      [4.25, 0],
    ],
  ],
  K: [
    [
      [0, 0],
      [0, 6],
    ],
    [
      [0, 2.8],
      [4, 6],
    ],
    [
      [1.45, 4],
      [4.2, 0],
    ],
  ],
};

// Saturated but slightly muddy, like the original lit Phong materials.
const ambientColorPalette = [
  0x16bd2e, 0xd82b1f, 0xdf8b17, 0x158bc0, 0x873ea4, 0x14a890, 0xd25173,
  0x557dd8, 0xb875c9, 0xd0c52b, 0xed6d25, 0x4fc46a, 0x21a6d8, 0xe34d94,
  0x98b52a, 0x8b63d2,
];
const ambientColors = ambientColorPalette.slice(0, 4);
const letterColors = [
  0x1bc23a, 0xd9a11a, 0xd94325, 0x1699b6, 0xd86c18, 0x37a63e, 0x9b3b84,
  0x789f22,
];

function randomFromSeed(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function key(point: P3) {
  return point.join(",");
}

function direction(from: P3, to: P3): P3 {
  return [
    Math.sign(to[0] - from[0]),
    Math.sign(to[1] - from[1]),
    Math.sign(to[2] - from[2]),
  ];
}

function sameDirection(first: P3, second: P3) {
  return (
    first[0] === second[0] &&
    first[1] === second[1] &&
    first[2] === second[2]
  );
}

function createAmbientPlan(): Plan {
  const random = randomFromSeed(0xafac2026);
  const segments: Segment[] = [];
  const joints: Joint[] = [];
  const occupied = new Set<string>();
  const directions: P3[] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];

  const openStart = (depth: number): P3 => {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const point: P3 = [
        Math.round(random() * 18 - 9),
        Math.round(random() * 16 - 8),
        depth,
      ];
      if (!occupied.has(key(point))) return point;
    }
    return [0, 0, 0];
  };

  for (let pipe = 0; pipe < ambientColors.length; pipe += 1) {
    let position = openStart(AMBIENT_PIPE_START_DEPTHS[pipe]);
    let heading = directions[Math.floor(random() * directions.length)];
    occupied.add(key(position));
    joints.push({
      at: [...position],
      radius: BALL_RADIUS,
      color: pipe,
      revealAt: 120 + AMBIENT_PIPE_START_DELAYS[pipe],
    });

    for (let step = 0; step < AMBIENT_PIPE_STEPS; step += 1) {
      const candidates = [...directions].sort(() => random() - 0.5);
      if (step > 0 && random() < 0.54) candidates.unshift(heading);
      let next: P3 | undefined;
      let nextHeading: P3 | undefined;

      for (const candidate of candidates) {
        if (
          candidate[0] === -heading[0] &&
          candidate[1] === -heading[1] &&
          candidate[2] === -heading[2]
        ) {
          continue;
        }
        const proposed: P3 = [
          position[0] + candidate[0] * AMBIENT_GRID_STEP,
          position[1] + candidate[1] * AMBIENT_GRID_STEP,
          position[2] + candidate[2] * AMBIENT_GRID_STEP,
        ];
        if (
          proposed.some((coordinate) => Math.abs(coordinate) > 10) ||
          occupied.has(key(proposed))
        ) {
          continue;
        }
        next = proposed;
        nextHeading = candidate;
        break;
      }
      if (!next || !nextHeading) break;

      const revealAt =
        180 +
        step * AMBIENT_STEP_INTERVAL +
        AMBIENT_PIPE_START_DELAYS[pipe];
      if (!sameDirection(heading, nextHeading)) {
        joints.push({
          at: [...position],
          radius: random() < 0.27 ? BALL_RADIUS : PIPE_RADIUS,
          color: pipe,
          revealAt,
        });
      }
      segments.push({
        from: [...position],
        to: [...next],
        color: pipe,
        revealAt,
      });
      occupied.add(key(next));
      position = next;
      heading = nextHeading;
    }
  }
  return { segments, joints };
}

function orthogonalPath(from: P2, to: P2) {
  const points: P2[] = [[...from]];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const distance = Math.max(Math.abs(dx), Math.abs(dy));
  if (Math.abs(dx) < 0.001 || Math.abs(dy) < 0.001) {
    const steps = Math.max(1, Math.ceil(distance));
    for (let step = 1; step <= steps; step += 1) {
      points.push([
        from[0] + (dx * step) / steps,
        from[1] + (dy * step) / steps,
      ]);
    }
    return points;
  }

  // One-unit grid steps match the classic screensaver's lattice and keep
  // diagonals chunky instead of turning into strings of tiny joints.
  const steps = Math.max(1, Math.ceil(distance));
  let current: P2 = [...from];
  for (let step = 1; step <= steps; step += 1) {
    const target: P2 = [
      from[0] + (dx * step) / steps,
      from[1] + (dy * step) / steps,
    ];
    current = [target[0], current[1]];
    points.push(current);
    current = [target[0], target[1]];
    points.push(current);
  }
  return points;
}

function createLetterPlan(): Plan {
  const segments: Segment[] = [];
  const joints: Joint[] = [];
  const lines = [
    { text: "AFAQ", x: -10.3, y: 1.35 },
    { text: "VIRK", x: -10.3, y: -7.15 },
  ];
  let revealIndex = 0;
  let letterIndex = 0;

  for (const line of lines) {
    for (let index = 0; index < line.text.length; index += 1) {
      const letter = line.text[index];
      const offsetX = line.x + index * 5.45;
      for (const stroke of glyphs[letter] ?? []) {
        let previous: P3 | undefined;
        let previousHeading: P3 | undefined;
        let started = false;
        for (let pair = 0; pair < stroke.length - 1; pair += 1) {
          for (const point of orthogonalPath(stroke[pair], stroke[pair + 1])) {
            const current: P3 = [
              offsetX + point[0],
              line.y + point[1],
              (letterIndex % 2) * 0.1,
            ];
            if (previous) {
              const heading = direction(previous, current);
              const hasLength =
                Math.abs(current[0] - previous[0]) > 0.001 ||
                Math.abs(current[1] - previous[1]) > 0.001;
              if (hasLength) {
                const revealAt = 420 + revealIndex * 24;
                if (!started) {
                  joints.push({
                    at: [...previous],
                    radius: BALL_RADIUS,
                    color: letterIndex,
                    revealAt,
                  });
                  started = true;
                } else if (
                  previousHeading &&
                  !sameDirection(previousHeading, heading)
                ) {
                  joints.push({
                    at: [...previous],
                    radius: PIPE_RADIUS,
                    color: letterIndex,
                    revealAt,
                  });
                }
                segments.push({
                  from: [...previous],
                  to: [...current],
                  color: letterIndex,
                  revealAt,
                });
                revealIndex += 1;
                previousHeading = heading;
              }
            }
            previous = current;
          }
        }
        if (previous) {
          joints.push({
            at: [...previous],
            radius: BALL_RADIUS,
            color: letterIndex,
            revealAt: 420 + revealIndex * 24,
          });
        }
      }
      letterIndex += 1;
    }
  }
  return { segments, joints };
}

function createMaterials(THREE: ThreeModule, colors: number[]) {
  return colors.map((color) => {
    const emissive = new THREE.Color(color).multiplyScalar(0.3);
    return new THREE.MeshPhongMaterial({
      color,
      emissive,
      specular: 0xa9fcff,
      shininess: 100,
    });
  });
}

function updateAmbientMaterialColors(
  materials: MeshPhongMaterial[],
  cycle: number,
) {
  const offset = (cycle * materials.length) % ambientColorPalette.length;
  materials.forEach((material, index) => {
    const color = ambientColorPalette[(offset + index) % ambientColorPalette.length];
    material.color.setHex(color);
    material.emissive.setHex(color).multiplyScalar(0.3);
  });
}

function upperBound(values: number[], time: number) {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (values[middle] <= time) low = middle + 1;
    else high = middle;
  }
  return low;
}

function addSegmentBatches(
  THREE: ThreeModule,
  scene: Scene,
  plans: Segment[],
  materials: MeshPhongMaterial[],
) {
  const geometry = new THREE.CylinderGeometry(
    PIPE_RADIUS,
    PIPE_RADIUS,
    1,
    10,
    4,
    true,
  );
  const batches: Batch[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  for (let color = 0; color < materials.length; color += 1) {
    const entries = plans
      .filter((plan) => plan.color % materials.length === color)
      .sort((a, b) => a.revealAt - b.revealAt);
    if (!entries.length) continue;
    const mesh = new THREE.InstancedMesh(
      geometry,
      materials[color],
      entries.length,
    );
    entries.forEach((entry, index) => {
      const from = new THREE.Vector3(...entry.from);
      const to = new THREE.Vector3(...entry.to);
      const delta = to.clone().sub(from);
      const midpoint = from.clone().add(to).multiplyScalar(0.5);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        up,
        delta.clone().normalize(),
      );
      const matrix = new THREE.Matrix4().compose(
        midpoint,
        quaternion,
        new THREE.Vector3(1, delta.length(), 1),
      );
      mesh.setMatrixAt(index, matrix);
    });
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    batches.push({
      mesh,
      revealTimes: entries.map((entry) => entry.revealAt),
    });
  }
  return { batches, geometry };
}

function addJointBatches(
  THREE: ThreeModule,
  scene: Scene,
  plans: Joint[],
  materials: MeshPhongMaterial[],
) {
  const geometry = new THREE.SphereGeometry(1, 8, 8);
  const batches: Batch[] = [];
  for (let color = 0; color < materials.length; color += 1) {
    const entries = plans
      .filter((plan) => plan.color % materials.length === color)
      .sort((a, b) => a.revealAt - b.revealAt);
    if (!entries.length) continue;
    const mesh = new THREE.InstancedMesh(
      geometry,
      materials[color],
      entries.length,
    );
    entries.forEach((entry, index) => {
      const matrix = new THREE.Matrix4().compose(
        new THREE.Vector3(...entry.at),
        new THREE.Quaternion(),
        new THREE.Vector3(entry.radius, entry.radius, entry.radius),
      );
      mesh.setMatrixAt(index, matrix);
    });
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    batches.push({
      mesh,
      revealTimes: entries.map((entry) => entry.revealAt),
    });
  }
  return { batches, geometry };
}

function reveal(batches: Batch[], time: number) {
  for (const batch of batches) {
    batch.mesh.count = time < 0 ? 0 : upperBound(batch.revealTimes, time);
  }
}

function createDissolve(THREE: ThreeModule) {
  const columns = 32;
  const rows = 24;
  const total = columns * rows;
  const geometry = new THREE.PlaneGeometry(
    WIDTH / columns + 1,
    HEIGHT / rows + 1,
  );
  const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
  material.toneMapped = false;
  const mesh = new THREE.InstancedMesh(geometry, material, total);
  const order = Array.from({ length: total }, (_, index) => index);
  const random = randomFromSeed(0xd15501);
  order.sort(() => random() - 0.5);
  order.forEach((cell, index) => {
    const column = cell % columns;
    const row = Math.floor(cell / columns);
    const matrix = new THREE.Matrix4().makeTranslation(
      -WIDTH / 2 + (column + 0.5) * (WIDTH / columns),
      HEIGHT / 2 - (row + 0.5) * (HEIGHT / rows),
      0,
    );
    mesh.setMatrixAt(index, matrix);
  });
  mesh.count = 0;
  mesh.frustumCulled = false;
  mesh.instanceMatrix.needsUpdate = true;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.OrthographicCamera(
    -WIDTH / 2,
    WIDTH / 2,
    HEIGHT / 2,
    -HEIGHT / 2,
    -1,
    1,
  );
  return { scene, camera, mesh, geometry, material, total };
}

function progress(time: number, start: number, end: number) {
  return Math.max(0, Math.min(1, (time - start) / (end - start)));
}

function startPipesScreensaver(canvas: FrameCanvas, THREE: ThreeModule) {
    // The construction and finish follow 1j01/pipes (MIT): grid walking,
    // cylinders, sphere joints, Phong materials, and its simple light rig.
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      // The CRT renderer samples this separate WebGL canvas on its next frame.
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(WIDTH, HEIGHT, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1);
    renderer.autoClear = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    scene.add(new THREE.AmbientLight(0x111111));
    const light = new THREE.DirectionalLight(0xffffff, 0.9);
    light.position.set(-1.2, 1.5, 0.5);
    scene.add(light);

    const camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      WIDTH / HEIGHT,
      AMBIENT_CAMERA_NEAR,
      100000,
    );
    const ambientPlan = createAmbientPlan();
    const letterPlan = createLetterPlan();
    const ambientMaterials = createMaterials(THREE, ambientColors);
    const nameMaterials = createMaterials(THREE, letterColors);
    const ambientSegments = addSegmentBatches(
      THREE,
      scene,
      ambientPlan.segments,
      ambientMaterials,
    );
    const ambientJoints = addJointBatches(
      THREE,
      scene,
      ambientPlan.joints,
      ambientMaterials,
    );
    const nameSegments = addSegmentBatches(
      THREE,
      scene,
      letterPlan.segments,
      nameMaterials,
    );
    const nameJoints = addJointBatches(
      THREE,
      scene,
      letterPlan.joints,
      nameMaterials,
    );
    const dissolve = createDissolve(THREE);
    const ambientCameraPosition = new THREE.Vector3(
      0,
      0,
      AMBIENT_CAMERA_DISTANCE,
    );
    const origin = new THREE.Vector3();
    const nameCenter = new THREE.Vector3(0, 0.1, 0);

    const startedAt = performance.now();
    let frame = 0;
    let lastFrame = 0;
    let colorCycle = -1;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;

      const elapsed = Math.max(0, now - startedAt);
      const cycleTime = elapsed % CYCLE_DURATION;
      const cycle = Math.floor(elapsed / CYCLE_DURATION);
      const showingName = cycleTime >= LETTER_PHASE_START;

      if (cycle !== colorCycle) {
        updateAmbientMaterialColors(ambientMaterials, cycle);
        colorCycle = cycle;
      }

      if (showingName) {
        reveal(ambientSegments.batches, -1);
        reveal(ambientJoints.batches, -1);
        reveal(nameSegments.batches, cycleTime - LETTER_PHASE_START);
        reveal(nameJoints.batches, cycleTime - LETTER_PHASE_START);
        camera.position.set(0, 0.1, 31);
        camera.lookAt(nameCenter);
      } else {
        reveal(ambientSegments.batches, cycleTime);
        reveal(ambientJoints.batches, cycleTime);
        reveal(nameSegments.batches, -1);
        reveal(nameJoints.batches, -1);
        camera.position.copy(ambientCameraPosition);
        camera.lookAt(origin);
      }

      renderer.clear();
      renderer.render(scene, camera);

      let dissolveAmount = 0;
      if (!showingName && cycleTime >= AMBIENT_DISSOLVE_START) {
        dissolveAmount = progress(
          cycleTime,
          AMBIENT_DISSOLVE_START,
          LETTER_PHASE_START,
        );
      } else if (cycleTime >= LETTER_DISSOLVE_START) {
        dissolveAmount = progress(
          cycleTime,
          LETTER_DISSOLVE_START,
          CYCLE_DURATION,
        );
      }
      dissolve.mesh.count = Math.floor(dissolve.total * dissolveAmount);
      if (dissolve.mesh.count) renderer.render(dissolve.scene, dissolve.camera);
      canvas.__crtFrameVersion = (canvas.__crtFrameVersion ?? 0) + 1;
    };

    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      ambientSegments.geometry.dispose();
      ambientJoints.geometry.dispose();
      nameSegments.geometry.dispose();
      nameJoints.geometry.dispose();
      ambientMaterials.forEach((material) => material.dispose());
      nameMaterials.forEach((material) => material.dispose());
      dissolve.geometry.dispose();
      dissolve.material.dispose();
      renderer.dispose();
    };
}

type PipesScreensaverCanvasProps = {
  active: boolean;
  volume: number;
};

export default function PipesScreensaverCanvas({
  active,
  volume,
}: PipesScreensaverCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const normalizedVolume = Math.max(0, Math.min(1, volume));
    audio.volume = normalizedVolume;
    audio.muted = normalizedVolume <= 0;

    if (!active) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    void audio.play().catch(() => {
      // A later turn of the volume dial provides another user gesture and
      // retries playback if the browser blocked the initial channel change.
    });
  }, [active, volume]);

  useEffect(() => {
    const canvas = canvasRef.current as FrameCanvas | null;
    if (!canvas || !active) return;

    let cancelled = false;
    let stopRenderer: (() => void) | undefined;
    void import("three").then((module) => {
      const THREE: ThreeModule = {
        AmbientLight: module.AmbientLight,
        Color: module.Color,
        CylinderGeometry: module.CylinderGeometry,
        DirectionalLight: module.DirectionalLight,
        InstancedMesh: module.InstancedMesh,
        Matrix4: module.Matrix4,
        MeshBasicMaterial: module.MeshBasicMaterial,
        MeshPhongMaterial: module.MeshPhongMaterial,
        OrthographicCamera: module.OrthographicCamera,
        PerspectiveCamera: module.PerspectiveCamera,
        PlaneGeometry: module.PlaneGeometry,
        Quaternion: module.Quaternion,
        Scene: module.Scene,
        SphereGeometry: module.SphereGeometry,
        SRGBColorSpace: module.SRGBColorSpace,
        Vector3: module.Vector3,
        WebGLRenderer: module.WebGLRenderer,
      };
      if (!cancelled) stopRenderer = startPipesScreensaver(canvas, THREE);
    });

    return () => {
      cancelled = true;
      stopRenderer?.();
    };
  }, [active]);

  return (
    <>
      <canvas
        id={PIPES_SCREENSAVER_CANVAS_ID}
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
      {/* Electric Zoo is instrumental, so there is no spoken content to caption. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={PIPES_SCREENSAVER_MUSIC}
        preload="auto"
        loop
        aria-hidden="true"
      />
    </>
  );
}
