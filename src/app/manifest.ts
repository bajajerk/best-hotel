import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voyagr Club — Preferred Hotel Rates",
    short_name: "Voyagr",
    description:
      "Access preferred wholesale hotel rates across 50+ cities worldwide. No markup, no hidden fees.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f0e8",
    theme_color: "#1a1710",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
