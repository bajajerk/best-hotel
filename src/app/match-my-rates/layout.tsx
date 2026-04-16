import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Match My Rate — Compare Your Hotel Rate",
  description:
    "Upload a screenshot of any hotel booking and compare it against our preferred rates. Voyagr Club's AI-powered rate matching finds you the best available rate.",
  keywords: [
    "hotel rate match",
    "hotel rate comparison",
    "best hotel rate guarantee",
    "hotel price comparison",
    "preferred hotel rates",
  ],
  openGraph: {
    title: "Match My Rate — Compare Your Hotel Rate",
    description:
      "Upload a screenshot of any hotel booking and compare it against preferred rates with Voyagr Club.",
    url: `${SITE_URL}/match-my-rates`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Match My Rate — Voyagr Club",
    description: "Upload a screenshot. Compare against preferred rates.",
  },
  alternates: {
    canonical: `${SITE_URL}/match-my-rates`,
  },
};

export default function MatchMyRatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
