"use client";

/**
 * LuxeLoader — random cinematic full-page loader.
 *
 * On every mount we pick one of the five luxe loader variants at random.
 * That means each time the user navigates and a `loading.tsx` is rendered,
 * a different loader plays. Same instance keeps the same loader for its
 * lifetime — we don't re-roll mid-loading, that would be jarring.
 *
 * SSR-safety: we render `null` during SSR / first paint to avoid
 * hydration mismatches (Math.random can't agree across server & client).
 * The loader appears on the next tick after mount — fast enough to feel
 * instant during a route transition.
 */

import { useEffect, useState, type ComponentType } from "react";
import LoaderCompass from "./LoaderCompass";
import LoaderInkBleed from "./LoaderInkBleed";
import LoaderQuote from "./LoaderQuote";
import LoaderConstellation from "./LoaderConstellation";
import LoaderMarquee from "./LoaderMarquee";

const VARIANTS: ComponentType[] = [
  LoaderCompass,
  LoaderInkBleed,
  LoaderQuote,
  LoaderConstellation,
  LoaderMarquee,
];

export function LuxeLoader() {
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    setComp(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)]);
  }, []);

  if (!Comp) return null;
  return <Comp />;
}

export default LuxeLoader;

// Named exports for testing / forced variants
export {
  LoaderCompass,
  LoaderInkBleed,
  LoaderQuote,
  LoaderConstellation,
  LoaderMarquee,
};
