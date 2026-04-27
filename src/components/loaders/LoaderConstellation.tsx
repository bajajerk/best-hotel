"use client";

/**
 * LoaderConstellation — A faint world-map of city dots connected by hairline
 * arcs being inked in, treasure-map style.
 *
 * Visual signature:
 *   • 12 cities scattered across the canvas at hand-tuned positions.
 *   • At any time, one dot pulses gold (1.5s); when it finishes, an arc
 *     "inks" from it to the next city using stroke-dashoffset, and the
 *     next dot picks up the pulse. Continues forever.
 *   • Faint dotted gridlines suggest a vintage atlas.
 *   • Below: a mono eyebrow "PLOTTING YOUR JOURNEY" and a thin progress
 *     hairline that animates left-to-right on a slow 9s loop.
 *
 * Implementation note: we drive the highlight with React state on a 1.5s
 * tick; arcs and pulses are CSS keyframes so the animation never jitters
 * even if the route navigation runs work on the main thread.
 */

import { useEffect, useState } from "react";

type City = { name: string; x: number; y: number };

// Hand-placed dots — this is a *stylised* constellation, not a real map
const CITIES: City[] = [
  { name: "New York", x: 188, y: 175 },
  { name: "London", x: 412, y: 152 },
  { name: "Paris", x: 432, y: 168 },
  { name: "Dubai", x: 540, y: 232 },
  { name: "Mumbai", x: 612, y: 248 },
  { name: "Bangkok", x: 706, y: 252 },
  { name: "Singapore", x: 728, y: 296 },
  { name: "Bali", x: 760, y: 332 },
  { name: "Tokyo", x: 808, y: 200 },
  { name: "Sydney", x: 836, y: 372 },
  { name: "Cape Town", x: 470, y: 348 },
  { name: "Rio", x: 268, y: 320 },
];

// Order in which the constellation lights up (looped)
const SEQUENCE = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const STEP_MS = 1500;

export default function LoaderConstellation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % SEQUENCE.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  const activeIdx = SEQUENCE[step];
  const nextIdx = SEQUENCE[(step + 1) % SEQUENCE.length];
  const active = CITIES[activeIdx];
  const next = CITIES[nextIdx];

  return (
    <div className="luxe-loader luxe-loader--constellation">
      <div className="luxe-loader__radial luxe-loader__radial--soft" aria-hidden />
      <div className="luxe-loader__grain" aria-hidden />

      <div className="luxe-loader__stage">
        <svg
          className="luxe-constellation"
          viewBox="0 0 960 480"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <radialGradient id="city-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#e6cf99" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#c8aa76" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c8aa76" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Vintage atlas grid — very faint */}
          <g
            stroke="#c8aa76"
            strokeOpacity="0.08"
            strokeWidth="0.4"
            strokeDasharray="2 6"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={(i + 1) * 60}
                x2="960"
                y2={(i + 1) * 60}
              />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={(i + 1) * 80}
                y1="0"
                x2={(i + 1) * 80}
                y2="480"
              />
            ))}
          </g>

          {/* Equator-ish curve, very faint */}
          <path
            d="M 0 270 Q 480 240 960 270"
            stroke="#c8aa76"
            strokeOpacity="0.18"
            strokeWidth="0.6"
            fill="none"
          />

          {/* All city base dots */}
          {CITIES.map((c, i) => (
            <g key={c.name}>
              <circle
                cx={c.x}
                cy={c.y}
                r="2"
                fill="#c8aa76"
                fillOpacity={i === activeIdx ? 0 : 0.45}
              />
              <text
                x={c.x + 8}
                y={c.y + 4}
                fontFamily="'JetBrains Mono', ui-monospace, monospace"
                fontSize="8"
                fill="#f5f0e8"
                fillOpacity={i === activeIdx ? 0.85 : 0.32}
                letterSpacing="1.5"
              >
                {c.name.toUpperCase()}
              </text>
            </g>
          ))}

          {/* Active city — pulsing halo */}
          <g key={`active-${step}`} className="luxe-constellation__active">
            <circle cx={active.x} cy={active.y} r="22" fill="url(#city-glow)" />
            <circle cx={active.x} cy={active.y} r="3" fill="#e6cf99" />
          </g>

          {/* Inking arc to next city */}
          <path
            key={`arc-${step}`}
            className="luxe-constellation__arc"
            d={`M ${active.x} ${active.y} Q ${(active.x + next.x) / 2} ${
              Math.min(active.y, next.y) - 40
            } ${next.x} ${next.y}`}
            fill="none"
            stroke="#c8aa76"
            strokeOpacity="0.7"
            strokeWidth="0.8"
          />
        </svg>

        <div className="luxe-loader__copy">
          <div className="luxe-loader__eyebrow">Plotting your journey</div>
          <div className="luxe-loader__progress" aria-hidden>
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
