"use client";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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
  logoUrl
}: EducationProps) {
  return (
    <motion.div className="relative group" variants={fadeInUp}>
      <div className="flex gap-6">
        {/* University Logo */}
        <div className="flex-shrink-0 w-16 h-16 overflow-hidden">
          <Image
            src={logoUrl}
            alt={`${school} logo`}
            width={64}
            height={64}
            className="w-full h-full object-contain"
            quality={100}
            priority
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
            <h3 className="text-xl font-semibold text-neutral-90">
              {degree}
            </h3>
            <span className="text-sm font-medium text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full mt-1 sm:mt-0 self-start">
              {period}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <p className="text-neutral-600 font-medium">{school}</p>
            {grade && (
              <span className="text-sm px-2 py-1 rounded mt-1 sm:mt-0 self-start">
                {grade}
              </span>
            )}
          </div>
          
          <p className="text-sm text-neutral-700 leading-relaxed mb-4">
            {details}
          </p>
          
          {/* Key highlights */}
          <div className="flex flex-wrap gap-2">
            {highlights.map((highlight, idx) => (
              <span 
                key={idx}
                className="text-xs bg-white border border-neutral-200 text-neutral-700 px-3 py-1.5 rounded-full hover:border-neutral-300 transition-colors"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}