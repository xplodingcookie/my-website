"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const scrollOrNavigate = useCallback((e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();

    if (pathname === "/") {
      const section = document.getElementById(id);
      if (section) {
        const headerHeight = window.innerWidth >= 640 ? 80 : 64;
        const additionalOffset = 20;
        
        const elementPosition = section.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - additionalOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    } else {
      router.push(`/#${id}`);
    }
    setOpen(false);
  }, [pathname, router]);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    scrollOrNavigate(e, "top");
  };

  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);

  useEffect(() => {
    if (menuRef.current) {
      setMenuHeight(menuRef.current.scrollHeight);
    }
  }, [open]);


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
          <a href="#experience" onClick={(e) => scrollOrNavigate(e, "experience")} className="hover:opacity-80 transition-opacity">Experience</a>
          <a href="/Resume_Dong_Li.pdf" target="_blank">Resume</a>
          <a href="#projects" onClick={(e) => scrollOrNavigate(e, "projects")} className="hover:opacity-80 transition-opacity">Projects</a>
          <a href="#contact" onClick={(e) => scrollOrNavigate(e, "contact")} className="hover:opacity-80 transition-opacity">Contact</a>
        </nav>
        <div className="sm:hidden">
          <button onClick={() => setOpen(!open)} className="p-2 rounded-md focus:outline-none">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: menuHeight }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            ref={menuRef}
            className="sm:hidden w-full overflow-hidden absolute top-16 left-0 z-40 flex flex-col gap-4 
              px-6 py-4 bg-gradient-to-r from-blue-100/90 to-pink-200/90 backdrop-blur-md 
              supports-[backdrop-filter]:bg-white/60 text-black font-medium border-b border-black/5"
          >
            <a href="#about" onClick={(e) => scrollOrNavigate(e, "about")} className="hover:opacity-80 transition-opacity">About</a>
            <a href="#experience" onClick={(e) => scrollOrNavigate(e, "experience")} className="hover:opacity-80 transition-opacity">Experience</a>
            <a href="/Resume_Dong_Li.pdf" target="_blank">Resume</a>
            <a href="#projects" onClick={(e) => scrollOrNavigate(e, "projects")} className="hover:opacity-80 transition-opacity">Projects</a>
            <a href="#contact" onClick={(e) => scrollOrNavigate(e, "contact")} className="hover:opacity-80 transition-opacity">Contact</a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
