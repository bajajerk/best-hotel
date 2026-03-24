"use client";

import React from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CityCardData {
  name: string;
  slug: string;
  country: string;
  tagline?: string;
  img: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// CityCard — image tile with overlay text
// ---------------------------------------------------------------------------
function CityCardInner({ city }: { city: CityCardData }) {
  return (
    <Link
      href={`/city/${city.slug}`}
      className="city-card"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div className="city-card-inner">
        {/* Image */}
        <div className="city-card-img-wrap">
          <img
            className="city-card-img"
            src={safeImageSrc(city.img)}
            alt={city.name}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
        </div>

        {/* Text overlay */}
        <div className="city-card-overlay">
          <h3 className="city-card-name">{city.name}</h3>
          <p className="city-card-country">{city.country}</p>
          {city.tagline && (
            <p className="city-card-tagline">{city.tagline}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

const CityCard = React.memo(CityCardInner);
export default CityCard;
