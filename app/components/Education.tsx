import TimelineCard from "./TimelineCard";

interface EducationProps {
  degree: string;
  school: string;
  period: string;
  grade?: string;
  details: string;
  highlights: string[];
  logoUrl: string;
}

export default function Education({
  degree,
  school,
  period,
  grade,
  details,
  highlights,
  logoUrl,
}: EducationProps) {
  return (
    <TimelineCard
      heading={degree}
      subheading={school}
      period={period}
      meta={grade}
      body={details}
      highlights={highlights}
      logoUrl={logoUrl}
      logoAlt={`${school} logo`}
    />
  );
}
