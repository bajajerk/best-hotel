import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Search Hotels — 50+ Cities, Wholesale Rates",
  description:
    "Search and compare wholesale hotel rates across 50+ cities worldwide. Filter by price, star rating, amenities and more. Save 20-40% on every booking with Voyagr Club.",
  keywords: [
    "search hotels",
    "compare hotel prices",
    "hotel search engine",
    "cheap hotel search",
    "find hotels",
    "hotel comparison",
  ],
  openGraph: {
    title: "Search Hotels — 50+ Cities, Wholesale Rates",
    description:
      "Search and compare wholesale hotel rates across 50+ cities worldwide. Save 20-40% on every booking.",
    url: `${SITE_URL}/search`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Search Hotels — Voyagr Club",
    description: "Search wholesale hotel rates across 50+ cities worldwide.",
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
