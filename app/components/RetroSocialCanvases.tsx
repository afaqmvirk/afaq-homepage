import { useEffect, useRef } from "react";

const WIDTH = 720;
const HEIGHT = 562;

const canvasIds = {
  Instagram: "retro-instagram-canvas",
  LinkedIn: "retro-linkedin-canvas",
  X: "retro-x-canvas",
  Devpost: "retro-devpost-canvas",
} as const;

export const RETRO_SOCIAL_MEDIA = {
  Instagram: `canvas:${canvasIds.Instagram}`,
  LinkedIn: `canvas:${canvasIds.LinkedIn}`,
  X: `canvas:${canvasIds.X}`,
  Devpost: `canvas:${canvasIds.Devpost}`,
} as const;

type FrameCanvas = HTMLCanvasElement & { __crtFrameVersion?: number };
type ImageMap = Record<string, HTMLImageElement>;

const imageSources = {
  avatar: "/previews/afaq-avatar.jpg",
  instagramAvatar: "/previews/instagram-avatar.jpg",
  instagram01: "/previews/instagram-post-01.jpg",
  instagram02: "/previews/instagram-post-02.jpg",
  instagram03: "/previews/instagram-post-03.jpg",
  instagram04: "/previews/instagram-post-04.jpg",
  instagram05: "/previews/instagram-post-05.jpg",
  instagram06: "/previews/instagram-post-06.jpg",
  instagram07: "/previews/instagram-post-07.jpg",
  bobby: "/previews/devpost-bobby.png",
  purplePages: "/previews/devpost-purple-pages.jpg",
  logiclaw: "/previews/devpost-logiclaw.jpg",
  donair: "/previews/devpost-donair.png",
  lorawat: "/previews/devpost-lorawat.jpg",
  karen: "/previews/devpost-karen.jpg",
  kompas: "/previews/devpost-kompas.png",
};

function drawBevel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  inset = false,
) {
  const light = inset ? "#404040" : "#ffffff";
  const midLight = inset ? "#808080" : "#dfdfdf";
  const dark = inset ? "#ffffff" : "#404040";
  const midDark = inset ? "#dfdfdf" : "#808080";

  context.fillStyle = "#c0c0c0";
  context.fillRect(x, y, width, height);
  context.fillStyle = light;
  context.fillRect(x, y, width, 2);
  context.fillRect(x, y, 2, height);
  context.fillStyle = midLight;
  context.fillRect(x + 2, y + 2, width - 4, 1);
  context.fillRect(x + 2, y + 2, 1, height - 4);
  context.fillStyle = dark;
  context.fillRect(x, y + height - 2, width, 2);
  context.fillRect(x + width - 2, y, 2, height);
  context.fillStyle = midDark;
  context.fillRect(x + 2, y + height - 3, width - 4, 1);
  context.fillRect(x + width - 3, y + 2, 1, height - 4);
}

function drawButton(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  label: string,
) {
  drawBevel(context, x, y, width, 25);
  context.fillStyle = "#111";
  context.font = '700 13px "Courier New", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(label, x + width / 2, y + 13);
}

function drawWindow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  titleColor = "#000080",
) {
  drawBevel(context, x, y, width, height);
  context.fillStyle = titleColor;
  context.fillRect(x + 4, y + 4, width - 8, 27);
  context.fillStyle = "#fff";
  context.font = '700 16px "Courier New", monospace';
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText(title, x + 12, y + 17);
  drawButton(context, x + width - 30, y + 7, 20, "X");
}

