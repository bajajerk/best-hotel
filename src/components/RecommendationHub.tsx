"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Hotel data
// ---------------------------------------------------------------------------
interface RecommendationHotel {
  id: number;
  name: string;
  city: string;
  image: string;
  perks: string[];
  rating: number;
  categoryTags: string[];
}

const hotels: RecommendationHotel[] = [
  {
    id: 1,
    name: "The Ritz-Carlton Bali",
    city: "Bali",
    image: "/hotels/ritz-bali.jpg",
    perks: [
      "Oceanfront room upgrade",
      "Late checkout",
      "Welcome drinks",
      "Spa credit",
    ],
    rating: 5,
    categoryTags: ["beach", "family", "deal-high", "season-summer"],
  },
  {
    id: 2,
    name: "Taj Palace New Delhi",
    city: "New Delhi",
    image: "/hotels/taj-delhi.jpg",
    perks: ["Heritage suite upgrade", "Breakfast included", "Airport transfer"],
    rating: 5,
    categoryTags: ["city", "india", "anniversary"],
  },
  {
    id: 3,
    name: "Aman Tokyo",
    city: "Tokyo",
    image: "/hotels/aman-tokyo.jpg",
    perks: ["Room upgrade", "Late checkout", "Onsen access"],
    rating: 5,
    categoryTags: ["city", "wellness", "hidden"],
  },
  {
    id: 4,
    name: "Mandarin Oriental Bangkok",
    city: "Bangkok",
    image: "/hotels/mandarin-bangkok.jpg",
    perks: ["River view upgrade", "Spa credit", "Romantic dinner"],
    rating: 5,
    categoryTags: ["city", "romantic", "use-honeymoon"],
  },
  {
    id: 5,
    name: "The Oberoi Mumbai",
    city: "Mumbai",
    image: "/hotels/oberoi-mumbai.jpg",
    perks: ["Sea view upgrade", "Breakfast included"],
    rating: 5,
    categoryTags: ["city", "india"],
  },
  {
    id: 6,
    name: "Park Hyatt Tokyo",
    city: "Tokyo",
    image: "/hotels/park-hyatt-tokyo.jpg",
    perks: ["Skyline view", "Late checkout"],
    rating: 5,
    categoryTags: ["city", "usa"],
  },
];

