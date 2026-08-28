import type { MetaFunction } from "@remix-run/node";
import VhsProductScreen from "@crazygl/hero-vhs-product-screen";
import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import CrtCaptionController from "~/components/CrtCaptionController";
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

type DirectoryItem = {
  label: string;
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
};

type DirectorySection = {
  title: string;
  items: DirectoryItem[];
};

const defaultPreview: DirectoryItem = {
  label: "Afaq Virk",
  href: "/",
  preview: HERO_PREVIEW_MEDIA,
  description:
    "This was the most recent version of my website until I updated it in late August 2026. Use the channel and volume knobs on the TV to explore further.",
  creationDate: "current",
};

const projectChannels = [
  {
    label: "LogiClaw",
    href: "https://devpost.com/software/logiclaw",
    preview: "/previews/devpost-logiclaw.jpg",
    external: true,
  },
  {
    label: "Donair",
    href: "https://devpost.com/software/flowstate-7ihg10",
    preview: "/previews/donair.mp4",
    startAt: 3,
    poster: "/previews/devpost-donair.png",
    external: true,
  },
  {
    label: "Bobby",
    href: "https://devpost.com/software/onthepulse",
    preview: "/previews/bobby-demo-h264.mp4",
    poster: "/previews/devpost-bobby.png",
    external: true,
  },
  {
    label: "LoRaWAT",
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
    label: "Kompas",
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

const tvChannels: DirectoryItem[] = [
  defaultPreview,
  {
    label: "3D pipes",
    href: "",
    preview: PIPES_SCREENSAVER_MEDIA,
    description: "This was just a cool screensaver.",
    creationDate: "2026-08-26",
  },
  {
    label: "Shopify ASCII",
    href: "https://internships.shopify.com/",
    preview: SHOPIFY_ASCII_MEDIA,
    description:
      "My internship at Shopify has lasted two years so far. I've worked on the Analytics and Financial Services teams, working on AI agents, RAG systems, and a whole bunch of other cool things.",
    creationDate: "2026-08-26",
    external: true,
  },
  {
    label: "Animation Project 1",
    href: "https://www.youtube.com/watch?v=pzAtMuLGgs0",
    preview: "/channels/animation-project-1.mp4",
    description:
      'An assignment I submitted to my 10th grade Communications Technology class, with the assignment prompt being "a loading screen."',
    creationDate: "2022-01-10",
    startAt: 3,
    external: true,
  },
  {
    label: "Animation Project 2",
    href: "https://www.youtube.com/watch?v=CxNt9lZIcDI",
    preview: "/channels/animation-project-2.mp4",
    description:
      '"Bee and Flower" was a submission to an assignment for my 10th grade media class, of "a character visiting three places."',
    creationDate: "2022-02-01",
    startAt: 3,
    external: true,
  },
  {
    label: "Text-to-SQL",
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
    label: "AMR Surveillance Bias",
    href: "https://github.com/afaqmvirk/cat",
    preview: "/channels/amr-surveillance-bias.mp4",
    description: "A research paper I presented.",
    creationDate: "2026-06-27",
    startAt: 60,
    captionTrack: "/captions/amr-surveillance-bias.json",
    external: true,
  },
  {
    label: "Balancing Chemical Equations",
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
    label: "Relatom",
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
    label: "WebSocket Collaboration",
    href: "https://calendar.carleton.ca/search/?P=COMP%202406",
    preview: "/channels/websocket-collaboration.mp4",
    description: "Another project for my COMP 2406 class.",
    creationDate: "-",
    startAt: 20,
    captionTrack: "/captions/websocket-collaboration.json",
    external: true,
  },
  {
    label: "LC Games",
    href: "https://github.com/afaqmvirk/carleton-leetcode-bootcamp-2025",
    preview: "/channels/leetcode-games.mp4",
    description:
      "Challenge 1B of the LeetCode Games workshop I held in January 2026 at Carleton University. Each problem was intended to introduce students to algorithmic problem-solving. I put together some fun videos last-minute introducing each challenge.",
    creationDate: "2026-01-28",
    startAt: 21,
    external: true,
  },
  {
    label: "PortalPants",
    href: "https://www.instagram.com/romanianspongebob/",
    preview: "/channels/portalpants.mp4",
    description:
      'SpongeBob PortalPants was a submission to an assignment for my 10th grade media class, of "a character visiting three places."',
    creationDate: "2022-01-22",
    startAt: 25,
    external: true,
  },
  {
    label: "COMP2406B Final Project",
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
    label: "Krusty Kalkulations",
    href: "https://github.com/afaqmvirk/carleton-leetcode-bootcamp-2025",
    preview: "/channels/krusty-kalkulations.mp4",
    description:
      "Challenge 3 of the LeetCode Games workshop I held in January 2026 at Carleton University. Each problem was intended to introduce students to algorithmic problem-solving. I put together some fun videos last-minute introducing each challenge.",
    creationDate: "2026-01-28",
    startAt: 17,
    external: true,
  },
  {
    label: "K.A.R.E.N.",
    href: "https://devpost.com/software/karen-5g01yk",
    preview: "/channels/karen-demo.mp4",
    description:
      "uOttaHack 8 submission—programmed an AI assistant on an FPGA using Tcl and AMD Vivado, complete with a screensaver and brick-breaker game.",
    creationDate: "2026-01-18",
    startAt: 3,
    external: true,
  },
  {
    label: "UCDSB Board Meeting",
    href: "https://www.standard-freeholder.com/news/local-news/seaways-ali-and-ccvss-virk-elected-ucdsb-student-trustees",
    preview: "/channels/ucdsb-board-meeting.mp4",
    description:
      "An excerpt of my time as a trustee for the UCDSB, where I advocated on topics like STEM in classrooms, the introduction of AI in classrooms, and more.",
    creationDate: "2024-03-06",
    captionTrack: "/captions/ucdsb-board-meeting.json",
    external: true,
  },
  {
    label: "Awards Ceremony",
    href: "https://www.cornwallseawaynews.com/education/ccvs-student-represents-canada-at-international-science-fair/",
    preview: "/channels/awards-ceremony.mp4",
    description: 'The elusive origin of "afork veerq."',
    creationDate: "2023-05-18",
    captionTrack: "/captions/awards-ceremony.json",
    external: true,
  },
  ...projectChannels,
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
    label: "instagram",
    href: "https://instagram.com/afaqmvirk",
    preview: "/previews/social-instagram.png",
    external: true,
  },
  {
    label: "linkedin",
    href: "https://linkedin.com/in/afaqmvirk",
    preview: "/previews/social-linkedin.png",
    external: true,
  },
  {
    label: "github",
    href: "https://github.com/afaqmvirk",
    preview: "/previews/github.png",
    screenFit: "contain",
    external: true,
  },
  {
    label: "x (twitter)",
    href: "https://x.com/afaqmvirk",
    preview: "/previews/social-x.png",
    external: true,
  },
  {
    label: "kahoot",
    href: "https://create.kahoot.it/profiles/35e825e0-8026-49fe-89c5-74cf77bccee3",
    preview: "/previews/social-kahoot.png",
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
    title: "Websites",
    items: [
      {
        label: "hackthehill",
        href: "https://hackthehill.com",
        preview: "/previews/hack-the-hill.png",
        external: true,
      },
      {
        label: "stupideas",
        href: "https://stupideas.com",
        preview: "/channels/sih-site-scroll.mp4",
        poster: "/previews/stupid-ideas.png",
        screenFit: "contain",
        description:
          "The website I built for the Stupid Ideas Hackathon community.",
        external: true,
      },
      {
        label: "mthmtech",
        href: "https://mthm.tech",
        preview: "/previews/mathematech.png",
        external: true,
      },
    ],
  },
  {
    title: "Others",
    items: [
      {
        label: "resume",
        href: "/resume.pdf",
        preview: RESUME_TERMINAL_MEDIA,
        external: true,
      },
    ],
  },
];

const directorySections = [...leftSections, ...rightSections];
const directoryItems = directorySections.flatMap((section) => section.items);
const mobileDirectoryItems = directorySections
  .filter((section) => section.title !== "Socials")
  .flatMap((section) =>
    section.items.map((item) => ({ ...item, sectionTitle: section.title })),
  );
const MOBILE_WHEEL_ROW_HEIGHT = 48;
const CRT_STATIC_TRANSITION_MS = 700;
// Set to true to restore the channel title strip and description panel.
const VIDEO_METADATA_OVERLAYS_ENABLED = false;
const PLACEHOLDER_CHANNEL_DESCRIPTION =
  "Placeholder channel description. A short summary of this channel will go here.";

function directoryChannelHref(item: DirectoryItem) {
  const slug = item.label
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
  const directoryIndex = directoryItems.findIndex(
    (candidate) =>
      candidate.label === item.label && candidate.href === item.href,
  );
  publishChannelOverlay(
    item,
    tvChannels.length + Math.max(0, directoryIndex) + 1,
  );
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
                  onMouseEnter={() => onPreview(item)}
                  onMouseLeave={onPreviewEnd}
                  onFocus={() => onPreview(item)}
                  onBlur={onPreviewEnd}
                  {...(item.external
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MobileSocialLinks() {
  const iconSources: Record<string, string> = {
    instagram: "/instagram.svg",
    linkedin: "/linkedin.svg",
    github: "/github.svg",
    "x (twitter)": "/x.svg",
    kahoot: "/kahoot.png",
  };

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
          <img src={iconSources[item.label]} alt="" />
        </a>
      ))}
    </nav>
  );
}

