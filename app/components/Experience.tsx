import TimelineCard from "./TimelineCard";

interface ExperienceProps {
  title: string;
  company: string;
  period: string;
  location?: string;
  description: string;
  evidence?: { label: string; text: string }[];
  highlights: string[];
  logoUrl?: string;
}

export default function Experience({
  title,
  company,
  period,
  location,
  description,
  evidence,
  highlights,
  logoUrl,
}: ExperienceProps) {
  return (
    <TimelineCard
      heading={title}
      subheading={company}
      period={period}
      meta={location}
      body={description}
      evidence={evidence}
      highlights={highlights}
      logoUrl={logoUrl}
      logoAlt={`${company} logo`}
    />
  );
}