// ---------------------------------------------------------------------------
// Season detection
// ---------------------------------------------------------------------------
function getCurrentSeason(): string {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function getSeasonLabel(season: string): string {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
interface Tab {
  key: string;
  label: string;
  filter: (hotel: RecommendationHotel) => boolean;
}

const currentSeason = getCurrentSeason();

const TABS: Tab[] = [
  {
    key: "deals",
    label: "Best Deals",
    filter: (h) => h.categoryTags.includes("deal-high"),
  },
  {
    key: "seasons",
    label: `Best for Seasons`,
    filter: (h) => h.categoryTags.includes(`season-${currentSeason}`),
  },
  {
    key: "beach",
    label: "Beachfront Bliss",
    filter: (h) => h.categoryTags.includes("beach"),
  },
  {
    key: "city",
    label: "City Skyline Icons",
    filter: (h) => h.categoryTags.includes("city"),
  },
  {
    key: "hidden",
    label: "Hidden Gems",
    filter: (h) => h.categoryTags.includes("hidden"),
  },
  {
    key: "sustainable",
    label: "Sustainable Luxury",
    filter: (h) => h.categoryTags.includes("sustainable"),
  },
  {
    key: "most-loved",
    label: "Most Loved",
    filter: () => true,
  },
  {
    key: "wellness",
    label: "Wellness & Spa",
    filter: (h) => h.categoryTags.includes("wellness"),
  },
  {
    key: "romantic",
    label: "Romantic Getaways",
    filter: (h) => h.categoryTags.includes("romantic"),
  },
  {
    key: "family",
    label: "Family Adventures",
    filter: (h) => h.categoryTags.includes("family"),
  },
  {
    key: "new",
    label: "New Arrivals",
    filter: () => true,
  },
  {
    key: "trending",
    label: "Trending Now",
    filter: () => true,
  },
  {
    key: "india",
    label: "Best in India",
    filter: (h) => h.categoryTags.includes("india"),
  },
];

// ---------------------------------------------------------------------------
// Fallback image
// ---------------------------------------------------------------------------
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function RecommendationHub() {
  const [activeTab, setActiveTab] = useState("seasons");
  const tabsRef = useRef<HTMLDivElement>(null);

  const filteredHotels = useMemo(() => {
    const tab = TABS.find((t) => t.key === activeTab);
    if (!tab) return hotels;
    return hotels.filter(tab.filter);
  }, [activeTab]);

  // Scroll active tab into view within the pill bar
  const scrollTabIntoView = useCallback((key: string) => {
    const container = tabsRef.current;
    if (!container) return;
    const btn = container.querySelector(`[data-tab="${key}"]`) as HTMLElement;
    if (!btn) return;
    const left = btn.offsetLeft - container.offsetWidth / 2 + btn.offsetWidth / 2;
    container.scrollTo({ left, behavior: "smooth" });
  }, []);

  const handleTabClick = useCallback(
    (key: string) => {
      setActiveTab(key);
      scrollTabIntoView(key);
    },
    [scrollTabIntoView]
  );

  // On mount, scroll "seasons" tab into view
  useEffect(() => {
    scrollTabIntoView("seasons");
  }, [scrollTabIntoView]);

  const seasonLabel = getSeasonLabel(currentSeason);

  return (
    <section
      className="section-pad"
      style={{ background: "var(--white)" }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: "center", marginBottom: "40px" }}
        >
          <h2
            className="type-display-2"
            style={{ color: "var(--ink)", marginBottom: "12px" }}
          >
            Find Your Perfect Stay —{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
              Curated for You
            </em>
          </h2>
          <p
            className="type-body"
            style={{
              color: "var(--ink-light)",
              lineHeight: 1.7,
              maxWidth: "620px",
              margin: "0 auto",
            }}
          >
            1,500+ handpicked hotels &bull; Exclusive perks on every booking
            &bull; Free for members
          </p>
        </motion.div>

        {/* ── Pill tabs — horizontally scrollable ── */}
        <div
          ref={tabsRef}
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "16px",
            marginBottom: "36px",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
            msOverflowStyle: "none",
          }}
          className="recommendation-tabs"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const label =
              tab.key === "seasons"
                ? `Best for ${seasonLabel}`
                : tab.label;
            return (
              <button
                key={tab.key}
                data-tab={tab.key}
                onClick={() => handleTabClick(tab.key)}
                style={{
                  flexShrink: 0,
                  padding: "9px 22px",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.04em",
                  color: isActive ? "var(--white)" : "var(--ink-mid)",
                  background: isActive ? "var(--gold)" : "var(--cream)",
                  border: isActive
                    ? "1px solid var(--gold)"
                    : "1px solid var(--cream-border)",
                  borderRadius: "100px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  fontFamily: "var(--font-body)",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* ── Hotel grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
          >
            {filteredHotels.length > 0 ? (
              <div
                className="recommendation-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: "24px",
                }}
              >
                {filteredHotels.map((hotel, i) => (
                  <motion.div
                    key={hotel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <HotelRecommendationCard hotel={hotel} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  color: "var(--ink-light)",
                }}
              >
                <p style={{ fontSize: "14px", marginBottom: "8px" }}>
                  No hotels match this category yet.
                </p>
                <p style={{ fontSize: "12px", opacity: 0.7 }}>
                  New properties are added regularly — check back soon.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Hotel Card — matches existing homepage card aesthetic
// ---------------------------------------------------------------------------
function HotelRecommendationCard({ hotel }: { hotel: RecommendationHotel }) {
  const whatsappMessage = encodeURIComponent(
    `Hi, interested in ${hotel.name} in ${hotel.city}. Send Voyagr preferred rate + perks.`
  );
  const whatsappUrl = `https://wa.me/919876543210?text=${whatsappMessage}`;
  const conciergeMessage = encodeURIComponent(
    `Hi, I'd like to learn more about ${hotel.name} in ${hotel.city}. Can you help?`
  );
  const conciergeUrl = `https://wa.me/919876543210?text=${conciergeMessage}`;

  const displayPerks = hotel.perks.slice(0, 3);

  return (
    <div
      className="card-hover"
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
        <img
          className="card-img"
          src={hotel.image}
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
        {/* Preferred Rate badge */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "var(--gold)",
            color: "var(--white)",
            fontSize: "9px",
            fontWeight: 600,
            padding: "5px 12px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Preferred Rate
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: "18px 20px 22px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Stars */}
        <div
          style={{
            color: "var(--gold)",
            fontSize: "10px",
            letterSpacing: "2px",
            marginBottom: "6px",
          }}
        >
          {"★".repeat(hotel.rating)}
        </div>

        {/* Name */}
        <h3
          className="type-heading-3"
          style={{
            color: "var(--ink)",
            marginBottom: "4px",
            fontSize: "16px",
          }}
        >
          {hotel.name}
        </h3>

        {/* City */}
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

        {/* Perks */}
        <div style={{ marginBottom: "14px" }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--emerald, #10B981)",
              marginBottom: "6px",
            }}
          >
            Members enjoy:
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "3px" }}
          >
            {displayPerks.map((perk) => (
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

        {/* Spacer to push buttons to bottom */}
        <div style={{ flex: 1 }} />

        {/* Buttons */}
        <div
          style={{
            borderTop: "1px solid var(--cream-border)",
            paddingTop: "14px",
            display: "flex",
            gap: "8px",
          }}
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "9px 12px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "#fff",
              background: "var(--emerald, #10B981)",
              border: "none",
              cursor: "pointer",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--emerald-dark, #059669)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--emerald, #10B981)";
            }}
          >
            See Perks &amp; Rates
          </a>
          <a
            href={conciergeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "9px 12px",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "var(--ink-mid)",
              background: "none",
              border: "1px solid var(--cream-border)",
              cursor: "pointer",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "var(--gold)";
              el.style.color = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "var(--cream-border)";
              el.style.color = "var(--ink-mid)";
            }}
          >
            Ask Concierge
          </a>
        </div>
      </div>
    </div>
  );
}
