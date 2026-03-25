import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import CompareBar from "@/components/CompareBar";
import WhatsAppFab from "@/components/WhatsAppFab";
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_DESCRIPTION,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Preferred Hotel Rates | Wholesale Access to 1,500+ Hotels Worldwide`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "preferred hotel rates",
    "B2B hotel rates",
    "wholesale hotel booking",
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
      "Access preferred wholesale hotel rates across 50+ cities worldwide. No markup, no hidden fees.",
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
      "Access preferred wholesale hotel rates across 50+ cities worldwide. No markup, no hidden fees.",
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
        className={`${cormorant.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>
        {children}
        <CompareBar />
        </Providers>

        {/* Floating WhatsApp Button — hidden on hotel detail pages via CSS */}
        <WhatsAppFab />
      </body>
    </html>
  );
}
