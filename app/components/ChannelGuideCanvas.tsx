import { useEffect, useRef } from "react";

export default function ChannelGuideCanvas({ channels, offset, focused, active }: {
  channels: readonly { label: string; year: number }[];
  offset: number; focused: number; active: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) {
      window.dispatchEvent(new CustomEvent("crt-guide-change", { detail: {} }));
      return;
    }
    let cancelled = false;
    const draw = () => {
      const canvas = ref.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || cancelled) return;
      ctx.clearRect(0, 0, 960, 750);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(7, 16, 27, 0.86)";
      ctx.fillRect(0, 0, 960, 750);
      ctx.font = '500 34px "Geist Pixel Square", monospace';
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "#2255ff";
      ctx.shadowBlur = 3;
      ctx.fillText("CHANNEL GUIDE", 64, 85);
      ctx.font = '500 24px "Geist Pixel Square", monospace';
      ctx.fillText("×", 870, 85);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 135, 960, 480);
      ctx.clip();
      channels.forEach(({ label, year }, index) => {
        const y = 135 + (index - offset) * 60;
        if (y < 75 || y > 615) return;
        if (index === focused) {
          ctx.fillStyle = "rgba(23, 62, 139, 0.84)";
          ctx.fillRect(50, y, 860, 60);
        }
        ctx.fillStyle = "#fff";
        ctx.font = '500 28px "Geist Pixel Square", monospace';
        ctx.fillText(String(index + 1).padStart(2, "0"), 70, y + 40);
        ctx.fillText(label, 150, y + 40, 620);
        ctx.textAlign = "right";
        ctx.fillText(String(year), 890, y + 40);
        ctx.textAlign = "left";
      });
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.font = '500 22px "Geist Pixel Square", monospace';
      (canvas as HTMLCanvasElement & { __crtFrameVersion?: number }).__crtFrameVersion =
        ((canvas as HTMLCanvasElement & { __crtFrameVersion?: number }).__crtFrameVersion ?? 0) + 1;
      window.dispatchEvent(new CustomEvent("crt-guide-change", { detail: { canvas } }));
    };
    draw();
    void document.fonts.load('500 28px "Geist Pixel Square"').then(draw);
    return () => { cancelled = true; };
  }, [channels, offset, focused, active]);
  return <canvas id="channel-guide" ref={ref} width={960} height={750} aria-hidden="true"
    style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }} />;
}
