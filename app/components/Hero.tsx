import type { MetaFunction } from "@remix-run/node";
import {
  motion,
  useScroll,
  useMotionValue,
  useTransform,
  useTime,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import SocialBar from "./SocialBar";

export const meta: MetaFunction = () => {
  return [{ title: "Afaq Virk" }, { name: "description", content: " !" }];
};

const phrases = [
  "Full-Stack Developer",
  "Technical Educator",
  "building something interesting",
];

export default function Hero() {
  const ref = useRef(null);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const [targetPhrase, setTargetPhrase] = useState(phrases[0]);

  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Transform scroll position to phrase index
  const phraseIndex = useTransform(
    scrollY,
    [0, 500, 1200, 2300],
    [0, 0, 1, 2],
    { clamp: true }
  );

  // Blinking cursor animation
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Handle phrase transitions
  useEffect(() => {
    const unsubscribe = phraseIndex.on("change", (latest) => {
      const newIndex = Math.round(latest);
      if (newIndex !== currentPhraseIndex) {
        const newPhrase = phrases[newIndex];
        setTargetPhrase(newPhrase);

        // Always start by deleting current text, then type new phrase
        setIsDeleting(true);
        setIsTyping(false);

        setCurrentPhraseIndex(newIndex);
      }
    });
    return unsubscribe;
  }, [phraseIndex, currentPhraseIndex]);

  // Deleting animation
  useEffect(() => {
    if (!isDeleting) return;

    const deleteInterval = setInterval(() => {
      setDisplayText((prev) => {
        if (prev.length <= 0) {
          setIsDeleting(false);
          setIsTyping(true);
          clearInterval(deleteInterval);
          return "";
        }
        return prev.slice(0, -1);
      });
    }, 18);

    return () => clearInterval(deleteInterval);
  }, [isDeleting]);

  // Typing animation
  useEffect(() => {
    if (!isTyping) return;

    const currentPhrase = targetPhrase;
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= currentPhrase.length) {
        setDisplayText(currentPhrase.slice(0, currentIndex));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 52);

    return () => clearInterval(typeInterval);
  }, [targetPhrase, isTyping]);

  return (
    <div className="h-[400vh]" ref={ref}>
      <motion.div className=" h-screen content-center  justify-items-center sticky top-0 overflow-hidden">
        <motion.p
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:text-5xl text-3xl font-extrabold"
        >
          Hey! I'm
        </motion.p>
        <br></br>
        <motion.p
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:text-[12rem]/[8rem] text-[5rem]/[2rem] font-head"
        >
          AFAQ
        </motion.p>
        <motion.p
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:text-[10.5rem]/[12rem] text-[4.4rem]/[6rem] font-head"
        >
          VIRK—
        </motion.p>
        <motion.p
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:text-5xl text-2xl font-mono font-extrabold"
        >
          {displayText}
          <span
            className={`inline-block w-2 h-12 ml-1 mt-1 bg-current ${
              isTyping || isDeleting
                ? "opacity-100"
                : showCursor
                ? "opacity-100"
                : "opacity-0"
            } transition-opacity duration-75`}
          >
            &nbsp;
          </span>
        </motion.p>
        <div className=" absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6">
          <SocialBar />
        </div>
      </motion.div>
      {/* Scrolling image below sticky content */}
      <div className="flex justify-center mt-[-400px] ml-[70%] mix-blend-overlay">
        <img src="/htmltag.png" alt="HTML Tag" className="w-[15rem] h-auto" />
      </div>
      <div className="flex justify-center mt-[800px] mr-[70%] mix-blend-overlay">
        <img src="/grad.png" alt="HTML Tag" className="w-[15rem] h-auto" />
      </div>
      <div className="flex justify-center mt-[800px] ml-[65%] p-0 mix-blend-overlay">
        <img src="/doodlebob.png" alt="HTML Tag" className=" w-[15rem] " />
      </div>
    </div>
  );
}
