"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";

interface TextRevealProps {
  /** Plain string, or segments so parts can be styled differently */
  segments: { text: string; className?: string }[];
  className?: string;
  splitBy?: "word" | "char";
  delay?: number;
  stagger?: number;
  /** Animate immediately (true) or when scrolled into view (false) */
  immediate?: boolean;
  /** Gate: when false, holds at hidden until it flips true */
  play?: boolean;
}

const item: Variants = {
  hidden: { y: "115%", rotate: 3 },
  show: {
    y: "0%",
    rotate: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

/**
 * Masked text reveal: each unit slides up out of an overflow-hidden clip.
 * Renders inline — wrap it in your own h1/h2/p. Static under reduced motion.
 */
export default function TextReveal({
  segments,
  className,
  splitBy = "word",
  delay = 0,
  stagger = 0.045,
  immediate = false,
  play = true,
}: TextRevealProps) {
  const reducedMotion = useReducedMotion();
  const label = segments.map((s) => s.text).join("");

  if (reducedMotion) {
    return (
      <span className={className}>
        {segments.map((s, i) => (
          <span key={i} className={s.className}>
            {s.text}
          </span>
        ))}
      </span>
    );
  }

  const units: { text: string; className?: string; isSpace: boolean }[] = [];
  for (const seg of segments) {
    if (splitBy === "char") {
      for (const ch of seg.text) {
        units.push({ text: ch, className: seg.className, isSpace: ch === " " });
      }
    } else {
      for (const w of seg.text.split(/(\s+)/).filter(Boolean)) {
        units.push({ text: w, className: seg.className, isSpace: /^\s+$/.test(w) });
      }
    }
  }

  return (
    <motion.span
      aria-label={label}
      role="text"
      className={`inline-block ${className ?? ""}`}
      initial="hidden"
      {...(immediate
        ? { animate: play ? "show" : "hidden" }
        : { whileInView: "show", viewport: { once: true, margin: "-80px" } })}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {units.map((u, i) =>
        u.isSpace ? (
          <span key={i} aria-hidden="true">
            {" "}
          </span>
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]"
          >
            <motion.span variants={item} className={`inline-block ${u.className ?? ""}`}>
              {u.text}
            </motion.span>
          </span>
        )
      )}
    </motion.span>
  );
}
