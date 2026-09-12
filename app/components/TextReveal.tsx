"use client";

interface TextRevealProps {
  segments: { text: string; className?: string }[];
  className?: string;
  splitBy?: "word" | "char";
  delay?: number;
  stagger?: number;
  immediate?: boolean;
  play?: boolean;
}

// Content is readable in the server HTML. The small entrance translates the
// whole line without hiding text or changing its accessible representation.
export default function TextReveal({ segments, className = "", immediate = false }: TextRevealProps) {
  return <span className={`${className} ${immediate ? "text-entrance" : ""}`}>
    {segments.map((segment, i) => <span key={i} className={segment.className}>{segment.text}</span>)}
  </span>;
}
