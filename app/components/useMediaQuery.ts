"use client";

import { useCallback, useSyncExternalStore } from "react";

const getServerSnapshot = () => false;

export default function useMediaQuery(query: string) {
  const subscribe = useCallback((update: () => void) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  // Match server HTML during hydration, then react to preference/orientation changes.
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
