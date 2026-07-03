"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export interface TimelineCardProps {
  heading: string;
  subheading: string;
  period: string;
  meta?: string;
  body: string;
  highlights: string[];
  logoUrl?: string;
  logoAlt?: string;
}

export default function TimelineCard({
  heading,
  subheading,
  period,
  meta,
  body,
  highlights,
  logoUrl,
  logoAlt,
}: TimelineCardProps) {
  return (
    <motion.div className="relative group" variants={fadeInUp}>
      {/* timeline node */}
      <span
        aria-hidden="true"
        className="absolute -left-12 top-7 hidden sm:block w-[9px] h-[9px] -translate-x-[4px] rounded-full border-2 border-indigo-400 bg-white transition-all duration-500 group-hover:bg-indigo-400 group-hover:shadow-[0_0_0_5px_rgb(129_140_248_/_0.18)]"
      />

      <div className="glass-card p-6 sm:p-7 group-hover:-translate-y-1">
        <div className="flex gap-5">
          {logoUrl && (
            <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white border border-black/5 shadow-sm p-1.5 overflow-hidden">
              <Image
                src={logoUrl}
                alt={logoAlt ?? `${subheading} logo`}
                width={56}
                height={56}
                className="w-full h-full object-contain"
                quality={100}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-4 mb-1">
              <h3 className="text-xl font-semibold text-neutral-900">{heading}</h3>
              <span className="text-sm font-medium text-indigo-500/90 whitespace-nowrap tabular-nums">
                {period}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-4 mb-3">
              <p className="text-neutral-600 font-medium">{subheading}</p>
              {meta && <span className="text-sm text-neutral-500">{meta}</span>}
            </div>

            <p className="text-sm text-neutral-700 leading-relaxed mb-4">{body}</p>

            <div className="flex flex-wrap gap-2">
              {highlights.map((highlight, idx) => (
                <span key={idx} className="chip">
                  {highlight}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
