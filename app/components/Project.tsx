"use client";
import useReducedMotion from "./useReducedMotion";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface ProjectProps {
  name: string;
  description: string;
  link: string;
  image: string;
  index: string;
  reverse?: boolean;
  target?: string;
  imageFit?: "cover" | "contain";
}

export default function Project({ name, description, link, image, index, reverse = false, target = "_blank", imageFit = "cover" }: ProjectProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);
  const isReport = link.endsWith(".pdf");
  return <motion.article ref={ref} className={`project-row ${reverse ? "project-reverse" : ""}`}
    initial={false} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }} transition={{ duration: .7, ease: [.22, 1, .36, 1] }}>
    <a href={link} target={target} rel="noopener noreferrer" className={`project-art ${isReport ? "project-art-taxi" : ""}`} tabIndex={-1} aria-hidden="true">
      <motion.div className="project-image" style={reduced ? undefined : { y }}>
        <Image src={image} alt="" fill style={{ objectFit: imageFit }} sizes="(min-width: 900px) 55vw, 100vw" unoptimized={image.endsWith(".svg")} />
      </motion.div>
      <span className="art-open"><ArrowUpRight size={21} /></span>
      <span className="art-caption">{isReport ? "DATA → INSIGHT → IMPACT" : "ALWAYS A WORK IN PROGRESS :)"}</span>
    </a>
    <div className="project-copy">
      <p className="project-eyebrow">{index} / {isReport ? "Data science & research" : "Under the hood"}</p>
      <h3><a href={link} target={target} rel="noopener noreferrer">{name}</a></h3>
      <p className="project-description">{description}</p>
      <ul className="skills-list">{(isReport ? ["Machine Learning", "Predictive Modelling"] : ["Open Source", "Experiments"]).map(t=><li key={t}>{t}</li>)}</ul>
      <a href={link} target={target} rel="noopener noreferrer" className="project-cta">{isReport ? "Read the research" : "Explore the source"}<span className="project-link-meta">{isReport ? "PDF" : "GITHUB"}</span><ArrowUpRight size={18} aria-hidden="true" /></a>
    </div>
  </motion.article>;
}
