import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this app — without this, the multiple
  // lockfiles in /home/mayank cause Turbopack to infer the wrong root and
  // write build manifests to a path that ENOENTs at the end of the build.
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "pix1.agoda.net" },
      { protocol: "https", hostname: "pix2.agoda.net" },
      { protocol: "https", hostname: "pix3.agoda.net" },
      { protocol: "https", hostname: "pix4.agoda.net" },
      { protocol: "https", hostname: "pix5.agoda.net" },
      { protocol: "https", hostname: "photos.hotelbeds.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
