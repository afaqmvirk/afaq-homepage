import type { MetaFunction } from "@remix-run/node";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  EN_TO_KO,
  FLASHCARDS,
  type Flashcard,
  type PosKey,
} from "~/kore1010/wordBank";
import {
  CONVERSATION_QUESTIONS,
  handleKoreanInput,
  type ConversationMessage,
} from "~/kore1010/conversation";

export const meta: MetaFunction = () => {
  return [
    { title: "Kore1010 Practice" },
    {
      name: "description",
      content: "Korean practice — flashcards, translate, conjugate, draw",
    },
  ];
};

// word bank moved to ~/kore1010/wordBank
// conversation data moved to ~/kore1010/conversation

type PracticeMode = "flashcards" | "conversation";

export default function Kore1010Practice() {
  const [mode, setMode] = useState<PracticeMode>("flashcards");
  const [activePos, setActivePos] = useState<PosKey>("noun");
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Conversation mode state
  const [conversationMessages, setConversationMessages] = useState<
    ConversationMessage[]
  >([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [showTranslation, setShowTranslation] = useState<Set<string>>(
    new Set()
  );
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedTexts, setDisplayedTexts] = useState<Record<string, string>>(
    {}
  );
  const [useNativeKeyboard, setUseNativeKeyboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shuffled conversation questions (randomized once per session)
  const [shuffledQuestions] = useState(() => {
    const shuffled = [...CONVERSATION_QUESTIONS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });

  // Flashcards
  const [flashIndex, setFlashIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [inverseMode, setInverseMode] = useState(false); // Show English by default if true
  const [starredWords, setStarredWords] = useState<Set<string>>(new Set());
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "left"
  );
  const [isSliding, setIsSliding] = useState(false);

  const filteredCards = useMemo(() => {
    let cards = FLASHCARDS.filter((c) => c.pos === activePos);
    if (showStarredOnly) {
      cards = cards.filter((c) => starredWords.has(`${c.ko}-${c.pos}`));
    }
    // Randomize the order
    const shuffled = [...cards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [activePos, showStarredOnly, starredWords]);

  const currentCard =
    filteredCards[flashIndex % Math.max(filteredCards.length, 1)];

  // Check if current card is starred
  const isStarred = currentCard
    ? starredWords.has(`${currentCard.ko}-${currentCard.pos}`)
    : false;

  // Drawing pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Prevent double presses
  const lastKeyPressRef = useRef<{ char: string; time: number } | null>(null);
  const KEY_PRESS_DEBOUNCE_MS = 150;

  useEffect(() => {
    // Resize canvas to container
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      // Only resize if in flashcards mode
      if (mode !== "flashcards") return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        // background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, rect.width, rect.height);
        // Update context ref and reinitialize styles
        ctxRef.current = ctx;
        initializeDrawingStyles();
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [mode]);

  const canvasCoords = (e: MouseEvent | TouchEvent | PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      clientX = t?.clientX ?? 0;
      clientY = t?.clientY ?? 0;
    } else if ("pointerId" in e) {
      // PointerEvent
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      // MouseEvent
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // Function to initialize drawing styles
  const initializeDrawingStyles = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827"; // gray-900
    ctx.lineWidth = 4;
    ctx.fillStyle = "#111827"; // gray-900 for initial point
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Only set up drawing if we're in flashcards mode (where drawing pad is visible)
    if (mode !== "flashcards") return;

    // Initialize canvas context and store in ref
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    // Set drawing styles
    initializeDrawingStyles();

    const onDown = (e: MouseEvent | TouchEvent | PointerEvent) => {
      const ctx = ctxRef.current;
      if (!ctx) return;

      // Re-initialize styles in case context was lost
      initializeDrawingStyles();

      isDrawingRef.current = true;
      const point = canvasCoords(e);
      lastPointRef.current = point;
      // Draw initial point
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
      ctx.fill();
      e.preventDefault();
    };

    const onMove = (e: MouseEvent | TouchEvent | PointerEvent) => {
      if (!isDrawingRef.current) return;
      const ctx = ctxRef.current;
      if (!ctx) return;

      const next = canvasCoords(e);
      const last = lastPointRef.current;
      if (!last) {
        lastPointRef.current = next;
        return;
      }
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(next.x, next.y);
      ctx.stroke();
      lastPointRef.current = next;
      e.preventDefault();
    };

    const onUp = (e?: MouseEvent | TouchEvent | PointerEvent) => {
      if (e) e.preventDefault();
      isDrawingRef.current = false;
      lastPointRef.current = null;
    };

    // Use pointer events for better cross-device support
    const onPointerDown = (e: PointerEvent) => {
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {
        // Pointer capture might fail, continue anyway
      }
      onDown(e);
    };

    const onPointerMove = (e: PointerEvent) => {
      // Check if we have capture, but also allow if we're drawing
      if (isDrawingRef.current || canvas.hasPointerCapture(e.pointerId)) {
        onMove(e);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore errors
      }
      onUp(e);
    };

    // Mouse events (fallback)
    canvas.addEventListener("mousedown", onDown as any);
    canvas.addEventListener("mousemove", onMove as any);
    window.addEventListener("mouseup", onUp as any);

    // Pointer events (works for both mouse and touch)
    canvas.addEventListener("pointerdown", onPointerDown as any);
    canvas.addEventListener("pointermove", onPointerMove as any);
    canvas.addEventListener("pointerup", onPointerUp as any);
    canvas.addEventListener("pointercancel", onPointerUp as any);

    // Touch events (additional support)
    canvas.addEventListener("touchstart", onDown as any, { passive: false });
    canvas.addEventListener("touchmove", onMove as any, { passive: false });
    window.addEventListener("touchend", onUp as any);
    window.addEventListener("touchcancel", onUp as any);

    return () => {
      canvas.removeEventListener("mousedown", onDown as any);
      canvas.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp as any);
      canvas.removeEventListener("pointerdown", onPointerDown as any);
      canvas.removeEventListener("pointermove", onPointerMove as any);
      canvas.removeEventListener("pointerup", onPointerUp as any);
      canvas.removeEventListener("pointercancel", onPointerUp as any);
      canvas.removeEventListener("touchstart", onDown as any);
      canvas.removeEventListener("touchmove", onMove as any);
      window.removeEventListener("touchend", onUp as any);
      window.removeEventListener("touchcancel", onUp as any);
    };
  }, [mode]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab became visible - reinitialize context and styles
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctxRef.current = ctx;
            initializeDrawingStyles();
            // Reset drawing state
            isDrawingRef.current = false;
            lastPointRef.current = null;
          }
        }
      } else {
        // Tab became hidden - reset drawing state
        isDrawingRef.current = false;
        lastPointRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Get fresh context and update ref
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;

    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Reinitialize drawing styles
    initializeDrawingStyles();
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    // Slide current card out to the left
    setSlideDirection("left");
    setIsSliding(true);

    // After slide out, update index and prepare new card to slide in from right
    setTimeout(() => {
      setFlashIndex((i) => (i + 1) % Math.max(filteredCards.length, 1));
      setSlideDirection("right");
      // Start new card from right, then slide in
      setTimeout(() => {
        setIsSliding(false);
      }, 50);
    }, 300); // Match animation duration
  };

  const toggleStar = () => {
    if (!currentCard) return;
    const key = `${currentCard.ko}-${currentCard.pos}`;
    setStarredWords((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Typing animation effect
  useEffect(() => {
    if (!typingMessageId) return;

    const message = conversationMessages.find((m) => m.id === typingMessageId);
    if (!message || !message.isBot) {
      setTypingMessageId(null);
      return;
    }

    const fullText = message.text;
    const currentLength = displayedTexts[typingMessageId]?.length || 0;

    if (currentLength < fullText.length) {
      const timer = setTimeout(() => {
        setDisplayedTexts((prev) => {
          const current = prev[typingMessageId] || "";
          return {
            ...prev,
            [typingMessageId]: fullText.slice(0, current.length + 1),
          };
        });
      }, 50); // 50ms per character for typing effect

      return () => clearTimeout(timer);
    } else {
      // Typing complete
      setTypingMessageId(null);
    }
  }, [typingMessageId, displayedTexts, conversationMessages]);

  // Conversation mode functions
  useEffect(() => {
    if (mode === "conversation" && conversationMessages.length === 0) {
      // Start with first question from shuffled list
      const firstQ = shuffledQuestions[0];
      if (firstQ) {
        const msgId = `q-0`;
        setConversationMessages([
          {
            id: msgId,
            text: firstQ.ko,
            translation: firstQ.en,
            isBot: true,
            timestamp: new Date(),
          },
        ]);
        setDisplayedTexts({ [msgId]: "" });
        setTypingMessageId(msgId);
        setCurrentQuestionIndex(0);
      }
    }
  }, [mode, conversationMessages.length, shuffledQuestions]);

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    // Add user message
    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      text: userInput.trim(),
      translation: "", // User messages don't need translation
      isBot: false,
      timestamp: new Date(),
    };

    setConversationMessages((prev) => [...prev, userMsg]);
    setUserInput("");

    // Add next question after a short delay with typing animation
    setTimeout(() => {
      const nextIndex = (currentQuestionIndex + 1) % shuffledQuestions.length;
      const nextQ = shuffledQuestions[nextIndex];
      if (nextQ) {
        const msgId = `q-${nextIndex}`;
        const botMsg: ConversationMessage = {
          id: msgId,
          text: nextQ.ko,
          translation: nextQ.en,
          isBot: true,
          timestamp: new Date(),
        };
        setConversationMessages((prev) => [...prev, botMsg]);
        setDisplayedTexts((prev) => ({ ...prev, [msgId]: "" }));
        setTypingMessageId(msgId);
        setCurrentQuestionIndex(nextIndex);
      }
    }, 500);
  };

  const toggleTranslation = (messageId: string) => {
    setShowTranslation((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  // Polite present conjugation with basic irregulars/contracted forms.
  // Returns { stem, ending } for color coding
  function conjugatePolitePresentSplit(
    word: string
  ): { stem: string; ending: string } | null {
    const w = word.trim();
    if (!w || !w.endsWith("다")) return null;

    if (w.endsWith("하다")) {
      return { stem: "해", ending: "요" };
    }

    // Known irregular overrides (subset)
    const overrides: Record<string, { stem: string; ending: string }> = {
      돕다: { stem: "도와", ending: "요" },
      곱다: { stem: "고와", ending: "요" },
      걷다: { stem: "걸어", ending: "요" },
      묻다: { stem: "물어", ending: "요" },
      듣다: { stem: "들어", ending: "요" },
      모르다: { stem: "몰라", ending: "요" },
      빠르다: { stem: "빨라", ending: "요" },
    };
    if (overrides[w]) return overrides[w];

    const baseStem = w.slice(0, -1 * "다".length);
    const last = baseStem[baseStem.length - 1]!;
    const code = last.charCodeAt(0);

    // Hangul syllables: AC00..D7A3
    if (code < 0xac00 || code > 0xd7a3) {
      return { stem: baseStem, ending: "어요" };
    }

    const index = code - 0xac00;
    const jung = Math.floor((index % 588) / 28); // vowel index
    // ㅏ index 0, ㅐ1, ㅑ2, ㅒ3, ㅓ4, ㅔ5, ㅕ6, ㅖ7, ㅗ8, ㅘ9, ㅙ10, ㅚ11, ㅛ12, ㅜ13, ㅝ14, ㅞ15, ㅟ16, ㅠ17, ㅡ18, ㅢ19, ㅣ20
    const chooseAyo = jung === 0 || jung === 8; // ㅏ or ㅗ

    // Simple contractions for common stems
    if (baseStem.endsWith("오")) {
      return { stem: "와", ending: "요" }; // 오다 → 와요
    }
    if (baseStem.endsWith("보")) {
      return { stem: "봐", ending: "요" }; // 보다 → 봐요
    }
    if (baseStem.endsWith("주")) {
      return { stem: "줘", ending: "요" }; // 주다 → 줘요
    }

    const ending = chooseAyo ? "아요" : "어요";
    return { stem: baseStem, ending };
  }

  // Korean keyboard layout
  const koreanKeyboard = [
    ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
    ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
    ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
  ];

  const insertKoreanChar = (char: string) => {
    const now = Date.now();
    const last = lastKeyPressRef.current;

    // Debounce: prevent double presses within 150ms
    if (last && last.char === char && now - last.time < KEY_PRESS_DEBOUNCE_MS) {
      return;
    }

    lastKeyPressRef.current = { char, time: now };
    setUserInput((prev) => handleKoreanInput(prev, char));
  };

  const handleBackspace = () => {
    const now = Date.now();
    const last = lastKeyPressRef.current;

    // Debounce: prevent double presses within 150ms
    if (
      last &&
      last.char === "Backspace" &&
      now - last.time < KEY_PRESS_DEBOUNCE_MS
    ) {
      return;
    }

    lastKeyPressRef.current = { char: "Backspace", time: now };
    setUserInput((prev) => handleKoreanInput(prev, "Backspace"));
  };

  const handleSpace = () => {
    const now = Date.now();
    const last = lastKeyPressRef.current;

    // Debounce: prevent double presses within 150ms
    if (last && last.char === " " && now - last.time < KEY_PRESS_DEBOUNCE_MS) {
      return;
    }

    lastKeyPressRef.current = { char: " ", time: now };

    setUserInput((prev) => {
      if (!prev) return " ";

      const lastChar = prev.slice(-1);
      const lastCode = lastChar.charCodeAt(0);

      // Check if last char is a jamo (incomplete syllable)
      const INITIAL_CONSONANTS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
      const VOWELS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";

      // If last char is a jamo (not a complete syllable), complete it with ㅇ
      if (INITIAL_CONSONANTS.includes(lastChar) || VOWELS.includes(lastChar)) {
        // It's a jamo - complete the syllable by adding ㅇ if needed
        if (INITIAL_CONSONANTS.includes(lastChar)) {
          // It's an initial consonant - add ㅣ vowel to complete
          const initialIdx = INITIAL_CONSONANTS.indexOf(lastChar);
          const vowelIdx = VOWELS.indexOf("ㅣ"); // Use ㅣ as default
          const syllableCode = 0xac00 + initialIdx * 588 + vowelIdx * 28;
          return prev.slice(0, -1) + String.fromCharCode(syllableCode) + " ";
        } else if (VOWELS.includes(lastChar)) {
          // It's a vowel - add ㅇ initial to complete
          const vowelIdx = VOWELS.indexOf(lastChar);
          const syllableCode = 0xac00 + 11 * 588 + vowelIdx * 28; // ㅇ + vowel
          return prev.slice(0, -1) + String.fromCharCode(syllableCode) + " ";
        }
      }

      // Last char is a complete syllable or other character - just add space
      return prev + " ";
    });
  };

  const handlePunctuation = (char: string) => {
    const now = Date.now();
    const last = lastKeyPressRef.current;

    // Debounce: prevent double presses within 150ms
    if (last && last.char === char && now - last.time < KEY_PRESS_DEBOUNCE_MS) {
      return;
    }

    lastKeyPressRef.current = { char, time: now };
    setUserInput((prev) => prev + char);
  };

  return (
    <div className="h-[100svh] min-h-[100svh] flex flex-col bg-white text-gray-900 overflow-hidden">
      {/* Mode Toggle */}
      <div className="z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              className={`px-2 sm:px-3 py-1 rounded text-base sm:text-sm touch-manipulation ${
                mode === "flashcards"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMode("flashcards");
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMode("flashcards");
              }}
              aria-label="Flashcards"
            >
              🃏
            </button>
            <button
              className={`px-2 sm:px-3 py-1 rounded text-base sm:text-sm touch-manipulation ${
                mode === "conversation"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMode("conversation");
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMode("conversation");
              }}
              aria-label="Conversation"
            >
              💬
            </button>
          </div>
          {mode === "flashcards" && (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  className={`px-2 sm:px-3 py-1 rounded text-base sm:text-sm touch-manipulation ${
                    showStarredOnly
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowStarredOnly((v) => !v);
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowStarredOnly((v) => !v);
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                  aria-label="Starred"
                >
                  {showStarredOnly ? "★" : "☆"}
                </button>
                <button
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm touch-manipulation ${
                    inverseMode
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setInverseMode((v) => !v);
                    setIsFlipped(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setInverseMode((v) => !v);
                    setIsFlipped(false);
                  }}
                >
                  <span className="hidden sm:inline">Inverse</span>
                  <span className="sm:hidden">↔</span>
                </button>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm touch-manipulation ${
                    activePos === "noun"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActivePos("noun");
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActivePos("noun");
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                >
                  <span className="hidden sm:inline">Nouns</span>
                  <span className="sm:hidden">N</span>
                </button>
                <button
                  className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm touch-manipulation ${
                    activePos === "verbAdj"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActivePos("verbAdj");
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActivePos("verbAdj");
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                >
                  <span className="hidden sm:inline">Verbs/Adj</span>
                  <span className="sm:hidden">V</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Flashcard */}
      {mode === "flashcards" && filteredCards.length === 0 ? (
        <div className="z-20 flex-shrink-0">
          <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
            <div className="rounded-lg border border-gray-200 shadow-sm bg-white p-8 text-center">
              <div className="text-lg text-gray-500">
                {showStarredOnly
                  ? "No starred words yet. Star some words to see them here!"
                  : "No cards available."}
              </div>
            </div>
          </div>
        </div>
      ) : mode === "flashcards" && currentCard ? (
        <div className="z-20 flex-shrink-0 overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 pt-4 pb-2">
            <div className="relative">
              {/* Slide container */}
              <div
                key={flashIndex}
                className="relative w-full transition-transform duration-300 ease-in-out"
                style={{
                  transform: isSliding
                    ? `translateX(${
                        slideDirection === "left" ? "-100%" : "100%"
                      })`
                    : "translateX(0)",
                  opacity: isSliding && slideDirection === "left" ? 0 : 1,
                }}
              >
                {/* Flip container */}
                <div
                  className="relative w-full"
                  style={{ perspective: "1000px" }}
                >
                  <div
                    className="relative w-full transition-transform duration-500 cursor-pointer"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: isFlipped
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFlipped(!isFlipped);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsFlipped(!isFlipped);
                    }}
                  >
                    {/* Front side */}
                    <div
                      className="relative w-full rounded-lg border border-gray-200 shadow-lg bg-white"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="p-8 sm:p-12 text-center min-h-[280px] sm:min-h-[320px] flex flex-col justify-center">
                        {/* Star button */}
                        <button
                          className="absolute top-4 left-4 text-2xl focus:outline-none z-10 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleStar();
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleStar();
                          }}
                          aria-label={isStarred ? "Unstar" : "Star"}
                        >
                          {isStarred ? "★" : "☆"}
                        </button>

                        {/* Content based on inverseMode */}
                        {inverseMode ? (
                          // Inverse: show English on front
                          activePos === "noun" ? (
                            <div className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight break-words text-gray-800">
                              {currentCard.en}
                            </div>
                          ) : (
                            <div className="text-2xl sm:text-3xl text-gray-500">
                              {currentCard.en}
                            </div>
                          )
                        ) : (
                          // Normal: show Korean on front
                          <div className="text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight break-words">
                            {currentCard.ko}
                          </div>
                        )}

                        {/* Flip hint */}
                        <div className="mt-6 text-sm text-gray-400">
                          Tap to flip
                        </div>
                      </div>
                    </div>

                    {/* Back side */}
                    <div
                      className="absolute inset-0 w-full rounded-lg border border-gray-200 shadow-lg bg-white"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div className="p-8 sm:p-12 text-center min-h-[280px] sm:min-h-[320px] flex flex-col justify-center">
                        {/* Star button (back side) */}
                        <button
                          className="absolute top-4 left-4 text-2xl focus:outline-none z-10 touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleStar();
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleStar();
                          }}
                          aria-label={isStarred ? "Unstar" : "Star"}
                        >
                          {isStarred ? "★" : "☆"}
                        </button>

                        {/* Content based on inverseMode and type */}
                        {inverseMode ? (
                          // Inverse: show Korean/conjugation on back
                          activePos === "noun" ? (
                            <div className="text-5xl sm:text-6xl md:text-7xl font-semibold leading-tight break-words">
                              {currentCard.ko}
                            </div>
                          ) : (
                            (() => {
                              const conj = conjugatePolitePresentSplit(
                                currentCard.ko
                              );
                              if (!conj) {
                                return (
                                  <div className="text-2xl text-gray-500">
                                    {currentCard.ko}
                                  </div>
                                );
                              }
                              return (
                                <div className="space-y-4">
                                  <div className="text-2xl sm:text-3xl text-gray-500 mb-2">
                                    {currentCard.en}
                                  </div>
                                  <div className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight">
                                    <span className="text-gray-900">
                                      {conj.stem}
                                    </span>
                                    <span className="text-red-600">
                                      {conj.ending}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()
                          )
                        ) : // Normal: show English/conjugation on back
                        activePos === "noun" ? (
                          <div className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight break-words text-gray-800">
                            {currentCard.en}
                          </div>
                        ) : (
                          (() => {
                            const conj = conjugatePolitePresentSplit(
                              currentCard.ko
                            );
                            if (!conj) {
                              return (
                                <div className="text-2xl text-gray-500">
                                  {currentCard.en}
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-4">
                                <div className="text-2xl sm:text-3xl text-gray-500 mb-2">
                                  {currentCard.en}
                                </div>
                                <div className="text-4xl sm:text-5xl md:text-6xl font-semibold leading-tight">
                                  <span className="text-gray-900">
                                    {conj.stem}
                                  </span>
                                  <span className="text-red-600">
                                    {conj.ending}
                                  </span>
                                </div>
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next button (circular, right side) */}
              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors focus:outline-none z-10 touch-manipulation"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNextCard();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNextCard();
                }}
                aria-label="Next card"
              >
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Conversation Mode */}
      {mode === "conversation" ? (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-0">
            {conversationMessages.map((msg) => {
              const displayedText =
                msg.isBot && typingMessageId === msg.id
                  ? displayedTexts[msg.id] || ""
                  : msg.text;
              const isTyping =
                msg.isBot &&
                typingMessageId === msg.id &&
                displayedText.length < msg.text.length;

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.isBot ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.isBot
                        ? "bg-gray-100 text-gray-900"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    <div className="text-base">
                      {displayedText}
                      {isTyping && (
                        <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
                      )}
                    </div>
                    {msg.isBot && msg.translation && !isTyping && (
                      <button
                        className="mt-1 text-xs text-gray-500 hover:text-gray-700 underline touch-manipulation"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleTranslation(msg.id);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleTranslation(msg.id);
                        }}
                      >
                        {showTranslation.has(msg.id) ? "Hide" : "Translate"}
                      </button>
                    )}
                    {msg.isBot &&
                      msg.translation &&
                      showTranslation.has(msg.id) &&
                      !isTyping && (
                        <div className="mt-1 text-xs text-gray-600 italic">
                          {msg.translation}
                        </div>
                      )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input area with Korean keyboard */}
          <div className="border-t border-gray-200 bg-white flex-shrink-0">
            {/* Text input */}
            <div className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                onFocus={(e) => {
                  // Prevent native keyboard on mobile when using custom keyboard
                  if (!useNativeKeyboard && window.innerWidth < 768) {
                    e.target.blur();
                  }
                }}
                readOnly={!useNativeKeyboard && window.innerWidth < 768}
                className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm sm:text-base touch-manipulation bg-white text-gray-900"
                placeholder="Type your answer..."
                inputMode={useNativeKeyboard ? "text" : "none"}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <button
                className="flex-shrink-0 px-2 sm:px-3 py-1.5 sm:py-2 rounded text-sm bg-gray-100 hover:bg-gray-200 touch-manipulation"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUseNativeKeyboard((v) => {
                    const newValue = !v;
                    // Focus input when switching to native keyboard
                    if (newValue && inputRef.current) {
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 100);
                    }
                    return newValue;
                  });
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUseNativeKeyboard((v) => {
                    const newValue = !v;
                    // Focus input when switching to native keyboard
                    if (newValue && inputRef.current) {
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 100);
                    }
                    return newValue;
                  });
                }}
                aria-label={
                  useNativeKeyboard
                    ? "Use custom keyboard"
                    : "Use native keyboard"
                }
              >
                {useNativeKeyboard ? "⌨️" : "🌐"}
              </button>
              <button
                className="flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 touch-manipulation text-sm sm:text-base whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendMessage();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSendMessage();
                }}
              >
                Send
              </button>
            </div>

            {/* Korean Keyboard */}
            {!useNativeKeyboard && (
              <div className="p-1.5 sm:p-3 bg-gray-50 border-t border-gray-200">
                <div className="space-y-1 sm:space-y-1">
                  {koreanKeyboard.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-0.5 sm:gap-1 w-full">
                      {row.map((char) => (
                        <button
                          key={char}
                          className="flex-1 min-h-[36px] sm:min-h-[44px] px-0.5 sm:px-1 py-1 sm:py-2 bg-white border border-gray-300 rounded text-base sm:text-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            insertKoreanChar(char);
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            insertKoreanChar(char);
                          }}
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  ))}
                  {/* Special keys row */}
                  <div className="flex gap-0.5 sm:gap-1 w-full">
                    <button
                      className="flex-1 min-h-[28px] sm:min-h-[36px] px-0.5 sm:px-1 py-0.5 sm:py-1.5 bg-white border border-gray-300 rounded text-base sm:text-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePunctuation(",");
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePunctuation(",");
                      }}
                    >
                      ,
                    </button>
                    <button
                      className="flex-1 min-h-[28px] sm:min-h-[36px] px-0.5 sm:px-1 py-0.5 sm:py-1.5 bg-white border border-gray-300 rounded text-base sm:text-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePunctuation("?");
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePunctuation("?");
                      }}
                    >
                      ?
                    </button>
                    <button
                      className="flex-[2] min-h-[36px] sm:min-h-[44px] px-1 sm:px-2 py-1 sm:py-2 bg-white border border-gray-300 rounded text-xs sm:text-sm hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSpace();
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSpace();
                      }}
                    >
                      Space
                    </button>
                    <button
                      className="flex-1 min-h-[28px] sm:min-h-[36px] px-0.5 sm:px-1 py-0.5 sm:py-1.5 bg-white border border-gray-300 rounded text-base sm:text-lg hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBackspace();
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBackspace();
                      }}
                    >
                      ⌫
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Drawing Pad (fills remaining space) */
        <div className="max-w-4xl mx-auto w-full px-4 mt-4 flex-1 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Drawing pad — practice characters
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-2 rounded bg-gray-100 text-sm touch-manipulation"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearCanvas();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    clearCanvas();
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            <div
              ref={containerRef}
              className="w-full flex-1 border border-gray-200 rounded-lg overflow-hidden"
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full touch-none cursor-crosshair"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
