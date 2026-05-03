import type { Metadata } from "next";
import { Playfair_Display, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/booking-tokens.css";
import Providers from "@/components/Providers";
import CompareBar from "@/components/CompareBar";
import SiteSignInStickyBar from "@/components/SiteSignInStickyBar";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

// Understated Luxury typography — Playfair Display for headings, Manrope for body, JetBrains Mono for tech labels
const playfair = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Preferred Hotel Rates | Members-Only Access to 1,500+ Hotels Worldwide`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "preferred hotel rates",
    "B2B hotel rates",
    "preferred hotel booking",
    "hotel price comparison",
    "voyagr club",
    "luxury hotel access",
    "hotel booking",
    "curated hotels",
    "members hotel rates",
    "insider hotel rates",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Preferred Hotel Rates`,
    description:
      "Access preferred hotel rates across 50+ cities worldwide. No markup, no hidden fees.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Preferred Hotel Rates`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Preferred Hotel Rates`,
    description:
      "Access preferred hotel rates across 50+ cities worldwide. No markup, no hidden fees.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols for drawer nav icons */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,300,0,0&display=swap"
        />
        {/* Organization + WebSite JSON-LD for sitewide SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd()),
          }}
        />
      </head>
      <body
        className={`${playfair.variable} ${manrope.variable} ${jetbrainsMono.variable} antialiased luxe-body`}
      >
        <Providers>
        {children}
        <CompareBar />
        <SiteSignInStickyBar />
        </Providers>
      </body>
    </html>
  );
}
