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
import RetroSocialCanvases, {
  RETRO_SOCIAL_MEDIA,
} from "~/components/RetroSocialCanvases";
import ResumeTerminalCanvas, {
  RESUME_TERMINAL_MEDIA,
} from "~/components/ResumeTerminalCanvas";

type DirectoryItem = {
  label: string;
  href: string;
  preview: string;
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
  creationDate: "current",
};

const tvChannels = [
  defaultPreview,
  {
    label: "3D pipes",
    href: "/",
    preview: PIPES_SCREENSAVER_MEDIA,
    creationDate: "2026-08-26",
  },
  {
    label: "Animation Project 1",
    href: "/",
    preview: "/channels/animation-project-1.mp4",
    creationDate: "2022-01-10",
    startAt: 3,
  },
  {
    label: "Animation Project 2",
    href: "/",
    preview: "/channels/animation-project-2.mp4",
    creationDate: "2022-02-01",
    startAt: 3,
  },
  {
    label: "Text-to-SQL",
    href: "/",
    preview: "/channels/text-to-sql.mp4",
    creationDate: "2025-11-30",
    startAt: 360,
    endAt: 420,
    captionTrack: "/captions/text-to-sql.json",
  },
  {
    label: "AMR Surveillance Bias",
    href: "/",
    preview: "/channels/amr-surveillance-bias.mp4",
    creationDate: "2026-06-27",
    startAt: 60,
    captionTrack: "/captions/amr-surveillance-bias.json",
  },
  {
    label: "Balancing Chemical Equations",
    href: "/",
    preview: "/channels/chemical-equations.mp4",
    creationDate: "2024-09-11",
    startAt: 30,
    captionTrack: "/captions/chemical-equations.json",
  },
  {
    label: "Relatom",
    href: "/",
    preview: "/channels/relatom.mp4",
    creationDate: "-",
    startAt: 120,
    captionTrack: "/captions/relatom.json",
  },
  {
    label: "WebSocket Collaboration",
    href: "/",
    preview: "/channels/websocket-collaboration.mp4",
    creationDate: "-",
    startAt: 20,
    captionTrack: "/captions/websocket-collaboration.json",
  },
  {
    label: "LC Games",
    href: "/",
    preview: "/channels/leetcode-games.mp4",
    creationDate: "2025-01-28",
    startAt: 21,
  },
  {
    label: "PortalPants",
    href: "/",
    preview: "/channels/portalpants.mp4",
    creationDate: "2022-01-22",
    startAt: 25,
  },
  {
    label: "COMP2406B Final Project",
    href: "/",
    preview: "/channels/comp2406b-final-project.mp4",
    creationDate: "2025-04-08",
    startAt: 150,
    captionTrack: "/captions/comp2406b-final-project.json",
  },
  {
    label: "Krusty Kalkulations",
    href: "/",
    preview: "/channels/krusty-kalkulations.mp4",
    creationDate: "2025-01-28",
    startAt: 17,
  },
  {
    label: "K.A.R.E.N.",
    href: "/",
    preview: "/channels/karen-demo.mp4",
    creationDate: "2026-01-18",
    startAt: 3,
  },
  {
    label: "UCDSB Board Meeting",
    href: "/",
    preview: "/channels/ucdsb-board-meeting.mp4",
    creationDate: "2024-03-06",
    captionTrack: "/captions/ucdsb-board-meeting.json",
  },
  {
    label: "Awards Ceremony",
    href: "/",
    preview: "/channels/awards-ceremony.mp4",
    creationDate: "2023-05-18",
    captionTrack: "/captions/awards-ceremony.json",
  },
] satisfies DirectoryItem[];

const socialItems: DirectoryItem[] = [
  {
    label: "Instagram",
    href: "https://instagram.com/afaqmvirk",
    preview: RETRO_SOCIAL_MEDIA.Instagram,
    external: true,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/afaqmvirk",
    preview: RETRO_SOCIAL_MEDIA.LinkedIn,
    external: true,
  },
  {
    label: "X",
    href: "https://x.com/afaqmvirk",
    preview: RETRO_SOCIAL_MEDIA.X,
    external: true,
  },
  {
    label: "Devpost",
    href: "https://devpost.com/afaqmvirk",
    preview: RETRO_SOCIAL_MEDIA.Devpost,
    external: true,
  },
];

