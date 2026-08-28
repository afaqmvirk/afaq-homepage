import { useEffect, useRef } from "react";

type SocialName = "instagram" | "linkedin" | "github" | "x (twitter)" | "kahoot";

type SocialSpec = {
  name: SocialName;
  canvasId: string;
  icon: string;
  logoSize: number;
  start: { x: number; y: number };
  velocity: { x: number; y: number };
  background: readonly [string, string, ...string[]];
};

type FrameCanvas = HTMLCanvasElement & { __crtFrameVersion?: number };

const WIDTH = 720;
const HEIGHT = 562;
const FOOTER_HEIGHT = 82;
const BOUNCE_MARGIN = -5;
const FRAME_INTERVAL = 1000 / 30;
const MIN_BOUNCE_SPEED = 92;
const MAX_BOUNCE_SPEED = 178;

const socialSpecs: readonly SocialSpec[] = [
  {
    name: "instagram",
    canvasId: "social-screensaver-instagram",
    icon: "/instagram.svg",
    logoSize: 150,
    start: { x: 76, y: 55 },
    velocity: { x: 142, y: 108 },
    background: ["#ffbd69", "#f43b57", "#8b35ca"],
  },
  {
    name: "linkedin",
    canvasId: "social-screensaver-linkedin",
    icon: "/linkedin.svg",
    logoSize: 148,
    start: { x: 452, y: 68 },
    velocity: { x: -136, y: 112 },
    background: ["#1475c4", "#064a86"],
  },
  {
    name: "github",
    canvasId: "social-screensaver-github",
    icon: "/github.svg",
    logoSize: 156,
    start: { x: 118, y: 235 },
    velocity: { x: 132, y: -116 },
    background: ["#20262d", "#6341a0"],
  },
  {
    name: "x (twitter)",
    canvasId: "social-screensaver-x",
    icon: "/x.svg",
    logoSize: 158,
    start: { x: 442, y: 220 },
    velocity: { x: -146, y: -104 },
    background: ["#26364b", "#03060c"],
  },
  {
    name: "kahoot",
    canvasId: "social-screensaver-kahoot",
    icon: "/kahoot.png",
    logoSize: 164,
    start: { x: 260, y: 82 },
    velocity: { x: 138, y: 118 },
    background: ["#49199e", "#7130e6", "#3470d6"],
  },
];

export const SOCIAL_SCREENSAVER_MEDIA: Record<SocialName, string> = {
  instagram: "canvas:social-screensaver-instagram",
  linkedin: "canvas:social-screensaver-linkedin",
  github: "canvas:social-screensaver-github",
  "x (twitter)": "canvas:social-screensaver-x",
  kahoot: "canvas:social-screensaver-kahoot",
};

const hiddenCanvasStyle = {
  position: "fixed",
  top: 0,
  left: "-10000px",
  width: 1,
  height: 1,
  pointerEvents: "none",
} as const;

function createWhiteLogo(image: HTMLImageElement) {
  const logo = document.createElement("canvas");
  const context = logo.getContext("2d");
  const sourceWidth = Math.max(1, image.naturalWidth);
  const sourceHeight = Math.max(1, image.naturalHeight);
  const longestSide = 512;
  const scale = longestSide / Math.max(sourceWidth, sourceHeight);

  logo.width = Math.max(1, Math.round(sourceWidth * scale));
  logo.height = Math.max(1, Math.round(sourceHeight * scale));
  if (!context) return logo;

  context.drawImage(image, 0, 0, logo.width, logo.height);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = "#fff";
  context.fillRect(0, 0, logo.width, logo.height);
  return logo;
}

