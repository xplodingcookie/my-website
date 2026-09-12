"use client";
import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import useReducedMotion from "./useReducedMotion";
import HeroFallback from "./HeroFallback";
import styles from "./PolyHero.module.css";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => <HeroFallback />,
});
export default function PolyHero() {
  const trackRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [focused, setFocused] = useState(false);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.6]);
  const haloOpacity = useTransform(scrollYProgress, [0.15, 0.45], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const canvasOpacity = useTransform(scrollYProgress, [0.85, 1], [1, 0]);
  useMotionValueEvent(scrollYProgress, "change", (value) =>
    setUnavailable(value >= 0.13),
  );
  const hidden = unavailable && !focused && !reduced;
  return (
    <section
      id="top"
      ref={trackRef}
      className={`${styles.track} ${reduced ? styles.trackStatic : ""}`}
      aria-label="Introduction"
    >
      <noscript>
        <style>{`.${styles.track}{height:auto!important}.${styles.stage}{position:relative!important;top:0!important}`}</style>
      </noscript>
      <div className={styles.stage}>
        <motion.div
          className={styles.halo}
          style={{ opacity: reduced ? 1 : haloOpacity }}
          aria-hidden="true"
        />
        <motion.div
          className={styles.scene}
          style={{ opacity: reduced ? 1 : canvasOpacity }}
          aria-hidden="true"
        >
          <HeroScene
            progress={scrollYProgress}
            paused={paused}
            reduced={reduced}
          />
        </motion.div>
        <div className={styles.inner}>
          <motion.div
            className={styles.topline}
            style={{ opacity: reduced ? 1 : haloOpacity }}
          >
            <span>Mathematics × Computer Science</span>
            <span>Melbourne, Australia</span>
          </motion.div>
          <motion.div
            className={styles.copy}
            data-hero-copy
            inert={hidden}
            aria-hidden={hidden || undefined}
            onFocusCapture={() => setFocused(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setFocused(false);
            }}
            style={
              reduced || focused
                ? { opacity: 1, scale: 1 }
                : { opacity: textOpacity, scale: textScale }
            }
          >
            <h1>
              <span className={styles.greeting}>Hi, I’m </span>
              <strong>
                Dong Li<span className={styles.period}>.</span>
              </strong>
            </h1>
            <p className={styles.tagline}>
              I love everything maths and computer science :)
            </p>
            <div className={styles.actions}>
              <a href="#experience" className="button-primary">
                See my work <ArrowUpRight size={17} aria-hidden="true" />
              </a>
              <a href="#projects" className="hero-about-link link-underline">
                Explore the maths <ArrowDown size={16} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
          <div className={styles.bottomline}>
            <span>Software engineer</span>
            <motion.span
              className={styles.scrollCue}
              style={{ opacity: reduced ? 0 : cueOpacity }}
            >
              Scroll to take flight <ArrowDown size={15} aria-hidden="true" />
            </motion.span>
            {!reduced && (
              <button
                className={`${styles.motionToggle} needs-js`}
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? "Play hero motion" : "Pause hero motion"}
              >
                {paused ? "Play motion ▷" : "Pause motion Ⅱ"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
