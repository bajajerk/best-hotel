/* ────────────────────────────────────────────────────────────
   LuxeSkeleton — base shimmer block
   Use this primitive to compose any skeleton screen. Visual
   treatment is driven by the `.luxe-skeleton` class defined in
   globals.css (champagne-gold sweep over a neutral surface).
   ──────────────────────────────────────────────────────────── */

import { CSSProperties } from "react";

export interface LuxeSkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  style?: CSSProperties;
  className?: string;
  /**
   * Surface variant. `cream` (default) suits the light-themed pages
   * (search, city, hotel). `dark` suits `.luxe` scope (profile, dark
   * editorial sections).
   */
  variant?: "cream" | "dark";
}

export default function LuxeSkeleton({
  width = "100%",
  height = 16,
  radius = 6,
  style,
  className,
  variant = "cream",
}: LuxeSkeletonProps) {
  const cls = [
    "luxe-skeleton",
    variant === "dark" ? "luxe-skeleton--dark" : "luxe-skeleton--cream",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-hidden="true"
      className={cls}
      style={{
        width,
        height,
        borderRadius: typeof radius === "number" ? `${radius}px` : radius,
        ...style,
      }}
    />
  );
}