function drawDesktop(
  context: CanvasRenderingContext2D,
  appName: string,
  backgroundColor = "#008080",
) {
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = "rgba(255,255,255,0.035)";
  for (let x = 0; x < WIDTH; x += 8) context.fillRect(x, 0, 1, HEIGHT - 36);

  context.fillStyle = "#c0c0c0";
  context.fillRect(0, HEIGHT - 36, WIDTH, 36);
  context.fillStyle = "#fff";
  context.fillRect(0, HEIGHT - 36, WIDTH, 2);
  context.fillStyle = "#555";
  context.fillRect(0, HEIGHT - 2, WIDTH, 2);
  drawButton(context, 5, HEIGHT - 31, 77, "Start");

  drawBevel(context, 88, HEIGHT - 31, 470, 25, true);
  context.fillStyle = "#111";
  context.font = '700 13px "Courier New", monospace';
  context.textAlign = "left";
  context.fillText(appName, 99, HEIGHT - 18);
  drawBevel(context, 575, HEIGHT - 31, 139, 25, true);
  context.textAlign = "center";
  context.fillText("ONLINE", 644, HEIGHT - 18);
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  context.fillStyle = "#666";
  context.fillRect(x, y, width, height);
  if (!image?.complete || image.naturalWidth === 0) return;

  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const renderedWidth = image.naturalWidth * scale;
  const renderedHeight = image.naturalHeight * scale;
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.drawImage(
    image,
    x + (width - renderedWidth) / 2,
    y + (height - renderedHeight) / 2,
    renderedWidth,
    renderedHeight,
  );
  context.restore();
}

function drawInsetImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  drawBevel(context, x, y, width, height, true);
  drawImageCover(context, image, x + 3, y + 3, width - 6, height - 6);
}

function drawRule(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
) {
  context.fillStyle = "#808080";
  context.fillRect(x, y, width, 1);
  context.fillStyle = "#fff";
  context.fillRect(x, y + 1, width, 1);
}

function drawInstagram(context: CanvasRenderingContext2D, images: ImageMap) {
  drawDesktop(context, "Instagram 95", "#0d1015");
  drawWindow(context, 28, 20, 664, 496, "Instagram 95  -  @afaqmvirk");

  drawButton(context, 41, 58, 67, "FILE");
  drawButton(context, 112, 58, 67, "EDIT");
  drawButton(context, 183, 58, 76, "PROFILE");
  drawButton(context, 263, 58, 71, "HELP");

  drawInsetImage(context, images.instagramAvatar, 48, 91, 72, 72);
  context.fillStyle = "#111";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = '700 21px "Courier New", monospace';
  context.fillText("afaqmvirk", 139, 111);
  context.font = '700 14px "Courier New", monospace';
  context.fillText("7 POSTS", 139, 138);
  context.fillText("1,256 FOLLOWERS", 248, 138);
  context.fillText("1,038 FOLLOWING", 429, 138);
  context.font = '13px "Courier New", monospace';
  context.fillText("Afaq Virk  //  Ottawa, Canada", 139, 158);

  drawRule(context, 47, 174, 626);
  const tiles = [
    ["instagram01", 48, 184],
    ["instagram02", 172, 184],
    ["instagram03", 296, 184],
    ["instagram04", 420, 184],
    ["instagram05", 544, 184],
    ["instagram06", 48, 334],
    ["instagram07", 172, 334],
  ] as const;
  for (const [key, x, y] of tiles) {
    drawInsetImage(context, images[key], x, y, 110, 144);
  }

  context.fillStyle = "#111";
  context.font = '700 17px "Courier New", monospace';
  context.textAlign = "center";
  context.fillText("LATEST POSTS", 478, 377);
  context.font = '13px "Courier New", monospace';
  context.fillText("All seven public posts", 478, 405);
  context.fillText("loaded from @afaqmvirk", 478, 427);
  drawButton(context, 416, 446, 125, "VIEW PROFILE");

  drawBevel(context, 40, 486, 642, 24, true);
  context.fillStyle = "#111";
  context.font = '12px "Courier New", monospace';
  context.textAlign = "left";
  context.fillText("Ready  |  public profile  |  7 posts", 50, 502);
}

