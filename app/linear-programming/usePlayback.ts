"use client";
import { useEffect, useState, useCallback } from "react";

// The pause per vertex at the slider's starting notch (7 of 10). Everything
// else that follows the walk is timed as a multiple of this, so one control
// paces the whole animation.
export const DEFAULT_DELAY = 2000;

// Discrete vertex steps leave time to read. No frame-by-frame React updates.
export function usePlayback(last: number, disabled: boolean, revision: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [delay, setDelay] = useState(DEFAULT_DELAY);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  useEffect(reset, [revision, reset]);
  useEffect(() => {
    if (disabled) setPlaying(false);
  }, [disabled]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  useEffect(() => {
    if (!playing || disabled || index >= last) return;
    const timeout = window.setTimeout(() => {
      setIndex((i) => i + 1);
      if (index + 1 >= last) setPlaying(false);
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [playing, disabled, index, last, delay]);
  const move = (to: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(last, to)));
  };
  return {
    index: Math.min(index, last),
    playing,
    delay,
    setDelay,
    reset,
    move,
    toggle: () => {
      if (index >= last) setIndex(0);
      setPlaying((p) => !p);
    },
  };
}
