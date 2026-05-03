"use client";

import React from "react";

export type PriceBlockVariant = "inline" | "stacked";

export interface PriceBlockProps {
  amount: string;            // pre-formatted (e.g. "$420", "₹38,200")
  memberLabel?: string;      // e.g. "Member rate"
  subline?: string;          // e.g. "per night · taxes incl."
  variant?: PriceBlockVariant;
  emphasis?: boolean;        // pull amount up to title-size serif
  className?: string;
  style?: React.CSSProperties;
}

const memberStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--bf-space-2)",
  padding: "var(--bf-space-1) var(--bf-space-3)",
  borderRadius: "var(--bf-radius-sm)",
  background: "var(--bf-color-accent-soft)",
  color: "var(--bf-color-accent)",
  fontFamily: "var(--bf-font-sans)",
  fontSize: 10,
  lineHeight: "14px",
  fontWeight: 500,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const sublineStyle: React.CSSProperties = {
  fontFamily: "var(--bf-font-sans)",
  fontSize: 12,
  lineHeight: "18px",
  color: "var(--bf-color-text-soft)",
  margin: 0,
};

export function PriceBlock({
  amount,
  memberLabel,
  subline,
  variant = "stacked",
  emphasis = false,
  className,
  style,
}: PriceBlockProps) {
  const isInline = variant === "inline";

  const amountStyle: React.CSSProperties = emphasis
    ? {
        fontFamily: "var(--bf-font-serif)",
        fontStyle: "italic",
        fontWeight: 400,
        fontSize: 26,
        lineHeight: "30px",
        color: "var(--bf-color-text-primary)",
      }
    : {
        fontFamily: "var(--bf-font-sans)",
        fontWeight: 500,
        fontSize: 16,
        lineHeight: "24px",
        color: "var(--bf-color-text-primary)",
      };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: isInline ? "row" : "column",
    alignItems: isInline ? "baseline" : "flex-start",
    gap: isInline ? "var(--bf-space-3)" : "var(--bf-space-2)",
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      {memberLabel && <span style={memberStyle}>{memberLabel}</span>}
      <span style={amountStyle}>{amount}</span>
      {subline && <p style={sublineStyle}>{subline}</p>}
    </div>
  );
}

export default PriceBlock;
