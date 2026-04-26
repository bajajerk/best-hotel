"use client";

import { CSSProperties, ReactNode } from "react";

type EyebrowLabelProps = {
  children: ReactNode;
  /** Default is gold; "soft" is white/40 for secondary use. */
  tone?: "gold" | "soft" | "white";
  /** Small variant: 9px / 0.4em tracking. Default 10px / 0.5em. */
  size?: "sm" | "md";
  className?: string;
  style?: CSSProperties;
  as?: "span" | "div" | "p";
};

/**
 * The gold uppercase tracked-out label used 30+ times in the redesign as a
 * section eyebrow / category tag. Centralising prevents drift in tracking,
 * weight, and font-size across pages.
 */
export default function EyebrowLabel({
  children,
  tone = "gold",
  size = "md",
  className,
  style,
  as = "span",
}: EyebrowLabelProps) {
  const Tag = as as "span";
  const composed = [
    "eyebrow",
    size === "sm" ? "eyebrow-sm" : null,
    tone === "soft" ? "eyebrow-soft" : null,
    tone === "white" ? null : null, // explicit fallthrough
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      className={composed}
      style={{
        ...(tone === "white" ? { color: "var(--color-white-soft)" } : null),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
