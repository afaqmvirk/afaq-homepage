export type ConversationMessage = {
  id: string;
  text: string;
  translation: string;
  isBot: boolean;
  timestamp: Date;
};

export type ConversationQuestion = {
  ko: string;
  en: string;
  isYesNo?: boolean; // Mark yes/no questions
};

export const CONVERSATION_QUESTIONS: ConversationQuestion[] = [
  // Yes/No questions
  {
    ko: "여동생 있어요?",
    en: "Do you have a younger sister?",
    isYesNo: true,
  },
  {
    ko: "남동생 있어요?",
    en: "Do you have a younger brother?",
    isYesNo: true,
  },
  {
    ko: "누나 있어요?",
    en: "Do you have an older sister?",
    isYesNo: true,
  },
  {
    ko: "형 있어요?",
    en: "Do you have an older brother?",
    isYesNo: true,
  },
  {
    ko: "아버지 있어요?",
    en: "Do you have a father?",
    isYesNo: true,
  },
  {
    ko: "어머니 있어요?",
    en: "Do you have a mother?",
    isYesNo: true,
  },
  {
    ko: "캐나다 사람이에요?",
    en: "Are you Canadian?",
    isYesNo: true,
  },
  {
    ko: "한국어 공부해요?",
    en: "Do you study Korean?",
    isYesNo: true,
  },
  {
    ko: "노트북 있어요?",
    en: "Do you have a laptop?",
    isYesNo: true,
  },
  {
    ko: "핸드폰 있어요?",
    en: "Do you have a cell phone?",
    isYesNo: true,
  },
  {
    ko: "한국 드라마 좋아해요?",
    en: "Do you like Korean dramas?",
    isYesNo: true,
  },
  {
    ko: "한국 음식 좋아해요?",
    en: "Do you like Korean food?",
    isYesNo: true,
  },
  {
    ko: "대학생이에요?",
    en: "Are you a college student?",
    isYesNo: true,
  },
  {
    ko: "1학년이에요?",
    en: "Are you a first-year student?",
    isYesNo: true,
  },
  {
    ko: "2학년이에요?",
    en: "Are you a second-year student?",
    isYesNo: true,
  },
  {
    ko: "3학년이에요?",
    en: "Are you a third-year student?",
    isYesNo: true,
  },
  {
    ko: "4학년이에요?",
    en: "Are you a fourth-year student?",
    isYesNo: true,
  },
  {
    ko: "토론토에 살아요?",
    en: "Do you live in Toronto?",
    isYesNo: true,
  },
  {
    ko: "밴쿠버에 살아요?",
    en: "Do you live in Vancouver?",
    isYesNo: true,
  },
  {
    ko: "기숙사에 살아요?",
    en: "Do you live in a residence?",
    isYesNo: true,
  },
  {
    ko: "한국어 재미있어요?",
    en: "Is Korean interesting?",
    isYesNo: true,
  },
  {
    ko: "한국어 어려워요?",
    en: "Is Korean difficult?",
    isYesNo: true,
  },
  // Open-ended questions
  {
    ko: "이름이 뭐예요?",
    en: "What is your name?",
  },
  {
    ko: "몇 학년이에요?",
    en: "What year are you? (Are you a first/second/etc. year student?)",
  },
  {
    ko: "뭐 먹어요?",
    en: "What are you eating?",
  },
  {
    ko: "뭐 해요?",
    en: "What do you do?",
  },
  {
    ko: "어디에 살아요?",
    en: "Where do you live?",
  },
  {
    ko: "어디 가요?",
    en: "Where are you going?",
  },
  {
    ko: "뭐 공부해요?",
    en: "What do you study?",
  },
  {
    ko: "뭐 읽어요?",
    en: "What do you read?",
  },
];

// Korean syllable composition helper
// Korean characters combine into syllable blocks: (initial consonant + vowel + optional final consonant)
const INITIAL_CONSONANTS = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const VOWELS = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ";
const FINAL_CONSONANTS =
  "ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ";

// Map single final consonants to their indices in FINAL_CONSONANTS
// Used for combining two singles into a double final
const FINAL_COMBINATIONS: Record<string, Record<string, number>> = {
  ㄱ: { ㅅ: 2 }, // ㄱ + ㅅ → ㄳ (index 2)
  ㄴ: { ㅈ: 4, ㅎ: 5 }, // ㄴ + ㅈ → ㄵ (index 4), ㄴ + ㅎ → ㄶ (index 5)
  ㄹ: {
    ㄱ: 8,
    ㅁ: 9,
    ㅂ: 10,
    ㅅ: 11,
    ㅌ: 12,
    ㅍ: 13,
    ㅎ: 14,
  }, // ㄹ + various → ㄺ, ㄻ, etc.
  ㅂ: { ㅅ: 17 }, // ㅂ + ㅅ → ㅄ (index 17)
};