function drawLinkedIn(context: CanvasRenderingContext2D, images: ImageMap) {
  drawDesktop(context, "LinkedIn Network Client", "#f4f2ee");
  drawWindow(
    context,
    72,
    38,
    576,
    456,
    "LinkedIn 95  -  Afaq Virk",
    "#0054a6",
  );

  drawButton(context, 86, 76, 92, "PROFILE");
  drawButton(context, 182, 76, 104, "NETWORK");
  drawButton(context, 290, 76, 86, "INBOX");
  drawButton(context, 380, 76, 77, "JOBS");

  drawInsetImage(context, images.avatar, 94, 111, 80, 80);
  context.fillStyle = "#111";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = '700 25px "Courier New", monospace';
  context.fillText("Afaq Virk", 194, 133);
  context.font = '700 16px "Courier New", monospace';
  context.fillText("Software Engineering @ Shopify", 194, 158);
  context.font = '14px "Courier New", monospace';
  context.fillText("Ottawa, Ontario, Canada", 194, 180);
  context.fillText("855 followers  //  500+ connections", 194, 200);

  drawWindow(context, 88, 213, 544, 252, "EXPERIENCE.LOG", "#0054a6");
  context.fillStyle = "#fff";
  context.fillRect(94, 246, 532, 213);

  context.fillStyle = "#82bd43";
  context.fillRect(106, 258, 35, 35);
  context.fillStyle = "#fff";
  context.font = '700 23px "Courier New", monospace';
  context.textAlign = "center";
  context.fillText("S", 123, 283);

  context.fillStyle = "#111";
  context.textAlign = "left";
  context.font = '700 15px "Courier New", monospace';
  context.fillText("Shopify  //  Internship · 2 yrs 1 mo", 154, 271);
  context.font = '12px "Courier New", monospace';
  context.fillText("Software Engineering · May 2026-Present · financial services", 154, 290);
  context.fillText("Software Engineering · May 2025-Apr 2026 · analytics", 154, 307);
  context.fillText("Dev Degree · Aug 2024-Apr 2025 · 1 of 30 selected", 154, 324);
  context.fillText("Fully-paid tuition · Ottawa · Remote", 154, 341);

  context.fillStyle = "#d7d7d7";
  context.fillRect(105, 351, 510, 1);
  context.fillStyle = "#111";

  context.font = '700 14px "Courier New", monospace';
  context.fillText("Teaching Assistant", 106, 372);
  context.font = '12px "Courier New", monospace';
  context.fillText("Carleton University · Aug 2026-Present · COMP 2804", 268, 372);

  context.font = '700 14px "Courier New", monospace';
  context.fillText("Founder & Lead Educator", 106, 402);
  context.font = '12px "Courier New", monospace';
  context.fillText("MathemaTech · 4,000 tutoring hrs · 800k students", 307, 402);

  context.font = '700 14px "Courier New", monospace';
  context.fillText("Member, Board of Trustees", 106, 432);
  context.font = '12px "Courier New", monospace';
  context.fillText("UCDSB · represented 27,000+ students", 321, 432);

  drawBevel(context, 82, 470, 556, 20, true);
  context.font = '12px "Courier New", monospace';
  context.fillText("linkedin.com/in/afaqmvirk", 93, 484);
}

