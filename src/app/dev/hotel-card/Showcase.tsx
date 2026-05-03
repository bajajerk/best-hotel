"use client";

import React, { useState } from "react";
import { Pill } from "@/components/primitives/booking";
import HotelCard, {
  type HotelCardModel,
} from "@/components/booking/HotelCard";

type Theme = "dark" | "light";

// ── Sample hotels ───────────────────────────────────────────────────────────
const standardHotel: HotelCardModel = {
  id: "h-aman-tokyo",
  name: "Aman Tokyo",
  location: { neighbourhood: "Otemachi", minutesFromAirport: 75, airportCode: "HND" },
  image:
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=70",
  rating: 9.4,
  stars: 5,
  amenities: ["Spa", "Onsen", "Tea ceremony", "City views"],
  member_rate: 1280,
  currency: "USD",
  cms: {
    search_blurb:
      "A vertical sanctuary above the Otemachi towers — six stories of cypress, basalt and quiet, with the city laid out below.",
  },
};

const conciergeHotel: HotelCardModel = {
  id: "h-cap-juluca",
  name: "Belmond Cap Juluca",
  location: { neighbourhood: "Maundays Bay", minutesFromAirport: 25, airportCode: "AXA" },
  image:
    "https://images.unsplash.com/photo-1582610116397-edb318620f90?w=1200&q=70",
  rating: 9.7,
  stars: 5,
  amenities: ["Beachfront", "Pool", "Spa", "Three restaurants"],
  member_rate: 2150,
  public_rate: 2480,
  currency: "USD",
  cms: {
    search_blurb:
      "Moorish-style domes along a horseshoe bay. The kind of beach that ruins other beaches.",
  },
};

const strikeHotel: HotelCardModel = {
  id: "h-rosewood-london",
  name: "Rosewood London",
  location: { neighbourhood: "Holborn", minutesFromAirport: 55, airportCode: "LHR" },
  image:
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=70",
  rating: 9.2,
  stars: 5,
  amenities: ["Courtyard", "Spa", "Holborn Dining Room", "Private bar"],
  member_rate: 740,
  public_rate: 920,
  currency: "GBP",
  cms: {
    search_blurb:
      "An Edwardian Belle Époque grande dame restored without the gilt. Holborn's quiet pocket of grown-up luxury.",
  },
};

const noBlurbHotel: HotelCardModel = {
  id: "h-grand-hyatt-mumbai",
  name: "Grand Hyatt Mumbai",
  location: { neighbourhood: "Bandra Kurla", minutesFromAirport: 18, airportCode: "BOM" },
  image:
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=70",
  rating: 8.6,
  stars: 5,
  amenities: ["Pool", "Spa", "Six restaurants", "Club lounge"],
  member_rate: 18400,
  currency: "INR",
  cms: { search_blurb: "", editorial_intro: "" },
};

// ── Layout chrome ───────────────────────────────────────────────────────────
const sectionStyle: React.CSSProperties = {
  padding: "var(--bf-space-10) var(--bf-space-7)",
  borderTop: "1px solid var(--bf-color-border-soft)",
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--bf-font-sans)",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--bf-color-accent)",
  marginBottom: "var(--bf-space-3)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--bf-font-serif)",
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: 26,
  lineHeight: "30px",
  color: "var(--bf-color-text-primary)",
  margin: "0 0 var(--bf-space-2)",
};

const sectionNoteStyle: React.CSSProperties = {
  fontFamily: "var(--bf-font-sans)",
  fontSize: 13,
  lineHeight: "20px",
  color: "var(--bf-color-text-soft)",
  marginBottom: "var(--bf-space-7)",
  maxWidth: 640,
};

const stackStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--bf-space-5)",
};

const mobileFrameOuterStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--bf-space-7)",
};

const mobileFrameStyle: React.CSSProperties = {
  width: 360,
  border: "1px solid var(--bf-color-border-default)",
  borderRadius: "var(--bf-radius-xl)",
  padding: "var(--bf-space-3)",
  background: "var(--bf-color-bg-surface-soft)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--bf-space-4)",
  alignItems: "center",
};

