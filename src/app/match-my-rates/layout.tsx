import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Match My Rate — We'll Beat Any Hotel Price",
  description:
    "Upload a screenshot of any hotel booking and we'll match or beat the price. Voyagr Club's AI-powered rate matching guarantees you the best deal.",
  keywords: [
    "hotel price match",
    "beat hotel price",
    "hotel rate comparison",
    "best hotel price guarantee",
    "hotel price guarantee",
  ],
  openGraph: {
    title: "Match My Rate — We'll Beat Any Hotel Price",
    description:
      "Upload a screenshot of any hotel booking and we'll match or beat the price with Voyagr Club.",
    url: `${SITE_URL}/match-my-rates`,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Match My Rate — Voyagr Club",
    description: "Upload a screenshot. We'll beat the price.",
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
