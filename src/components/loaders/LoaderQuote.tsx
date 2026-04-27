"use client";

/**
 * LoaderQuote — Rotating travel verses in italic Playfair, set on a near-black
 * field with the faintest ken-burns image at 8% opacity.
 *
 * Visual signature:
 *   • Slowly drifting & zooming travel photo at 8% opacity (Unsplash via
 *     `images.unsplash.com` — the layout already whitelists this in
 *     next.config). Falls back to pure radial gradient if the image fails
 *     to load — handled by graceful CSS background composition.
 *   • Centred italic Playfair quote, attribution in mono caps.
 *   • Each verse holds 3.2s with a 0.6s cross-fade.
 *   • A single champagne pulse-dot below indicates motion without being
 *     impatient.
 *
 * Why this works: the quote-as-loader trick is straight out of Aman.com
 * onboarding videos. Slow text + slow image + a single point of motion.
 */

import { useEffect, useState } from "react";

const QUOTES: Array<{ text: string; by: string }> = [
  {
    text: "We travel not to escape life, but for life not to escape us.",
    by: "Anonymous",
  },
  {
    text: "The world is a book, and those who do not travel read only one page.",
    by: "Augustine",
  },
  {
    text: "To travel is to take a journey into yourself.",
    by: "Danny Kaye",
  },
  {
    text: "Not all those who wander are lost.",
    by: "J. R. R. Tolkien",
  },
  {
    text: "Wherever you go, go with all your heart.",
    by: "Confucius",
  },
];

const HOLD_MS = 3200;

export default function LoaderQuote() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % QUOTES.length);
    }, HOLD_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="luxe-loader luxe-loader--quote">
      {/* Ken-burns travel photo at 8% — uses CSS background to avoid
          Next/Image hydration cost during a route transition. */}
      <div className="luxe-loader__kenburns" aria-hidden />
      <div className="luxe-loader__kenburns-veil" aria-hidden />
      <div className="luxe-loader__grain" aria-hidden />

      <div className="luxe-loader__stage">
        <div className="luxe-quote">
          {QUOTES.map((q, i) => (
            <figure
              key={i}
              className={`luxe-quote__item${i === idx ? " is-active" : ""}`}
              aria-hidden={i !== idx}
            >
              <blockquote className="luxe-quote__text">
                <span aria-hidden className="luxe-quote__open">&ldquo;</span>
                {q.text}
                <span aria-hidden className="luxe-quote__close">&rdquo;</span>
              </blockquote>
              <figcaption className="luxe-quote__by">— {q.by}</figcaption>
            </figure>
          ))}
        </div>

        <div className="luxe-loader__pulse-dot" aria-hidden />
      </div>
    </div>
  );
}
