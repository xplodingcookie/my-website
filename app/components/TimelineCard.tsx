"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export interface TimelineCardProps {
  heading: string;
  subheading: string;
  period: string;
  meta?: string;
  body: string;
  evidence?: { label: string; text: string }[];
  highlights: string[];
  logoUrl?: string;
  logoAlt?: string;
}

export default function TimelineCard({ heading, subheading, period, meta, body, evidence, highlights, logoUrl, logoAlt }: TimelineCardProps) {
  return (
    <motion.article className="timeline-entry"
      initial={false}
      whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
      <div className="timeline-date">
        <span className="timeline-node" aria-hidden="true" />
        <span>{period}</span>
        {period.includes("Present") && <span className="current-label">Current</span>}
      </div>
      <div className="timeline-body">
        <div className="timeline-heading">
          <div>
            <p className="timeline-company">{subheading}</p>
            <h3>{heading}</h3>
            {meta && <p className="timeline-meta">{meta}</p>}
          </div>
          {logoUrl && <div className="timeline-logo"><Image src={logoUrl} alt={logoAlt ?? `${subheading} logo`} width={56} height={56} sizes="56px" /></div>}
        </div>
        <p className={evidence ? "experience-summary" : "timeline-description"}>{body}</p>
        {evidence && <dl className="experience-evidence">{evidence.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.text}</dd></div>)}</dl>}
        <ul className="skills-list" aria-label="Areas of work">
          {highlights.map(highlight => <li key={highlight}>{highlight}</li>)}
        </ul>
      </div>
    </motion.article>
  );
}