// Decompose a Hangul syllable into its components
// Returns { initial, vowel, final } where final is 0 if none
function decomposeSyllable(syllable: string): {
  initial: number;
  vowel: number;
  final: number;
} | null {
  const code = syllable.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return null;

  const index = code - 0xac00;
  const initial = Math.floor(index / 588);
  const vowel = Math.floor((index % 588) / 28);
  const final = index % 28;

  return { initial, vowel, final };
}

// Get the single final consonant character from a final index
function getFinalChar(finalIdx: number): string {
  if (finalIdx === 0) return "";
  return FINAL_CONSONANTS[finalIdx - 1] || "";
}

// Check if two single finals can combine into a double final
function canCombineFinals(first: string, second: string): number | null {
  if (FINAL_COMBINATIONS[first] && FINAL_COMBINATIONS[first][second]) {
    return FINAL_COMBINATIONS[first][second];
  }
  return null;
}

// Compose a Hangul syllable from components
function composeSyllable(
  initial: number,
  vowel: number,
  final: number
): string {
  const syllableCode = 0xac00 + initial * 588 + vowel * 28 + final;
  return String.fromCharCode(syllableCode);
}

// Convert jamo (individual characters) to syllable blocks
// Hangul syllables: AC00 (가) to D7A3 (힣)
// Formula: AC00 + (initial × 588) + (vowel × 28) + final
export function composeKoreanSyllable(
  prev: string,
  char: string
): { composed: string; remaining: string } {
  if (!prev) {
    // Empty string - start new syllable
    if (INITIAL_CONSONANTS.includes(char)) {
      return { composed: char, remaining: "" };
    } else if (VOWELS.includes(char)) {
      // Vowel without initial - use ㅇ (index 11) as placeholder
      const vowelIdx = VOWELS.indexOf(char);
      const syllableCode = 0xac00 + 11 * 588 + vowelIdx * 28; // ㅇ + vowel
      return { composed: String.fromCharCode(syllableCode), remaining: "" };
    }
    return { composed: char, remaining: "" };
  }

  const lastChar = prev.slice(-1);
  const lastCode = lastChar.charCodeAt(0);

  // Check if last char is a complete Hangul syllable (AC00-D7A3)
  if (lastCode >= 0xac00 && lastCode <= 0xd7a3) {
    const decomposed = decomposeSyllable(lastChar);
    if (decomposed) {
      // Last char is complete syllable
      if (FINAL_CONSONANTS.includes(char)) {
        // Handle final consonant
        if (decomposed.final === 0) {
          // No final consonant yet - add it
          const finalIdx = FINAL_CONSONANTS.indexOf(char);
          const newSyllable = composeSyllable(
            decomposed.initial,
            decomposed.vowel,
            finalIdx + 1
          ); // +1 because final index 0 means no final
          return {
            composed: prev.slice(0, -1) + newSyllable,
            remaining: "",
          };
        } else {
          // Already has a final - check if we can combine into double final
          const existingFinal = getFinalChar(decomposed.final);
          const combinedFinalIdx = canCombineFinals(existingFinal, char);

          if (combinedFinalIdx !== null) {
            // Combine into double final (e.g., ㄱ + ㅅ → ㄳ)
            const newSyllable = composeSyllable(
              decomposed.initial,
              decomposed.vowel,
              combinedFinalIdx + 1
            );
            return {
              composed: prev.slice(0, -1) + newSyllable,
              remaining: "",
            };
          } else {
            // Can't combine - move to next syllable
            // The existing final stays, new char becomes initial of next syllable
            if (INITIAL_CONSONANTS.includes(char)) {
              // New char is an initial consonant (includes single finals like ㄱ, ㄴ, etc.)
              // Start new syllable with this as initial
              return { composed: prev + char, remaining: "" };
            } else if (VOWELS.includes(char)) {
              // New char is a vowel - start new syllable with ㅇ as initial
              const vowelIdx = VOWELS.indexOf(char);
              const syllableCode = 0xac00 + 11 * 588 + vowelIdx * 28;
              return {
                composed: prev + String.fromCharCode(syllableCode),
                remaining: "",
              };
            } else if (
              FINAL_CONSONANTS.includes(char) &&
              !INITIAL_CONSONANTS.includes(char)
            ) {
              // It's a double final (ㄳ, ㄵ, etc.) that can't be an initial
              // Replace the existing final with this double final
              const finalIdx = FINAL_CONSONANTS.indexOf(char);
              if (finalIdx >= 0) {
                const newSyllable = composeSyllable(
                  decomposed.initial,
                  decomposed.vowel,
                  finalIdx + 1
                );
                return {
                  composed: prev.slice(0, -1) + newSyllable,
                  remaining: "",
                };
              }
            }
            // Fallback: just append
            return { composed: prev + char, remaining: "" };
          }
        }
      } else if (INITIAL_CONSONANTS.includes(char)) {
        // Start new syllable with initial consonant
        return { composed: prev + char, remaining: "" };
      } else if (VOWELS.includes(char)) {
        // Vowel needs initial consonant - use ㅇ
        const vowelIdx = VOWELS.indexOf(char);
        const syllableCode = 0xac00 + 11 * 588 + vowelIdx * 28;
        return {
          composed: prev + String.fromCharCode(syllableCode),
          remaining: "",
        };
      }
    }
    return { composed: prev + char, remaining: "" };
  }

  // Last char is jamo - try to compose
  if (INITIAL_CONSONANTS.includes(lastChar)) {
    // Last is initial consonant
    if (VOWELS.includes(char)) {
      // Combine: initial + vowel → syllable
      const initialIdx = INITIAL_CONSONANTS.indexOf(lastChar);
      const vowelIdx = VOWELS.indexOf(char);
      const syllableCode = 0xac00 + initialIdx * 588 + vowelIdx * 28;
      return {
        composed: prev.slice(0, -1) + String.fromCharCode(syllableCode),
        remaining: "",
      };
    } else if (INITIAL_CONSONANTS.includes(char)) {
      // Two initials - keep separate (can't combine)
      return { composed: prev + char, remaining: "" };
    } else if (FINAL_CONSONANTS.includes(char)) {
      // Initial + final consonant - can't combine without vowel
      // Keep as separate jamo
      return { composed: prev + char, remaining: "" };
    }
    return { composed: prev + char, remaining: "" };
  } else if (VOWELS.includes(lastChar)) {
    // Last is vowel - check if previous char was initial
    if (prev.length >= 2) {
      const secondLast = prev.slice(-2, -1);
      if (INITIAL_CONSONANTS.includes(secondLast)) {
        // We have initial + vowel, check if we can add final
        if (FINAL_CONSONANTS.includes(char)) {
          // Add final to the syllable we just formed
          const initialIdx = INITIAL_CONSONANTS.indexOf(secondLast);
          const vowelIdx = VOWELS.indexOf(lastChar);
          const finalIdx = FINAL_CONSONANTS.indexOf(char);
          const newSyllable = composeSyllable(
            initialIdx,
            vowelIdx,
            finalIdx + 1
          );
          return {
            composed: prev.slice(0, -2) + newSyllable,
            remaining: "",
          };
        }
      }
    }
    // Can't add to existing vowel
    if (INITIAL_CONSONANTS.includes(char)) {
      return { composed: prev + char, remaining: "" };
    } else if (VOWELS.includes(char)) {
      // Two vowels - start new syllable with ㅇ
      const vowelIdx = VOWELS.indexOf(char);
      const syllableCode = 0xac00 + 11 * 588 + vowelIdx * 28;
      return {
        composed: prev + String.fromCharCode(syllableCode),
        remaining: "",
      };
    }
    return { composed: prev + char, remaining: "" };
  } else if (FINAL_CONSONANTS.includes(lastChar)) {
    // Last is final consonant jamo - start new syllable
    if (INITIAL_CONSONANTS.includes(char)) {
      return { composed: prev + char, remaining: "" };
    } else if (VOWELS.includes(char)) {
      const vowelIdx = VOWELS.indexOf(char);
      const syllableCode = 0xac00 + 11 * 588 + vowelIdx * 28;
      return {
        composed: prev + String.fromCharCode(syllableCode),
        remaining: "",
      };
    }
    return { composed: prev + char, remaining: "" };
  }

  // Default: just append (for non-Korean characters)
  return { composed: prev + char, remaining: "" };
}

// Smart Korean text input handler
export function handleKoreanInput(
  currentText: string,
  newChar: string
): string {
  // Handle special characters
  if (newChar === " ") {
    return currentText + " ";
  }
  if (newChar === "Backspace" || newChar === "⌫") {
    return currentText.slice(0, -1);
  }

  // Try to compose Korean syllable
  const result = composeKoreanSyllable(currentText, newChar);
  return result.composed;
}
