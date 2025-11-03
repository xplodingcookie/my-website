"use client";
import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";

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
  children: ReactNode;
}

export default function Section({ id, title, children }: SectionProps) {
  return (
    <section id={id} className="section-wrap max-w-5xl mx-auto px-6 py-20">
      <motion.h2
        className="text-3xl sm:text-4xl font-semibold mb-6 tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {title}
      </motion.h2>
      <motion.div
        initial="hidden"
        whileInView="show"
        variants={stagger(0.2)}
        viewport={{ once: true, margin: "-100px" }}
        className="space-y-6 text-neutral-700 leading-relaxed"
      >
        {children}
      </motion.div>
    </section>
  );
}