function fillBackground(
  context: CanvasRenderingContext2D,
  colors: SocialSpec["background"],
) {
  const gradient = context.createLinearGradient(0, HEIGHT, WIDTH, 0);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawFrame(
  canvas: FrameCanvas,
  context: CanvasRenderingContext2D,
  spec: SocialSpec,
  logo: HTMLCanvasElement | null,
  x: number,
  y: number,
) {
  fillBackground(context, spec.background);

  if (logo) {
    const scale = spec.logoSize / Math.max(logo.width, logo.height);
    const logoWidth = logo.width * scale;
    const logoHeight = logo.height * scale;
    const insetX = (spec.logoSize - logoWidth) / 2;
    const insetY = (spec.logoSize - logoHeight) / 2;

    context.save();
    context.shadowColor = "rgba(0, 0, 0, 0.18)";
    context.shadowBlur = 12;
    context.shadowOffsetY = 4;
    context.drawImage(logo, x + insetX, y + insetY, logoWidth, logoHeight);
    context.restore();
  }

  const footerTop = HEIGHT - FOOTER_HEIGHT;
  const footerShade = context.createLinearGradient(0, footerTop, 0, HEIGHT);
  footerShade.addColorStop(0, "rgba(0, 0, 0, 0)");
  footerShade.addColorStop(0.35, "rgba(0, 0, 0, 0.08)");
  footerShade.addColorStop(1, "rgba(0, 0, 0, 0.2)");
  context.fillStyle = footerShade;
  context.fillRect(0, footerTop, WIDTH, FOOTER_HEIGHT);

  context.save();
  context.fillStyle = "#fff";
  context.font = '700 40px Inter, "Segoe UI", Arial, sans-serif';
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.shadowColor = "rgba(0, 0, 0, 0.26)";
  context.shadowBlur = 8;
  context.shadowOffsetY = 2;
  context.fillText("@afaqmvirk", WIDTH / 2, HEIGHT - 4);
  context.restore();

  canvas.__crtFrameVersion = (canvas.__crtFrameVersion ?? 0) + 1;
}

function variedVelocity(velocity: number) {
  const direction = velocity < 0 ? -1 : 1;
  const variation = 0.84 + Math.random() * 0.32;
  const speed = Math.min(
    MAX_BOUNCE_SPEED,
    Math.max(MIN_BOUNCE_SPEED, Math.abs(velocity) * variation),
  );
  return direction * speed;
}

function SocialScreensaverCanvas({
  spec,
  active,
}: {
  spec: SocialSpec;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current as FrameCanvas | null;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context || !active) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const logoImage = new Image();
    logoImage.decoding = "async";
    let logo: HTMLCanvasElement | null = null;
    let animationFrame = 0;
    let lastFrame = performance.now();
    let x = reduceMotion
      ? (WIDTH - spec.logoSize) / 2
      : Math.min(spec.start.x, WIDTH - BOUNCE_MARGIN - spec.logoSize);
    let y = reduceMotion
      ? (HEIGHT - spec.logoSize) / 2
      : Math.min(
          spec.start.y,
          HEIGHT - BOUNCE_MARGIN - spec.logoSize,
        );
    let velocityX = spec.velocity.x;
    let velocityY = spec.velocity.y;

    const maxX = WIDTH - BOUNCE_MARGIN - spec.logoSize;
    const maxY = HEIGHT - BOUNCE_MARGIN - spec.logoSize;

    const render = (now: number) => {
      animationFrame = window.requestAnimationFrame(render);
      const elapsed = now - lastFrame;
      if (elapsed < FRAME_INTERVAL) return;
      lastFrame = now;

      if (!reduceMotion) {
        const delta = Math.min(elapsed, 64) / 1000;
        x += velocityX * delta;
        y += velocityY * delta;

        if (x <= BOUNCE_MARGIN) {
          x = BOUNCE_MARGIN;
          velocityX = Math.abs(velocityX);
          velocityY = variedVelocity(velocityY);
        } else if (x >= maxX) {
          x = maxX;
          velocityX = -Math.abs(velocityX);
          velocityY = variedVelocity(velocityY);
        }

        if (y <= BOUNCE_MARGIN) {
          y = BOUNCE_MARGIN;
          velocityY = Math.abs(velocityY);
          velocityX = variedVelocity(velocityX);
        } else if (y >= maxY) {
          y = maxY;
          velocityY = -Math.abs(velocityY);
          velocityX = variedVelocity(velocityX);
        }
      }

      drawFrame(canvas, context, spec, logo, x, y);
    };

    const handleLogoLoad = () => {
      logo = createWhiteLogo(logoImage);
      drawFrame(canvas, context, spec, logo, x, y);
    };
    logoImage.addEventListener("load", handleLogoLoad);
    logoImage.src = spec.icon;

    drawFrame(canvas, context, spec, null, x, y);
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      logoImage.removeEventListener("load", handleLogoLoad);
    };
  }, [active, spec]);

  return (
    <canvas
      id={spec.canvasId}
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      aria-hidden="true"
      style={hiddenCanvasStyle}
    />
  );
}

export default function SocialScreensaverCanvases({
  activeSocial,
}: {
  activeSocial: string;
}) {
  return socialSpecs.map((spec) => (
    <SocialScreensaverCanvas
      key={spec.name}
      spec={spec}
      active={activeSocial === spec.name}
    />
  ));
}
