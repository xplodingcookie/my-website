"use client";

import useMediaQuery from "./useMediaQuery";

// The server and first hydration render share the same snapshot. Media-query
// preferences are applied immediately after hydration, without changing the DOM
// between server markup and the first client render.
export default function useReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
