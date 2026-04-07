"use client";

import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Data — curated hotel experiences with member perks
// ---------------------------------------------------------------------------
const FEATURED_EXPERIENCES = [
  {
    hotel: "The Ritz-Carlton",
    city: "Bali, Indonesia",
    stars: 5,
    img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80",
    description:
      "Oceanfront luxury where every detail creates lasting memories — from clifftop villas to world-class dining.",
    perks: ["Preferred room upgrade", "Late checkout", "Welcome drinks"],
  },
  {
    hotel: "Mandarin Oriental",
    city: "Bangkok, Thailand",
    stars: 5,
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    description:
      "Riverside elegance in the heart of Bangkok — where Thai hospitality reaches its most refined expression.",
    perks: ["Spa credit", "Early check-in", "Breakfast included"],
  },
  {
    hotel: "Taj Palace",
    city: "New Delhi, India",
    stars: 5,
    img: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
    description:
      "An icon of Indian luxury where heritage meets contemporary grandeur in the diplomatic heart of Delhi.",
    perks: ["Club lounge access", "Airport transfer", "Room upgrade"],
  },
  {
    hotel: "Aman Tokyo",
    city: "Tokyo, Japan",
    stars: 5,
    img: "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=80",
    description:
      "Minimalist serenity above the Otemachi skyline — Japanese precision meets effortless luxury.",
    perks: ["Onsen access", "Late checkout", "Mini-bar included"],
  },
];

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
// Single experience card
// ---------------------------------------------------------------------------
function ExperienceCard({
  hotel,
  index,
}: {
  hotel: (typeof FEATURED_EXPERIENCES)[number];
  index: number;
}) {
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

        <div
          style={{
            flex: 1,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Hotel info */}
          <div style={{ marginBottom: "12px" }}>
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

          {/* Description */}
          <p
            style={{
              fontSize: "13px",
              color: "var(--ink-mid)",
              lineHeight: 1.7,
              marginBottom: "16px",
              fontStyle: "italic",
            }}
          >
            {hotel.description}
          </p>

          {/* Club perks */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "9px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--emerald, #10B981)",
              }}
            >
              Voyagr Club members enjoy:
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {hotel.perks.map((perk) => (
                <span
                  key={perk}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "11px",
                    color: "var(--ink-mid)",
                  }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--emerald, #10B981)"
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
      </div>

      {/* Bottom banner */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(184, 149, 90, 0.05))",
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
            Voyagr Club members enjoy{" "}
            <strong style={{ color: "var(--emerald, #10B981)" }}>
              privileged access
            </strong>{" "}
            with exclusive perks included
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
          Join Free &rarr;
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main export — VoyagerClubComparison section (now experience-focused)
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
            Voyagr Club
          </div>
          <h2
            className="type-display-2"
            style={{ color: "var(--ink)", marginBottom: "16px" }}
          >
            Privileged access to{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
              extraordinary stays
            </em>
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--ink-light)",
              maxWidth: "600px",
              lineHeight: 1.7,
            }}
          >
            Voyagr Club members enjoy elevated access to handpicked luxury
            hotels — plus complimentary perks on every stay, from room upgrades
            to spa credits and beyond.
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

        {/* Experience cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {FEATURED_EXPERIENCES.map((hotel, i) => (
            <ExperienceCard key={hotel.hotel} hotel={hotel} index={i} />
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
              <span className="type-heading-3" style={{ color: "var(--ink)" }}>
                Join Voyagr Club
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
              Free membership. No annual fees. Enjoy preferred access and
              exclusive perks at 1,500+ hotels worldwide.
            </p>
            <a
              href="https://wa.me/919876543210?text=Hi%2C%20I%27d%20like%20to%20join%20Voyagr%20Club"
              className="btn-emerald"
              style={{
                marginTop: "4px",
                textDecoration: "none",
                padding: "14px 36px",
              }}
            >
              Join Free &rarr; Begin Your Journey
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
