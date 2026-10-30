import { useEffect, useRef } from "react";

export const WEBSITE_CAPTURE_MEDIA = "canvas:website-capture";

export default function WebsiteCaptureCanvas({ source }: { source?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!source) return;
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let frame = 0;
    let cancelled = false;
    const image = new Image();
    context.fillStyle = "#101010";
    context.fillRect(0, 0, canvas.width, canvas.height);
    const markFrame = () => {
      const texture = canvas as HTMLCanvasElement & { __crtFrameVersion?: number };
      texture.__crtFrameVersion = (texture.__crtFrameVersion ?? 0) + 1;
    };
    markFrame();
    image.onload = () => {
      if (cancelled) return;
      const started = performance.now();
      const viewportHeight = image.width * canvas.height / canvas.width;
      const travel = Math.max(0, image.height - viewportHeight);
      const duration = Math.max(14000, travel / 75 * 1000);
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const draw = (now: number) => {
        // Pause at either end, then scroll back up without an abrupt loop cut.
        const phase = (now - started) % (duration * 2 + 6000);
        const offset = phase < 3000 ? 0
          : phase < duration + 3000 ? (phase - 3000) / duration
          : phase < duration + 6000 ? 1
          : 1 - (phase - duration - 6000) / duration;
        context.drawImage(image, 0, reducedMotion ? 0 : offset * travel,
          image.width, Math.min(viewportHeight, image.height), 0, 0, canvas.width, canvas.height);
        markFrame();
        if (!reducedMotion) frame = requestAnimationFrame(draw);
      };
      draw(started);
    };
    image.src = source;
    return () => { cancelled = true; cancelAnimationFrame(frame); };
  }, [source]);
  return <canvas ref={ref} id="website-capture" width={960} height={750}
    aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} />;
}
