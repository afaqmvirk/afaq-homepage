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
    return cards;
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
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    // Resize canvas to container
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
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
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const canvasCoords = (e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      const t = e.touches[0] ?? e.changedTouches[0];
      clientX = t?.clientX ?? 0;
      clientY = t?.clientY ?? 0;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827"; // gray-900
    ctx.lineWidth = 4;

    const onDown = (e: MouseEvent | TouchEvent) => {
      isDrawingRef.current = true;
      lastPointRef.current = canvasCoords(e);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
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
    const onUp = () => {
      isDrawingRef.current = false;
      lastPointRef.current = null;
    };

    // Mouse
    canvas.addEventListener("mousedown", onDown as any);
    canvas.addEventListener("mousemove", onMove as any);
    window.addEventListener("mouseup", onUp as any);
    // Touch
    canvas.addEventListener("touchstart", onDown as any, { passive: false });
    canvas.addEventListener("touchmove", onMove as any, { passive: false });
    window.addEventListener("touchend", onUp as any);

    return () => {
      canvas.removeEventListener("mousedown", onDown as any);
      canvas.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp as any);
      canvas.removeEventListener("touchstart", onDown as any);
      canvas.removeEventListener("touchmove", onMove as any);
      window.removeEventListener("touchend", onUp as any);
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const container = containerRef.current;
    if (ctx && container) {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
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
      // Start with first question
      const firstQ = CONVERSATION_QUESTIONS[0];
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
      }
    }
  }, [mode, conversationMessages.length]);

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
      const nextIndex =
        (currentQuestionIndex + 1) % CONVERSATION_QUESTIONS.length;
      const nextQ = CONVERSATION_QUESTIONS[nextIndex];
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
    setUserInput((prev) => handleKoreanInput(prev, char));
  };

  const handleBackspace = () => {
    setUserInput((prev) => handleKoreanInput(prev, "Backspace"));
  };

  const handleSpace = () => {
    setUserInput((prev) => handleKoreanInput(prev, " "));
  };

  const handlePunctuation = (char: string) => {
    setUserInput((prev) => prev + char);
  };

  return (
    <div className="h-[100svh] min-h-[100svh] flex flex-col bg-white text-gray-900 overflow-hidden">
      {/* Mode Toggle */}
      <div className="z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded text-sm ${
                mode === "flashcards"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setMode("flashcards")}
            >
              Flashcards
            </button>
            <button
              className={`px-3 py-1 rounded text-sm ${
                mode === "conversation"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
              onClick={() => setMode("conversation")}
            >
              Conversation
            </button>
          </div>
          {mode === "flashcards" && (
            <>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded text-sm flex items-center gap-1 ${
                    showStarredOnly
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => {
                    setShowStarredOnly((v) => !v);
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                >
                  <span>{showStarredOnly ? "⭐" : "☆"}</span>
                  <span>Starred</span>
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    inverseMode
                      ? "bg-blue-100 text-blue-800 border border-blue-300"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => {
                    setInverseMode((v) => !v);
                    setIsFlipped(false);
                  }}
                >
                  Inverse
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activePos === "noun"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => {
                    setActivePos("noun");
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                >
                  Nouns
                </button>
                <button
                  className={`px-3 py-1 rounded text-sm ${
                    activePos === "verbAdj"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => {
                    setActivePos("verbAdj");
                    setFlashIndex(0);
                    setIsFlipped(false);
                  }}
                >
                  Verbs/Adj
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
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    {/* Front side */}
                    <div
                      className="relative w-full rounded-lg border border-gray-200 shadow-lg bg-white"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="p-8 sm:p-12 text-center min-h-[280px] sm:min-h-[320px] flex flex-col justify-center">
                        {/* Star button */}
                        <button
                          className="absolute top-4 left-4 text-2xl focus:outline-none z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar();
                          }}
                          aria-label={isStarred ? "Unstar" : "Star"}
                        >
                          {isStarred ? "⭐" : "☆"}
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
                          className="absolute top-4 left-4 text-2xl focus:outline-none z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar();
                          }}
                          aria-label={isStarred ? "Unstar" : "Star"}
                        >
                          {isStarred ? "⭐" : "☆"}
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
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors focus:outline-none z-10"
                onClick={handleNextCard}
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
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
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
                        onClick={() => toggleTranslation(msg.id)}
                        onTouchStart={(e) => e.stopPropagation()}
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
          <div className="border-t border-gray-200 bg-white">
            {/* Text input */}
            <div className="flex items-center gap-2 p-2">
              <input
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
                  if (window.innerWidth < 768) {
                    e.target.blur();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-base touch-manipulation bg-white text-gray-900"
                placeholder="Type your answer..."
                inputMode="none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                onClick={handleSendMessage}
              >
                Send
              </button>
            </div>

            {/* Korean Keyboard */}
            <div className="p-2 sm:p-3 bg-gray-50 border-t border-gray-200">
              <div className="space-y-1.5 sm:space-y-1">
                {koreanKeyboard.map((row, rowIdx) => (
                  <div
                    key={rowIdx}
                    className="flex gap-1.5 sm:gap-1 justify-center flex-wrap"
                  >
                    {row.map((char) => (
                      <button
                        key={char}
                        className="min-w-[44px] min-h-[44px] px-3 sm:px-2 py-2.5 sm:py-2 bg-white border border-gray-300 rounded text-lg sm:text-base hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                        onClick={(e) => {
                          e.preventDefault();
                          insertKoreanChar(char);
                        }}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          insertKoreanChar(char);
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {char}
                      </button>
                    ))}
                  </div>
                ))}
                {/* Special keys row */}
                <div className="flex gap-1.5 sm:gap-1 justify-center flex-wrap">
                  <button
                    className="min-w-[44px] min-h-[44px] px-3 sm:px-2 py-2.5 sm:py-2 bg-white border border-gray-300 rounded text-lg sm:text-base hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePunctuation(",");
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePunctuation(",");
                    }}
                  >
                    ,
                  </button>
                  <button
                    className="min-w-[44px] min-h-[44px] px-3 sm:px-2 py-2.5 sm:py-2 bg-white border border-gray-300 rounded text-lg sm:text-base hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePunctuation("?");
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePunctuation("?");
                    }}
                  >
                    ?
                  </button>
                  <button
                    className="min-w-[80px] min-h-[44px] px-6 py-2.5 sm:py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSpace();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSpace();
                    }}
                  >
                    Space
                  </button>
                  <button
                    className="min-w-[80px] min-h-[44px] px-6 py-2.5 sm:py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-100 active:bg-gray-200 touch-manipulation select-none"
                    onClick={(e) => {
                      e.preventDefault();
                      handleBackspace();
                    }}
                    onTouchStart={(e) => {
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
                  className="px-3 py-2 rounded bg-gray-100 text-sm"
                  onClick={clearCanvas}
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
