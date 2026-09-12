"use client";

import { useSyncExternalStore } from "react";

// The server and first hydration render share the same snapshot. Media-query
// preferences are applied immediately after hydration, without changing the DOM
// between server markup and the first client render.
const query = '(prefers-reduced-motion: reduce)';
function subscribe(update: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}
const getSnapshot = () => window.matchMedia(query).matches;
const getServerSnapshot = () => false;

export default function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
