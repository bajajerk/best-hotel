"use client";

import Link from "next/link";
import { PriceProofCompact } from "@/components/PriceProof";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type HotelCardData = {
  name: string;
  city: string;
  citySlug: string;
  stars: number;
  rating: number;
  tags: string[];
  priceFrom: number;
  savePercent: number;
  img: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Vertical Hotel Card — used in home page carousels
// ---------------------------------------------------------------------------
export default function HotelCard({ hotel }: { hotel: HotelCardData }) {
  return (
    <Link href={`/city/${hotel.citySlug}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        className="card-hover"
        style={{
          background: "var(--white)",
          border: "1px solid var(--cream-border)",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
          <img
            className="card-img"
            src={safeImageSrc(hotel.img)}
            alt={hotel.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "saturate(0.88)",
            }}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          {hotel.rating >= 8.5 && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "var(--gold)",
                color: "var(--white)",
                fontSize: "12px",
                fontWeight: 600,
                padding: "4px 10px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {hotel.rating.toFixed(1)}
            </div>
          )}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              background: "var(--success)",
              color: "var(--cream)",
              fontSize: "10px",
              fontWeight: 500,
              padding: "4px 10px",
              letterSpacing: "0.04em",
            }}
          >
            Save up to {hotel.savePercent}%
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "18px 20px 22px" }}>
          <div
            style={{
              color: "var(--gold)",
              fontSize: "10px",
              letterSpacing: "2px",
              marginBottom: "6px",
            }}
          >
            {"★".repeat(hotel.stars)}
          </div>
          <h3
            className="type-heading-3"
            style={{ color: "var(--ink)", marginBottom: "4px", fontSize: "16px" }}
          >
            {hotel.name}
          </h3>
          <p
            style={{
              fontSize: "12px",
              color: "var(--ink-light)",
              letterSpacing: "0.04em",
              marginBottom: "14px",
            }}
          >
            {hotel.city}
          </p>
          <div
            style={{
              display: "flex",
              gap: "5px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            {hotel.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "9px",
                  padding: "3px 8px",
                  background: "var(--cream)",
                  color: "var(--ink-mid)",
                  border: "1px solid var(--cream-border)",
                  letterSpacing: "0.04em",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            style={{
              borderTop: "1px solid var(--cream-border)",
              paddingTop: "14px",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--ink-light)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                From
              </span>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "var(--our-rate)",
                  lineHeight: 1.2,
                }}
              >
                &#8377;{hotel.priceFrom.toLocaleString("en-IN")}
              </div>
              <span style={{ fontSize: "10px", color: "var(--ink-light)" }}>
                per night
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <PriceProofCompact savePercent={hotel.savePercent} />
              <span
                className="card-arrow"
                style={{
                  fontSize: "11px",
                  color: "var(--gold)",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                }}
              >
                View &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
