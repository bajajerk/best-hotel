"use client";

import { useMemo, useState } from "react";

type StarValue = "Any" | "3+" | "4+" | "5";
type SortValue = "Recommended" | "Price: Low" | "Price: High" | "Rating";

const STAR_OPTIONS: StarValue[] = ["Any", "3+", "4+", "5"];
const SORT_OPTIONS: SortValue[] = [
  "Recommended",
  "Price: Low",
  "Price: High",
  "Rating",
];
const PERK_OPTIONS = [
  "Free cancellation",
  "Breakfast",
  "Spa credit",
  "Early check-in",
  "Late checkout",
  "Room upgrade",
];

const FONT_DISPLAY = "'Cormorant Garamond', 'Cormorant', Georgia, serif";
const FONT_LABEL =
  "'Montserrat', system-ui, -apple-system, 'Helvetica Neue', sans-serif";

type Hotel = {
  id: string;
  name: string;
  location: string;
  stars: 3 | 4 | 5;
  rating: number;
  pricePerNight: number;
  freeCancellation: boolean;
  breakfast: boolean;
  perks: string[];
  image: string;
};

const HOTELS: Hotel[] = [
  {
    id: "h1",
    name: "The Taj Mahal Palace",
    location: "Mumbai, Colaba",
    stars: 5,
    rating: 4.8,
    pricePerNight: 28400,
    freeCancellation: true,
    breakfast: true,
    perks: ["Breakfast", "Free cancellation", "Room upgrade"],
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "h2",
    name: "Soho House Mumbai",
    location: "Mumbai, Juhu",
    stars: 5,
    rating: 4.7,
    pricePerNight: 24900,
    freeCancellation: true,
    breakfast: false,
    perks: ["Free cancellation", "Late checkout"],
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "h3",
    name: "The St. Regis Mumbai",
    location: "Mumbai, Lower Parel",
    stars: 5,
    rating: 4.6,
    pricePerNight: 19800,
    freeCancellation: true,
    breakfast: true,
    perks: ["Breakfast", "Free cancellation", "Spa credit"],
    image:
      "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "h4",
    name: "JW Marriott Juhu",
    location: "Mumbai, Juhu Beach",
    stars: 5,
    rating: 4.5,
    pricePerNight: 16200,
    freeCancellation: false,
    breakfast: true,
    perks: ["Breakfast", "Early check-in"],
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "h5",
    name: "Trident Bandra Kurla",
    location: "Mumbai, BKC",
    stars: 4,
    rating: 4.4,
    pricePerNight: 11600,
    freeCancellation: true,
    breakfast: true,
    perks: ["Breakfast", "Free cancellation"],
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "h6",
    name: "Novotel Juhu Beach",
    location: "Mumbai, Juhu",
    stars: 4,
    rating: 4.2,
    pricePerNight: 9400,
    freeCancellation: true,
    breakfast: false,
    perks: ["Free cancellation"],
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "h7",
    name: "Hyatt Regency Mumbai",
    location: "Mumbai, Andheri East",
    stars: 4,
    rating: 4.3,
    pricePerNight: 10800,
    freeCancellation: false,
    breakfast: true,
    perks: ["Breakfast", "Late checkout"],
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "h8",
    name: "The Resort Madh Marve",
    location: "Mumbai, Madh Island",
    stars: 3,
    rating: 4.0,
    pricePerNight: 6500,
    freeCancellation: true,
    breakfast: true,
    perks: ["Breakfast", "Free cancellation"],
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80",
  },
];

const TOTAL_HOTELS = 373;

function starsToNumber(s: StarValue): number {
  if (s === "5") return 5;
  if (s === "4+") return 4;
  if (s === "3+") return 3;
  return 0;
}

