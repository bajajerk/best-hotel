"use client";

import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatINR(amount: number): string {
  return `\u20B9${Math.round(amount).toLocaleString("en-IN")}`;
}

// ---------------------------------------------------------------------------
// Data — curated comparison examples
// ---------------------------------------------------------------------------
const COMPARISON_HOTELS = [
  {
    hotel: "The Ritz-Carlton",
    city: "Bali, Indonesia",
    stars: 5,
    img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80",
    marketRate: 22400,
    voyagrRate: 16800,
    clubRate: 13400,
    perks: ["Room upgrade", "Late checkout", "Welcome drinks"],
  },
  {
    hotel: "Mandarin Oriental",
    city: "Bangkok, Thailand",
    stars: 5,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    marketRate: 18500,
    voyagrRate: 14200,
    clubRate: 11100,
    perks: ["Spa credit", "Early check-in", "Breakfast included"],
  },
  {
    hotel: "Taj Palace",
    city: "New Delhi, India",
    stars: 5,
    img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
    marketRate: 15800,
    voyagrRate: 11900,
    clubRate: 9500,
    perks: ["Club lounge access", "Airport transfer", "Room upgrade"],
  },
  {
    hotel: "Aman Tokyo",
    city: "Tokyo, Japan",
    stars: 5,
    img: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80",
    marketRate: 34000,
    voyagrRate: 25500,
    clubRate: 20400,
    perks: ["Onsen access", "Late checkout", "Mini-bar included"],
  },
];

