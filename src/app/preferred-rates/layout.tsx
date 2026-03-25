import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Preferred Rates Program — Insider Hotel Access",
  description:
    "Join Voyagr Club's Preferred Rates program for exclusive access to curated 5-star properties in 50+ cities worldwide.",
  keywords: [
    "preferred hotel rates",
    "insider hotel access",
    "hotel loyalty program",
    "curated hotel stays",
    "VIP hotel booking",
  ],
  openGraph: {
    title: "Preferred Rates Program — Insider Hotel Access",
    description:
      "Join Voyagr Club's Preferred Rates program. Access curated 5-star hotels worldwide.",
    url: `${SITE_URL}/preferred-rates`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Preferred Rates — Voyagr Club",
    description: "Access curated 5-star hotels worldwide.",
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
