"use client";

import { CSSProperties, ReactNode } from "react";
import EyebrowLabel from "./EyebrowLabel";

type SectionHeaderProps = {
  /** Small gold uppercase tag above the title. */
  eyebrow?: ReactNode;
  /** The italic Cormorant headline. Use a <span className="not-italic"> for the partial-italic redesign treatment, e.g. "Curated <not-italic>Collections</not-italic>". */
  title: ReactNode;
  /** Right-rail description shown on md+ next to the title. */
  description?: ReactNode;
  /** Right-side action element (e.g. carousel chevrons, Browse-All link). */
  actions?: ReactNode;
  /** Centred layout (used on /preferred-rates "Savings Matrix"). */
  align?: "left" | "center";
  /** Visual scale for the title. "lg" = clamp 28-44, "xl" = clamp 32-56, "2xl" = clamp 40-72. */
  size?: "lg" | "xl" | "2xl";
  className?: string;
  style?: CSSProperties;
};

/**
 * The eyebrow + italic-Cormorant headline + optional description/actions
 * pattern used in every section header across the redesign. One component
 * means consistent spacing, scale ramps, and typography across pages.
 */
export default function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
  align = "left",
  size = "xl",
  className,
  style,
}: SectionHeaderProps) {
  const sizeMap: Record<NonNullable<SectionHeaderProps["size"]>, string> = {
    lg: "clamp(28px, 3vw, 44px)",
    xl: "clamp(32px, 4vw, 56px)",
    "2xl": "clamp(40px, 5vw, 72px)",
  };

  if (align === "center") {
    return (
      <div
        className={className}
        style={{ textAlign: "center", ...style }}
      >
        {eyebrow ? (
          <EyebrowLabel
            as="div"
            style={{ marginBottom: 16 }}
          >
            {eyebrow}
          </EyebrowLabel>
        ) : null}
        <h2
          className="serif-italic"
          style={{
            fontSize: sizeMap[size],
            lineHeight: 1.05,
            margin: 0,
            color: "var(--color-white-soft)",
          }}
        >
          {title}
        </h2>
        {description ? (
          <p
            style={{
              marginTop: 16,
              maxWidth: 560,
              marginInline: "auto",
              fontSize: 14,
              color: "var(--color-white-50)",
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 24,
        ...style,
      }}
    >
      <div style={{ maxWidth: 640 }}>
        {eyebrow ? (
          <EyebrowLabel
            as="div"
            style={{ marginBottom: 16 }}
          >
            {eyebrow}
          </EyebrowLabel>
        ) : null}
        <h2
          className="serif-italic"
          style={{
            fontSize: sizeMap[size],
            lineHeight: 1.05,
            margin: 0,
            color: "var(--color-white-soft)",
          }}
        >
          {title}
        </h2>
        {description ? (
          <p
            style={{
              marginTop: 14,
              fontSize: 14,
              color: "var(--color-white-50)",
              lineHeight: 1.7,
              fontWeight: 300,
              maxWidth: 480,
            }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div style={{ flexShrink: 0 }}>{actions}</div>
      ) : null}
    </div>
  );
}
