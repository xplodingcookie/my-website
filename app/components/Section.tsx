"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import TextReveal from "./TextReveal";

const stagger = (staggerTime = 0.2): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: staggerTime,
    },
  },
});

interface SectionProps {
  id: string;
  title: string;
  /** Two-digit index rendered in the eyebrow, e.g. "01" */
  index?: string;
  /** Center the whole section — used for the closing beat */
  centered?: boolean;
  children: ReactNode;
}

export default function Section({ id, title, index, centered = false, children }: SectionProps) {
  return (
    <section
      id={id}
      className={`section-wrap max-w-5xl mx-auto px-6 py-24 ${centered ? "text-center" : ""}`}
    >
      {index && (
        <motion.div
          className={`flex items-center gap-4 mb-4 ${centered ? "justify-center" : ""}`}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="eyebrow">{index}</span>
          <motion.span
            aria-hidden="true"
            className="h-px bg-indigo-300/60 origin-left"
            initial={{ scaleX: 0, width: "3rem" }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          />
        </motion.div>
      )}

      <h2 className="text-3xl sm:text-4xl font-semibold mb-10 tracking-tight">
        <TextReveal
          segments={[{ text: title }, { text: ".", className: "text-indigo-500" }]}
          stagger={0.06}
        />
      </h2>

      <motion.div
        initial="hidden"
        whileInView="show"
        variants={stagger(0.2)}
        viewport={{ once: true, margin: "-100px" }}
        className={`space-y-6 text-neutral-700 leading-relaxed ${
          centered ? "flex flex-col items-center" : ""
        }`}
      >
        {children}
      </motion.div>
    </section>
  );
}