const leftSections: DirectorySection[] = [
  {
    title: "Socials",
    items: socialItems,
  },
  {
    title: "Projects",
    items: [
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
        external: true,
      },
      {
        label: "KAREN",
        href: "https://devpost.com/software/karen-5g01yk",
        preview: "/channels/karen-demo.mp4",
        poster: "/previews/devpost-karen.jpg",
        startAt: 3,
        external: true,
      },
      {
        label: "Kompas",
        href: "https://devpost.com/software/kompas",
        preview: "/previews/devpost-kompas.png",
        external: true,
      },
    ],
  },
];

const rightSections: DirectorySection[] = [
  {
    title: "Design",
    items: [
      {
        label: "HtH III",
        href: "https://hackthehill.com",
        preview: "/previews/hack-the-hill.png",
        external: true,
      },
      {
        label: "sih",
        href: "https://stupideas.com",
        preview: "/previews/stupid-ideas.png",
        external: true,
      },
    ],
  },
  {
    title: "MathemaTech",
    items: [
      {
        label: "Courses",
        href: "https://mthm.tech",
        preview: "/previews/mathematech.png",
        external: true,
      },
      {
        label: "Kahoot!",
        href: "https://create.kahoot.it/profiles/35e825e0-8026-49fe-89c5-74cf77bccee3",
        preview: "/previews/kahoot.png",
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

function directoryChannelHref(item: DirectoryItem) {
  const slug = item.label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `#channel-${slug}`;
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
        title: item.label,
        creationDate: resolvedCreationDate(item),
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
          <h2>{section.title}</h2>
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
    Instagram: "/instagram.svg",
    LinkedIn: "/linkedin.svg",
  };
  const iconLabels: Record<string, string> = {
    X: "X",
    Devpost: "D",
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
          {iconSources[item.label] ? (
            <img src={iconSources[item.label]} alt="" />
          ) : (
            <span aria-hidden="true">{iconLabels[item.label]}</span>
          )}
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
      <div className="mobile-directory-wheel__section" aria-live="polite">
        {items[selectedIndex].sectionTitle}
      </div>
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
  const [channelTurns, setChannelTurns] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [volumeTurns, setVolumeTurns] = useState(0);
  const [usedControls, setUsedControls] = useState({
    channel: false,
    volume: false,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobileTvLayout, setIsMobileTvLayout] = useState(false);
  const [isTvModelReady, setIsTvModelReady] = useState(false);
  const [crtStageSize, setCrtStageSize] = useState({ width: 0, height: 0 });
  const crtStageRef = useRef<HTMLDivElement>(null);
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
  const screenMedia = (() => {
    if (!selectedPreview.preview.endsWith(".mp4")) {
      return selectedPreview.preview;
    }

    const mediaParams = new URLSearchParams();
    if (selectedPreview.startAt !== undefined) {
      mediaParams.set("startAt", String(selectedPreview.startAt));
    }
    if (selectedPreview.endAt !== undefined) {
      mediaParams.set("endAt", String(selectedPreview.endAt));
    }

    const mediaQuery = mediaParams.toString();
    return `${selectedPreview.preview}${mediaQuery ? `?${mediaQuery}` : ""}`;
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
    const nextChannel = (channel + 1) % tvChannels.length;
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
        <RetroSocialCanvases />
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
              screenFit="cover"
              screenSizeScale={1}
              curvature={0.16}
              scanlineStrength={0.32}
              chromaticEdgeIntensity={0.48}
              vignetteStrength={0.52}
              screenEmissive={0.86}
              glitchFrequency={4}
              glitchIntensity={0.35}
              backgroundColor="#0e0e0e"
              pointerParallax={1}
              turnOnAnimation
            />
          ) : null}
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
