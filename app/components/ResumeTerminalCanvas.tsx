import { useEffect, useRef } from "react";

export const RESUME_TERMINAL_CANVAS_ID = "resume-terminal-canvas";
export const RESUME_TERMINAL_MEDIA = `canvas:${RESUME_TERMINAL_CANVAS_ID}`;

const WIDTH = 720;
const HEIGHT = 562;
const FONT_SIZE = 13;
const LINE_HEIGHT = 19;
const PAGE_DURATION = 6500;
const FRAME_INTERVAL = 1000 / 10;

type Tone = "prompt" | "heading" | "title" | "meta" | "body" | "dim";
type TerminalLine = { text: string; tone?: Tone };
type FrameCanvas = HTMLCanvasElement & { __crtFrameVersion?: number };

const pages: TerminalLine[][] = [
  [
    { text: "$ cat afaq_virk.resume", tone: "prompt" },
    { text: "", tone: "body" },
    { text: "AFAQ VIRK", tone: "title" },
    { text: "613-360-3067 | afaq@mathematech.ca", tone: "meta" },
    {
      text: "linkedin.com/in/afaqmvirk | github.com/afaqmvirk",
      tone: "meta",
    },
    { text: "", tone: "body" },
    { text: "[EDUCATION]", tone: "heading" },
    { text: "Carleton University | Ottawa, ON", tone: "title" },
    {
      text: "Bachelor of Computer Science (Honours), Industrial Applications Stream.",
      tone: "body",
    },
    { text: "4.0 GPA | Sep. 2024 - Apr. 2027", tone: "meta" },
    { text: "", tone: "body" },
    { text: "[EXPERIENCE]", tone: "heading" },
    {
      text: "Software Engineering Intern (Dev Degree) | Aug 2024 - Present",
      tone: "title",
    },
    { text: "Shopify | Ottawa, ON (Remote)", tone: "meta" },
    {
      text: "- Selected as 1 of ~30 nationally for Shopify's Dev Degree program",
      tone: "body",
    },
    { text: "  with full tuition sponsorship.", tone: "body" },
    {
      text: "- Prototyped a gamified mobile shopping experience in React Native,",
      tone: "body",
    },
    {
      text: "  implementing real-time state, animations, and event-driven UI",
      tone: "body",
    },
    {
      text: "  flows integrated with Shopify storefront APIs.",
      tone: "body",
    },
    {
      text: "- Maintained and extended analytics dashboards used by merchants,",
      tone: "body",
    },
    {
      text: "  improving data visualization reliability.",
      tone: "body",
    },
    {
      text: "- Extended ShopifyQL by adding new query capabilities and backend handlers,",
      tone: "body",
    },
    { text: "  enabling richer metric exploration.", tone: "body" },
  ],
  [
    { text: "$ resume --page experience", tone: "prompt" },
    {
      text: "- Updated data ingestion and transformation pipelines powering",
      tone: "body",
    },
    {
      text: "  AI-driven internal agents, improving schema consistency and",
      tone: "body",
    },
    { text: "  downstream query accuracy.", tone: "body" },
    { text: "", tone: "body" },
    { text: "Founder, Lead Educator | May 2021 - Present", tone: "title" },
    { text: "MathemaTech | Remote", tone: "meta" },
    {
      text: "- Delivered 3,800+ hours of 1-on-1 tutoring in mathematics and",
      tone: "body",
    },
    { text: "  computer science to 120+ students.", tone: "body" },
    { text: "- Building AI-powered web tools to fully automate teaching.", tone: "body" },
    {
      text: "- Created and marketed educational content enjoyed by over 700,000",
      tone: "body",
    },
    { text: "  students and educators.", tone: "body" },
    { text: "", tone: "body" },
    { text: "Member, Board of Trustees | Aug. 2023 - Jul. 2024", tone: "title" },
    { text: "Upper Canada District School Board | Brockville, ON", tone: "meta" },
    {
      text: "- Elected to represent over 27,000 students across Eastern Ontario",
      tone: "body",
    },
    { text: "  region.", tone: "body" },
    {
      text: "- Led discussions on STEM education initiatives, AI integration in",
      tone: "body",
    },
    { text: "  classrooms, and pedagogy.", tone: "body" },
    {
      text: "- Streamlined election procedures and enhanced social media",
      tone: "body",
    },
    { text: "  marketing strategies.", tone: "body" },
    { text: "", tone: "body" },
    { text: "[PROJECTS]", tone: "heading" },
  ],
  [
    { text: "$ resume --page projects", tone: "prompt" },
    { text: "", tone: "body" },
    { text: "LoRaWATSGoingOn | Jan 2026", tone: "title" },
    { text: "FastAPI, SQLite, JavaScript, LoRaWAN", tone: "meta" },
    {
      text: "- Built a LoRaWAN dashboard ingesting ChirpStack JSON into SQLite",
      tone: "body",
    },
    { text: "  for device, gateway, and site analytics.", tone: "body" },
    {
      text: "- Won 1st Place at the SSi Canada x Carleton Computer Networks",
      tone: "body",
    },
    { text: "  Hackathon.", tone: "body" },
    { text: "", tone: "body" },
    { text: "Donair.tech | Jan 2026", tone: "title" },
    { text: "TypeScript, Next.js, Supabase, Solana Pay", tone: "meta" },
    {
      text: "- Built an agentic crowdfunding platform using vector search over",
      tone: "body",
    },
    {
      text: "  110,000+ donation records, real-time QR donations through Solana,",
      tone: "body",
    },
    { text: "  and AI-scored lead tracking.", tone: "body" },
    {
      text: "- Developed for the Talsom Challenge and pro-bono support for",
      tone: "body",
    },
    { text: "  La Maison du Père.", tone: "body" },
    { text: "", tone: "body" },
    { text: "K.A.R.E.N | Jan 2026", tone: "title" },
    { text: "SystemVerilog, FPGA, Tcl, Python, Vivado", tone: "meta" },
    {
      text: "- Built an FPGA system with HDMI video, keyboard input, audio I/O,",
      tone: "body",
    },
    { text: "  and mode-switching state machines.", tone: "body" },
    {
      text: "- Developed for the ROSS FPGA Challenge at uOttaHack 2026.",
      tone: "body",
    },
  ],
  [
    { text: "$ resume --page projects+skills", tone: "prompt" },
    { text: "", tone: "body" },
    { text: "elECHOlocation | 2023", tone: "title" },
    { text: "Arduino, C++, Ultrasonic Sensors", tone: "meta" },
    {
      text: "- Engineered an ultrasonic navigation aid for visually impaired users.",
      tone: "body",
    },
    {
      text: "- Won $6,000+ at Canada-Wide Science Fair and Best Delegation at",
      tone: "body",
    },
    { text: "  MILSET International in Mexico.", tone: "body" },
    { text: "", tone: "body" },
    { text: "[TECHNICAL SKILLS]", tone: "heading" },
    {
      text: "Languages: Rust, Python, Java, C, C++, TypeScript, SQL, Verilog,",
      tone: "title",
    },
    { text: "           Visual Basic, R", tone: "body" },
    {
      text: "Frameworks: React, React Native, Ruby on Rails, FastAPI, Next.js,",
      tone: "title",
    },
    { text: "            Unity, DSPy, LangChain", tone: "body" },
    {
      text: "Data & Infra: SQLite, PostgreSQL (pgvector), BigQuery, ETL pipelines,",
      tone: "title",
    },
    { text: "              REST APIs, WebSockets", tone: "body" },
    {
      text: "Systems: LoRaWAN, Embedded Systems, Digital Logic, HDMI/Video Timing,",
      tone: "title",
    },
    { text: "         State Machines", tone: "body" },
    { text: "Tools: Git, Docker, GCP, Linux, Vivado, Blender", tone: "title" },
    { text: "", tone: "body" },
    { text: "$ _", tone: "prompt" },
  ],
];

