import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Preferred Rates Program — Insider Hotel Access",
  description:
    "Join Voyagr Club's Preferred Rates program for exclusive access to insider hotel pricing at 5-star properties in 50+ cities worldwide.",
  keywords: [
    "preferred hotel rates",
    "insider hotel access",
    "hotel loyalty program",
    "members hotel rates",
    "VIP hotel booking",
  ],
  openGraph: {
    title: "Preferred Rates Program — Insider Hotel Access",
    description:
      "Join Voyagr Club's Preferred Rates program. Access preferred rates at 5-star hotels worldwide.",
    url: `${SITE_URL}/preferred-rates`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Preferred Rates — Voyagr Club",
    description: "Access preferred rates at 5-star hotels in 50+ cities worldwide.",
  },
  alternates: {
    canonical: `${SITE_URL}/preferred-rates`,
  },
};

export default function PreferredRatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
