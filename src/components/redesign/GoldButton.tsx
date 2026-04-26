"use client";

import { CSSProperties, MouseEvent, ReactNode } from "react";
import Link from "next/link";

type CommonProps = {
  children: ReactNode;
  /** Visual size: sm=8px tracking 10px font; md=10px tracking 11px font; lg=12px tracking 12px font. */
  size?: "sm" | "md" | "lg";
  /** Add the gold-glow halo (use sparingly — primary CTAs only). */
  glow?: boolean | "strong";
  /** Make the button full width of its container. */
  block?: boolean;
  /** Disable hover white-flip; useful when on a gold background. */
  invertHover?: boolean;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
};

type AnchorProps = CommonProps & {
  href: string;
  external?: boolean;
  onClick?: never;
  type?: never;
  disabled?: never;
};

type ButtonProps = CommonProps & {
  href?: never;
  external?: never;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  disabled?: boolean;
};

type GoldButtonProps = AnchorProps | ButtonProps;

/**
 * Primary CTA — gold background, black-rich text, generous tracking. Becomes
 * an <a> when href is passed, else a <button>. Centralizes the redesign's
 * 5+ near-identical Tailwind incantations into one component.
 */
export default function GoldButton(props: GoldButtonProps) {
  const {
    children,
    size = "md",
    glow = true,
    block = false,
    invertHover = false,
    className,
    style,
    ariaLabel,
  } = props;

  const sizeMap = {
    sm: { fontSize: 9, padding: "12px 24px", letterSpacing: "0.4em" },
    md: { fontSize: 10, padding: "16px 32px", letterSpacing: "0.5em" },
    lg: { fontSize: 11, padding: "20px 40px", letterSpacing: "0.5em" },
  } as const;

  const visualStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "var(--color-gold)",
    color: "var(--color-black-rich)",
    border: "none",
    borderRadius: 9999,
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    textTransform: "uppercase",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "background 0.2s ease, transform 0.15s ease, color 0.2s ease",
    width: block ? "100%" : undefined,
    ...sizeMap[size],
    ...style,
  };

  const glowClass = glow === "strong" ? "gold-glow-strong" : glow ? "gold-glow" : null;
  const composedClass = ["redesign-gold-btn", glowClass, className].filter(Boolean).join(" ");

  // Hover/active behavior in CSS-class form so it works with both Link and button.
  // The CSS lives in globals.css under .redesign-gold-btn:hover (added below).
  const dataAttrs = invertHover ? { "data-invert-hover": "true" } : {};

  if ("href" in props && props.href) {
    if (props.external) {
      return (
        <a
          href={props.href}
          target="_blank"
          rel="noreferrer"
          aria-label={ariaLabel}
          className={composedClass}
          style={visualStyle}
          {...dataAttrs}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={props.href}
        aria-label={ariaLabel}
        className={composedClass}
        style={visualStyle}
        {...dataAttrs}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={ariaLabel}
      className={composedClass}
      style={{
        ...visualStyle,
        opacity: props.disabled ? 0.4 : 1,
        cursor: props.disabled ? "not-allowed" : "pointer",
      }}
      {...dataAttrs}
    >
      {children}
    </button>
  );
}
