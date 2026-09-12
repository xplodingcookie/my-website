"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import TextReveal from "./TextReveal";

interface SectionProps {
  id: string;
  title: string;
  index?: string;
  centered?: boolean;
  children: ReactNode;
}

const captions: Record<string, string> = {
  about: "Maths, data & software",
  experience: "Software in practice",
  projects: "Selected work",
  education: "The foundations",
  contact: "The invitation",
};

export default function Section({ id, title, index, centered = false, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`section-wrap ${centered ? "section-centered" : ""}`}>
      <div className="section-kicker">
        <span className="eyebrow">{index} / {captions[id]}</span>
        <span className="section-rule" aria-hidden="true" />
        <span className="section-cross" aria-hidden="true">+</span>
      </div>
      <h2 id={`${id}-title`} className="section-title">
        <TextReveal segments={[{ text: title }, ...(/[!.?]$/.test(title) ? [] : [{ text: ".", className: "accent-text" }])]} stagger={0.035} />
      </h2>
      <motion.div
        initial={false}
        whileInView="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        viewport={{ once: true, margin: "0px 0px -50px 0px" }}
        className="section-content"
      >
        {children}
      </motion.div>
    </section>
  );
}
