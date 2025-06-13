"use client";
import dynamic from "next/dynamic";
import { motion, stagger } from "framer-motion";
import PolyHero from "./components/PolyHero";

function HeroSkeleton() {
  return (
    <section className="relative h-screen flex flex-col justify-center items-center text-center bg-gradient-to-b from-white to-sky-50">
      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight opacity-20">Loading…</h1>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <PolyHero />

      {/* About */}
      <Section id="about" title="About Me">
        <p>
          I’m Dong Li – a creative full‑stack developer who blends math, design &amp; code to craft immersive web experiences. My toolbox spans TypeScript, Three.js, React/Next, and a perfectionist’s eye for detail.
        </p>
      </Section>

      {/* Projects */}
      <Section id="projects" title="Featured Projects">
        <Project
          name="Interactive Linear Programming"
          description="A visual Simplex method playground built with Next.js, React‑Three‑Fiber & GLSL shaders."
          link="/linear-programming"
          image="/images/projects/lp.png"
        />
        <Project
          name="Realtime Metrics Deck"
          description="A Grafana‑style dashboard powered by Prometheus and WebSockets for millisecond updates."
          link="https://github.com/dongli/realtime-metrics"
          image="/images/projects/metrics.png"
        />
      </Section>

      {/* Contact */}
      <Section id="contact" title="Let’s work together">
        <p className="mb-6">Got a project in mind or just want to say hi? Reach out! ✌️</p>
        <a
          href="mailto:dong.li@phoebe.solutions"
          className="inline-block rounded-full bg-neutral-900 px-6 py-3 text-white font-medium shadow-md hover:shadow-lg transition-shadow"
        >
          Email Me
        </a>
      </Section>
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="section-wrap max-w-5xl mx-auto px-6 py-28">
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

function Project({ name, description, link, image }: { name: string; description: string; link: string; image: string }) {
  return (
    <motion.a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <img src={image} alt={name} className="w-full h-56 object-cover" />
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-2">{name}</h3>
        <p className="text-sm opacity-80 leading-relaxed">{description}</p>
      </div>
    </motion.a>
  );
}
