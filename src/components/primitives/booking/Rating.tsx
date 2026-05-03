"use client";

import React from "react";

export type RatingSize = "sm" | "md" | "lg";

export interface RatingProps {
  value: number;
  outOf?: number;
  size?: RatingSize;
  showOutOf?: boolean;
  ariaLabel?: string;
  style?: React.CSSProperties;
  className?: string;
}

const sizeMap: Record<RatingSize, { num: number; star: number; sub: number; gap: number }> = {
  sm: { num: 13, star: 12, sub: 10, gap: 4 },
  md: { num: 16, star: 14, sub: 11, gap: 6 },
  lg: { num: 22, star: 18, sub: 12, gap: 8 },
};

function StarGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="var(--bf-color-accent)"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.5l2.95 6.36 6.55.7-4.9 4.5 1.4 6.44L12 17l-5.99 3.5 1.4-6.44L2.5 9.56l6.55-.7L12 2.5z" />
    </svg>
  );
}

export function Rating({
  value,
  outOf = 10,
  size = "md",
  showOutOf = true,
  ariaLabel,
  style,
  className,
}: RatingProps) {
  const s = sizeMap[size];
  const formatted = value.toFixed(1);

  return (
    <span
      className={className}
      role="img"
      aria-label={ariaLabel ?? `Rated ${formatted} out of ${outOf}`}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: s.gap,
        fontFamily: "var(--bf-font-sans)",
        color: "var(--bf-color-text-primary)",
        ...style,
      }}
    >
      <StarGlyph size={s.star} />
      <span style={{ fontSize: s.num, fontWeight: 500, lineHeight: 1 }}>{formatted}</span>
      {showOutOf && (
        <span
          style={{
            fontSize: s.sub,
            color: "var(--bf-color-text-soft)",
            fontWeight: 400,
            lineHeight: 1,
          }}
        >
          / {outOf}
        </span>
      )}
    </span>
  );
}

export default Rating;
