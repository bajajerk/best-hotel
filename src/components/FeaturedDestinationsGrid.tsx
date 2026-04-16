"use client";

import React, { useState } from "react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface FeaturedHotelCard {
  name: string;
  location: string;
  citySlug: string;
  editorial: string;
  publicRate: number;
  memberRate: number;
  img: string;
  isVoyagrPick?: boolean;
}

// ---------------------------------------------------------------------------
// Sample data — 3 cards, max 2 Voyagr Picks
// ---------------------------------------------------------------------------
const SAMPLE_CARDS: FeaturedHotelCard[] = [
  {
    name: "Amangalla",
    location: "Galle, Sri Lanka",
    citySlug: "colombo",
    editorial: "Where colonial grandeur meets Indian Ocean calm",
    publicRate: 420,
    memberRate: 295,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    isVoyagrPick: true,
  },
  {
    name: "The Siam",
    location: "Bangkok, Thailand",
    citySlug: "bangkok",
    editorial: "Where the river whispers through art-deco halls",
    publicRate: 380,
    memberRate: 265,
    img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    isVoyagrPick: true,
  },
  {
    name: "Cap Rocat",
    location: "Mallorca, Spain",
    citySlug: "barcelona",
    editorial: "Where the fortress opens onto the Mediterranean",
    publicRate: 510,
    memberRate: 365,
    img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
  },
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

// ---------------------------------------------------------------------------
// Card component
// ---------------------------------------------------------------------------
function DestinationCard({ card }: { card: FeaturedHotelCard }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/city/${card.citySlug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#132338",
          border: `1px solid ${hovered ? "rgba(201,168,76,0.25)" : "rgba(201,168,76,0.08)"}`,
          borderRadius: "4px",
          overflow: "hidden",
          cursor: "pointer",
          transition: "border-color 0.2s",
        }}
      >
        {/* Image area — 180px height with navy gradient overlay */}
        <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
          <img
            src={card.img}
            alt={card.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
            }}
          />
          {/* Navy gradient overlay 60% */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, #132338 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* Voyagr Pick badge — gold border + text, DM Mono 8px, top-left 12px */}
          {card.isVoyagrPick && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                border: "1px solid #C9A84C",
                color: "#C9A84C",
                fontFamily: "var(--font-mono)",
                fontSize: "8px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "4px 8px",
                lineHeight: 1,
              }}
            >
              Voyagr Pick
            </div>
          )}
        </div>

        {/* Body — 20px padding */}
        <div style={{ padding: "20px" }}>
          {/* Location: DM Mono 9px, muted, uppercase, letter-spacing 0.2em */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              color: "rgba(245,241,232,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "8px",
            }}
          >
            {card.location}
          </div>

          {/* Hotel name: Cormorant Garamond 20px, ivory */}
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 400,
              color: "#F5F1E8",
              margin: "0 0 8px 0",
              lineHeight: 1.2,
            }}
          >
            {card.name}
          </h3>

          {/* Editorial line: DM Sans 12px, italic, ivory 40% opacity */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "12px",
              fontStyle: "italic",
              color: "rgba(245,241,232,0.4)",
              margin: "0 0 16px 0",
              lineHeight: 1.5,
            }}
          >
            {card.editorial}
          </p>

          {/* Rate row: flex, align baseline, gap 10px */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "10px",
            }}
          >
            {/* Public: DM Sans 12px, ivory 30%, line-through */}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "rgba(245,241,232,0.3)",
                textDecoration: "line-through",
              }}
            >
              ${card.publicRate}
            </span>

            {/* Member: Cormorant 22px, gold */}
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 500,
                color: "#C9A84C",
                lineHeight: 1,
              }}
            >
              ${card.memberRate}
            </span>

            {/* /night: DM Sans 11px, muted */}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                color: "rgba(245,241,232,0.45)",
              }}
            >
              /night
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Grid section
// ---------------------------------------------------------------------------
export default function FeaturedDestinationsGrid({
  cards = SAMPLE_CARDS,
}: {
  cards?: FeaturedHotelCard[];
}) {
  return (
    <section
      className="featured-destinations-section"
      style={{
        background: "#0B1B2B",
        padding: "80px 60px",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Section header — left-aligned */}
        <div style={{ marginBottom: "48px" }}>
          {/* Eyebrow: "FEATURED DESTINATIONS" */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "#C9A84C",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              marginBottom: "12px",
            }}
          >
            Featured Destinations
          </div>
          {/* H2: Cormorant 44px */}
          <h2
            className="featured-destinations-heading"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "44px",
              fontWeight: 300,
              color: "#F5F1E8",
              margin: 0,
              lineHeight: 1.15,
            }}
          >
            Where Members Are Travelling{" "}
            <em style={{ fontStyle: "italic" }}>Now</em>
          </h2>
        </div>

        {/* 3-up desktop, 1-up mobile, gap 2px */}
        <div
          className="featured-destinations-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "2px",
          }}
        >
          {cards.map((card) => (
            <DestinationCard key={card.name} card={card} />
          ))}
        </div>
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 767px) {
          .featured-destinations-grid {
            grid-template-columns: 1fr !important;
          }
          .featured-destinations-section {
            padding: 60px 20px !important;
          }
          .featured-destinations-heading {
            font-size: 32px !important;
          }
        }
      `}</style>
    </section>
  );
}
