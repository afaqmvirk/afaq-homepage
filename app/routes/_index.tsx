import type { MetaFunction } from "@remix-run/node";
import { motion, useScroll, useTime, useTransform } from "motion/react";
import Contact from "~/components/Contact";
import Experience from "~/components/Experience";
import Hero from "~/components/Hero";
import Projects from "~/components/Projects";
import useSize from "~/components/useSize";
export const meta: MetaFunction = () => {
  return [{ title: "Afaq Virk" }, { name: "description", content: " !" }];
};

export default function Index() {
  const time = useTime();
  const [width, h] = useSize();

  const { scrollY } = useScroll();
  const rotate = useTransform(() => time.get() / 40 + scrollY.get() / 20);

  const opacity = useTransform(scrollY, [0, 1000], [0, 1]);
  return (
    <div className="bg-hero-pattern bg-fixed bg-auto">
      <motion.img
        src="/gear.png"
        style={{ rotate }}
        className="fixed z-2 lg:h-[35rem] md:h-[30rem] h-[25rem] top-[-15rem] left-[-8rem] mix-blend-overlay pointer-events-none	"
      ></motion.img>
      <motion.img
        src="/gear.png"
        style={{ rotate }}
        className="fixed z-2 lg:h-[25rem] md:h-[20rem] h-[15rem] bottom-[-9rem] right-[-8rem] mix-blend-overlay pointer-events-none	"
      ></motion.img>
      <Hero />
      <Experience />
      <Contact />
    </div>
  );
}
