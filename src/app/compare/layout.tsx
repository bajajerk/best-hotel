import type { Metadata } from "next";
import { SITE_URL, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Compare Hotels Side by Side",
  description:
    "Compare hotel amenities, prices, ratings and locations side by side. Make informed booking decisions with Voyagr Club's hotel comparison tool.",
  openGraph: {
    title: "Compare Hotels Side by Side",
    description:
      "Compare hotel amenities, prices, ratings and locations side by side on Voyagr Club.",
    url: `${SITE_URL}/compare`,
    siteName: SITE_NAME,
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/compare`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
