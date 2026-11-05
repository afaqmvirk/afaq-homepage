import type { MetaFunction } from "@remix-run/node";
import VhsProductScreen from "@crazygl/hero-vhs-product-screen";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import CrtCaptionController from "~/components/CrtCaptionController";
import WebsiteCaptureCanvas, { WEBSITE_CAPTURE_MEDIA } from "~/components/WebsiteCaptureCanvas";
import ChannelGuideCanvas from "~/components/ChannelGuideCanvas";
import HeroPreviewCanvas, {
  HERO_PREVIEW_MEDIA,
} from "~/components/HeroPreviewCanvas";
import PipesScreensaverCanvas, {
  PIPES_SCREENSAVER_MEDIA,
} from "~/components/PipesScreensaverCanvas";
import ResumeTerminalCanvas, {
  RESUME_TERMINAL_MEDIA,
} from "~/components/ResumeTerminalCanvas";
import ShopifyAsciiCanvas, {
  SHOPIFY_ASCII_MEDIA,
} from "~/components/ShopifyAsciiCanvas";
import SocialScreensaverCanvases, {
  SOCIAL_SCREENSAVER_MEDIA,
} from "~/components/SocialScreensaverCanvases";

type DirectoryItem = {
  label: string;
  year: number;
  slug?: string;
  socialKey?: string;
  href: string;
  preview: string;
  description?: string;
  slideshow?: readonly string[];
  screenFit?: "cover" | "contain";
  creationDate?: string;
  startAt?: number;
  endAt?: number;
  captionTrack?: string;
  poster?: string;
  external?: boolean;
  webCapture?: string;
};

type DirectorySection = {
  title: string;
  items: DirectoryItem[];
};

const defaultPreview: DirectoryItem = {
  label: "homepage", year: 2025, slug: "Afaq Virk",
  href: "/",
  preview: HERO_PREVIEW_MEDIA,
  description:
    "This was the most recent version of my website until I updated it in late August 2026. Use the channel and volume knobs on the TV to explore further.",
  creationDate: "current",
};

const projectChannels = [
  {
    label: "logiclaw (logitech hackathon winner)", year: 2026, slug: "LogiClaw",
    href: "https://devpost.com/software/logiclaw",
    preview: "/previews/devpost-logiclaw.jpg",
    external: true,
  },
  {
    label: "donair (conuhacks winner)", year: 2026, slug: "Donair",
    href: "https://devpost.com/software/flowstate-7ihg10",
    preview: "/previews/donair.mp4",
    startAt: 3,
    poster: "/previews/devpost-donair.png",
    external: true,
  },
  {
    label: "bobby (hackers and healers winner)", year: 2026, slug: "Bobby",
    href: "https://devpost.com/software/onthepulse",
    preview: "/previews/bobby-demo-h264.mp4",
    poster: "/previews/devpost-bobby.png",
    external: true,
  },
  {
    label: "lorawat (ssi-canada hackathon winner)", year: 2026, slug: "LoRaWAT",
    href: "https://devpost.com/software/computer-networks-hackathon-ssi-canada",
    preview: "/previews/devpost-lorawat.jpg",
    slideshow: [
      "/previews/lorawat-dashboard.png",
      "/previews/lorawat-site.png",
      "/previews/lorawat-level.png",
      "/previews/lorawat-doors.png",
      "/previews/devpost-lorawat.jpg",
    ],
    external: true,
  },
  {
    label: "kompas (hack the north)", year: 2025, slug: "Kompas",
    href: "https://devpost.com/software/kompas",
    preview: "/previews/devpost-kompas.png",
    slideshow: [
      "/previews/kompas-workbench.jpg",
      "/previews/kompas-prototype.png",
      "/previews/devpost-kompas.png",
    ],
    screenFit: "contain",
    external: true,
  },
] satisfies DirectoryItem[];

const websiteChannels: DirectoryItem[] = [
  { label: "hackthehill.com design", year: 2026, slug: "Hack the Hill", href: "https://hackthehill.com", preview: WEBSITE_CAPTURE_MEDIA,
    webCapture: "/channels/hack-the-hill-web-capture.jpg", external: true },
  { label: "stupideas.com design", year: 2026, slug: "Stupideas", href: "https://stupideas.com", preview: WEBSITE_CAPTURE_MEDIA,
    webCapture: "/channels/stupideas-web-capture.jpg", external: true },
  { label: "mathematech.com design", year: 2026, slug: "Mthmtech", href: "https://mthm.tech", preview: WEBSITE_CAPTURE_MEDIA,
    webCapture: "/channels/mthmtech-web-capture.jpg", external: true },
];

