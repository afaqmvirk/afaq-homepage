import { useEffect, useRef, useState } from "react";

type CaptionCue = {
  start: number;
  end: number;
  text: string;
};

type CaptionTrack = {
  cues: CaptionCue[];
};

type CrtVideoTimeDetail = {
  url?: string;
  currentTime?: number;
};

export type CrtCaptionStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  maxWidth: number;
  maxLines: number;
  bottomPadding: number;
  horizontalPadding: number;
  verticalPadding: number;
  backgroundOpacity: number;
  outlineWidth: number;
};

// This is the single adjustment point for every TV caption. Caption wording
// and timing remain separately editable in public/captions/*.json.
export const CRT_CAPTION_STYLE: CrtCaptionStyle = {
  fontFamily: "Arial, sans-serif",
  fontSize: 44,
  fontWeight: 600,
  lineHeight: 1.18,
  maxWidth: 0.84,
  maxLines: 2,
  bottomPadding: 62,
  horizontalPadding: 18,
  verticalPadding: 10,
  backgroundOpacity: 0.72,
  outlineWidth: 2,
};

const emitCaption = (
  text: string,
  style: CrtCaptionStyle,
  target: EventTarget = window,
) => {
  target.dispatchEvent(
    new CustomEvent("crt-caption-change", {
      bubbles: true,
      detail: { text, ...style },
    }),
  );
};

const findCaption = (cues: CaptionCue[], currentTime: number) => {
  let low = 0;
  let high = cues.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const cue = cues[middle];

    if (currentTime < cue.start) high = middle - 1;
    else if (currentTime >= cue.end) low = middle + 1;
    else return cue;
  }

  return null;
};

type CrtCaptionControllerProps = {
  mediaUrl: string;
  track?: string;
  style?: CrtCaptionStyle;
};

export default function CrtCaptionController({
  mediaUrl,
  track,
  style = CRT_CAPTION_STYLE,
}: CrtCaptionControllerProps) {
  const [cues, setCues] = useState<CaptionCue[]>([]);
  const [accessibleText, setAccessibleText] = useState("");
  const cuesRef = useRef<CaptionCue[]>([]);
  const currentTextRef = useRef("");
  const latestTimeRef = useRef(0);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const abortController = new AbortController();
    cuesRef.current = [];
    currentTextRef.current = "";
    latestTimeRef.current = 0;
    setCues([]);
    setAccessibleText("");
    const eventTarget = statusRef.current?.closest(".crt-stage") ?? window;
    emitCaption("", style, eventTarget);

    if (!track) return () => abortController.abort();

    void fetch(track, { signal: abortController.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Caption track failed to load: ${response.status}`);
        }
        return response.json() as Promise<CaptionTrack>;
      })
      .then((captionTrack) => {
        const nextCues = captionTrack.cues ?? [];
        cuesRef.current = nextCues;
        setCues(nextCues);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn(error);
      });

    return () => abortController.abort();
  }, [mediaUrl, style, track]);

  useEffect(() => {
    const updateCaption = (currentTime: number) => {
      latestTimeRef.current = currentTime;
      const text = findCaption(cuesRef.current, currentTime)?.text ?? "";

      if (text === currentTextRef.current) return;

      currentTextRef.current = text;
      setAccessibleText(text);
      const eventTarget = statusRef.current?.closest(".crt-stage") ?? window;
      emitCaption(text, style, eventTarget);
    };

    const handleVideoTime = (event: Event) => {
      const detail = (event as CustomEvent<CrtVideoTimeDetail>).detail;
      if (detail?.url !== mediaUrl || !Number.isFinite(detail.currentTime)) return;
      updateCaption(Number(detail.currentTime));
    };

    const eventTarget = statusRef.current?.closest(".crt-stage") ?? window;
    eventTarget.addEventListener("crt-video-time", handleVideoTime);
    updateCaption(latestTimeRef.current);

    return () => eventTarget.removeEventListener("crt-video-time", handleVideoTime);
  }, [cues, mediaUrl, style]);

  return (
    <span
      className="sr-only"
      aria-live="off"
      ref={statusRef}
    >
      {accessibleText}
    </span>
  );
}
