"use client";

import { ReactNode, useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";

/**
 * Wraps timeline cards with a vertical line that draws itself as you scroll,
 * anchoring Experience and Education into one visual system.
 */
export default function Timeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.55"],
  });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  return (
    <div ref={ref} className="relative">
      <span
        aria-hidden="true"
        className="absolute left-[13px] top-2 bottom-2 w-px bg-indigo-100 hidden sm:block"
      />
      <motion.span
        aria-hidden="true"
        style={reducedMotion ? undefined : { scaleY }}
        className="absolute left-[13px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-indigo-400 to-sky-300 hidden sm:block"
      />
      <div className="space-y-10 sm:pl-12">{children}</div>
    </div>
  );
}