function MobileDirectoryWheel({
  items,
  onPreview,
  onPreviewEnd,
}: {
  items: Array<DirectoryItem & { sectionTitle: string }>;
  onPreview: (item: DirectoryItem) => void;
  onPreviewEnd: () => void;
}) {
  const [position, setPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef(0);
  const selectedIndexRef = useRef(0);
  const dragRef = useRef({
    active: false,
    startY: 0,
    startPosition: 0,
    startIndex: 0,
    moved: false,
    suppressClick: false,
  });

  const clampPosition = (value: number) =>
    Math.min(items.length - 1, Math.max(0, value));

  const selectPosition = (nextPosition: number, preview = true) => {
    const clampedPosition = clampPosition(nextPosition);
    const nextIndex = Math.round(clampedPosition);
    positionRef.current = clampedPosition;
    setPosition(clampedPosition);
    if (nextIndex !== selectedIndexRef.current) {
      selectedIndexRef.current = nextIndex;
      setSelectedIndex(nextIndex);
      if (preview) onPreview(items[nextIndex]);
    }
  };

  const snapToIndex = (index: number) => {
    const nextIndex = Math.round(clampPosition(index));
    selectedIndexRef.current = nextIndex;
    positionRef.current = nextIndex;
    setSelectedIndex(nextIndex);
    setPosition(nextIndex);
  };

  useEffect(() => {
    return onPreviewEnd;
    // Clear a held preview if the wheel unmounts during a gesture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemIndexFromEvent = (event: ReactPointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    const item = target.closest<HTMLElement>("[data-wheel-index]");
    const index = Number(item?.dataset.wheelIndex);
    return Number.isFinite(index) ? index : selectedIndexRef.current;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      startY: event.clientY,
      startPosition: positionRef.current,
      startIndex: itemIndexFromEvent(event),
      moved: false,
      suppressClick: false,
    };
    setIsDragging(true);
    onPreview(items[selectedIndexRef.current]);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || !event.isPrimary) return;
    const deltaY = event.clientY - drag.startY;
    if (Math.abs(deltaY) > 5) drag.moved = true;
    selectPosition(
      drag.startPosition - deltaY / MOBILE_WHEEL_ROW_HEIGHT,
      true,
    );
  };

  const finishPointerGesture = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active) return;
    drag.active = false;
    drag.suppressClick = drag.moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
    if (!drag.moved && drag.startIndex !== selectedIndexRef.current) {
      snapToIndex(drag.startIndex);
    } else {
      snapToIndex(Math.round(positionRef.current));
    }
    window.setTimeout(() => {
      dragRef.current.suppressClick = false;
    }, 0);
  };

  const handleItemClick = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    index: number,
  ) => {
    if (
      dragRef.current.suppressClick ||
      index !== selectedIndexRef.current
    ) {
      event.preventDefault();
      if (!dragRef.current.suppressClick) snapToIndex(index);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    snapToIndex(selectedIndexRef.current + direction);
  };

  return (
    <nav
      className={`mobile-directory-wheel${
        isDragging ? " mobile-directory-wheel--dragging" : ""
      }`}
      aria-label="Swipe to browse links"
    >
      <div
        className="mobile-directory-wheel__viewport"
        role="slider"
        aria-label="Selected link"
        aria-valuemin={0}
        aria-valuemax={items.length - 1}
        aria-valuenow={selectedIndex}
        aria-valuetext={items[selectedIndex].label}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointerGesture}
        onPointerCancel={finishPointerGesture}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div className="mobile-directory-wheel__track">
          {items.map((item, index) => {
            const offset = index - position;
            const distance = Math.abs(offset);
            const scale = Math.max(0.66, 1 - distance * 0.115);
            const opacity = Math.max(0, 1 - distance * 0.28);
            const wheelStyle = {
              "--wheel-y": `${offset * MOBILE_WHEEL_ROW_HEIGHT}px`,
              "--wheel-tilt": `${Math.max(-62, Math.min(62, -offset * 18))}deg`,
              "--wheel-scale": scale,
              "--wheel-opacity": opacity,
              "--wheel-blur": `${Math.max(0, distance - 1.4) * 0.75}px`,
              zIndex: Math.max(1, 20 - Math.round(distance * 3)),
            } as CSSProperties;

            return (
              <a
                className={`mobile-directory-wheel__item${
                  index === selectedIndex
                    ? " mobile-directory-wheel__item--selected"
                    : ""
                }`}
                data-wheel-index={index}
                href={item.href}
                key={`${item.sectionTitle}-${item.label}`}
                style={wheelStyle}
                aria-current={index === selectedIndex ? "true" : undefined}
                onClick={(event) => handleItemClick(event, index)}
                {...(item.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function Index() {
  const [hoveredPreview, setHoveredPreview] =
    useState<DirectoryItem | null>(null);
  const [directoryChannel, setDirectoryChannel] =
    useState<DirectoryItem | null>(null);
  const [channel, setChannel] = useState(0);
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
      setIsTvModelReady(false);
      setIsMobileTvLayout(mobileTvQuery.matches);
    };
    const handleTvModelReady = () => setIsTvModelReady(true);

    updateMobileTvLayout();
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
    : fittedModelScale;
  const currentChannel = tvChannels[channel];
  const regularChannelActive =
    hoveredPreview === null && directoryChannel === null;
  const selectedPreview = hoveredPreview ?? directoryChannel ?? currentChannel;
  const screenLinkHref = selectedPreview.href || null;
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
        <ResumeTerminalCanvas active={selectedPreview.label === "resume"} />
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
      {isHydrated && isMobileTvLayout ? (
        <MobileDirectoryWheel
          items={mobileDirectoryItems}
          onPreview={showPreview}
          onPreviewEnd={returnToRegularChannels}
        />
      ) : null}
      <MobileSocialLinks />
      <DirectoryColumn
        sections={directorySections}
        side="left"
        onPreview={showPreview}
        onPreviewEnd={restoreChannelAfterPreview}
      />
    </main>
  );
}
