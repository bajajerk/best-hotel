"use client";

import { useEffect, useState } from "react";

/**
 * Subscribe to a CSS media query. SSR-safe — returns `defaultValue` until mounted.
 * Used by the redesign-v2 motion budget primitives.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const [matches, setMatches] = useState<boolean>(defaultValue);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setMatches("matches" in e ? e.matches : false);

    handler(mql);
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, [query]);

  return matches;
}

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useReducedMotion = () =>
  useMediaQuery("(prefers-reduced-motion: reduce)");

/**
 * Returns true when motion should be FULLY enabled — desktop AND user has not
 * asked to reduce motion. Use this to gate expensive effects (mouse parallax,
 * scroll-tied transforms, infinite autoscrollers).
 */
export function useMotionAllowed(): boolean {
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  return !isMobile && !reduced;
}
