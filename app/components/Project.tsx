"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

interface ProjectProps {
  name: string;
  description: string;
  link: string;
  image: string;
  /** Two-digit index, e.g. "01" */
  index: string;
  reverse?: boolean;
  target?: string;
}

const TILT_MAX = 2.5; // degrees

export default function Project({
  name,
  description,
  link,
  image,
  index,
  reverse = false,
  target = "_blank",
}: ProjectProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reducedMotion = useReducedMotion();

  /* image drifts gently within its frame as the card crosses the viewport */
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-7%", "7%"]);

  /* subtle 3D tilt toward the cursor */
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 200, damping: 24 });
  const rotateY = useSpring(ry, { stiffness: 200, damping: 24 });

  const handleMove = (e: React.MouseEvent) => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rx.set(-py * TILT_MAX * 2);
    ry.set(px * TILT_MAX * 2);
  };
  const handleLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.a
        ref={ref}
        href={link}
        target={target}
        rel="noopener noreferrer"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={reducedMotion ? undefined : { rotateX, rotateY }}
        className="group glass-card grid md:grid-cols-2 overflow-hidden will-change-transform"
        initial={{ opacity: 0, y: 44 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* image */}
        <div
          className={`relative h-60 md:h-80 overflow-hidden ${reverse ? "md:order-2" : ""}`}
        >
          <motion.div
            style={reducedMotion ? undefined : { y: imageY }}
            className="absolute inset-[-8%] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          >
            <Image
              src={image}
              alt={name}
              fill
              style={{ objectFit: "cover" }}
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </motion.div>
          {/* soft veil so the image sits *in* the card rather than on it */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-indigo-950/10 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-20"
          />
        </div>

        {/* content */}
        <div className={`relative p-7 sm:p-9 flex flex-col justify-center ${reverse ? "md:order-1" : ""}`}>
          <span
            aria-hidden="true"
            className="absolute top-2 right-5 text-[6rem] leading-none font-bold text-indigo-900/[0.05] select-none pointer-events-none"
          >
            {index}
          </span>

          <h3 className="font-semibold text-xl sm:text-2xl mb-3 text-neutral-900 flex items-start gap-2">
            <span>{name}</span>
            <span
              aria-hidden="true"
              className="inline-block text-indigo-500 text-lg mt-0.5 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:translate-x-1"
            >
              ↗
            </span>
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed mb-5 max-w-prose">{description}</p>

          <span className="link-underline self-start text-sm font-medium text-indigo-600">
            View project
          </span>
        </div>
      </motion.a>
    </div>
  );
}
