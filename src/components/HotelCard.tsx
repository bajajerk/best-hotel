"use client";

import React from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type HotelCardData = {
  hotelId: number;
  name: string;
  city: string;
  citySlug: string;
  stars: number;
  rating: number;
  tags: string[];
  priceFrom: number;
  savePercent: number;
  img: string;
  whyVisitNow?: string;
};

/** Deal variant includes market-rate vs Voyagr-rate pricing */
export type HotelDealData = {
  hotelId: number;
  name: string;
  city: string;
  citySlug: string;
  stars: number;
  rating: number;
  tags: string[];
  marketRate: number;
  voyagrRate: number;
  savePercent: number;
  img: string;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

function safeImageSrc(url: string): string {
  if (!url || !url.trim()) return FALLBACK_IMAGE;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Perk suggestions based on hotel tags/name — gives each card unique perks
// ---------------------------------------------------------------------------
const PERK_SETS: Record<string, string[]> = {
  Spa: ["Spa credit", "Late checkout", "Welcome amenity"],
  Beach: ["Room upgrade", "Welcome drinks", "Late checkout"],
  Pool: ["Preferred room upgrade", "Early check-in", "Welcome drinks"],
  Restaurant: ["Breakfast included", "Room upgrade", "Late checkout"],
  default: ["Room upgrade", "Late checkout", "Welcome drinks"],
};

function getPerksForHotel(tags: string[]): string[] {
  for (const tag of tags) {
    if (PERK_SETS[tag]) return PERK_SETS[tag];
  }
  return PERK_SETS.default;
}

// ---------------------------------------------------------------------------
// Vertical Hotel Card — used in home page carousels
// ---------------------------------------------------------------------------
function HotelCardInner({ hotel }: { hotel: HotelCardData }) {
  if (!hotel.name) return null;
  const perks = getPerksForHotel(hotel.tags);

  return (
    <Link href={`/hotel/${hotel.hotelId}`} style={{ textDecoration: "none", display: "block" }}>
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
              const img = e.target as HTMLImageElement;
              if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
            }}
          />
          {hotel.rating >= 8.5 && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "var(--gold)",
                color: "#1a1710",
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
              background: "var(--emerald, #10B981)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 500,
              padding: "4px 10px",
              letterSpacing: "0.04em",
            }}
          >
            Member Perks Included
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
              marginBottom: hotel.whyVisitNow ? "10px" : "14px",
            }}
          >
            {hotel.city}
          </p>
          {hotel.whyVisitNow && (
            <p
              style={{
                fontSize: "11px",
                lineHeight: 1.5,
                color: "var(--ink-mid)",
                fontStyle: "italic",
                marginBottom: "12px",
                borderLeft: "2px solid var(--gold)",
                paddingLeft: "10px",
              }}
            >
              {hotel.whyVisitNow}
            </p>
          )}

          {/* Member perks */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--emerald, #10B981)",
              marginBottom: "6px",
            }}>
              Members enjoy:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {perks.map((perk) => (
                <span
                  key={perk}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "10px",
                    color: "var(--ink-mid)",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald, #10B981)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {perk}
                </span>
              ))}
            </div>
          </div>

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
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <p style={{
              fontSize: "10px",
              color: "var(--ink-light)",
              fontStyle: "italic",
              maxWidth: "200px",
              lineHeight: 1.4,
            }}>
              Privileged access with exclusive perks reserved for members.
            </p>
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
    </Link>
  );
}

const HotelCard = React.memo(HotelCardInner);
export default HotelCard;

// ---------------------------------------------------------------------------
// Deal Card variant — experience-focused with perks highlight
// ---------------------------------------------------------------------------
function HotelDealCardInner({ deal }: { deal: HotelDealData }) {
  if (!deal.name) return null;
  const perks = getPerksForHotel(deal.tags);

  return (
    <Link href={`/hotel/${deal.hotelId}`} style={{ textDecoration: "none", display: "block" }}>
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
            src={safeImageSrc(deal.img)}
            alt={deal.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "saturate(0.88)",
            }}
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: "12px",
              background: "var(--emerald, #10B981)",
              color: "#fff",
              padding: "6px 14px",
              fontSize: "9px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Member Perks Included
          </div>
          {deal.rating >= 8.5 && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "var(--gold)",
                color: "#1a1710",
                fontSize: "12px",
                fontWeight: 600,
                padding: "4px 10px",
                fontFamily: "var(--font-mono)",
              }}
            >
              {deal.rating.toFixed(1)}
            </div>
          )}
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
            {"★".repeat(deal.stars)}
          </div>
          <h3
            className="type-heading-3"
            style={{ color: "var(--ink)", marginBottom: "4px", fontSize: "16px" }}
          >
            {deal.name}
          </h3>
          <p
            style={{
              fontSize: "12px",
              color: "var(--ink-light)",
              letterSpacing: "0.04em",
              marginBottom: "14px",
            }}
          >
            {deal.city}
          </p>

          {/* Member perks */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--emerald, #10B981)",
              marginBottom: "6px",
            }}>
              Members enjoy:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {perks.map((perk) => (
                <span
                  key={perk}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "10px",
                    color: "var(--ink-mid)",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald, #10B981)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {perk}
                </span>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "5px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            {deal.tags.map((tag) => (
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
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "var(--emerald, #10B981)",
            }}>
              Preferred Access
            </div>
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
    </Link>
  );
}

export const HotelDealCard = React.memo(HotelDealCardInner);
