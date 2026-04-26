"use client";

import { CSSProperties, ReactNode } from "react";
import { motion, MotionProps } from "framer-motion";
import { useMotionAllowed } from "@/hooks/useMediaQuery";

type MotionFadeProps = {
  children: ReactNode;
  /** Direction of the entrance offset. Default "up" (translateY +12 → 0). */
  from?: "up" | "down" | "left" | "right" | "scale" | "none";
  /** Magnitude of the entrance offset in px. Default 12. */
  distance?: number;
  /** Animation duration in seconds. Default 0.6. */
  duration?: number;
  /** Delay in seconds before this element starts animating. */
  delay?: number;
  /** "in-view" = fires when scrolled into viewport (default for sections);
   *  "mount"   = fires on mount (use for hero / above-the-fold). */
  trigger?: "in-view" | "mount";
  /** Run only once (default true) — skip the exit animation on re-scroll. */
  once?: boolean;
  /** Tag to render. */
  as?: "div" | "section" | "article" | "li" | "figure";
  className?: string;
  style?: CSSProperties;
  id?: string;
};

/**
 * Motion-budgeted entrance wrapper:
 *  - On desktop without prefers-reduced-motion, runs framer-motion entrance.
 *  - On mobile (<768px) OR prefers-reduced-motion, renders children
 *    immediately with no animation. (CSS @media in globals.css also kills
 *    transition-duration for safety.)
 *
 * Use this for ALL redesign section entrances instead of writing
 * <motion.div initial={...} whileInView={...} /> by hand. Keeps the motion
 * budget consistent and respects the locked decision (mobile throttle +
 * prefers-reduced-motion).
 */
export default function MotionFade({
  children,
  from = "up",
  distance = 12,
  duration = 0.6,
  delay = 0,
  trigger = "in-view",
  once = true,
  as = "div",
  className,
  style,
  id,
}: MotionFadeProps) {
  const motionAllowed = useMotionAllowed();

  if (!motionAllowed || from === "none") {
    const Tag = as as "div";
    return (
      <Tag id={id} className={className} style={style}>
        {children}
      </Tag>
    );
  }

  const fromState: { opacity: number; x?: number; y?: number; scale?: number } =
    from === "scale"
      ? { opacity: 0, scale: 0.97 }
      : from === "left"
        ? { opacity: 0, x: -distance }
        : from === "right"
          ? { opacity: 0, x: distance }
          : from === "down"
            ? { opacity: 0, y: -distance }
            : { opacity: 0, y: distance };

  const toState =
    from === "scale"
      ? { opacity: 1, scale: 1 }
      : { opacity: 1, x: 0, y: 0 };

  const motionProps: MotionProps =
    trigger === "mount"
      ? { initial: fromState, animate: toState }
      : {
          initial: fromState,
          whileInView: toState,
          viewport: { once, margin: "-80px" },
        };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      id={id}
      className={className}
      style={style}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...motionProps}
    >
      {children}
    </MotionTag>
  );
}
