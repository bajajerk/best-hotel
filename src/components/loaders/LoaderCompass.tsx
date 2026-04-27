"use client";

/**
 * LoaderCompass — A slow-rotating compass / windrose drawn in hairline gold.
 *
 * Visual signature:
 *   • A cinematic full-bleed charcoal canvas with a single, breathing radial
 *     of champagne light at the centre.
 *   • A 320px windrose — eight-pointed star + 24-tick bezel + cardinal letters
 *     drawn in pure SVG, hairline stroke. Two concentric rings counter-rotate
 *     at different speeds (8s / 14s) for a slow-mechanical feel — like the
 *     bezel of an Aman concierge's watch.
 *   • Beneath it a single italic Playfair word fades through the curation
 *     verbs: Plotting · Curating · Composing · Confirming (1.2s each).
 *   • Mono eyebrow above. Champagne micro-progress hairline below.
 *
 * Accessibility: respects prefers-reduced-motion via .luxe-loader-reduce
 *   guards in globals.css — falls back to a static, perfectly framed compass.
 */

import { useEffect, useState } from "react";

const VERBS = ["Plotting", "Curating", "Composing", "Confirming"];

export default function LoaderCompass() {
  const [verbIdx, setVerbIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setVerbIdx((i) => (i + 1) % VERBS.length);
    }, 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="luxe-loader luxe-loader--compass">
      {/* Champagne radial pulse — set on a pseudo so it can breathe */}
      <div className="luxe-loader__radial" aria-hidden />
      {/* Micro-grain noise overlay */}
      <div className="luxe-loader__grain" aria-hidden />

      <div className="luxe-loader__stage">
        <svg
          className="luxe-compass"
          viewBox="0 0 320 320"
          width="320"
          height="320"
          aria-hidden
        >
          <defs>
            <radialGradient id="compass-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#c8aa76" stopOpacity="0.18" />
              <stop offset="60%" stopColor="#c8aa76" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#c8aa76" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="compass-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d9c08d" />
              <stop offset="100%" stopColor="#9b7f4f" />
            </linearGradient>
          </defs>

          {/* Soft halo */}
          <circle cx="160" cy="160" r="158" fill="url(#compass-glow)" />

          {/* Outer bezel — counter-rotates */}
          <g className="luxe-compass__bezel">
            <circle
              cx="160"
              cy="160"
              r="148"
              fill="none"
              stroke="url(#compass-stroke)"
              strokeOpacity="0.55"
              strokeWidth="0.6"
            />
            <circle
              cx="160"
              cy="160"
              r="142"
              fill="none"
              stroke="#c8aa76"
              strokeOpacity="0.18"
              strokeWidth="0.4"
            />
            {/* 24 tick marks */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24;
              const isMajor = i % 6 === 0;
              const r1 = isMajor ? 132 : 138;
              const r2 = 148;
              const rad = (angle * Math.PI) / 180;
              const x1 = 160 + r1 * Math.cos(rad);
              const y1 = 160 + r1 * Math.sin(rad);
              const x2 = 160 + r2 * Math.cos(rad);
              const y2 = 160 + r2 * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#c8aa76"
                  strokeOpacity={isMajor ? 0.85 : 0.32}
                  strokeWidth={isMajor ? 0.9 : 0.5}
                />
              );
            })}
          </g>

          {/* Inner rose — rotates the other way, slower */}
          <g className="luxe-compass__rose">
            {/* Eight-pointed star — long arms */}
            <g stroke="url(#compass-stroke)" strokeWidth="0.7" fill="none">
              {[0, 45, 90, 135].map((a) => {
                const rad = (a * Math.PI) / 180;
                const x1 = 160 + 124 * Math.cos(rad);
                const y1 = 160 + 124 * Math.sin(rad);
                const x2 = 160 - 124 * Math.cos(rad);
                const y2 = 160 - 124 * Math.sin(rad);
                return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} />;
              })}
            </g>

            {/* North arrow — solid champagne, the only "filled" mark */}
            <polygon
              points="160,40 152,160 160,156 168,160"
              fill="#c8aa76"
              fillOpacity="0.92"
            />
            <polygon
              points="160,280 152,160 160,164 168,160"
              fill="#c8aa76"
              fillOpacity="0.28"
            />

            {/* Diamond facets between cardinals — a touch of jewellery */}
            {[45, 135, 225, 315].map((a) => {
              const rad = (a * Math.PI) / 180;
              const x = 160 + 86 * Math.cos(rad);
              const y = 160 + 86 * Math.sin(rad);
              return (
                <polygon
                  key={a}
                  points={`${x},${y - 5} ${x + 5},${y} ${x},${y + 5} ${x - 5},${y}`}
                  fill="#c8aa76"
                  fillOpacity="0.55"
                />
              );
            })}

            {/* Inner ring */}
            <circle
              cx="160"
              cy="160"
              r="60"
              fill="none"
              stroke="#c8aa76"
              strokeOpacity="0.4"
              strokeWidth="0.6"
            />
            {/* Pinprick centre */}
            <circle cx="160" cy="160" r="2.4" fill="#c8aa76" />
          </g>

          {/* Cardinal letters — fixed, not rotating */}
          <g
            fill="#f5f0e8"
            fillOpacity="0.72"
            fontFamily="'JetBrains Mono', ui-monospace, monospace"
            fontSize="11"
            letterSpacing="2"
            textAnchor="middle"
          >
            <text x="160" y="22">N</text>
            <text x="302" y="164">E</text>
            <text x="160" y="306">S</text>
            <text x="18" y="164">W</text>
          </g>
        </svg>

        <div className="luxe-loader__copy">
          <div className="luxe-loader__eyebrow">Voyagr · Concierge</div>
          <div className="luxe-loader__verb-wrap" aria-live="polite">
            {VERBS.map((v, i) => (
              <span
                key={v}
                className={`luxe-loader__verb${i === verbIdx ? " is-active" : ""}`}
              >
                {v}
              </span>
            ))}
          </div>
          <div className="luxe-loader__hairline" aria-hidden>
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
