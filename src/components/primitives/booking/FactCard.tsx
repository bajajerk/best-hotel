"use client";

import React from "react";

export interface FactCardProps {
  label: string;
  lines: Array<string | null | undefined>;
  icon?: React.ReactNode;
  maxLines?: number;
  className?: string;
  style?: React.CSSProperties;
}

const labelStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--bf-space-2)",
  marginBottom: "var(--bf-space-3)",
  fontFamily: "var(--bf-font-sans)",
  fontSize: 11,
  lineHeight: "16px",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--bf-color-accent)",
};

const lineStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "var(--bf-font-sans)",
  fontSize: 13,
  lineHeight: "20px",
  fontWeight: 400,
  color: "var(--bf-color-text-primary)",
};

const cardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  padding: "var(--bf-space-5)",
  background: "var(--bf-color-bg-surface-soft)",
  border: "1px solid var(--bf-color-border-soft)",
  borderRadius: "var(--bf-radius-md)",
};

export function FactCard({
  label,
  lines,
  icon,
  maxLines = 3,
  className,
  style,
}: FactCardProps) {
  const visible = lines.slice(0, maxLines);
  return (
    <div className={className} style={{ ...cardStyle, ...style }}>
      <span style={labelStyle}>
        {icon}
        {label}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--bf-space-1)" }}>
        {visible.map((line, i) => (
          <p key={i} style={lineStyle}>
            {line || "—"}
          </p>
        ))}
      </div>
    </div>
  );
}

export default FactCard;