const contentChannels: DirectoryItem[] = [
  defaultPreview,
  {
    label: "screensaver", year: 2023, slug: "Pipes Screensaver",
    href: "",
    preview: PIPES_SCREENSAVER_MEDIA,
    description: "This was just a cool screensaver.",
    creationDate: "2026-08-26",
  },
  {
    label: "large green shopping bag", year: 2024, slug: "Shopify",
    href: "https://internships.shopify.com/",
    preview: SHOPIFY_ASCII_MEDIA,
    description:
      "My internship at Shopify has lasted two years so far. I've worked on the Analytics and Financial Services teams, working on AI agents, RAG systems, and a whole bunch of other cool things.",
    creationDate: "2026-08-26",
    external: true,
  },
  {
    label: "loading screens", year: 2022, slug: "TGJ2O0",
    href: "https://www.youtube.com/watch?v=pzAtMuLGgs0",
    preview: "/channels/animation-project-1.mp4",
    description:
      'An assignment I submitted to my 10th grade Communications Technology class, with the assignment prompt being "a loading screen."',
    creationDate: "2022-01-10",
    startAt: 3,
    external: true,
  },
  {
    label: "bee and flower", year: 2022, slug: "Bee and Flower",
    href: "https://www.youtube.com/watch?v=CxNt9lZIcDI",
    preview: "/channels/animation-project-2.mp4",
    description:
      '"Bee and Flower" was a submission to an assignment for my 10th grade media class, of "a character visiting three places."',
    creationDate: "2022-02-01",
    startAt: 3,
    external: true,
  },
  {
    label: "text-to-sql presentation", year: 2025, slug: "Text-to-SQL",
    href: "https://www.youtube.com/watch?v=_9E5xJQrnaQ",
    preview: "/channels/text-to-sql.mp4",
    description:
      "A lecture I gave to my COMP 3005 class on Text-to-SQL systems.",
    creationDate: "2025-11-30",
    startAt: 360,
    endAt: 420,
    captionTrack: "/captions/text-to-sql.json",
    external: true,
  },
  {
    label: "amr surveillance bias", year: 2026, slug: "AMR Surveillance Bias",
    href: "https://github.com/afaqmvirk/cat",
    preview: "/channels/amr-surveillance-bias.mp4",
    description: "A research paper I presented.",
    creationDate: "2026-06-27",
    startAt: 60,
    captionTrack: "/captions/amr-surveillance-bias.json",
    external: true,
  },
  {
    label: "tutoring chemistry", year: 2025, slug: "Balancing Chemical Equations",
    href: "https://mthm.tech",
    preview: "/channels/chemical-equations.mp4",
    description:
      "Just another section of the 4000+ hours I've spent tutoring over the past six years.",
    creationDate: "2024-09-11",
    startAt: 30,
    captionTrack: "/captions/chemical-equations.json",
    external: true,
  },
  {
    label: "relatom language", year: 2025, slug: "Relatom",
    href: "https://github.com/afaqmvirk/relatom",
    preview: "/channels/relatom.mp4",
    description:
      'Relatom—a relational query language made up of "atomic" statements. Bonus project for COMP 3005.',
    creationDate: "-",
    startAt: 120,
    captionTrack: "/captions/relatom.json",
    external: true,
  },
  {
    label: "websockets demo", year: 2025, slug: "WebSocket Collaboration",
    href: "https://calendar.carleton.ca/search/?P=COMP%202406",
    preview: "/channels/websocket-collaboration.mp4",
    description: "Another project for my COMP 2406 class.",
    creationDate: "-",
    startAt: 20,
    captionTrack: "/captions/websocket-collaboration.json",
    external: true,
  },
  {
    label: "leetcode games 1B", year: 2025, slug: "LC Games",
    href: "https://github.com/afaqmvirk/carleton-leetcode-bootcamp-2025",
    preview: "/channels/leetcode-games.mp4",
    description:
      "Challenge 1B of the LeetCode Games workshop I held in January 2026 at Carleton University. Each problem was intended to introduce students to algorithmic problem-solving. I put together some fun videos last-minute introducing each challenge.",
    creationDate: "2026-01-28",
    startAt: 21,
    external: true,
  },
  {
    label: "portalpants", year: 2021, slug: "PortalPants",
    href: "https://www.instagram.com/romanianspongebob/",
    preview: "/channels/portalpants.mp4",
    description:
      'SpongeBob PortalPants was a submission to an assignment for my 10th grade media class, of "a character visiting three places."',
    creationDate: "2022-01-22",
    startAt: 25,
    external: true,
  },
  {
    label: "kahoot clone demo", year: 2025, slug: "COMP2406B Final Project",
    href: "https://create.kahoot.it/profiles/35e825e0-8026-49fe-89c5-74cf77bccee3",
    preview: "/channels/comp2406b-final-project.mp4",
    description:
      "A Kahoot! clone I built as a final project for my COMP 2406 Web Applications class.",
    creationDate: "2025-04-08",
    startAt: 150,
    captionTrack: "/captions/comp2406b-final-project.json",
    external: true,
  },
  {
    label: "leetcode games 3", year: 2025, slug: "Krusty Kalkulations",
    href: "https://github.com/afaqmvirk/carleton-leetcode-bootcamp-2025",
    preview: "/channels/krusty-kalkulations.mp4",
    description:
      "Challenge 3 of the LeetCode Games workshop I held in January 2026 at Carleton University. Each problem was intended to introduce students to algorithmic problem-solving. I put together some fun videos last-minute introducing each challenge.",
    creationDate: "2026-01-28",
    startAt: 17,
    external: true,
  },
  {
    label: "karen (uottahack 8)", year: 2026, slug: "K.A.R.E.N.",
    href: "https://devpost.com/software/karen-5g01yk",
    preview: "/channels/karen-demo.mp4",
    description:
      "uOttaHack 8 submission—programmed an AI assistant on an FPGA using Tcl and AMD Vivado, complete with a screensaver and brick-breaker game.",
    creationDate: "2026-01-18",
    startAt: 3,
    external: true,
  },
  {
    label: "school board trustee-ing", year: 2023, slug: "UCDSB Board Meeting",
    href: "https://www.standard-freeholder.com/news/local-news/seaways-ali-and-ccvss-virk-elected-ucdsb-student-trustees",
    preview: "/channels/ucdsb-board-meeting.mp4",
    description:
      "An excerpt of my time as a trustee for the UCDSB, where I advocated on topics like STEM in classrooms, the introduction of AI in classrooms, and more.",
    creationDate: "2024-03-06",
    captionTrack: "/captions/ucdsb-board-meeting.json",
    external: true,
  },
  {
    label: "elecholocation hardware research", year: 2023, slug: "Awards Ceremony",
    href: "https://www.cornwallseawaynews.com/education/ccvs-student-represents-canada-at-international-science-fair/",
    preview: "/channels/awards-ceremony.mp4",
    description: 'The elusive origin of "afork veerq."',
    creationDate: "2023-05-18",
    captionTrack: "/captions/awards-ceremony.json",
    external: true,
  },
  ...projectChannels,
  ...websiteChannels,
];

