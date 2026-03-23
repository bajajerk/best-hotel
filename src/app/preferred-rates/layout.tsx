import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Preferred Rates Program — Exclusive Hotel Discounts",
  description:
    "Join Voyagr Club's Preferred Rates program for exclusive access to wholesale hotel prices. Save 20-40% on 5-star hotels in 50+ cities worldwide.",
  keywords: [
    "preferred hotel rates",
    "exclusive hotel discounts",
    "hotel loyalty program",
    "wholesale hotel rates",
    "VIP hotel booking",
  ],
  openGraph: {
    title: "Preferred Rates Program — Exclusive Hotel Discounts",
    description:
      "Join Voyagr Club's Preferred Rates program. Save 20-40% on 5-star hotels worldwide.",
    url: `${SITE_URL}/preferred-rates`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Preferred Rates — Voyagr Club",
    description: "Save 20-40% on 5-star hotels in 50+ cities worldwide.",
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
