import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "BeatMyRate — Hotel Rates You Weren't Supposed to See | Save 20-40%",
  description:
    "Get B2B wholesale hotel rates across 50+ cities worldwide. We negotiate directly with hotels so you save 20-40% on every booking. No markup, no hidden fees.",
  keywords: ["hotel deals", "B2B hotel rates", "cheap hotels", "wholesale hotel booking", "hotel price comparison", "beatmyrate"],
  openGraph: {
    title: "BeatMyRate — Hotel Rates You Weren't Supposed to See",
    description: "Get B2B wholesale hotel rates across 50+ cities worldwide. Save 20-40% on every booking.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
