"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      // Slide‑down reveal on mount
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-30 h-16 sm:h-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-black/5"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3 h-full">
        <Link href="#top" className="font-semibold text-lg tracking-tight">Dong Li</Link>
        <nav className="hidden sm:flex gap-6 text-sm font-medium">
          <a href="#about" className="hover:opacity-80 transition-opacity">About</a>
          <a href="#projects" className="hover:opacity-80 transition-opacity">Projects</a>
          <a href="#contact" className="hover:opacity-80 transition-opacity">Contact</a>
        </nav>
      </div>
    </motion.header>
  );
}