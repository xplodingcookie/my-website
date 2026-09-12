"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export const INTRO_SEEN_KEY = "dl-intro-seen";
export const INTRO_DONE_EVENT = "dl:intro-done";

/* 2D projection of an icosahedron — the same family of solids as the hero */
const R_OUTER = 40;
const R_INNER = 22;
const hex = Array.from({ length: 6 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 3;
  return [50 + R_OUTER * Math.cos(a), 50 + R_OUTER * Math.sin(a)] as const;
});
const tri = Array.from({ length: 3 }, (_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
  return [50 + R_INNER * Math.cos(a), 50 + R_INNER * Math.sin(a)] as const;
});
const p = ([x, y]: readonly [number, number]) => `${x.toFixed(2)} ${y.toFixed(2)}`;
const EDGES = [
  `M ${p(hex[0])} L ${p(hex[1])} L ${p(hex[2])} L ${p(hex[3])} L ${p(hex[4])} L ${p(hex[5])} Z`,
  `M ${p(tri[0])} L ${p(tri[1])} L ${p(tri[2])} Z`,
  // each inner vertex connects to its three nearest outer vertices
  `M ${p(hex[5])} L ${p(tri[0])} L ${p(hex[0])} M ${p(tri[0])} L ${p(hex[1])}`,
  `M ${p(hex[1])} L ${p(tri[1])} L ${p(hex[2])} M ${p(tri[1])} L ${p(hex[3])}`,
  `M ${p(hex[3])} L ${p(tri[2])} L ${p(hex[4])} M ${p(tri[2])} L ${p(hex[5])}`,
];

export default function Preloader() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || sessionStorage.getItem(INTRO_SEEN_KEY)) {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      setVisible(false);
    }, 1450);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          role="status"
          aria-label="Loading"
          className="preloader-screen fixed inset-0 z-[100] flex items-center justify-center"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div exit={{ opacity: 0, scale: 0.92 }} transition={{ duration: 0.3 }}>
            <svg
              width="88"
              height="88"
              viewBox="0 0 100 100"
              fill="none"
              aria-hidden="true"
            >
              {EDGES.map((d, i) => (
                <motion.path
                  key={i}
                  d={d}
                  stroke="var(--ink)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    pathLength: { duration: 0.7, delay: 0.1 + i * 0.12, ease: [0.65, 0, 0.35, 1] },
                    opacity: { duration: 0.2, delay: 0.1 + i * 0.12 },
                  }}
                />
              ))}
              {hex.concat(tri).map(([x, y], i) => (
                <motion.circle
                  key={`v${i}`}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="var(--ink)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.55 + i * 0.04, ease: "backOut" }}
                />
              ))}
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
