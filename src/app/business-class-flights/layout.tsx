import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Business Class Flights — Luxury Travel at Economy Prices",
  description:
    "Fly business & first class at up to 70% off with Mer Voyage Club. Exclusive airline partnerships, preferred airmile rates, and premium seats from India to 30+ global destinations.",
  keywords: [
    "business class flights",
    "cheap business class",
    "first class fares",
    "luxury flights India",
    "premium flight booking",
    "discounted business class",
    "Mer Voyage Club flights",
  ],
  openGraph: {
    title: "Business Class Flights — Mer Voyage Club",
    description:
      "Fly business & first class at up to 70% off. Premium seats from India to 30+ global destinations.",
    url: `${SITE_URL}/business-class-flights`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Class Flights — Mer Voyage Club",
    description:
      "Luxury travel at economy prices. Save up to 70% on business & first class flights.",
  },
  alternates: {
    canonical: `${SITE_URL}/business-class-flights`,
  },
};

export default function BusinessClassFlightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