export default function HotelCardShowcase() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [favorited, setFavorited] = useState(false);
  const [lastSelectedId, setLastSelectedId] = useState<string | number | null>(null);

  return (
    <div
      data-bf-theme={theme}
      style={{
        minHeight: "100vh",
        background: "var(--bf-color-bg-primary)",
        color: "var(--bf-color-text-primary)",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "var(--bf-space-5) var(--bf-space-7)",
          background: "var(--bf-color-bg-overlay)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--bf-color-border-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--bf-space-5)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--bf-font-sans)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--bf-color-accent)",
              fontWeight: 500,
            }}
          >
            Ticket 02 · Booking Flow
          </span>
          <h1
            style={{
              fontFamily: "var(--bf-font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 26,
              margin: 0,
              color: "var(--bf-color-text-primary)",
            }}
          >
            Hotel card
          </h1>
        </div>
        <div style={rowStyle}>
          <Pill
            variant={theme === "dark" ? "active" : "default"}
            onClick={() => setTheme("dark")}
          >
            Dark
          </Pill>
          <Pill
            variant={theme === "light" ? "active" : "default"}
            onClick={() => setTheme("light")}
          >
            Light (v2)
          </Pill>
        </div>
      </header>

      {/* Standard horizontal */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>01 · Standard</div>
        <h2 style={sectionTitleStyle}>Horizontal — desktop default</h2>
        <p style={sectionNoteStyle}>
          Image left at 4:3, editorial info middle, rating + price + CTA right.
          Reads exclusively from booking-flow tokens.
        </p>
        <div style={stackStyle}>
          <HotelCard
            hotel={standardHotel}
            layout="horizontal"
            nights={3}
            onSelect={(h) => setLastSelectedId(h.id)}
          />
        </div>
      </section>

      {/* Concierge pick */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>02 · Concierge pick</div>
        <h2 style={sectionTitleStyle}>Top-3 amber tag overlay</h2>
        <p style={sectionNoteStyle}>
          The <code>isConciergePick</code> flag is set by the parent for the
          first three results in any list. Hotels at rank 4+ render without the tag.
        </p>
        <div style={stackStyle}>
          <HotelCard
            hotel={conciergeHotel}
            isConciergePick
            layout="horizontal"
            nights={4}
            onSelect={(h) => setLastSelectedId(h.id)}
          />
        </div>
      </section>

      {/* Strikethrough */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>03 · With strikethrough</div>
        <h2 style={sectionTitleStyle}>Public rate &gt; member rate</h2>
        <p style={sectionNoteStyle}>
          When <code>hotel.public_rate</code> is greater than{" "}
          <code>member_rate</code>, the public price renders beneath the member
          price, smaller and struck through. Otherwise it is hidden entirely.
        </p>
        <div style={stackStyle}>
          <HotelCard
            hotel={strikeHotel}
            layout="horizontal"
            nights={2}
            onSelect={(h) => setLastSelectedId(h.id)}
          />
        </div>
      </section>

      {/* No blurb */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>04 · No blurb</div>
        <h2 style={sectionTitleStyle}>Empty CMS fallback</h2>
        <p style={sectionNoteStyle}>
          When both <code>search_blurb</code> and <code>editorial_intro</code>{" "}
          are empty, the blurb section is omitted (no API prose leaks in).
        </p>
        <div style={stackStyle}>
          <HotelCard
            hotel={noBlurbHotel}
            layout="horizontal"
            nights={1}
            onSelect={(h) => setLastSelectedId(h.id)}
          />
        </div>
      </section>

      {/* Mobile vertical */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>05 · Mobile</div>
        <h2 style={sectionTitleStyle}>Vertical — under 768px</h2>
        <p style={sectionNoteStyle}>
          Image full-width at 16:9. Concierge tag, heart, and rating chip overlay
          the image. Blurb is hidden. Price + CTA stack in the bottom row.
        </p>
        <div style={mobileFrameOuterStyle}>
          <div style={mobileFrameStyle}>
            <HotelCard
              hotel={standardHotel}
              layout="vertical"
              nights={3}
              isFavorited={favorited}
              onToggleFavorite={() => setFavorited((v) => !v)}
              onSelect={(h) => setLastSelectedId(h.id)}
            />
          </div>
          <div style={mobileFrameStyle}>
            <HotelCard
              hotel={conciergeHotel}
              isConciergePick
              layout="vertical"
              nights={4}
              isFavorited
              onSelect={(h) => setLastSelectedId(h.id)}
            />
          </div>
          <div style={mobileFrameStyle}>
            <HotelCard
              hotel={strikeHotel}
              layout="vertical"
              nights={2}
              onSelect={(h) => setLastSelectedId(h.id)}
            />
          </div>
        </div>
      </section>

      {/* Hover */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>06 · Hover state</div>
        <h2 style={sectionTitleStyle}>Border lift &amp; image saturation</h2>
        <p style={sectionNoteStyle}>
          Hover the card below: the border emphasises and the image gains a
          subtle scale to telegraph interactivity. Effect is applied via the
          <code> .bf-hotel-card-hover </code> wrapper class only on this page so
          hosts can opt in.
        </p>
        <style>{`
          .bf-hotel-card-hover article[data-bf-card="hotel"] {
            transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
          }
          .bf-hotel-card-hover article[data-bf-card="hotel"]:hover {
            border-color: var(--bf-color-border-emphasis);
            transform: translateY(-2px);
            box-shadow: 0 18px 40px rgba(0, 0, 0, 0.32);
          }
          .bf-hotel-card-hover article[data-bf-card="hotel"] img {
            transition: transform 0.4s ease;
          }
          .bf-hotel-card-hover article[data-bf-card="hotel"]:hover img {
            transform: scale(1.04);
          }
        `}</style>
        <div className="bf-hotel-card-hover" style={stackStyle}>
          <HotelCard
            hotel={conciergeHotel}
            isConciergePick
            layout="horizontal"
            nights={3}
            onSelect={(h) => setLastSelectedId(h.id)}
          />
        </div>
      </section>

      {/* Auto */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>07 · Auto</div>
        <h2 style={sectionTitleStyle}>Resize me</h2>
        <p style={sectionNoteStyle}>
          <code>layout=&quot;auto&quot;</code> swaps to vertical below 768px.
          Resize the viewport to verify the breakpoint behaviour.
        </p>
        <div style={stackStyle}>
          <HotelCard
            hotel={standardHotel}
            layout="auto"
            nights={3}
            onSelect={(h) => setLastSelectedId(h.id)}
          />
        </div>
      </section>

      <footer
        style={{
          padding: "var(--bf-space-10) var(--bf-space-7)",
          borderTop: "1px solid var(--bf-color-border-soft)",
          color: "var(--bf-color-text-faint)",
          fontFamily: "var(--bf-font-sans)",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
          gap: "var(--bf-space-5)",
        }}
      >
        <span>VOY · Booking flow design system</span>
        {lastSelectedId !== null && (
          <span>last selected · {String(lastSelectedId)}</span>
        )}
      </footer>
    </div>
  );
}