function pickWeightedChannel(currentChannel: number, visitCounts: number[]) {
  if (tvChannels.length <= 1) return 0;

  const candidates = tvChannels
    .map((_, index) => ({
      index,
      weight: index === currentChannel
        ? 0
        : 1 / Math.pow(1 + (visitCounts[index] ?? 0), 4),
    }))
    .filter(({ weight }) => weight > 0);
  const totalWeight = candidates.reduce(
    (total, candidate) => total + candidate.weight,
    0,
  );
  let selection = Math.random() * totalWeight;

  for (const candidate of candidates) {
    selection -= candidate.weight;
    if (selection <= 0) return candidate.index;
  }

  return candidates[candidates.length - 1]?.index ?? currentChannel;
}

const socialItems: DirectoryItem[] = [
  {
    label: "afaq's instagram", year: 2019, slug: "instagram", socialKey: "instagram",
    href: "https://instagram.com/afaqmvirk",
    preview: SOCIAL_SCREENSAVER_MEDIA.instagram,
    external: true,
  },
  {
    label: "afaq's linkedin", year: 2022, slug: "linkedin", socialKey: "linkedin",
    href: "https://linkedin.com/in/afaqmvirk",
    preview: SOCIAL_SCREENSAVER_MEDIA.linkedin,
    external: true,
  },
  {
    label: "afaq's github", year: 2020, slug: "github", socialKey: "github",
    href: "https://github.com/afaqmvirk",
    preview: SOCIAL_SCREENSAVER_MEDIA.github,
    external: true,
  },
  {
    label: "afaq's twitter", year: 2020, slug: "x (twitter)", socialKey: "x (twitter)",
    href: "https://x.com/afaqmvirk",
    preview: SOCIAL_SCREENSAVER_MEDIA["x (twitter)"],
    external: true,
  },
  {
    label: "afaq's kahoot profile", year: 2021, slug: "kahoot", socialKey: "kahoot",
    href: "https://create.kahoot.it/profiles/35e825e0-8026-49fe-89c5-74cf77bccee3",
    preview: SOCIAL_SCREENSAVER_MEDIA.kahoot,
    external: true,
  },
];

const leftSections: DirectorySection[] = [
  {
    title: "Socials",
    items: socialItems,
  },
];

const rightSections: DirectorySection[] = [
  {
    title: "Others",
    items: [
      {
        label: "afaq's resume", year: 2026, slug: "resume",
        href: "/resume.pdf",
        preview: RESUME_TERMINAL_MEDIA,
        external: true,
      },
    ],
  },
];

const directorySections = [...leftSections, ...rightSections];
const directoryItems = directorySections.flatMap((section) => section.items);
const tvChannels: DirectoryItem[] = [
  ...contentChannels,
  ...directoryItems,
  {
    label: "marl project proposal",
    year: 2026,
    href: "https://5801.afaq.mov/prelim-video",
    preview: "/channels/marl-project-proposal.mp4",
    startAt: 361,
    description: "Our COMP 4900/5801 cooperative lunar-mapping MARL project proposal.",
    external: true,
  },
  {
    label: "COMP5801 seminar lecture",
    year: 2026,
    href: "",
    preview: "/channels/comp5801-seminar-lecture.mp4",
    captionTrack: "/captions/comp5801-seminar-lecture.json",
    description: "An excerpt from the November 4, 2026 COMP5801 seminar lecture (8:00–11:00).",
    creationDate: "2026-11-04",
  },
];
const guideChannels = tvChannels;
const CRT_STATIC_TRANSITION_MS = 700;
// Set to true to restore the channel title strip and description panel.
const VIDEO_METADATA_OVERLAYS_ENABLED = false;
const PLACEHOLDER_CHANNEL_DESCRIPTION =
  "Placeholder channel description. A short summary of this channel will go here.";

