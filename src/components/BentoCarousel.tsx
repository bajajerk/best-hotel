"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export type BentoItem = {
  key: string;
  title: string;
  meta: string;
  img: string;
  href: string;
};

/**
 * Bento Grid Carousel — "Understated Luxury" hero rotator.
 *
 * - Two fixed-height rows, asymmetric column widths in a repeating 4-card pattern
 *   (320 row-span-2 / 380 / 380 / 420 row-span-2) for the bento aesthetic.
 * - Auto-rotates horizontally every 5 seconds (scrollBy 360px), loops back to 0
 *   when the end is reached.
 * - Snap-mandatory horizontal scroll, hidden scrollbar, snap-center cards.
 */
export default function BentoCarousel({
  items,
  intervalMs = 5000,
  step = 360,
}: {
  items: BentoItem[];
  intervalMs?: number;
  step?: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || items.length === 0) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const node = scrollRef.current;
      if (!node) return;
      const max = node.scrollWidth - node.clientWidth - 4;
      if (node.scrollLeft >= max) {
        node.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        node.scrollBy({ left: step, behavior: "smooth" });
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [items.length, intervalMs, step]);

  // Asymmetric width pattern (repeats over the items list)
  const sizes: Array<{ w: number; tall: boolean }> = [
    { w: 320, tall: true },
    { w: 380, tall: false },
    { w: 380, tall: false },
    { w: 420, tall: true },
  ];

  return (
    <div
      ref={scrollRef}
      className="bento-rail"
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      onTouchStart={() => (pausedRef.current = true)}
      onTouchEnd={() => {
        // Resume after a short delay to honour user intent
        setTimeout(() => (pausedRef.current = false), 1200);
      }}
      role="region"
      aria-label="Featured destinations and hotels"
    >
      {items.map((item, i) => {
        const size = sizes[i % sizes.length];
        const tall = size.tall;
        return (
          <Link
            key={item.key}
            href={item.href}
            className="bento-card group"
            style={{
              width: `${size.w}px`,
              gridRow: tall ? "span 2" : undefined,
              height: tall ? "auto" : "280px",
              textDecoration: "none",
            }}
          >
            <img
              src={item.img}
              alt={item.title}
              className="bento-card-img"
              loading="lazy"
            />
            <div className="bento-card-overlay" />
            <div className="bento-card-content">
              <div className="bento-card-meta">{item.meta}</div>
              <h3 className="bento-card-title" style={{ marginTop: 6 }}>
                {item.title}
              </h3>
            </div>
          </Link>
        );
      })}
      {/* Trailing spacer so last card can centre when snapped */}
      <div aria-hidden style={{ width: 24, gridRow: "span 2" }} />
    </div>
  );
}
