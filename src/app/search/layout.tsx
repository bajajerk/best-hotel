import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Search Hotels — 50+ Cities, Curated Stays",
  description:
    "Search and explore curated hotels across 50+ cities worldwide. Filter by price, star rating, amenities and more.",
  keywords: [
    "search hotels",
    "compare hotel prices",
    "hotel search engine",
    "find hotels",
    "hotel comparison",
    "preferred hotel rates",
  ],
  openGraph: {
    title: "Search Hotels — 50+ Cities, Curated Stays",
    description:
      "Search and explore curated hotels across 50+ cities worldwide. Preferred access on every booking.",
    url: `${SITE_URL}/search`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Search Hotels — Voyagr Club",
    description: "Search curated hotels across 50+ cities worldwide.",
  },
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
