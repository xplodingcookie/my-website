"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export default function Footer() {
  const reducedMotion = useReducedMotion();
  return (
    <footer className="border-t border-black/5 mt-8">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center gap-3 text-xs text-neutral-500">
        <motion.div
          whileHover={reducedMotion ? undefined : { y: -7, rotate: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 9 }}
          className="cursor-default"
        >
          <Image src="/frog_transparent.png" alt="" width={36} height={36} aria-hidden="true" />
        </motion.div>
        <p>© {new Date().getFullYear()} Dong Li. All rights reserved.</p>
      </div>
    </footer>
  );
}
