import {
  motion,
  useScroll,
  useMotionValue,
  useTransform,
  useTime,
} from "framer-motion";
import { useEffect } from "react";
import SocialBar from "./SocialBar";

export default function Contact() {
  return (
    <div className="h-[200vh]">
      <div className=" h-screen content-center bg-hero-pattern justify-items-center sticky top-0 overflow-hidden">
        <motion.p
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:text-5xl text-3xl font-extrabold "
        >
          You've made it this far.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:text-5xl text-2xl mb-20"
        >
          Let's get in touch.
        </motion.p>
        <motion.a
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:text-5xl text-3xl font-bold bg-[#052829] p-4 rounded-2xl block mx-auto"
          href="mailto:afaq@mathematech.ca"
        >
          👉 afaq@mathematech.ca
        </motion.a>
        <div className="flex space-x-6 mt-[5rem] mb-20 justify-center">
          <SocialBar />
        </div>
        <motion.a
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          className="md:text-3xl text-2xl font-extrabold underline rounded-2xl block mx-auto"
          href="/resume.pdf"
          target="_blank"
        >
          Download my resume (PDF)
        </motion.a>
      </div>
    </div>
  );
}
