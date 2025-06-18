import type { MetaFunction } from "@remix-run/node";
import {
  motion,
  useScroll,
  useMotionValue,
  useTransform,
  useTime,
  useMotionTemplate,
  useMotionValueEvent,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
export const meta: MetaFunction = () => {
  return [{ title: "Afaq Virk" }, { name: "description", content: " !" }];
};
import { shopify, carleton, mathematech } from "./ascii";
import useSize from "./useSize";
import "../crt.css";

// Random symbols for dissolve effect
const randomSymbols = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";

function generateRandomAscii(
  sourceAscii: string,
  targetAscii: string,
  progress: number
): string {
  const sourceLines = sourceAscii.split("\n");
  const targetLines = targetAscii.split("\n");
  const maxLines = Math.max(sourceLines.length, targetLines.length);
  const maxCharsPerLine = Math.max(
    ...sourceLines.map((line: string) => line.length),
    ...targetLines.map((line: string) => line.length)
  );

  // Create array of all character positions
  const allPositions = [];
  for (let i = 0; i < maxLines; i++) {
    for (let j = 0; j < maxCharsPerLine; j++) {
      allPositions.push([i, j]);
    }
  }

  // Randomly shuffle the positions
  const shuffledPositions = [...allPositions].sort(() => Math.random() - 0.5);

  // Calculate how many characters should be from target
  const totalChars = maxLines * maxCharsPerLine;
  const targetChars = Math.floor(totalChars * progress);

  // Create a set of positions that should be from target
  const targetPositions = new Set();
  for (let i = 0; i < targetChars; i++) {
    const [row, col] = shuffledPositions[i];
    targetPositions.add(`${row},${col}`);
  }

  let result = "";
  for (let i = 0; i < maxLines; i++) {
    for (let j = 0; j < maxCharsPerLine; j++) {
      const sourceChar = sourceLines[i]?.[j] || " ";
      const targetChar = targetLines[i]?.[j] || " ";

      if (targetPositions.has(`${i},${j}`)) {
        // This character should be from target
        result += targetChar;
      } else {
        // This character should be from source (or random if source is space and target isn't)
        if (sourceChar === " " && targetChar !== " ") {
          // If source is space but target isn't, use random symbol
          result +=
            randomSymbols[Math.floor(Math.random() * randomSymbols.length)];
        } else {
          // Otherwise use source character
          result += sourceChar;
        }
      }
    }
    if (i < maxLines - 1) result += "\n";
  }
  return result;
}

export default function Experience() {
  const [width, h] = useSize();
  const [currentAscii, setCurrentAscii] = useState(shopify);
  const [isDissolving, setIsDissolving] = useState(false);
  const [targetAscii, setTargetAscii] = useState(shopify);
  const [sourceAscii, setSourceAscii] = useState(shopify);
  const [currentColor, setCurrentColor] = useState("#00ff00");
  const [activeSection, setActiveSection] = useState(0);

  const ref = useRef(null);

  const { scrollY } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const len = useTransform(scrollY, [1 * h, 2 * h], [0, 1000], {
    clamp: false,
  });

  const asciiIndex = useTransform(
    scrollY,
    [4 * h, 5 * h, 5 * h + 1, 6 * h, 6 * h + 1],
    [0, 0, 1, 1, 2],
    { clamp: true }
  );

  const asciiArt = [shopify, carleton, mathematech];
  const colors = ["#00ff00", "#ff0000", "#00ffff"]; // green, red, teal

  // Handle ASCII transitions
  useEffect(() => {
    const unsubscribe = asciiIndex.on("change", (latest) => {
      const newIndex = Math.round(latest);
      const newAscii = asciiArt[newIndex];
      const newColor = colors[newIndex];

      if (newAscii !== targetAscii) {
        setSourceAscii(currentAscii); // Store current art as source
        setTargetAscii(newAscii);
        setCurrentColor(newColor);
        setActiveSection(newIndex);
        setIsDissolving(true);
      }
    });
    return unsubscribe;
  }, [asciiIndex, targetAscii, asciiArt, currentAscii, colors]);

  // Dissolve animation
  useEffect(() => {
    if (!isDissolving) return;

    let dissolveCount = 0;
    const maxDissolves = 35; // Number of random symbol iterations

    const dissolveInterval = setInterval(() => {
      if (dissolveCount < maxDissolves) {
        // Calculate progress (0 = all source, 1 = all target)
        const progress = dissolveCount / maxDissolves;
        setCurrentAscii(
          generateRandomAscii(sourceAscii, targetAscii, progress)
        );
        dissolveCount++;
      } else {
        setCurrentAscii(targetAscii);
        setIsDissolving(false);
        clearInterval(dissolveInterval);
      }
    }, 17);

    return () => clearInterval(dissolveInterval);
  }, [isDissolving, targetAscii, sourceAscii]);

  return (
    <div className="h-[400vh]">
      <div
        className="h-screen content-center bg-crt-pattern justify-items-center sticky top-0 overflow-hidden md:border-y-[3rem] md:border-x-[10rem] border-y-[4rem] border-x-[1rem] border-solid"
        style={{ borderImage: "url(crt_front.png) 270 stretch" }}
        ref={ref}
      >
        <motion.p
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:text-7xl md:text-6xl text-3xl font-head md:my-20 crt xl:mt-0 mb-10 mt-10 xl:pr-60"
        >
          DEV EXPERIENCE
        </motion.p>
        <div className="flex flex-col md:flex-row max-w-[80rem] mx-auto">
          {/* Left Section */}
          <div className="w-full xl:w-[50%] justify-items-center xl:text-2xl md:text-xl text-xs p-auto z-20 ml-5">
            <div className="text-white  p-auto font-mono">
              {/* Shopify Section */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: activeSection === 0 ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex  items-center space-x-2">
                  &gt;&nbsp;
                  <a
                    className="bg-[#00ff00] ctext text-black font-bold px-2  "
                    href="https://shopify.com"
                    target="_blank"
                  >
                    Shopify, Inc.
                  </a>
                  <span className="text-gray-400">(Aug 2024 – )</span>
                </div>
                <p className="mt-2 font-bold">Software Engineering Intern</p>
                <p className="mt-0.5 text-lg text-gray-500">
                  TypeScript | SQL | Ruby on Rails <br />
                  SQLite | React Router | NodeJS
                </p>
              </motion.div>

              {/* Carleton University Section */}
              <motion.div
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: activeSection === 1 ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  &gt;&nbsp;
                  <a
                    className="bg-[#ff0000] text-white font-bold px-2 "
                    href="https://carleton.ca"
                    target="_blank"
                  >
                    Carleton University
                  </a>
                  <span className="text-gray-400">(Sep 2024 – )</span>
                </div>
                <p className="mt-2 font-bold">Bachelor of Computer Science</p>
                <p className="mt-1 text-lg text-gray-500">
                  Python | Java | C | HTML/CSS <br />
                  IntelliJ | JavaFX | Vite
                </p>
              </motion.div>

              {/* MathemaTech Section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: activeSection === 2 ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-2">
                  {" "}
                  &gt;&nbsp;
                  <a
                    className="bg-[#00ffff] text-black font-bold px-2 "
                    href="https://www.mathematech.ca"
                    target="_blank"
                  >
                    MathemaTech
                  </a>
                  <span className="text-gray-400">(May 2021 – )</span>
                </div>
                <p className="mt-2 font-bold">
                  Founder, Lead Technical Educator
                </p>
                <p className="mt-1 text-lg text-gray-500">
                  C# | Microsoft VBA | Lua <br />
                  Angular | Blender | Adobe CC | Unity3D
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Section */}
          <div className="w-full xl:w-[50%] p-auto ">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className=" font-mono whitespace-pre-wrap xl:text-[.4rem] md:text-[.35rem] text-center text-[.15rem] text-bold md:py-0 py-8 leading-tight"
              style={{ color: currentColor }}
            >
              {currentAscii}
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  );
}