function drawTwitter(context: CanvasRenderingContext2D) {
  context.fillStyle = "#000";
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawDevpost(context: CanvasRenderingContext2D, images: ImageMap) {
  drawDesktop(context, "Devpost Portfolio", "#003e54");
  drawWindow(
    context,
    24,
    18,
    672,
    500,
    "Devpost Portfolio  -  afaqmvirk",
    "#f55a24",
  );

  drawButton(context, 38, 56, 92, "PROJECTS");
  drawButton(context, 134, 56, 112, "HACKATHONS");
  drawButton(context, 250, 56, 126, "ACHIEVEMENTS");
  drawButton(context, 380, 56, 84, "PROFILE");

  drawInsetImage(context, images.avatar, 43, 96, 92, 92);
  context.fillStyle = "#111";
  context.textAlign = "left";
  context.textBaseline = "alphabetic";
  context.font = '700 24px "Courier New", monospace';
  context.fillText("Afaq Virk  (afaqmvirk)", 155, 119);
  context.font = '14px "Courier New", monospace';
  context.fillText("Ottawa, Ontario, Canada", 155, 145);
  context.font = '700 13px "Courier New", monospace';
  context.fillText("7 PROJECTS  //  5 HACKATHONS  //  8 ACHIEVEMENTS", 155, 170);
  context.font = '12px "Courier New", monospace';
  context.fillText("JS  TS  React  Python  SQL  C++  Arduino  Google Cloud", 155, 190);

  drawRule(context, 43, 204, 633);
  const projects = [
    ["bobby", "Bobby", 43, 218],
    ["purplePages", "Purple Pages", 201, 218],
    ["logiclaw", "LogiClaw", 359, 218],
    ["lorawat", "LoRaWAT", 517, 218],
    ["donair", "Donair", 43, 353],
    ["karen", "K.A.R.E.N.", 201, 353],
    ["kompas", "Kompas", 359, 353],
  ] as const;
  for (const [key, label, x, y] of projects) {
    drawInsetImage(context, images[key], x, y, 145, 97);
    context.fillStyle = "#111";
    context.font = '700 12px "Courier New", monospace';
    context.textAlign = "center";
    context.fillText(label, x + 72, y + 117);
  }

  drawBevel(context, 517, 353, 145, 118, true);
  context.fillStyle = "#f55a24";
  context.fillRect(521, 357, 137, 110);
  context.fillStyle = "#fff";
  context.font = '700 15px "Courier New", monospace';
  context.textAlign = "center";
  context.fillText("VIEW ALL", 589, 405);
  context.font = '12px "Courier New", monospace';
  context.fillText("PROJECTS >", 589, 428);

  drawBevel(context, 38, 487, 648, 25, true);
  context.fillStyle = "#111";
  context.textAlign = "left";
  context.fillText("Connected to devpost.com/afaqmvirk", 49, 504);
}

function markFrame(canvas: FrameCanvas | null) {
  if (canvas) canvas.__crtFrameVersion = (canvas.__crtFrameVersion ?? 0) + 1;
}

const hiddenCanvasStyle = {
  position: "fixed",
  top: 0,
  left: "-10000px",
  width: 1,
  height: 1,
  pointerEvents: "none",
} as const;

export default function RetroSocialCanvases() {
  const instagramRef = useRef<HTMLCanvasElement>(null);
  const linkedInRef = useRef<HTMLCanvasElement>(null);
  const twitterRef = useRef<HTMLCanvasElement>(null);
  const devpostRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const images = Object.fromEntries(
      Object.entries(imageSources).map(([key, src]) => {
        const image = new Image();
        image.decoding = "async";
        image.src = src;
        return [key, image];
      }),
    ) as ImageMap;

    const drawAll = () => {
      const instagram = instagramRef.current as FrameCanvas | null;
      const linkedIn = linkedInRef.current as FrameCanvas | null;
      const twitter = twitterRef.current as FrameCanvas | null;
      const devpost = devpostRef.current as FrameCanvas | null;

      const instagramContext = instagram?.getContext("2d", { alpha: false });
      const linkedInContext = linkedIn?.getContext("2d", { alpha: false });
      const twitterContext = twitter?.getContext("2d", { alpha: false });
      const devpostContext = devpost?.getContext("2d", { alpha: false });

      if (instagram && instagramContext) {
        drawInstagram(instagramContext, images);
        markFrame(instagram);
      }
      if (linkedIn && linkedInContext) {
        drawLinkedIn(linkedInContext, images);
        markFrame(linkedIn);
      }
      if (twitter && twitterContext) {
        drawTwitter(twitterContext);
        markFrame(twitter);
      }
      if (devpost && devpostContext) {
        drawDevpost(devpostContext, images);
        markFrame(devpost);
      }
    };

    Object.values(images).forEach((image) => {
      image.addEventListener("load", drawAll);
      image.addEventListener("error", drawAll);
    });
    void Promise.all([
      document.fonts.load('400 14px "Courier New"'),
      document.fonts.load('700 16px "Courier New"'),
    ])
      .then(drawAll)
      .catch(() => undefined);
    void document.fonts.ready.then(drawAll);
    drawAll();

    return () => {
      Object.values(images).forEach((image) => {
        image.removeEventListener("load", drawAll);
        image.removeEventListener("error", drawAll);
      });
    };
  }, []);

  return (
    <>
      <canvas
        id={canvasIds.Instagram}
        ref={instagramRef}
        width={WIDTH}
        height={HEIGHT}
        aria-hidden="true"
        style={hiddenCanvasStyle}
      />
      <canvas
        id={canvasIds.LinkedIn}
        ref={linkedInRef}
        width={WIDTH}
        height={HEIGHT}
        aria-hidden="true"
        style={hiddenCanvasStyle}
      />
      <canvas
        id={canvasIds.X}
        ref={twitterRef}
        width={WIDTH}
        height={HEIGHT}
        aria-hidden="true"
        style={hiddenCanvasStyle}
      />
      <canvas
        id={canvasIds.Devpost}
        ref={devpostRef}
        width={WIDTH}
        height={HEIGHT}
        aria-hidden="true"
        style={hiddenCanvasStyle}
      />
    </>
  );
}
