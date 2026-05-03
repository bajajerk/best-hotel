/**
 * Booking-flow primitives showcase.
 *
 * Storybook alternative: a single page that renders every primitive across
 * every variant. Lives under /dev/booking-tokens, noindex'd, and serves as
 * the visual contract for TICKET 01. Use the theme toggle to verify both
 * dark (default) and the v2 light flag.
 */

import type { Metadata } from "next";
import BookingTokensShowcase from "./Showcase";

export const metadata: Metadata = {
  title: "Booking Flow · Tokens & Primitives",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <BookingTokensShowcase />;
}