// ---------------------------------------------------------------------------
// Rate tier label component
// ---------------------------------------------------------------------------
function RateTier({
  label,
  price,
  isClub,
  isMarket,
  savingsVsMarket,
}: {
  label: string;
  price: number;
  isClub?: boolean;
  isMarket?: boolean;
  savingsVsMarket?: number;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: "16px 14px",
        background: isClub ? "rgba(184, 149, 90, 0.08)" : "transparent",
        border: isClub ? "1px solid var(--gold)" : "1px solid var(--cream-border)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {isClub && (
        <div
          style={{
            position: "absolute",
            top: "-10px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--gold)",
            color: "var(--white)",
            fontSize: "8px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            padding: "2px 10px",
            whiteSpace: "nowrap",
          }}
        >
          Best Rate
        </div>
      )}
      <div
        style={{
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: isClub ? "var(--gold)" : isMarket ? "var(--ink-light)" : "var(--ink-mid)",
          fontFamily: "var(--font-body)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: isClub ? "24px" : "18px",
          fontWeight: 500,
          color: isMarket
            ? "var(--market-rate)"
            : isClub
            ? "var(--our-rate)"
            : "var(--ink)",
          textDecoration: isMarket ? "line-through" : "none",
          lineHeight: 1.1,
        }}
      >
        {formatINR(price)}
      </div>
      <div style={{ fontSize: "9px", color: "var(--ink-light)" }}>per night</div>
      {savingsVsMarket != null && savingsVsMarket > 0 && (
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: isClub ? "var(--success)" : "var(--ink-mid)",
            fontFamily: "var(--font-body)",
          }}
        >
          Club Rate
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single comparison card
// ---------------------------------------------------------------------------
function ComparisonCard({
  hotel,
  index,
}: {
  hotel: (typeof COMPARISON_HOTELS)[number];
  index: number;
}) {
  const marketSave = 0;
  const standardSave = Math.round(
    ((hotel.marketRate - hotel.voyagrRate) / hotel.marketRate) * 100
  );
  const clubSave = Math.round(
    ((hotel.marketRate - hotel.clubRate) / hotel.marketRate) * 100
  );
  void marketSave;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="card-hover"
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        overflow: "hidden",
      }}
    >
      {/* Top: Image + hotel info */}
      <div style={{ display: "flex" }}>
        <div
          style={{
            width: "200px",
            minHeight: "220px",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <img
            className="card-img"
            src={hotel.img}
            alt={hotel.hotel}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              filter: "saturate(0.88)",
            }}
            loading="lazy"
          />
        </div>

        <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
          {/* Hotel info */}
          <div style={{ marginBottom: "16px" }}>
            <div
              style={{
                color: "var(--gold)",
                fontSize: "10px",
                letterSpacing: "2px",
                marginBottom: "4px",
              }}
            >
              {"★".repeat(hotel.stars)}
            </div>
            <div
              className="type-heading-3"
              style={{ color: "var(--ink)", marginBottom: "2px" }}
            >
              {hotel.hotel}
            </div>
            <div style={{ fontSize: "12px", color: "var(--ink-light)" }}>
              {hotel.city}
            </div>
          </div>

          {/* Three-tier rate comparison */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
              marginBottom: "14px",
            }}
          >
            <RateTier
              label="Market Rate"
              price={hotel.marketRate}
              isMarket
            />
            <RateTier
              label="Voyagr Rate"
              price={hotel.voyagrRate}
              savingsVsMarket={standardSave}
            />
            <RateTier
              label="Voyager Club"
              price={hotel.clubRate}
              isClub
              savingsVsMarket={clubSave}
            />
          </div>

          {/* Club perks */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--gold)",
              }}
            >
              Club perks:
            </span>
            {hotel.perks.map((perk) => (
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
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--success)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom savings banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(184, 149, 90, 0.06), rgba(74, 124, 89, 0.06))",
          borderTop: "1px solid var(--cream-border)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
          <span style={{ fontSize: "11px", color: "var(--ink-mid)" }}>
            Voyager Club members access preferred rates{" "}
            <strong style={{ color: "var(--success)" }}>
              negotiated directly
            </strong>
            {" "}with this property
          </span>
        </div>
        <span
          className="card-arrow"
          style={{
            fontSize: "11px",
            color: "var(--gold)",
            fontWeight: 500,
            letterSpacing: "0.04em",
            cursor: "pointer",
          }}
        >
          Join the Club &rarr;
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Stat pill
// ---------------------------------------------------------------------------
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        padding: "16px 24px",
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "24px",
          fontWeight: 500,
          color: "var(--gold)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-light)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export — VoyagerClubComparison section
// ---------------------------------------------------------------------------
export default function VoyagerClubComparison() {
  return (
    <section
      className="section-voyager-club"
      style={{
        padding: "80px 60px",
        background: "var(--cream)",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: "48px" }}
        >
          <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
            Voyager Club
          </div>
          <h2
            className="type-display-2"
            style={{ color: "var(--ink)", marginBottom: "16px" }}
          >
            Market rate vs{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
              Voyager Club
            </em>{" "}
            rate
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--ink-light)",
              maxWidth: "600px",
              lineHeight: 1.7,
            }}
          >
            Voyager Club members unlock exclusive wholesale rates negotiated directly
            with premium hotels — plus complimentary perks on every stay.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, auto)",
            gap: "12px",
            justifyContent: "start",
            marginBottom: "40px",
          }}
        >
          <StatPill value="Direct" label="Hotel partnerships" />
          <StatPill value="1,500+" label="Partner hotels" />
          <StatPill value="120+" label="Destinations" />
          <StatPill value="Free" label="Membership" />
        </motion.div>

        {/* Comparison cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {COMPARISON_HOTELS.map((hotel, i) => (
            <ComparisonCard key={hotel.hotel} hotel={hotel} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            marginTop: "48px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              padding: "32px 48px",
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span
                className="type-heading-3"
                style={{ color: "var(--ink)" }}
              >
                Join Voyager Club
              </span>
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "var(--ink-light)",
                maxWidth: "400px",
                lineHeight: 1.6,
              }}
            >
              Free membership. No annual fees. Access preferred wholesale rates
              and exclusive perks at 1,500+ hotels worldwide.
            </p>
            <button
              className="btn-primary"
              style={{ marginTop: "4px" }}
            >
              Get Club Access
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
