"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CITY_IMAGES, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import EditorialCard from "./EditorialCard";

type CityTag = "Member Favourite" | "Most Visited";

type CityItem = {
  slug: string;
  name: string;
  country: string;
  stays: number;
  tag?: CityTag;
};

// Curated list per spec — city order, stays count, and gold tags are
// design-locked, not driven by the admin curation API.
const TOP_CITIES: CityItem[] = [
  { slug: "singapore", name: "Singapore", country: "Singapore",      stays: 232,  tag: "Most Visited" },
  { slug: "bangkok",   name: "Bangkok",   country: "Thailand",       stays: 28 },
  { slug: "bali",      name: "Bali",      country: "Indonesia",      stays: 1000, tag: "Member Favourite" },
  { slug: "london",    name: "London",    country: "United Kingdom", stays: 844 },
  { slug: "paris",     name: "Paris",     country: "France",         stays: 29 },
  { slug: "new-york",  name: "New York",  country: "United States",  stays: 273 },
  { slug: "phuket",    name: "Phuket",    country: "Thailand",       stays: 729 },
  { slug: "mumbai",    name: "Mumbai",    country: "India",          stays: 279 },
];

export default function TopCitiesMobileCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Sync the dot indicator with horizontal scroll position. We measure the
  // first card + computed gap each time so it stays correct across breakpoints
  // (mobile uses 72vw cards; tablet+ caps to a fixed max-width).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      const cardWidth = first.offsetWidth;
      const gap = parseFloat(getComputedStyle(el).columnGap || "0") || 0;
      const stride = cardWidth + gap;
      if (stride <= 0) return;
      const idx = Math.round(el.scrollLeft / stride);
      setActiveIndex(Math.max(0, Math.min(idx, TOP_CITIES.length - 1)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="tcm-section">
      <div className="luxe-container tcm-header">
        <div className="tcm-eyebrow">Top Cities</div>
        <h2 className="tcm-title">
          Loved by <em>Indian Travellers</em>
        </h2>
        <Link href="/search" className="tcm-browse">
          <span>Browse All</span>
          <span aria-hidden="true" className="tcm-browse-arrow">&rarr;</span>
        </Link>
      </div>

      <div className="tcm-wrapper">
        <div ref={trackRef} className="tcm-track">
          {TOP_CITIES.map((c) => {
            const img = CITY_IMAGES[c.slug] ?? FALLBACK_CITY_IMAGE;
            const chips: string[] = [];
            if (c.tag) chips.push(c.tag);
            chips.push(`${c.stays.toLocaleString()} Stays`);
            return (
              <div key={c.slug} className="tcm-slot">
                <EditorialCard
                  href={`/city/${c.slug}`}
                  imageUrl={img}
                  imageAlt={`${c.name}, ${c.country}`}
                  eyebrow={c.country.toUpperCase()}
                  name={c.name}
                  subline={c.tag}
                  chips={chips}
                  variant="city"
                  aspectRatio="4 / 5"
                  sizes="(max-width: 640px) 72vw, 320px"
                  className="tcm-card-edcard"
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="tcm-dots" role="tablist" aria-label="Top cities position">
        {TOP_CITIES.map((c, i) => (
          <span
            key={c.slug}
            className={`tcm-dot${i === activeIndex ? " is-active" : ""}`}
            aria-hidden="true"
          />
        ))}
      </div>
    </section>
  );
}
