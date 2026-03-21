import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
