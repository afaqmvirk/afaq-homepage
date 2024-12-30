import type { MetaFunction } from "@remix-run/node";
import { motion, useScroll, useTime, useTransform } from "motion/react";
import Contact from "~/components/Contact";
import Experience from "~/components/Experience";
import Hero from "~/components/Hero";
export const meta: MetaFunction = () => {
  return [{ title: "Afaq Virk" }, { name: "description", content: " !" }];
};

export default function Index() {
  const time = useTime();

  const { scrollY } = useScroll();
  const rotate = useTransform(() => time.get() / 40 + scrollY.get() / 20);
  return (
    <div className="bg-crt-pattern">
      <motion.img
        src="/gear.png"
        style={{ rotate }}
        className="fixed z-10 lg:h-[35rem] md:h-[30rem] h-[25rem] top-[-15rem] left-[-8rem] mix-blend-overlay"
      ></motion.img>
      <motion.img
        src="/gear.png"
        style={{ rotate }}
        className="fixed z-10 lg:h-[25rem] md:h-[20rem] h-[15rem] bottom-[-9rem] right-[-8rem] mix-blend-overlay"
      ></motion.img>
      <Hero />
      <Experience />
      <Contact />
    </div>
  );
}
