"use client";
import { motion } from "framer-motion";
import Image from "next/image";

interface ProjectProps {
  name: string;
  description: string;
  link: string;
  image: string;
  target?: string;
}

export default function Project({ 
  name, 
  description, 
  link, 
  image, 
  target = "_blank" 
}: ProjectProps) {
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