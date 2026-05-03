"use client";

import React from "react";

export type TagTone = "amber" | "success" | "warning" | "danger";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  withDot?: boolean;
  children: React.ReactNode;
}

// CSS var lookups per tone — keeps the component declarative and themable.
const toneToVar: Record<TagTone, { fg: string; soft: string }> = {
  amber:   { fg: "var(--bf-color-accent)",  soft: "var(--bf-color-accent-soft)" },
  success: { fg: "var(--bf-color-success)", soft: "rgba(143, 194, 149, 0.14)" },
  warning: { fg: "var(--bf-color-warning)", soft: "rgba(212, 163, 115, 0.14)" },
  danger:  { fg: "var(--bf-color-danger)",  soft: "rgba(201, 134, 134, 0.14)" },
};

const base: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--bf-space-2)",
  padding: "var(--bf-space-1) var(--bf-space-3)",
  borderRadius: "var(--bf-radius-sm)",
  fontFamily: "var(--bf-font-sans)",
  fontSize: 10,
  lineHeight: "14px",
  fontWeight: 500,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

export function Tag({ tone = "amber", withDot = false, style, children, ...rest }: TagProps) {
  const colors = toneToVar[tone];
  const merged: React.CSSProperties = {
    ...base,
    color: colors.fg,
    background: colors.soft,
    ...style,
  };

  return (
    <span style={merged} {...rest}>
      {withDot && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "var(--bf-radius-pill)",
            background: colors.fg,
          }}
        />
      )}
      {children}
    </span>
  );
}

export default Tag;
