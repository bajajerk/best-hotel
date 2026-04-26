"use client";

import { CSSProperties, ReactNode, forwardRef } from "react";

type GlassPanelProps = {
  children: ReactNode;
  /** "soft" = white/5 + 12px blur; "strong" = white/8 + 20px blur. */
  intensity?: "soft" | "strong";
  /** Border radius preset matching the redesign's 24/32/40 ladder. */
  radius?: 24 | 32 | 40 | "full";
  /** Add a gold border tint instead of the default white/10. */
  goldBorder?: boolean;
  /** Pass-through className for layout / spacing utilities. */
  className?: string;
  style?: CSSProperties;
  as?: "div" | "section" | "article" | "aside" | "figure";
  onClick?: () => void;
  id?: string;
};

/**
 * Backdrop-blurred panel with a hairline border — the redesign's signature
 * surface. Use radius=24 for compact cards, 32 for content cards, 40 for
 * hero / sticky cards.
 */
const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(function GlassPanel(
  {
    children,
    intensity = "soft",
    radius = 32,
    goldBorder = false,
    className,
    style,
    as = "div",
    ...rest
  },
  ref
) {
  const Tag = as as "div";
  const radiusValue = radius === "full" ? 9999 : radius;
  const baseClass = intensity === "strong" ? "glass-panel-strong" : "glass-panel";
  const composed = [baseClass, className].filter(Boolean).join(" ");

  return (
    <Tag
      ref={ref}
      className={composed}
      style={{
        borderRadius: radiusValue,
        ...(goldBorder
          ? { borderColor: "rgba(212, 175, 55, 0.20)" }
          : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
});

export default GlassPanel;
