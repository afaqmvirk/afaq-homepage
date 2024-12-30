import type { MetaFunction } from "@remix-run/node";
import {
  motion,
  useScroll,
  useMotionValue,
  useTransform,
  useTime,
} from "framer-motion";
import { useEffect } from "react";
export const meta: MetaFunction = () => {
  return [{ title: "Afaq Virk" }, { name: "description", content: " !" }];
};

export default function Hero() {
  const time = useTime();

  const { scrollY } = useScroll();
  const rotate = useTransform(() => time.get() / 40 + scrollY.get() / 20);
  return (
    <div className="h-[400vh]">
      <div className=" h-screen content-center bg-hero-pattern justify-items-center sticky top-0 overflow-hidden">
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
          className="md:text-5xl text-2xl font-extrabold"
        >
          Full-Stack Developer
        </motion.p>
        <div className=" absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6">
          <img src="/instagram.svg" className="h-[3rem] invert"></img>
          <img src="/github.svg" className="h-[3rem] invert"></img>
          <img src="/linkedin.svg" className="h-[3rem] invert"></img>
        </div>
      </div>
    </div>
  );
}
