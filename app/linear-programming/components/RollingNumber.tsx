"use client";
import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { format } from "../problem";
import type { TravelPlan } from "../travel";

// A readout number that rolls through the same keyframes and timing as the
// plot marker, like the original playground's per-frame counters. Without a
// plan (backward moves, new problems, reduced motion) it updates instantly.
export default function RollingNumber({
  value,
  frames,
  plan,
}: {
  value: number;
  frames: number[] | null;
  plan: TravelPlan | null;
}) {
  const current = useMotionValue(value);
  const text = useTransform(current, (v: number) => format(v));
  useEffect(() => {
    if (frames && plan) {
      const controls = animate(current, frames, {
        duration: plan.duration,
        times: plan.times,
        ease: plan.ease,
      });
      return () => controls.stop();
    }
    current.jump(value);
  }, [current, value, frames, plan]);
  return <motion.span>{text}</motion.span>;
}
