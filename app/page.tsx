"use client";
import { motion, Variants } from "framer-motion";
import PolyHero from "./components/PolyHero";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <PolyHero />

      {/* About */}
      <Section id="about" title="About Me">
        <p>
          I&apos;m Dong Li - a data scientist turned software engineer with experience in full-stack data science, integration, and web design. I enjoy turning data into insights and building clean, interactive web apps using tools like Python, Javascript, and React.
        </p>
      </Section>

      {/* Projects */}
      <Section id="projects" title="Featured Projects">
        <Project
          name="Interactive Linear Programming"
          description="A visual Simplex method playground built with Next.js, React-Three-Fiber & GLSL shaders."
          link="/linear-programming"
          image="/linear_programming.webp"
          target="_self"
        />
        <Project
          name="Taxi Revenue Optimisation"
          description="A data-driven analysis using machine learning to help taxi drivers maximise daily revenue by predicting fare amounts and identifying profitable zones."
          link="/Optimising_Daily_Revenue_Dong_Li.pdf"
          image="/taxi_pic.png"
        />
      </Section>

      {/* Contact */}
      <Section id="contact" title="Come reach out!">
        <p className="mb-6">Want to grab bubble tea or just want to say hi? Reach out! ✌️</p>
        <a
          href="mailto:lidc2504@gmail.com"
          className="inline-block rounded-full bg-neutral-900 px-6 py-3 text-white font-medium shadow-md hover:shadow-lg transition-shadow"
        >
          Email Me
        </a>
      </Section>
    </>
  );
}

const stagger = (staggerTime = 0.2): Variants => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: staggerTime,
    },
  },
});

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


function Project({ name, description, link, image, target = "_blank" }: { name: string; description: string; link: string; image: string, target?: string }) {
  return (
    <motion.a
      href={link}
      target={target}
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="relative w-full h-56 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          style={{ objectFit: "cover" }}
          sizes="100vw"
          priority
        />
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-2">{name}</h3>
        <p className="text-sm opacity-80 leading-relaxed">{description}</p>
      </div>
    </motion.a>
  );
}