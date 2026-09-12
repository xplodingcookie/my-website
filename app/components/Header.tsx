"use client";
import useReducedMotion from "./useReducedMotion";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";

const SECTION_LINKS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      if (pathname !== "/") return;
      const threshold = window.innerHeight * 0.4;
      let current = "";
      for (const { id } of SECTION_LINKS) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= threshold) current = id;
      }
      // The final section is shorter than the threshold line; at the bottom
      // of the page it is the one being read.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2)
        current = SECTION_LINKS[SECTION_LINKS.length - 1].id;
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const resize = () => { if (window.innerWidth >= 900) setOpen(false); };
    window.addEventListener("keydown", dismiss);
    window.addEventListener("pointerdown", outside);
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("keydown", dismiss);
      window.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  function navigate(event: React.MouseEvent<HTMLAnchorElement>, id: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    setOpen(false);
    if (pathname !== "/") return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, "", `#${id}`);
    const top = id === "top" ? 0 : target.getBoundingClientRect().top + window.scrollY - 104;
    const focus = () => { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); };
    if (window.__lenis && !reduced) window.__lenis.scrollTo(top, { duration: 1.05, onComplete: focus });
    else { window.scrollTo({ top, behavior: reduced ? "instant" : "smooth" }); focus(); }
  }

  return (
    <header ref={headerRef} className={`site-header ${scrolled ? "is-scrolled" : ""}`}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <noscript><style>{`.menu-toggle{display:none!important}.site-header{position:relative;height:auto}.header-inner{flex-wrap:wrap;padding-block:12px;gap:8px}.desktop-nav{display:flex!important;flex-basis:100%;order:3;flex-wrap:wrap;justify-content:space-between;gap:8px 16px}main{padding-top:0!important}`}</style></noscript>
      <div className="header-inner">
        <Link href="/#top" onClick={e => navigate(e, "top")} className="brand" aria-label="Dong Li — back to top">
          <Image src="/frog_transparent.png" alt="" width={44} height={44} priority />
          <span>Dong Li<span className="brand-dot">.</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {SECTION_LINKS.map(({ id, label }) => <Link key={id} href={`/#${id}`} onClick={e => navigate(e, id)} aria-current={active === id && pathname === "/" ? "location" : undefined} className="nav-link">{label}</Link>)}
        </nav>
        <a href="/Resume_Dong_Li.pdf" target="_blank" rel="noopener noreferrer" className="resume-link">Résumé <ArrowUpRight size={14} aria-hidden="true" /></a>
        <button ref={toggleRef} onClick={() => setOpen(!open)} className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"}>
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

        {open && <motion.nav id="mobile-menu" aria-label="Mobile navigation" className="mobile-nav"
          initial={false}>
          {SECTION_LINKS.map(({ id, label }, i) => <Link key={id} href={`/#${id}`} onClick={e => navigate(e, id)} aria-current={active === id ? "location" : undefined}><span className="eyebrow">0{i + 1}</span>{label}<ArrowUpRight size={18} aria-hidden="true" /></Link>)}
        </motion.nav>}

      <motion.div className="reading-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />
    </header>
  );
}
