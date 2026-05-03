"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
export type ButtonSize = "sm" | "md";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
};

export type ButtonProps = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps>;

const sizePadding: Record<ButtonSize, string> = {
  sm: "10px 18px",
  md: "14px 24px",
};

const sizeFont: Record<ButtonSize, number> = {
  sm: 11,
  md: 12,
};

const base: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "var(--bf-space-2)",
  borderRadius: "var(--bf-radius-pill)",
  border: "1px solid transparent",
  fontFamily: "var(--bf-font-sans)",
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
  whiteSpace: "nowrap",
  textDecoration: "none",
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--bf-color-text-primary)",
    color: "var(--bf-color-bg-primary)",
    borderColor: "var(--bf-color-text-primary)",
  },
  secondary: {
    background: "transparent",
    color: "var(--bf-color-text-primary)",
    borderColor: "var(--bf-color-border-emphasis)",
  },
  ghost: {
    background: "transparent",
    color: "var(--bf-color-text-muted)",
    borderColor: "transparent",
    letterSpacing: "0.04em",
    textTransform: "none",
  },
  icon: {
    width: 40,
    height: 40,
    padding: 0,
    background: "var(--bf-color-bg-surface-soft)",
    borderColor: "var(--bf-color-border-default)",
    color: "var(--bf-color-text-primary)",
    letterSpacing: "0",
  },
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  leftIcon,
  rightIcon,
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  const isIcon = variant === "icon";
  const resolved = variants[variant];

  const merged: React.CSSProperties = {
    ...base,
    padding: isIcon ? 0 : sizePadding[size],
    fontSize: sizeFont[size],
    opacity: disabled || loading ? 0.55 : 1,
    pointerEvents: disabled || loading ? "none" : "auto",
    ...resolved,
    ...style,
  };

  return (
    <button type="button" disabled={disabled || loading} style={merged} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}

export default Button;
