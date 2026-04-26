"use client";

import { CSSProperties } from "react";

type PulseDotProps = {
  /** Pixel size of the dot itself (the halo extends beyond). Default 6. */
  size?: number;
  /** Color of the dot. Default gold. */
  color?: "gold" | "white" | string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Pulsing dot used for "Confirmed" / "Live Pulse" / active-channel indicators
 * — repeated 5+ times in the redesign reference. Animation is killed under
 * prefers-reduced-motion via the global stylesheet rule on .pulse-gold-dot.
 */
export default function PulseDot({
  size = 6,
  color = "gold",
  className,
  style,
}: PulseDotProps) {
  const resolvedColor =
    color === "gold"
      ? "var(--color-gold)"
      : color === "white"
        ? "var(--color-white-soft)"
        : color;

  // Re-use the .pulse-gold-dot class for the gold default (gets the @keyframes
  // pulseGold animation from globals.css). For non-gold, render a plain dot —
  // we keep the redesign's gold-only halo style intentional.
  const isGold = color === "gold";

  if (isGold) {
    return (
      <span
        className={["pulse-gold-dot", className].filter(Boolean).join(" ")}
        style={{ width: size, height: size, ...style }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: resolvedColor,
        ...style,
      }}
      aria-hidden="true"
    />
  );
}
