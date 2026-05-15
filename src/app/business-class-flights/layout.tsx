import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Premium Cabin Fares — Voyagr Club",
  description:
    "Preferred premium-cabin pricing on the routes Voyagr Club members fly most, negotiated directly with carriers. Business and first class fares from India to 30+ destinations, paired with a concierge.",
  keywords: [
    "business class flights",
    "first class fares",
    "premium cabin pricing",
    "luxury flights India",
    "preferred airmile rates",
    "premium flight booking",
    "Voyagr Club flights",
  ],
  openGraph: {
    title: "Premium Cabin Fares — Voyagr Club",
    description:
      "Preferred premium-cabin pricing on the routes our members fly most. Business and first class from India to 30+ destinations, with a concierge who ticketed your last ten trips.",
    url: `${SITE_URL}/business-class-flights`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Premium Cabin Fares — Voyagr Club",
    description:
      "Considered fares for considered travellers. Negotiated premium-cabin pricing on the routes we curate.",
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