function directoryChannelHref(item: DirectoryItem) {
  const slug = (item.slug ?? item.label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `#channel-${slug}`;
}

function formattedLinkDestination(href: string) {
  if (!/^https?:\/\//i.test(href)) {
    return typeof window === "undefined" ? "" : window.location.hostname;
  }

  try {
    const url = new URL(href);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

function resolvedCreationDate(item: DirectoryItem) {
  if (item.creationDate !== "current") return item.creationDate ?? "-";
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function publishChannelOverlay(
  item: DirectoryItem,
  channelNumber: number,
) {
  window.dispatchEvent(
    new CustomEvent("crt-channel-change", {
      detail: {
        channel: channelNumber,
        title: VIDEO_METADATA_OVERLAYS_ENABLED ? item.label : "",
        creationDate: VIDEO_METADATA_OVERLAYS_ENABLED
          ? resolvedCreationDate(item)
          : "",
      },
    }),
  );
}

function publishDirectoryChannelOverlay(item: DirectoryItem) {
  const index = tvChannels.findIndex((candidate) => candidate === item);
  publishChannelOverlay(item, Math.max(0, index) + 1);
}

// VhsProductScreen renders with a 36-degree perspective camera at z=4.2.
// After its built-in `little-tv` normalization, this cabinet is 2.8 world
// units wide and extends roughly 1.25 units toward the camera. Accounting for
// that depth keeps the projected cabinet inside the stage, not just its centre
// plane. The stage itself already excludes the fixed directory sidebar.
const CRT_CAMERA_DISTANCE = 4.2;
const CRT_HALF_VERTICAL_FOV_TANGENT = Math.tan((36 * Math.PI) / 360);
const TV_HALF_WIDTH_AT_UNIT_SCALE = 1.4;
const TV_FRONT_DEPTH_AT_UNIT_SCALE = 1.25;
const TV_MAX_HEIGHT_SCALE = 1.04;

function fitTvScaleToStage(stageAspect: number) {
  const visibleHalfWidthAtTvCenter =
    CRT_CAMERA_DISTANCE * CRT_HALF_VERTICAL_FOV_TANGENT * stageAspect;
  const perspectiveDepthCost =
    TV_FRONT_DEPTH_AT_UNIT_SCALE *
    CRT_HALF_VERTICAL_FOV_TANGENT *
    stageAspect;
  const widthScale =
    visibleHalfWidthAtTvCenter /
    (TV_HALF_WIDTH_AT_UNIT_SCALE + perspectiveDepthCost);

  return Math.min(TV_MAX_HEIGHT_SCALE, Math.max(0.1, widthScale));
}

export const meta: MetaFunction = () => [
  { title: "Afaq Virk" },
  {
    name: "description",
    content: "Selected work, projects, writing, and links by Afaq Virk.",
  },
];

function DirectoryColumn({
  sections,
  side,
  onPreview,
  onPreviewEnd,
}: {
  sections: DirectorySection[];
  side: "left" | "right";
  onPreview: (item: DirectoryItem) => void;
  onPreviewEnd: () => void;
}) {
  return (
    <div className={`directory-column directory-column--${side}`}>
      {sections.map((section) => (
        <section className="directory-section" key={section.title}>
          <ul>
            {section.items.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  onMouseEnter={() => onPreview(item)}
                  onMouseLeave={onPreviewEnd}
                  onFocus={() => onPreview(item)}
                  onBlur={onPreviewEnd}
                  {...(item.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  <img src={socialIconSources[item.socialKey ?? item.label]} alt="" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const socialIconSources: Record<string, string> = {
    instagram: "/instagram.svg",
    linkedin: "/linkedin.svg",
    github: "/github.svg",
    "x (twitter)": "/x.svg",
    kahoot: "/kahoot.png",
};

function MobileSocialLinks() {
  return (
    <nav className="mobile-social-links" aria-label="Social links">
      {socialItems.map((item) => (
        <a
          href={item.href}
          key={item.label}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          title={item.label}
        >
          <img src={socialIconSources[item.socialKey ?? item.label]} alt="" />
        </a>
      ))}
      <a href="/resume.pdf" className="mobile-resume-link" target="_blank" rel="noreferrer">resume</a>
    </nav>
  );
}

export default function Index() {
  const [hoveredPreview, setHoveredPreview] =
    useState<DirectoryItem | null>(null);
  const [directoryChannel, setDirectoryChannel] =
    useState<DirectoryItem | null>(null);
  const [channel, setChannel] = useState(0);
  const [isChannelGuideOpen, setIsChannelGuideOpen] = useState(false);
  const [guideOffset, setGuideOffset] = useState(0);
  const [guideFocused, setGuideFocused] = useState(0);
  const guideButtonRef = useRef<HTMLButtonElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const guideHoverPointRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideshowTransitionActive, setSlideshowTransitionActive] =
    useState(false);
  const channelVisitCountsRef = useRef<number[]>(
    tvChannels.map((_, index) => (index === 0 ? 1 : 0)),
  );
  const [channelTurns, setChannelTurns] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [volumeTurns, setVolumeTurns] = useState(0);
  const [isChannelDescriptionVisible, setIsChannelDescriptionVisible] =
    useState(false);
  const [usedControls, setUsedControls] = useState({
    channel: false,
    volume: false,
    guide: false,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobileTvLayout, setIsMobileTvLayout] = useState(false);
  const [isTvModelReady, setIsTvModelReady] = useState(false);
  const [crtStageSize, setCrtStageSize] = useState({ width: 0, height: 0 });
  const [isScreenLinkTooltipVisible, setIsScreenLinkTooltipVisible] =
    useState(false);
  const crtStageRef = useRef<HTMLDivElement>(null);
  const descriptionTriggerRef = useRef<HTMLButtonElement>(null);
  const screenLinkTooltipRef = useRef<HTMLSpanElement>(null);
  const previewTimerRef = useRef<number | null>(null);
  const previewTokenRef = useRef(0);

  useEffect(() => {
    const crtStage = crtStageRef.current;
    const mobileTvQuery = window.matchMedia("(max-width: 640px)");
    const resizeObserver = new ResizeObserver(([entry]) => {
      setCrtStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    const updateMobileTvLayout = () => {
      if (crtStage) delete crtStage.dataset.crtReady;
      setIsTvModelReady(false);
      setIsMobileTvLayout(mobileTvQuery.matches);
    };
    const handleTvModelReady = () => setIsTvModelReady(true);

    setIsMobileTvLayout(mobileTvQuery.matches);
    // Fast Refresh reruns this effect while retaining the mounted renderer.
    // Recover its ready state instead of waiting for a one-time event again.
    setIsTvModelReady(crtStage?.dataset.crtReady === "true");
    setIsHydrated(true);
    if (crtStage) resizeObserver.observe(crtStage);
    mobileTvQuery.addEventListener("change", updateMobileTvLayout);
    window.addEventListener("crt-model-ready", handleTvModelReady);

    return () => {
      resizeObserver.disconnect();
      mobileTvQuery.removeEventListener("change", updateMobileTvLayout);
      window.removeEventListener("crt-model-ready", handleTvModelReady);
    };
  }, []);

  useEffect(() => {
    const syncDirectoryChannelFromHash = () => {
      const regularIndex = tvChannels.findIndex(
        (item) => directoryChannelHref(item) === window.location.hash,
      );
      if (regularIndex >= 0) {
        setChannel(regularIndex);
        setDirectoryChannel(null);
        publishChannelOverlay(tvChannels[regularIndex], regularIndex + 1);
        return;
      }
      const matchingChannel =
        directoryItems.find(
          (item) => directoryChannelHref(item) === window.location.hash,
        ) ?? null;
      setDirectoryChannel(matchingChannel);
      if (matchingChannel) publishDirectoryChannelOverlay(matchingChannel);
    };

    syncDirectoryChannelFromHash();
    window.addEventListener("hashchange", syncDirectoryChannelFromHash);
    return () =>
      window.removeEventListener("hashchange", syncDirectoryChannelFromHash);
  }, []);

  useEffect(() => {
    if (!isChannelGuideOpen) return;
    const selected = guideRef.current?.querySelector<HTMLButtonElement>(
      '[aria-current="true"]',
    ) ?? guideRef.current?.querySelector<HTMLButtonElement>(".crt-channel-guide__item");
    selected?.focus({ preventScroll: true });
    selected?.scrollIntoView({ block: "nearest" });
  }, [isChannelGuideOpen]);

  useEffect(() => {
    if (!isChannelGuideOpen) return;
    const timer = window.setInterval(() => {
      const point = guideHoverPointRef.current;
      const list = guideRef.current?.querySelector<HTMLDivElement>(".crt-channel-guide__list");
      if (!point || !list || list.clientHeight === 0) return;
      const detail: { clientX: number; clientY: number; u?: number; v?: number } = { ...point };
      window.dispatchEvent(new CustomEvent("crt-guide-hit", { detail }));
      const { u, v } = detail;
      if (u === undefined || v === undefined || u < .05 || u > .95 || v < .04 || v > .96) return;
      if (u > .84 && v < .18) return;
      const direction = v < .26 ? -1 : v > .74 ? 1 : 0;
      if (!direction) return;
      const rowHeight = list.clientHeight / 8;
      const currentRow = Math.round(list.scrollTop / rowHeight);
      const nextRow = Math.max(0, Math.min(guideChannels.length - 8, currentRow + direction));
      if (nextRow === currentRow) return;
      list.scrollTop = nextRow * rowHeight;
      setGuideOffset(nextRow);
      if (v >= .18 && v < .82) {
        setGuideFocused(Math.min(guideChannels.length - 1, Math.floor(nextRow + (v - .18) / .08)));
      }
    }, 240);
    return () => {
      window.clearInterval(timer);
      guideHoverPointRef.current = null;
    };
  }, [isChannelGuideOpen]);

  useEffect(() => {
    if (directoryChannel) publishDirectoryChannelOverlay(directoryChannel);
  }, [directoryChannel]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("crt-dial-change", {
        detail: {
          channelAngle: channelTurns * (Math.PI / 2),
          volumeAngle: volumeTurns * (Math.PI / 4),
        },
      }),
    );
  }, [channelTurns, volumeTurns]);

  useEffect(
    () => () => {
      if (previewTimerRef.current !== null) {
        window.clearTimeout(previewTimerRef.current);
      }
    },
    [],
  );

  const stageAspect =
    crtStageSize.height > 0 ? crtStageSize.width / crtStageSize.height : 1;
  const fittedModelScale = fitTvScaleToStage(stageAspect);
  const modelScale = isMobileTvLayout
    ? Math.min(1.16, fittedModelScale * 1.12)
    : fittedModelScale * 0.9;
  const currentChannel = tvChannels[channel];
  const regularChannelActive =
    hoveredPreview === null && directoryChannel === null;
  const selectedPreview = hoveredPreview ?? directoryChannel ?? currentChannel;
  const screenLinkHref = isChannelGuideOpen ? null : selectedPreview.href || null;
  const screenLinkDestination = screenLinkHref
    ? formattedLinkDestination(screenLinkHref)
    : "";
  const channelDescription =
    selectedPreview.description ?? PLACEHOLDER_CHANNEL_DESCRIPTION;
  const slideshow = selectedPreview.slideshow;
  const selectedMedia = slideshow?.length
    ? slideshow[slideshowIndex % slideshow.length]
    : selectedPreview.preview;

  useEffect(() => {
    setSlideshowIndex(0);
    if (!slideshow) {
      setSlideshowTransitionActive(false);
      return;
    }

    setSlideshowTransitionActive(true);
    const transitionTimer = window.setTimeout(() => {
      setSlideshowTransitionActive(false);
    }, CRT_STATIC_TRANSITION_MS);

    if (slideshow.length < 2) {
      return () => window.clearTimeout(transitionTimer);
    }

    const slideshowTimer = window.setInterval(() => {
      setSlideshowIndex((index) => (index + 1) % slideshow.length);
    }, 5000);

    return () => {
      window.clearTimeout(transitionTimer);
      window.clearInterval(slideshowTimer);
    };
  }, [slideshow]);

  useEffect(() => {
    setIsScreenLinkTooltipVisible(false);
  }, [screenLinkHref]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("crt-description-change", {
        detail: VIDEO_METADATA_OVERLAYS_ENABLED && isChannelDescriptionVisible
          ? {
              title: selectedPreview.label,
              text: channelDescription,
              creationDate: resolvedCreationDate(selectedPreview),
            }
          : {},
      }),
    );
  }, [
    channelDescription,
    isChannelDescriptionVisible,
    isTvModelReady,
    selectedPreview.label,
  ]);

  useEffect(() => {
    if (!isChannelDescriptionVisible || !isMobileTvLayout) return;

    const closeDescriptionOnOutsideTap = (event: PointerEvent) => {
      if (descriptionTriggerRef.current?.contains(event.target as Node)) return;
      setIsChannelDescriptionVisible(false);
    };

    window.addEventListener("pointerdown", closeDescriptionOnOutsideTap, true);
    return () =>
      window.removeEventListener(
        "pointerdown",
        closeDescriptionOnOutsideTap,
        true,
      );
  }, [isChannelDescriptionVisible, isMobileTvLayout]);

  const screenMedia = (() => {
    if (!selectedMedia.endsWith(".mp4")) {
      return selectedMedia;
    }

    const mediaParams = new URLSearchParams();
    if (selectedPreview.startAt !== undefined) {
      mediaParams.set("startAt", String(selectedPreview.startAt));
    }
    if (selectedPreview.endAt !== undefined) {
      mediaParams.set("endAt", String(selectedPreview.endAt));
    }

    const mediaQuery = mediaParams.toString();
    return `${selectedMedia}${mediaQuery ? `?${mediaQuery}` : ""}`;
  })();
  const showPreview = (item: DirectoryItem) => {
    publishDirectoryChannelOverlay(item);
    const token = ++previewTokenRef.current;
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    if (!item.poster) {
      setHoveredPreview(item);
      return;
    }

    setHoveredPreview({ ...item, preview: item.poster });
    previewTimerRef.current = window.setTimeout(() => {
      if (previewTokenRef.current === token) setHoveredPreview(item);
      previewTimerRef.current = null;
    }, 300);
  };

  const clearPreview = () => {
    previewTokenRef.current += 1;
    if (previewTimerRef.current !== null) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setHoveredPreview(null);
  };

  const restoreChannelAfterPreview = () => {
    clearPreview();
    if (directoryChannel) {
      publishDirectoryChannelOverlay(directoryChannel);
    } else {
      publishChannelOverlay(currentChannel, channel + 1);
    }
  };

  const returnToRegularChannels = (showOverlay = true) => {
    clearPreview();
    setDirectoryChannel(null);
    if (window.location.hash.startsWith("#channel-")) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
    if (showOverlay) publishChannelOverlay(currentChannel, channel + 1);
  };

  const turnChannelDial = () => {
    setIsChannelGuideOpen(false);
    returnToRegularChannels(false);
    const nextChannel = pickWeightedChannel(
      channel,
      channelVisitCountsRef.current,
    );
    channelVisitCountsRef.current[nextChannel] =
      (channelVisitCountsRef.current[nextChannel] ?? 0) + 1;
    publishChannelOverlay(tvChannels[nextChannel], nextChannel + 1);
    setChannel(nextChannel);
    setChannelTurns((turns) => turns + 1);
    setUsedControls((controls) => ({ ...controls, channel: true }));
  };

  const turnVolumeDial = () => {
    const nextVolumeLevel = isMobileTvLayout
      ? volumeLevel > 0
        ? 0
        : 4
      : (volumeLevel + 1) % 5;
    const nextVolume = isMobileTvLayout
      ? nextVolumeLevel > 0
        ? 1
        : 0
      : nextVolumeLevel / 4;

    window.dispatchEvent(
      new CustomEvent("crt-volume-change", {
        detail: {
          volume: nextVolume,
          level: nextVolumeLevel,
        },
      }),
    );
    setVolumeLevel(nextVolumeLevel);
    setVolumeTurns((turns) => turns + 1);
    setUsedControls((controls) => ({ ...controls, volume: true }));
  };

  const positionScreenLinkTooltip = (clientX: number, clientY: number) => {
    const stage = crtStageRef.current;
    const tooltip = screenLinkTooltipRef.current;
    if (!stage || !tooltip) return;

    const stageBounds = stage.getBoundingClientRect();
    tooltip.style.left = `${clientX - stageBounds.left}px`;
    tooltip.style.top = `${clientY - stageBounds.top}px`;
  };

  const muteTv = () => {
    window.dispatchEvent(
      new CustomEvent("crt-volume-change", {
        detail: { volume: 0, level: 0 },
      }),
    );
    setVolumeLevel(0);
  };

  const closeChannelGuide = () => {
    setIsChannelGuideOpen(false);
    guideButtonRef.current?.focus();
  };

  const selectGuideChannel = (item: DirectoryItem, index: number) => {
    clearPreview();
    if (index < tvChannels.length) {
      setDirectoryChannel(null);
      setChannel(index);
      channelVisitCountsRef.current[index] = (channelVisitCountsRef.current[index] ?? 0) + 1;
    } else {
      setDirectoryChannel(item);
    }
    window.history.replaceState(null, "", directoryChannelHref(item));
    publishChannelOverlay(item, index + 1);
    window.dispatchEvent(new CustomEvent("crt-guide-tune"));
    setChannelTurns((turns) => turns + 1);
    setUsedControls((controls) => ({ ...controls, channel: true }));
    closeChannelGuide();
  };

  const guidePointerHit = (clientX: number, clientY: number) => {
    const detail: { clientX: number; clientY: number; u?: number; v?: number } = { clientX, clientY };
    window.dispatchEvent(new CustomEvent("crt-guide-hit", { detail }));
    return detail;
  };

  return (
    <main className="link-directory">
      <h1 className="sr-only">Afaq Virk</h1>
      <div
        className="crt-display"
        role="group"
        aria-label="Interactive CRT television"
      >
        <HeroPreviewCanvas active={regularChannelActive && channel === 0} />
        <PipesScreensaverCanvas
          active={regularChannelActive && channel === 1}
          volume={volumeLevel / 4}
        />
        <ShopifyAsciiCanvas
          active={regularChannelActive && channel === 2}
          volume={volumeLevel / 4}
        />
        <ResumeTerminalCanvas active={selectedPreview.preview === RESUME_TERMINAL_MEDIA} />
        <SocialScreensaverCanvases activeSocial={selectedPreview.socialKey ?? selectedPreview.label} />
        <WebsiteCaptureCanvas source={selectedPreview.webCapture} />
        <ChannelGuideCanvas channels={guideChannels} offset={guideOffset}
          focused={guideFocused} active={isChannelGuideOpen && isTvModelReady} />
        {/* This hero was inspired and implemented based on the implementation at https://crazygl.com/hero/vhs-product-screen */}
        {/* Original implementation by @ybouane https://x.com/ybouane */}
        {/* Sharp 13LM16 TV model by TWIG-design: https://www.cgtrader.com/free-3d-models/electronics/video/old-vintage-sharp-13lm16-tv-3d-model */}
        <span
          className="crt-attribution"
          dangerouslySetInnerHTML={{
            __html:
              "<!-- This hero was inspired and implemented based on the implementation at https://crazygl.com/hero/vhs-product-screen --><!-- Original implementation by @ybouane https://x.com/ybouane --><!-- Sharp 13LM16 TV model by TWIG-design: https://www.cgtrader.com/free-3d-models/electronics/video/old-vintage-sharp-13lm16-tv-3d-model -->",
          }}
        />
        <div className="crt-stage" ref={crtStageRef}>
          <CrtCaptionController
            mediaUrl={screenMedia}
            track={selectedPreview.captionTrack}
          />
          {isHydrated ? (
            <VhsProductScreen
              key={isMobileTvLayout ? "mobile-tv" : "desktop-tv"}
              style={{
                position: "relative",
                display: "block",
                width: "100%",
                height: "100%",
              }}
              contentType="custom"
              content={null}
              screenMedia={screenMedia}
              tvModel="little-tv"
              modelScale={modelScale}
              modelTilt={-2.5}
              monitorX={0}
              monitorY={-0.06}
              screenFit={selectedPreview.screenFit ?? "cover"}
              screenSizeScale={1}
              curvature={0.19}
              scanlineStrength={0.46}
              scanlineFrequency={720}
              chromaticEdgeIntensity={0.68}
              vignetteStrength={0.62}
              screenEmissive={0.9}
              glitchFrequency={6}
              glitchIntensity={0.58}
              backgroundColor="#0e0e0e"
              pointerParallax={1}
              turnOnAnimation={!slideshow || slideshowTransitionActive}
            />
          ) : null}
          {isTvModelReady && isChannelGuideOpen ? (
            <div className="crt-channel-guide" id="tv-channel-guide" ref={guideRef}
              role="dialog" aria-label="TV channels"
              onClickCapture={(event) => {
                if (event.detail === 0) return; // Keyboard and assistive activation.
                event.preventDefault();
                event.stopPropagation();
                const { u, v } = guidePointerHit(event.clientX, event.clientY);
                if (u === undefined || v === undefined) return;
                if (u > .84 && v < .18) { closeChannelGuide(); return; }
                if (v < .18 || v >= .82 || u < .05 || u > .95) return;
                const index = Math.floor(guideOffset + (v - .18) / .08);
                if (guideChannels[index]) selectGuideChannel(guideChannels[index], index);
              }}
              onPointerMove={(event) => {
                if (event.pointerType === "touch") return;
                guideHoverPointRef.current = { clientX: event.clientX, clientY: event.clientY };
                const { u, v } = guidePointerHit(event.clientX, event.clientY);
                if (u === undefined || v === undefined || v < .18 || v >= .82) return;
                const index = Math.floor(guideOffset + (v - .18) / .08);
                if (guideChannels[index]) setGuideFocused(index);
              }}
              onPointerLeave={() => { guideHoverPointRef.current = null; }}
              onKeyDown={(event) => {
                if (event.key === "Escape") { event.preventDefault(); closeChannelGuide(); }
                if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(".crt-channel-guide__item"));
                  const current = items.indexOf(document.activeElement as HTMLButtonElement);
                  const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
                    : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
                  items[next]?.focus();
                }
              }}>
              <div className="crt-channel-guide__heading">
                <span>CHANNEL GUIDE</span>
                <button type="button" aria-label="Close channel guide" onClick={closeChannelGuide}>×</button>
              </div>
              <div className="crt-channel-guide__list" onScroll={(event) => {
                const rowHeight = event.currentTarget.clientHeight / 8;
                const row = Math.round(event.currentTarget.scrollTop / rowHeight);
                setGuideOffset(row);
              }}>
                {guideChannels.map((item, index) => (
                  <button key={item.label} type="button" className="crt-channel-guide__item"
                    aria-current={selectedPreview === item ? "true" : undefined}
                    onFocus={() => setGuideFocused(index)}
                    onClick={() => selectGuideChannel(item, index)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{item.label}</span>
                    <span>{item.year}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {isTvModelReady && screenLinkHref ? (
            <>
              <a
                className="crt-screen-link"
                href={screenLinkHref}
                aria-label={`Open ${selectedPreview.label}: ${screenLinkDestination}`}
                onClick={muteTv}
                onPointerEnter={(event) => {
                  if (event.pointerType === "touch") return;
                  positionScreenLinkTooltip(event.clientX, event.clientY);
                  setIsScreenLinkTooltipVisible(true);
                }}
                onPointerMove={(event) => {
                  if (event.pointerType !== "touch") {
                    positionScreenLinkTooltip(event.clientX, event.clientY);
                  }
                }}
                onPointerLeave={() => setIsScreenLinkTooltipVisible(false)}
                onFocus={(event) => {
                  const bounds = event.currentTarget.getBoundingClientRect();
                  positionScreenLinkTooltip(
                    bounds.left + bounds.width / 2,
                    bounds.top + bounds.height / 2,
                  );
                  setIsScreenLinkTooltipVisible(true);
                }}
                onBlur={() => setIsScreenLinkTooltipVisible(false)}
                {...(selectedPreview.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              />
              <span
                className={`crt-screen-link-tooltip${
                  isScreenLinkTooltipVisible
                    ? " crt-screen-link-tooltip--visible"
                    : ""
                }`}
                ref={screenLinkTooltipRef}
                aria-hidden="true"
              >
                {screenLinkDestination}
              </span>
            </>
          ) : null}
          {VIDEO_METADATA_OVERLAYS_ENABLED &&
          isTvModelReady &&
          !screenLinkHref ? (
            <button
              type="button"
              className="crt-screen-description-trigger"
              ref={descriptionTriggerRef}
              aria-label={`${
                isChannelDescriptionVisible ? "Hide" : "Show"
              } description for ${selectedPreview.label}`}
              aria-pressed={isChannelDescriptionVisible}
              onPointerEnter={(event) => {
                if (event.pointerType !== "touch") {
                  setIsChannelDescriptionVisible(true);
                }
              }}
              onPointerLeave={(event) => {
                if (event.pointerType !== "touch") {
                  setIsChannelDescriptionVisible(false);
                }
              }}
              onFocus={(event) => {
                if (
                  !isMobileTvLayout ||
                  event.currentTarget.matches(":focus-visible")
                ) {
                  setIsChannelDescriptionVisible(true);
                }
              }}
              onBlur={() => setIsChannelDescriptionVisible(false)}
              onClick={() => {
                if (isMobileTvLayout) {
                  setIsChannelDescriptionVisible((isVisible) => !isVisible);
                }
              }}
            />
          ) : null}
          <span className="sr-only" aria-live="polite">
            {isChannelDescriptionVisible
              ? `${selectedPreview.label}. ${resolvedCreationDate(
                  selectedPreview,
                )}. ${channelDescription}`
              : ""}
          </span>
          {isTvModelReady ? (
            <div
              className="crt-controls"
              role="group"
              aria-label="Television controls"
            >
              <button type="button" ref={guideButtonRef}
                className={`crt-control crt-control--guide${
                  usedControls.guide ? " crt-control--discovered" : ""
                }`}
                data-control-label="GUIDE" aria-label="Show TV channel guide"
                aria-expanded={isChannelGuideOpen} aria-controls="tv-channel-guide"
                title="Channel guide" onClick={() => {
                  clearPreview();
                  setUsedControls((controls) => ({ ...controls, guide: true }));
                  setIsChannelGuideOpen((open) => !open);
                }} />
              <button
                type="button"
                className={`crt-control crt-control--channel${
                  usedControls.channel ? " crt-control--discovered" : ""
                }`}
                data-control-label="CHANNEL"
                aria-label={`Channel ${channel + 1}: ${currentChannel.label}. Click to change channel.`}
                title={`Channel ${channel + 1}: ${currentChannel.label}`}
                onClick={turnChannelDial}
              />
              <button
                type="button"
                className={`crt-control crt-control--volume${
                  usedControls.volume ? " crt-control--discovered" : ""
                }`}
                data-control-label="VOLUME"
                aria-label={
                  isMobileTvLayout
                    ? `TV sound ${volumeLevel > 0 ? "on" : "muted"}. Tap to ${
                        volumeLevel > 0 ? "mute" : "turn on"
                      }; device buttons control volume.`
                    : `Volume ${volumeLevel} of 4. Click to increase.`
                }
                title={
                  isMobileTvLayout
                    ? `TV sound ${volumeLevel > 0 ? "on" : "muted"}`
                    : `Volume ${volumeLevel} of 4`
                }
                onClick={turnVolumeDial}
              />
            </div>
          ) : null}
        </div>
      </div>
      <MobileSocialLinks />
      <a className="desktop-resume-link" href="/resume.pdf" download
        onMouseEnter={() => showPreview(rightSections[0].items[0])}
        onMouseLeave={restoreChannelAfterPreview}
        onFocus={() => showPreview(rightSections[0].items[0])}
        onBlur={restoreChannelAfterPreview}>
        download my resume (PDF)
      </a>
      <DirectoryColumn
        sections={leftSections}
        side="left"
        onPreview={showPreview}
        onPreviewEnd={restoreChannelAfterPreview}
      />
    </main>
  );
}