function formatPrice(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

export default function VoyagrFilterResults() {
  // Committed (real) filter state
  const [stars, setStars] = useState<StarValue>("Any");
  const [perks, setPerks] = useState<string[]>([]);
  const [sort, setSort] = useState<SortValue>("Recommended");

  // Sheet temp state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempStars, setTempStars] = useState<StarValue>("Any");
  const [tempPerks, setTempPerks] = useState<string[]>([]);
  const [tempSort, setTempSort] = useState<SortValue>("Recommended");

  const activeFilterCount = (stars !== "Any" ? 1 : 0) + perks.length;

  function openSheet() {
    setTempStars(stars);
    setTempPerks(perks);
    setTempSort(sort);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
  }

  function applySheet() {
    setStars(tempStars);
    setPerks(tempPerks);
    setSort(tempSort);
    setSheetOpen(false);
  }

  function clearAllTemp() {
    setTempStars("Any");
    setTempPerks([]);
    setTempSort("Recommended");
  }

  function toggleTempPerk(p: string) {
    setTempPerks((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function removePerk(p: string) {
    setPerks((prev) => prev.filter((x) => x !== p));
  }

  function cycleSort() {
    const idx = SORT_OPTIONS.indexOf(sort);
    setSort(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length]);
  }

  // Apply filters to hotel list (purely cosmetic — list stays in sample range)
  const visibleHotels = useMemo(() => {
    let list = [...HOTELS];
    const minStars = starsToNumber(stars);
    if (minStars > 0) {
      if (stars === "5") list = list.filter((h) => h.stars === 5);
      else list = list.filter((h) => h.stars >= minStars);
    }
    if (perks.length > 0) {
      list = list.filter((h) => perks.every((p) => h.perks.includes(p)));
    }
    switch (sort) {
      case "Price: Low":
        list.sort((a, b) => a.pricePerNight - b.pricePerNight);
        break;
      case "Price: High":
        list.sort((a, b) => b.pricePerNight - a.pricePerNight);
        break;
      case "Rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }
    return list;
  }, [stars, perks, sort]);

  const filtersActive = activeFilterCount > 0;

  return (
    <div
      style={{
        background: "#0a0a0a",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: FONT_LABEL,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400;1,500&family=Montserrat:wght@400;500;600;700&display=swap');
        .vf-scroll-x::-webkit-scrollbar { display: none; }
        .vf-sheet-scroll::-webkit-scrollbar { width: 0; }
        @keyframes vf-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes vf-slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      <div
        style={{
          maxWidth: 430,
          margin: "0 auto",
          paddingBottom: 60,
          position: "relative",
        }}
      >
        {/* Top nav */}
        <div
          style={{
            padding: "18px 20px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            aria-label="Back"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ←
          </button>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              letterSpacing: 1,
            }}
          >
            <span
              style={{
                fontFamily: FONT_LABEL,
                fontWeight: 700,
                color: "#fff",
                fontSize: 14,
                letterSpacing: 2,
              }}
            >
              VOYAGR
            </span>
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontStyle: "italic",
                color: "#c9a96e",
                fontSize: 16,
                fontWeight: 400,
              }}
            >
              Club
            </span>
          </div>
          <div style={{ width: 36 }} />
        </div>

        {/* Search bar — sticky */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "#0a0a0a",
            padding: "8px 20px 14px",
          }}
        >
          <button
            style={{
              width: "100%",
              background: "#c9a96e",
              borderRadius: 100,
              padding: "14px 22px",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontFamily: FONT_LABEL,
                fontSize: 13,
                fontWeight: 500,
                color: "#000",
              }}
            >
              Mumbai · 2 guests · Jun 12–15
            </span>
            <span style={{ color: "#000", fontSize: 16, fontWeight: 600 }}>
              →
            </span>
          </button>
        </div>

        {/* Results meta row */}
        <div
          style={{
            padding: "18px 20px 12px",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 22,
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1.1,
            }}
          >
            <span style={{ fontStyle: "italic", color: "#c9a96e" }}>
              {visibleHotels.length === HOTELS.length
                ? TOTAL_HOTELS
                : visibleHotels.length}
            </span>{" "}
            <span style={{ fontStyle: "normal" }}>hotels found</span>
          </div>
          <div
            style={{
              fontFamily: FONT_LABEL,
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              whiteSpace: "nowrap",
            }}
          >
            showing {Math.min(20, visibleHotels.length)} of {TOTAL_HOTELS}
          </div>
        </div>

        {/* Filter bar — 3 rows */}
        <div
          style={{
            padding: "0 20px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Row 1: Sort + Filters */}
          <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
            <button
              onClick={cycleSort}
              style={{
                flex: 1,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 100,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                fontFamily: FONT_LABEL,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                ↕ {sort === "Recommended" ? "Recommended" : sort}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                ▾
              </span>
            </button>

            <button
              onClick={openSheet}
              style={{
                flexShrink: 0,
                border: filtersActive
                  ? "1px solid #c9a96e"
                  : "1px solid rgba(255,255,255,0.12)",
                background: filtersActive
                  ? "rgba(201,169,110,0.08)"
                  : "rgba(255,255,255,0.04)",
                borderRadius: 100,
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                fontFamily: FONT_LABEL,
                color: filtersActive ? "#c9a96e" : "rgba(255,255,255,0.7)",
                position: "relative",
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Filters
              </span>
              {activeFilterCount > 0 && (
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#c9a96e",
                    color: "#0a0a0a",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: FONT_LABEL,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Row 2: Star rating pills */}
          <div
            className="vf-scroll-x"
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            <span
              style={{
                fontFamily: FONT_LABEL,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: 2,
                color: "rgba(255,255,255,0.3)",
                flexShrink: 0,
                textTransform: "uppercase",
              }}
            >
              STARS
            </span>
            {STAR_OPTIONS.map((opt) => {
              const active = stars === opt;
              const label =
                opt === "Any" ? "Any" : opt === "5" ? "★ 5" : `★ ${opt}`;
              return (
                <button
                  key={opt}
                  onClick={() => setStars(opt)}
                  style={{
                    flexShrink: 0,
                    padding: "6px 14px",
                    borderRadius: 100,
                    border: active
                      ? "1px solid #c9a96e"
                      : "1px solid rgba(255,255,255,0.1)",
                    background: active
                      ? "#c9a96e"
                      : "rgba(255,255,255,0.03)",
                    color: active ? "#0a0a0a" : "rgba(255,255,255,0.55)",
                    fontFamily: FONT_LABEL,
                    fontSize: 10,
                    fontWeight: active ? 600 : 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Row 3: Active perk chips */}
          {perks.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {perks.map((p) => (
                <span
                  key={p}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 8px 6px 12px",
                    background: "rgba(201,169,110,0.1)",
                    border: "1px solid rgba(201,169,110,0.3)",
                    borderRadius: 100,
                    color: "#c9a96e",
                    fontFamily: FONT_LABEL,
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                >
                  {p}
                  <button
                    onClick={() => removePerk(p)}
                    aria-label={`Remove ${p} filter`}
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(201,169,110,0.18)",
                      color: "#c9a96e",
                      fontSize: 11,
                      lineHeight: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Hotel result cards */}
        <div>
          {visibleHotels.map((h) => (
            <HotelResultCard key={h.id} hotel={h} />
          ))}
          {visibleHotels.length === 0 && (
            <div
              style={{
                margin: "40px 20px",
                padding: 24,
                textAlign: "center",
                color: "rgba(255,255,255,0.45)",
                fontSize: 12,
                fontFamily: FONT_LABEL,
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 18,
              }}
            >
              No stays match these filters. Try clearing one to see more.
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet */}
      {sheetOpen && (
        <FilterSheet
          tempStars={tempStars}
          tempPerks={tempPerks}
          tempSort={tempSort}
          onChangeStars={setTempStars}
          onTogglePerk={toggleTempPerk}
          onChangeSort={setTempSort}
          onClear={clearAllTemp}
          onClose={closeSheet}
          onApply={applySheet}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hotel result card
// ---------------------------------------------------------------------------
function HotelResultCard({ hotel }: { hotel: Hotel }) {
  return (
    <article
      style={{
        margin: "16px 20px 0",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#111",
      }}
    >
      <div style={{ position: "relative", height: 210 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hotel.image}
          alt={hotel.name}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            padding: "5px 12px",
            background: "rgba(201,169,110,0.92)",
            color: "#0a0a0a",
            fontFamily: FONT_LABEL,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            borderRadius: 100,
          }}
        >
          Member · 20% off
        </span>
      </div>

      <div style={{ padding: "16px 16px 18px" }}>
        <div
          style={{
            color: "#c9a96e",
            fontSize: 11,
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          {"★".repeat(hotel.stars)}
        </div>
        <h3
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 24,
            fontStyle: "italic",
            fontWeight: 300,
            color: "#fff",
            margin: 0,
            lineHeight: 1.15,
          }}
        >
          {hotel.name}
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            marginTop: 6,
            color: "rgba(255,255,255,0.4)",
            fontFamily: FONT_LABEL,
            fontSize: 10,
          }}
        >
          <span aria-hidden>📍</span>
          <span>{hotel.location}</span>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <MetaPill>{hotel.rating.toFixed(1)} ★</MetaPill>
          {hotel.freeCancellation && <MetaPill>Free cancellation</MetaPill>}
          {hotel.breakfast && <MetaPill>Breakfast</MetaPill>}
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 22,
                color: "#fff",
                lineHeight: 1,
                fontWeight: 300,
              }}
            >
              {formatPrice(hotel.pricePerNight)}
            </span>
            <span
              style={{
                fontFamily: FONT_LABEL,
                fontSize: 9,
                color: "rgba(255,255,255,0.35)",
              }}
            >
              /night
            </span>
          </div>
          <button
            style={{
              border: "1px solid #c9a96e",
              color: "#c9a96e",
              fontFamily: FONT_LABEL,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
              borderRadius: 100,
              padding: "9px 18px",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            View Stay
          </button>
        </div>
      </div>
    </article>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: "4px 10px",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 100,
        color: "rgba(255,255,255,0.55)",
        fontFamily: FONT_LABEL,
        fontSize: 9,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Filter bottom sheet
// ---------------------------------------------------------------------------
function FilterSheet({
  tempStars,
  tempPerks,
  tempSort,
  onChangeStars,
  onTogglePerk,
  onChangeSort,
  onClear,
  onClose,
  onApply,
}: {
  tempStars: StarValue;
  tempPerks: string[];
  tempSort: SortValue;
  onChangeStars: (v: StarValue) => void;
  onTogglePerk: (p: string) => void;
  onChangeSort: (v: SortValue) => void;
  onClear: () => void;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Filter stays"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "vf-fade-in 0.25s ease",
          zIndex: 50,
        }}
      />
      <div
        className="vf-sheet-scroll"
        style={{
          position: "fixed",
          left: "50%",
          bottom: 0,
          transform: "translateX(-50%)",
          width: "100%",
          maxWidth: 430,
          background: "#141414",
          borderRadius: "24px 24px 0 0",
          maxHeight: "85vh",
          overflowY: "auto",
          zIndex: 51,
          animation:
            "vf-slide-up 0.4s cubic-bezier(0.25,0.46,0.45,0.94) both",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: 36,
            height: 4,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 2,
            margin: "14px auto 0",
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: FONT_DISPLAY,
              fontSize: 24,
              fontWeight: 300,
              color: "#fff",
            }}
          >
            Filter stays
          </div>
          <button
            onClick={onClear}
            style={{
              background: "none",
              border: "none",
              color: "#c9a96e",
              fontFamily: FONT_LABEL,
              fontSize: 10,
              fontWeight: 500,
              cursor: "pointer",
              padding: 0,
            }}
          >
            Clear all
          </button>
        </div>

        {/* Section: Star rating */}
        <SheetSection label="Star rating">
          <PillGrid>
            {STAR_OPTIONS.map((opt) => {
              const active = tempStars === opt;
              const label =
                opt === "Any" ? "Any" : opt === "5" ? "★ 5" : `★ ${opt}`;
              return (
                <SheetPill
                  key={opt}
                  active={active}
                  onClick={() => onChangeStars(opt)}
                >
                  {label}
                </SheetPill>
              );
            })}
          </PillGrid>
        </SheetSection>

        <SectionDivider />

        {/* Section: Perks & amenities */}
        <SheetSection label="Perks & amenities">
          <PillGrid>
            {PERK_OPTIONS.map((p) => {
              const active = tempPerks.includes(p);
              return (
                <SheetPill
                  key={p}
                  active={active}
                  onClick={() => onTogglePerk(p)}
                >
                  {p}
                </SheetPill>
              );
            })}
          </PillGrid>
        </SheetSection>

        <SectionDivider />

        {/* Section: Sort by */}
        <SheetSection label="Sort by">
          <PillGrid>
            {SORT_OPTIONS.map((opt) => {
              const active = tempSort === opt;
              return (
                <SheetPill
                  key={opt}
                  active={active}
                  onClick={() => onChangeSort(opt)}
                >
                  {opt}
                </SheetPill>
              );
            })}
          </PillGrid>
        </SheetSection>

        {/* Apply */}
        <button
          onClick={onApply}
          style={{
            display: "block",
            margin: "24px 22px 28px",
            width: "calc(100% - 44px)",
            background: "#c9a96e",
            color: "#0a0a0a",
            fontFamily: FONT_LABEL,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            borderRadius: 100,
            padding: 15,
            border: "none",
            cursor: "pointer",
          }}
        >
          Show Results
        </button>
      </div>
    </div>
  );
}

function SheetSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: "20px 22px 4px" }}>
      <div
        style={{
          fontFamily: FONT_LABEL,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.35)",
          marginBottom: 14,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function SectionDivider() {
  return (
    <div
      style={{
        height: 1,
        background: "rgba(255,255,255,0.06)",
        margin: "10px 22px 0",
      }}
    />
  );
}

function PillGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
  );
}

function SheetPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "9px 18px",
        borderRadius: 100,
        border: active ? "1px solid #c9a96e" : "1px solid rgba(255,255,255,0.12)",
        background: active ? "rgba(201,169,110,0.12)" : "rgba(255,255,255,0.03)",
        color: active ? "#c9a96e" : "rgba(255,255,255,0.6)",
        fontFamily: FONT_LABEL,
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </button>
  );
}
