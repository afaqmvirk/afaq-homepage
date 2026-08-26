import { useEffect, useRef } from "react";

export const HERO_PREVIEW_CANVAS_ID = "hero-preview-canvas";
export const HERO_PREVIEW_MEDIA = `canvas:${HERO_PREVIEW_CANVAS_ID}`;

const WIDTH = 720;
const HEIGHT = 562;
const FRAME_INTERVAL = 1000 / 24;
const PHRASE_DURATION = 5000;
const ORIGINAL_HERO_WIDTH = 1280;
const ORIGINAL_TYPE_SCALE = WIDTH / ORIGINAL_HERO_WIDTH;
const HEY_FONT_SIZE = 48 * ORIGINAL_TYPE_SCALE;
const AFAQ_FONT_SIZE = 192 * ORIGINAL_TYPE_SCALE;
const VIRK_FONT_SIZE = 168 * ORIGINAL_TYPE_SCALE;
const PHRASE_FONT_SIZE = 48 * ORIGINAL_TYPE_SCALE;
const HEY_BASELINE = 180;
const AFAQ_BASELINE = 280;
const VIRK_BASELINE = 363;
const PHRASE_BASELINE = 403;
const phrases = [
  "Full-Stack Developer",
  "Technical Educator",
  "building something cool",
];

function createImage(src: string) {
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  return image;
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
) {
  const scale = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
}

function drawRotatingImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  centerY: number,
  size: number,
  angle: number,
) {
  context.save();
  context.translate(centerX, centerY);
  context.rotate(angle);
  context.drawImage(image, -size / 2, -size / 2, size, size);
  context.restore();
}

function visiblePhrase(elapsed: number) {
  const phraseIndex = Math.floor(elapsed / PHRASE_DURATION) % phrases.length;
  const phrase = phrases[phraseIndex];
  const phase = elapsed % PHRASE_DURATION;
  const typeUntil = 1250;
  const holdUntil = 3500;
  const deleteUntil = 4450;

  let characterCount = phrase.length;
  if (phase < typeUntil) {
    characterCount = Math.floor((phase / typeUntil) * (phrase.length + 1));
  } else if (phase >= holdUntil) {
    characterCount = Math.max(
      0,
      Math.ceil(
        phrase.length * (1 - (phase - holdUntil) / (deleteUntil - holdUntil)),
      ),
    );
  }

  return phrase.slice(0, characterCount);
}

type FrameCanvas = HTMLCanvasElement & { __crtFrameVersion?: number };

export default function HeroPreviewCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current as FrameCanvas | null;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context || !active) return;

    const background = createImage("/previews/hero-background.webp");
    const gear = createImage("/gear.png");
    const htmlTag = createImage("/htmltag.png");
    const startedAt = performance.now();
    let animationFrame = 0;
    let lastFrame = 0;

    const draw = (now: number) => {
      animationFrame = requestAnimationFrame(draw);
      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;

      const elapsed = Math.max(0, now - startedAt);
      const elapsedSeconds = elapsed / 1000;

      context.fillStyle = "#08766d";
      context.fillRect(0, 0, WIDTH, HEIGHT);
      if (background.complete && background.naturalWidth > 0) {
        drawCover(context, background);
      }

      context.save();
      context.globalCompositeOperation = "overlay";
      context.globalAlpha = 0.82;
      if (gear.complete && gear.naturalWidth > 0) {
        const angle = elapsedSeconds * 0.44;
        drawRotatingImage(context, gear, 75, 10, 250, angle);
        drawRotatingImage(context, gear, 670, 540, 225, angle);
      }
      if (htmlTag.complete && htmlTag.naturalWidth > 0) {
        const bob = Math.sin(elapsedSeconds * 1.25) * 5;
        context.drawImage(htmlTag, 548, 302 + bob, 142, 130);
      }
      context.restore();

      context.fillStyle = "#fff";
      context.textAlign = "center";
      context.textBaseline = "alphabetic";

      context.font = `700 ${HEY_FONT_SIZE}px Inter, "Segoe UI", sans-serif`;
      context.fillText("Hey! I'm", WIDTH / 2, HEY_BASELINE);

      context.font = `400 ${AFAQ_FONT_SIZE}px "Dela Gothic One", "Arial Black", sans-serif`;
      context.fillText("AFAQ", WIDTH / 2, AFAQ_BASELINE);
      context.font = `400 ${VIRK_FONT_SIZE}px "Dela Gothic One", "Arial Black", sans-serif`;
      context.fillText("VIRK—", WIDTH / 2, VIRK_BASELINE);

      const phrase = visiblePhrase(elapsed);
      const cursorVisible = Math.floor(elapsed / 500) % 2 === 0;
      context.font = `800 ${PHRASE_FONT_SIZE}px "Menlo-Regular", Menlo, Consolas, monospace`;
      context.fillText(phrase, WIDTH / 2, PHRASE_BASELINE);
      if (cursorVisible) {
        const phraseWidth = context.measureText(phrase).width;
        context.textAlign = "left";
        context.fillText(
          "|",
          WIDTH / 2 + phraseWidth / 2 + 2,
          PHRASE_BASELINE,
        );
        context.textAlign = "center";
      }

      canvas.__crtFrameVersion = (canvas.__crtFrameVersion ?? 0) + 1;
    };

    void Promise.all([
      document.fonts.load(`700 ${HEY_FONT_SIZE}px Inter`),
      document.fonts.load(`400 ${AFAQ_FONT_SIZE}px "Dela Gothic One"`),
      document.fonts.load(`800 ${PHRASE_FONT_SIZE}px "Menlo-Regular"`),
    ]).catch(() => undefined);

    animationFrame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationFrame);
  }, [active]);

  return (
    <canvas
      id={HERO_PREVIEW_CANVAS_ID}
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
