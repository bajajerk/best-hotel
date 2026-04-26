"use client";

import { CSSProperties, MouseEvent, ReactNode } from "react";
import Link from "next/link";

type CommonProps = {
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  block?: boolean;
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

type OutlineButtonProps = AnchorProps | ButtonProps;

/**
 * Secondary CTA — hairline border, white-soft text, hover lifts to white/5
 * fill + gold border. Used next to GoldButton on every "two-CTA" row.
 */
export default function OutlineButton(props: OutlineButtonProps) {
  const {
    children,
    size = "md",
    block = false,
    className,
    style,
    ariaLabel,
  } = props;

  const sizeMap = {
    sm: { fontSize: 9, padding: "12px 22px", letterSpacing: "0.4em" },
    md: { fontSize: 10, padding: "16px 30px", letterSpacing: "0.5em" },
    lg: { fontSize: 11, padding: "20px 38px", letterSpacing: "0.5em" },
  } as const;

  const visualStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "transparent",
    color: "var(--color-white-soft)",
    border: "1px solid rgba(255, 255, 255, 0.10)",
    borderRadius: 9999,
    fontFamily: "var(--font-body)",
    fontWeight: 700,
    textTransform: "uppercase",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s, color 0.2s",
    width: block ? "100%" : undefined,
    ...sizeMap[size],
    ...style,
  };

  const composedClass = ["redesign-outline-btn", className].filter(Boolean).join(" ");

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
    >
      {children}
    </button>
  );
}
