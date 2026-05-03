"use client";

import React from "react";

export type PillVariant = "default" | "active" | "accent" | "micro";

export interface PillProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: PillVariant;
  selected?: boolean;
  as?: "button" | "span";
  children: React.ReactNode;
}

const base: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--bf-space-2)",
  borderRadius: "var(--bf-radius-pill)",
  border: "1px solid transparent",
  background: "transparent",
  color: "var(--bf-color-text-primary)",
  fontFamily: "var(--bf-font-sans)",
  cursor: "pointer",
  transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease",
  whiteSpace: "nowrap",
};

const variants: Record<PillVariant, React.CSSProperties> = {
  default: {
    padding: "var(--bf-space-2) var(--bf-space-4)",
    fontSize: 13,
    lineHeight: "20px",
    fontWeight: 400,
    background: "var(--bf-color-bg-surface-soft)",
    borderColor: "var(--bf-color-border-default)",
    color: "var(--bf-color-text-muted)",
  },
  active: {
    padding: "var(--bf-space-2) var(--bf-space-4)",
    fontSize: 13,
    lineHeight: "20px",
    fontWeight: 500,
    background: "var(--bf-color-text-primary)",
    borderColor: "var(--bf-color-text-primary)",
    color: "var(--bf-color-bg-primary)",
  },
  accent: {
    padding: "var(--bf-space-2) var(--bf-space-4)",
    fontSize: 13,
    lineHeight: "20px",
    fontWeight: 500,
    background: "var(--bf-color-accent-soft)",
    borderColor: "var(--bf-color-accent-line)",
    color: "var(--bf-color-accent)",
  },
  micro: {
    padding: "var(--bf-space-1) var(--bf-space-3)",
    fontSize: 11,
    lineHeight: "16px",
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    background: "var(--bf-color-bg-surface-soft)",
    borderColor: "var(--bf-color-border-soft)",
    color: "var(--bf-color-text-muted)",
  },
};

export function Pill({
  variant = "default",
  selected,
  as = "button",
  style,
  children,
  ...rest
}: PillProps) {
  const resolved = selected && variant === "default" ? variants.active : variants[variant];
  const merged = { ...base, ...resolved, ...style };

  if (as === "span") {
    const { onClick: _ignore, ...spanRest } = rest as React.HTMLAttributes<HTMLSpanElement>;
    void _ignore;
    return (
      <span style={merged} {...spanRest}>
        {children}
      </span>
    );
  }

  return (
    <button type="button" style={merged} {...rest}>
      {children}
    </button>
  );
}

export default Pill;
