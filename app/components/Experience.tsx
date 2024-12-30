import type { MetaFunction } from "@remix-run/node";
import {
  motion,
  useScroll,
  useMotionValue,
  useTransform,
  useTime,
} from "framer-motion";
import { useEffect, useState } from "react";
export const meta: MetaFunction = () => {
  return [{ title: "Afaq Virk" }, { name: "description", content: " !" }];
};

export default function Hero() {
  const time = useTime();

  const { scrollY } = useScroll();
  const rotate = useTransform(() => time.get() / 40 + scrollY.get() / 20);

  const [asciiArt, setAsciiArt] = useState("");

  useEffect(() => {
    fetch("/ascii-art.txt")
      .then((response) => response.text())
      .then((text) => setAsciiArt(text))
      .catch((error) => console.error("Error loading ASCII art:", error));
  }, []);

  return (
    <div className="h-[400vh]">
      <div className=" h-screen content-center bg-crt-pattern justify-items-center sticky top-0 overflow-hidden">
        <motion.p
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="xl:text-8xl md:text-5xl text-3xl font-head md:my-20  xl:mt-0 mb-10 mt-10 xl:pr-60"
        >
          DEV EXPERIENCE
        </motion.p>
        <div className="flex flex-col md:flex-row max-w-[80rem] mx-auto">
          {/* Left Section */}
          <div className="w-full  xl:w-[60%] justify-items-center xl:text-3xl md:text-xl text-xs p-auto">
            <div className="text-white p-auto font-mono">
              {/* Shopify Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  &gt;&nbsp;
                  <span className="bg-[#00ff00] text-black font-bold px-2  ">
                    Shopify, Inc.
                  </span>
                  <span className="text-gray-400">(Sep 2024 – )</span>
                </div>
                <p className="mt-2 font-bold">Software Engineering Intern</p>
                <p className="mt-1 text-gray-500">
                  TypeScript | SQL | Ruby <br />
                  Ruby on Rails | SQLite | React | NodeJS
                </p>
              </div>

              {/* Carleton University Section */}
              <div className="mb-6">
                <div className="flex items-center space-x-2">
                  &gt;&nbsp;
                  <span className="bg-[#ff0000] text-white font-bold px-2 ">
                    Carleton University
                  </span>
                  <span className="text-gray-400">(Sep 2024 – )</span>
                </div>
                <p className="mt-2 font-bold">Bachelor of Computer Science</p>
                <p className="mt-1 text-gray-500">
                  Python | Java | C | HTML/CSS <br />
                  VSCode | IntelliJ | JavaFX | Vite
                </p>
              </div>

              {/* MathemaTech Section */}
              <div>
                <div className="flex items-center space-x-2">
                  {" "}
                  &gt;&nbsp;
                  <span className="bg-[#00ffff] text-black font-bold px-2 ">
                    MathemaTech
                  </span>
                  <span className="text-gray-400">(May 2021 – )</span>
                </div>
                <p className="mt-2 font-bold">
                  Founder, Lead Technical Educator
                </p>
                <p className="mt-1 text-gray-500">
                  C# | Microsoft VBA | Lua <br />
                  Angular | Blender | Adobe CC | Unity3D
                </p>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="w-full xl:w-[40%] p-auto ">
            <p className=" font-mono whitespace-pre-wrap md:text-[.4rem] text-center text-[#00ff00] text-[.15rem] text-bold md:py-0 py-8">
              {asciiArt || " "}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
