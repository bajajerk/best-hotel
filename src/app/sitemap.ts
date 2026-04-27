import type { MetadataRoute } from "next";
import { SAMPLE_CITIES } from "@/lib/constants";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://voyagr.club";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/preferred-rates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/match-my-rates`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // City pages — one entry per curated city
  const cityPages: MetadataRoute.Sitemap = SAMPLE_CITIES.map((city) => ({
    url: `${SITE_URL}/city/${city.city_slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  // Optionally fetch hotel IDs from backend for hotel pages
  let hotelPages: MetadataRoute.Sitemap = [];
  try {
    const backendUrl = process.env.BACKEND_URL || "http://134.122.41.91:5000";
    // Fetch hotel slugs + short_ids from each city's curations and emit the
    // canonical pretty URL `/hotel/<slug>-<short_id>`. Phase D migration.
    const hotelPaths: string[] = [];
    for (const city of SAMPLE_CITIES.slice(0, 20)) {
      try {
        const res = await fetch(
          `${backendUrl}/api/curations/${city.city_slug}/hotels`,
          { next: { revalidate: 86400 } } // revalidate daily
        );
        if (res.ok) {
          const data = await res.json();
          const hotels = data.hotels || data || [];
          for (const h of hotels) {
            if (h.slug && h.short_id) {
              hotelPaths.push(`${h.slug}-${h.short_id}`);
            } else if (h.short_id) {
              hotelPaths.push(h.short_id);
            } else if (h.master_id) {
              hotelPaths.push(h.master_id);
            }
          }
        }
      } catch {
        // Skip cities that fail
      }
    }
    hotelPages = hotelPaths.map((path) => ({
      url: `${SITE_URL}/hotel/${path}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));
  } catch {
    // If backend is unreachable, skip hotel pages
  }

  return [...staticPages, ...cityPages, ...hotelPages];
}