const palette: Record<Tone, string> = {
  prompt: "#62f6a8",
  heading: "#63d7ff",
  title: "#ffd166",
  meta: "#c59cff",
  body: "#e4edf2",
  dim: "#78909c",
};

function drawTerminal(
  context: CanvasRenderingContext2D,
  pageIndex: number,
  cursorVisible: boolean,
) {
  context.fillStyle = "#05090d";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = "#0a1118";
  context.fillRect(32, 19, 656, 524);
  context.strokeStyle = "#345064";
  context.lineWidth = 2;
  context.strokeRect(32, 19, 656, 524);

  context.fillStyle = "#142431";
  context.fillRect(34, 21, 652, 32);
  context.fillStyle = "#ff5f57";
  context.fillRect(47, 32, 9, 9);
  context.fillStyle = "#febc2e";
  context.fillRect(64, 32, 9, 9);
  context.fillStyle = "#28c840";
  context.fillRect(81, 32, 9, 9);

  context.font = `${FONT_SIZE}px "Menlo-Regular", Menlo, Consolas, monospace`;
  context.textBaseline = "alphabetic";
  context.textAlign = "left";
  context.fillStyle = palette.dim;
  context.fillText("afaq@homepage: ~/resume", 108, 41);

  const lines = pages[pageIndex];
  lines.forEach((line, index) => {
    context.fillStyle = palette[line.tone ?? "body"];
    const text =
      pageIndex === pages.length - 1 && index === lines.length - 1 && !cursorVisible
        ? "$  "
        : line.text;
    context.fillText(text, 49, 76 + index * LINE_HEIGHT);
  });

  context.fillStyle = "#0d1922";
  context.fillRect(34, 518, 652, 23);
  context.fillStyle = palette.dim;
  context.fillText(
    `resume.txt  |  page ${pageIndex + 1}/${pages.length}  |  auto-page`,
    49,
    534,
  );
}

const hiddenCanvasStyle = {
  position: "fixed",
  top: 0,
  left: "-10000px",
  width: 1,
  height: 1,
  pointerEvents: "none",
} as const;

export default function ResumeTerminalCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current as FrameCanvas | null;
    const context = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !context) return;

    let animationFrame = 0;
    let lastFrame = 0;
    const startedAt = performance.now();

    const draw = (now: number) => {
      if (now - lastFrame < FRAME_INTERVAL) return;
      lastFrame = now;

      const elapsed = Math.max(0, now - startedAt);
      const pageIndex = active
        ? Math.floor(elapsed / PAGE_DURATION) % pages.length
        : 0;
      const cursorVisible = Math.floor(elapsed / 500) % 2 === 0;
      drawTerminal(context, pageIndex, cursorVisible);
      canvas.__crtFrameVersion = (canvas.__crtFrameVersion ?? 0) + 1;
    };

    const tick = (now: number) => {
      draw(now);
      animationFrame = requestAnimationFrame(tick);
    };
    const drawFirstFrame = () => draw(performance.now() + FRAME_INTERVAL);
    void document.fonts
      .load(`${FONT_SIZE}px "Menlo-Regular"`)
      .then(drawFirstFrame)
      .catch(() => drawFirstFrame());
    drawFirstFrame();
    if (active) animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [active]);

  return (
    <canvas
      id={RESUME_TERMINAL_CANVAS_ID}
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      aria-hidden="true"
      style={hiddenCanvasStyle}
    />
  );
}
