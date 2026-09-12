"use client";
import useReducedMotion from "./useReducedMotion";
import { ReactNode, useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export default function Timeline({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.8", "end 0.6"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  return <div ref={ref} className="timeline">
    <div className="timeline-rail" aria-hidden="true"><motion.span style={reduced ? undefined : { scaleY }} /></div>
    {children}
  </div>;
}
