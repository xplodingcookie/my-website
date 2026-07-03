"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useCallback, useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const SECTION_LINKS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" },
] as const;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Track which section is in view for the nav indicator */
  useEffect(() => {
    if (pathname !== "/") return;
    const sections = SECTION_LINKS.map((l) => document.getElementById(l.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-35% 0px -60% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  const scrollOrNavigate = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
      e.preventDefault();

      if (pathname === "/") {
        const section = document.getElementById(id);
        if (section) {
          const headerHeight = window.innerWidth >= 640 ? 80 : 64;
          const additionalOffset = 20;
          const target =
            id === "top"
              ? 0
              : section.getBoundingClientRect().top + window.scrollY - headerHeight - additionalOffset;

          if (window.__lenis) {
            window.__lenis.scrollTo(target, { duration: 1.1 });
          } else {
            window.scrollTo({ top: target, behavior: "smooth" });
          }
        }
      } else {
        router.push(`/#${id}`);
      }
      setOpen(false);
    },
    [pathname, router],
  );

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      className={`fixed inset-x-0 top-0 z-30 h-16 sm:h-20 backdrop-blur transition-[background-color,box-shadow,border-color] duration-500 border-b ${
        scrolled
          ? "supports-[backdrop-filter]:bg-white/70 border-black/5 shadow-[0_1px_20px_rgb(79_70_229_/_0.06)]"
          : "supports-[backdrop-filter]:bg-white/30 border-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3 h-full">
        <a href="#top" onClick={(e) => scrollOrNavigate(e, "top")} aria-label="Back to top">
          <motion.span
            className="block"
            whileHover={reducedMotion ? undefined : { rotate: -10, scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 12 }}
          >
            <Image src="/frog_transparent.png" alt="Frog logo" width={55} height={55} />
          </motion.span>
        </a>

        <nav className="hidden sm:flex items-center gap-7 text-sm font-medium">
          {SECTION_LINKS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => scrollOrNavigate(e, id)}
              className="relative py-1 text-neutral-700 hover:text-neutral-950 transition-colors"
            >
              {label}
              {active === id && pathname === "/" && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute -bottom-0.5 left-0 right-0 h-[2px] rounded-full bg-indigo-500"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </a>
          ))}
          <a
            href="/Resume_Dong_Li.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-full border border-neutral-300 hover:border-indigo-400 hover:text-indigo-600 px-4 py-1.5 transition-colors"
          >
            Resume
            <span className="inline-block ml-1 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              ↗
            </span>
          </a>
        </nav>

        <div className="sm:hidden">
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-md"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden w-full overflow-hidden absolute top-16 left-0 z-40 bg-white/85 backdrop-blur-md border-b border-black/5 shadow-[0_16px_40px_-16px_rgb(79_70_229_/_0.15)]"
          >
            <motion.div
              className="flex flex-col gap-1 px-6 py-4 font-medium"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } }, hidden: {} }}
            >
              {[...SECTION_LINKS.map((l) => ({ ...l, href: `#${l.id}` })), { id: "resume", label: "Resume ↗", href: "/Resume_Dong_Li.pdf" }].map(
                (link) => (
                  <motion.a
                    key={link.id}
                    variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                    href={link.href}
                    {...(link.id === "resume"
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : { onClick: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => scrollOrNavigate(e, link.id) })}
                    className="py-2.5 border-b border-black/5 last:border-none text-neutral-800"
                  >
                    {link.label}
                  </motion.a>
                ),
              )}
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
