'use client';

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useCallback } from "react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();

  const scrollOrNavigate = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();

    if (pathname === "/") {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(`/#${id}`);
    }
  }, [pathname, router]);

  const handleLogoClick = (e: React.MouseEvent) => {
    scrollOrNavigate(e, "top");
  };

  return (
    <motion.header
      initial={{ y: 0, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-30 h-16 sm:h-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-black/5"
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3 h-full">
        <a
          href="#top"
          onClick={handleLogoClick}
          className="font-semibold text-lg tracking-tight"
        >
          <Image src="/frog_transparent.png" alt="Frog Logo" width={55} height={55} />
        </a>
        <nav className="hidden sm:flex gap-6 text-sm font-medium">
          <a href="#about" onClick={(e) => scrollOrNavigate(e, "about")} className="hover:opacity-80 transition-opacity">About</a>
          <a href="#projects" onClick={(e) => scrollOrNavigate(e, "projects")} className="hover:opacity-80 transition-opacity">Projects</a>
          <a href="#contact" onClick={(e) => scrollOrNavigate(e, "contact")} className="hover:opacity-80 transition-opacity">Contact</a>
        </nav>
      </div>
    </motion.header>
  );
}