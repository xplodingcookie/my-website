"use client";
import useReducedMotion from "./useReducedMotion";

import Image from "next/image";
import { motion, Variants } from "framer-motion";

const fadeIn: Variants = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

/* small wireframe accents that echo the hero's solids */
function WirePoly({ className, path, delay }: { className: string; path: string; delay: number }) {
  const reducedMotion = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={`absolute w-8 h-8 text-indigo-400/50 ${className}`}
      whileHover={reducedMotion ? undefined : { rotate: 8 }}
      transition={{ duration: .5, delay }}
    >
      <path d={path} stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </motion.svg>
  );
}

export default function AboutPortrait() {
  const reducedMotion = useReducedMotion();
  return (
    <motion.div variants={fadeIn} className="relative flex justify-center md:justify-end">
      <div className="relative w-56 sm:w-64">
        <WirePoly
          className="-top-6 -left-8"
          path="M20 4 L36 30 L4 30 Z M20 4 L20 30"
          delay={0}
        />
        <WirePoly
          className="bottom-10 -right-9"
          path="M20 3 L37 20 L20 37 L3 20 Z M3 20 L37 20"
          delay={0}
        />

        <motion.div
          whileHover={reducedMotion ? undefined : { y: -5 }}
          transition={{ duration: .5 }}
        >
          <Image
            src="/pfp.png"
            alt="Dong Li’s illustrated ninja avatar"
            width={500}
            height={500}
            className="w-full h-auto select-none"
          />
        </motion.div>

        {/* A quiet grounding shadow beneath the original avatar. */}
        <motion.div
          aria-hidden="true"
          className="mx-auto -mt-2 h-4 w-3/4 rounded-[100%] bg-indigo-900/15 blur-md"
          transition={{ duration: .5 }}
        />
      </div>
    </motion.div>
  );
}
