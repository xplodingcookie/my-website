"use client";
import { useEffect, useState, useCallback } from "react";

// Discrete vertex steps leave time to read. No frame-by-frame React updates.
export function usePlayback(last: number, disabled: boolean, revision: number) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [delay, setDelay] = useState(2000);
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
