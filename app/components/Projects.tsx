import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const projects = [
  {
    title: "Project One",
    description:
      "This is a placeholder for Project One. It does something cool!",
  },
  {
    title: "Project Two",
    description:
      "This is a placeholder for Project Two. It does something even cooler!",
  },
  {
    title: "Project Three",
    description:
      "This is a placeholder for Project Three. It's the coolest of all!",
  },
];

export default function Projects() {
  const sectionRef = useRef(null);
  const stickyRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });
  const index = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 2], {
    clamp: true,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = index.on("change", (latest) => {
      setActiveIndex(Math.round(latest));
    });
    return unsubscribe;
  }, [index]);

  return (
    <section ref={sectionRef} className="h-[300vh] bg-black">
      <div
        ref={stickyRef}
        className="h-screen sticky top-0 flex flex-col items-center justify-center"
      >
        <h2 className="text-5xl font-bold text-white mb-16 mt-32">Projects</h2>
        <div className="relative w-full h-[30rem] overflow-x-hidden flex justify-center items-center">
          {projects.map((project, i) => {
            const offset = i - activeIndex;
            return (
              <motion.div
                key={i}
                className="absolute w-[28rem] h-[20rem] bg-white/90 rounded-xl shadow-2xl flex flex-col items-center justify-center p-8 text-center border-4 border-black"
                animate={{
                  opacity: offset === 0 ? 1 : 0.2,
                  scale: offset === 0 ? 1 : 0.8,
                  zIndex: offset === 0 ? 10 : 1,
                  rotateY: `${offset * 40}deg`,
                  left: `calc(50% + ${offset * 350}px - 14rem)`,
                }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <h3 className="text-3xl font-bold mb-4">{project.title}</h3>
                <p className="text-lg text-gray-700">{project.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
