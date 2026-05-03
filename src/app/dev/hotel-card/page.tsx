/**
 * HotelCard showcase.
 *
 * Storybook alternative: every required state for TICKET 02 rendered on a
 * single noindex'd page. Covers standard, concierge-pick, with-strikethrough,
 * no-blurb, forced-mobile, and a hover demonstration.
 */

import type { Metadata } from "next";
import HotelCardShowcase from "./Showcase";

export const metadata: Metadata = {
  title: "Booking Flow · Hotel Card",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HotelCardShowcase />;
}
