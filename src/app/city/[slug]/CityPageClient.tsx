"use client";

// =============================================================================
//  /city/[slug] — Voyagr Club city page (DARK LUXE)
//
//  Visual language mirrors the homepage (see HomePageClient.tsx). The whole
//  page is rendered inside a `<div className="luxe">` wrapper, which remaps the
//  legacy `var(--cream)` / `var(--ink)` / `var(--gold)` / `var(--white)` design
//  tokens to the dark-luxe palette via `globals.css` (.luxe scope).
//
//  Layout (top → bottom):
//    1. Hero with city image
//    2. Sticky search summary bar
//    3. "Why <city>" editorial guide (admin-curated, optional)
//    4. Editor's-pick carousel (curatedPicks, derived from curated hotels)
//    5. <HotelGrid> — the canonical listing of ALL hotels in this city
//       (paginated /api/hotels/search results; filter/sort UI lives there).
//    6. Concierge CTA strip
//
//  The legacy on-page filter UI (price/star/sort popovers + bottom sheet)
//  was removed once HotelGrid became the source of truth for the listing.
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  fetchCityCurations,
  fetchBatchRates,
  fetchCityGuide,
  defaultBookingDates,
  CuratedHotel,
} from "@/lib/api";
import type { BatchRatesResponse, CityGuide } from "@/lib/api";
import { hotelUrl } from "@/lib/urls";
import { rankHotels } from "@/lib/ranking";
import { useBooking } from "@/context/BookingContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackCityViewed } from "@/lib/analytics";
import DateBar from "@/components/DateBar";
import GuestRoomPicker from "@/components/GuestRoomPicker";
import HotelResultsView from "@/components/HotelResultsView";
import { CITY_IMAGES, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import { conciergeWhatsappLink } from "@/lib/concierge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Category = "singles" | "couples" | "families";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function slugToName(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDateLabel(iso: string, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function safeImg(u: string | null | undefined): string {
  if (!u || !u.trim()) return FALLBACK_CITY_IMAGE;
  if (u.startsWith("http://")) return u.replace("http://", "https://");
  return u;
}

const CITY_FALLBACK_GRADIENT =
  "linear-gradient(135deg, rgba(200,170,118,0.32) 0%, rgba(20,18,15,0.92) 100%)";

// ---------------------------------------------------------------------------
// Search Summary Bar — sticky, dark luxe glass
// ---------------------------------------------------------------------------
function SearchSummaryBar({
  destination,
  onOpen,
  onBack,
}: {
  destination: string;
  onOpen: () => void;
  onBack: () => void;
}) {
  const { checkIn, checkOut, rooms, totalGuests } = useBooking();

  const datesLabel =
    checkIn && checkOut
      ? `${formatDateLabel(checkIn, "")} – ${formatDateLabel(checkOut, "")}`
      : "Add dates";
  const guestsLabel = `${rooms.length} Room${rooms.length > 1 ? "s" : ""}, ${totalGuests} Guest${totalGuests !== 1 ? "s" : ""}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--luxe-hairline-strong)",
        borderRadius: 14,
        padding: "10px 14px",
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--luxe-champagne-line)";
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor =
          "var(--luxe-hairline-strong)";
        (e.currentTarget as HTMLDivElement).style.background =
          "rgba(255,255,255,0.04)";
      }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onBack(); }}
        aria-label="Go back"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 10,
          border: "none",
          background: "transparent",
          color: "var(--luxe-soft-white)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8L10 13" />
        </svg>
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--luxe-soft-white)",
            fontFamily: "var(--font-body)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {destination}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--luxe-soft-white-50)",
            fontFamily: "var(--font-body)",
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {datesLabel} · {guestsLabel}
        </div>
      </div>

      <span
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 10,
          color: "var(--luxe-champagne)",
          flexShrink: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search Edit Modal — bottom sheet (dark luxe)
// ---------------------------------------------------------------------------
function SearchEditModal({
  open,
  onClose,
  defaultDestination,
}: {
  open: boolean;
  onClose: () => void;
  defaultDestination: string;
}) {
  const router = useRouter();
  const [destInput, setDestInput] = useState(defaultDestination);

  useEffect(() => {
    if (open) setDestInput(defaultDestination);
  }, [open, defaultDestination]);

  if (!open) return null;

  const handleApply = () => {
    const trimmed = destInput.trim();
    const currentSlug = defaultDestination.toLowerCase();
    const newSlug = trimmed.toLowerCase().replace(/\s+/g, "-");
    if (trimmed && newSlug !== currentSlug) {
      router.push(`/city/${newSlug}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(8,7,6,0.7)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 1200,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <motion.div
          key="sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "tween", duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--luxe-black-2)",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            border: "1px solid var(--luxe-hairline)",
            borderBottom: "none",
            width: "100%",
            maxWidth: 560,
            maxHeight: "88vh",
            overflowY: "auto",
            padding: "20px 20px 28px",
            boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
            color: "var(--luxe-soft-white)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span className="luxe-tech">Edit search</span>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "var(--luxe-soft-white-70)",
                padding: 6,
                display: "inline-flex",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <label className="luxe-tech" style={{ display: "block", marginBottom: 6 }}>
            Destination
          </label>
          <input
            value={destInput}
            onChange={(e) => setDestInput(e.target.value)}
            placeholder="Where to?"
            style={{
              width: "100%",
              padding: "12px 14px",
              border: "1px solid var(--luxe-hairline-strong)",
              borderRadius: 10,
              fontSize: 14,
              fontFamily: "var(--font-body)",
              color: "var(--luxe-soft-white)",
              background: "rgba(255,255,255,0.04)",
              marginBottom: 16,
              outline: "none",
            }}
          />

          <div style={{ marginBottom: 12 }}>
            <span className="luxe-tech" style={{ display: "block", marginBottom: 6 }}>
              When
            </span>
            <DateBar variant="dark" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <span className="luxe-tech" style={{ display: "block", marginBottom: 6 }}>
              Guests
            </span>
            <GuestRoomPicker variant="dark" compact />
          </div>

          <button onClick={handleApply} className="luxe-btn-gold" style={{ width: "100%" }}>
            Apply
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Floating Map Button (dark luxe)
// ---------------------------------------------------------------------------
function FloatingMapButton({ destination }: { destination: string }) {
  const handleClick = () => {
    const q = encodeURIComponent(`${destination} hotels`);
    window.open(`https://www.google.com/maps/search/${q}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Open map view"
      style={{
        position: "fixed",
        bottom: 92,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--luxe-black-2)",
        color: "var(--luxe-soft-white)",
        border: "1px solid var(--luxe-champagne-line)",
        borderRadius: 20,
        padding: "10px 20px",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: "0.03em",
        fontFamily: "var(--font-body)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        cursor: "pointer",
        zIndex: 900,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        <line x1="8" y1="2" x2="8" y2="18" />
        <line x1="16" y1="6" x2="16" y2="22" />
      </svg>
      Map
    </button>
  );
}

// =============================================================================
//  Main Page
// =============================================================================
export default function CityPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { checkIn, checkOut, totalAdults, totalChildren } = useBooking();

  const [curations, setCurations] = useState<Record<Category, CuratedHotel[]>>({
    singles: [],
    couples: [],
    families: [],
  });
  const [cityName, setCityName] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [tagline, setTagline] = useState("");
  const [cityImage, setCityImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [batchRates, setBatchRates] = useState<BatchRatesResponse | null>(null);
  const [cityGuide, setCityGuide] = useState<CityGuide | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetchCityCurations(slug)
      .then((data) => {
        setCurations(data.curations as Record<Category, CuratedHotel[]>);
        setCityName(data.city.city_name);
        setCityCountry(data.city.country);
        setTagline(data.city.tagline);
        setCityImage(data.city.image_url || "");
        trackCityViewed({
          city_slug: slug,
          city_name: data.city.city_name,
          country: data.city.country,
          continent: data.city.continent || "",
        });
      })
      .catch((err) => {
        console.error("[Voyagr] Failed to load city curations:", err);
        setFetchError(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // City editorial guide (admin-curated, optional). Endpoint may not exist
  // yet — fetchCityGuide returns null on any failure so we hide the section.
  useEffect(() => {
    let cancelled = false;
    fetchCityGuide(slug).then((g) => {
      if (!cancelled) setCityGuide(g);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Batch-fetch live rates for all hotels on this city page. Unmatched IDs are
  // hidden from the list; matched IDs get their `rates_from` overridden.
  useEffect(() => {
    const all = [
      ...(curations.couples ?? []),
      ...(curations.singles ?? []),
      ...(curations.families ?? []),
    ];
    const ids = Array.from(new Set(all.map((h) => h.id))).filter(Boolean);
    if (ids.length === 0) return;

    const { checkin: defIn, checkout: defOut } = defaultBookingDates();
    const ci = checkIn || defIn;
    const co = checkOut || defOut;
    const adults = totalAdults > 0 ? totalAdults : 2;
    const children = totalChildren;

    let cancelled = false;
    fetchBatchRates(ids, ci, co, adults, children)
      .then((data) => {
        if (!cancelled) setBatchRates(data);
      })
      .catch((err) => {
        console.error("[Voyagr] Batch rates failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [curations, checkIn, checkOut, totalAdults, totalChildren]);

  const rawAllHotels = Array.from(
    new Map(
      [...curations.couples, ...curations.singles, ...curations.families].map(
        (h) => [h.id, h]
      )
    ).values()
  );

  // When live batch rates are available, hide unmatched hotels and override the
  // stale curated `rates_from`/currency with live `from_price` / mrp currency.
  const allHotels: CuratedHotel[] = batchRates
    ? rawAllHotels
        .filter((h) => !batchRates.unmatched_ids.includes(h.id))
        .map((h) => {
          const rate = batchRates.results[h.id];
          if (!rate) return h;
          return {
            ...h,
            rates_from: rate.from_price,
            rates_currency: rate.mrp?.currency || h.rates_currency || "INR",
          };
        })
        .filter((h) => batchRates.results[h.id])
    : rawAllHotels;

  // `rankedAll` is the rating-ranked list of curated hotels; only used to
  // build `curatedPicks` for the editor's-pick carousel below. The on-page
  // filter/sort UI was removed once <HotelGrid> became the canonical list.
  const rankedAll = rankHotels(allHotels);

  const displayName = cityName || slugToName(slug);

  // Hero image — prefer admin-curated `image_url` from the curations endpoint,
  // fall back to legacy hardcoded CITY_IMAGES, then to the global fallback.
  const heroImg = safeImg(cityImage || CITY_IMAGES[slug] || FALLBACK_CITY_IMAGE);

  // Curated picks for the editorial carousel — top 8 by rating, deduped.
  // Uses the same `rankedAll` so we don't double-rank.
  const curatedPicks: CuratedHotel[] = rankedAll
    .map((r) => r.hotel)
    .filter((h) => h.rating_average != null)
    .slice(0, 8);

  const handleScrollToHotels = () => {
    document.getElementById("hotels")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="luxe" style={{ overflowX: "hidden" }}>
      <Header />

      {/* ================================================================
          1. HERO — full-bleed city image, dark gradient overlay
          ================================================================ */}
      <header
        style={{
          position: "relative",
          minHeight: 520,
          display: "flex",
          alignItems: "flex-end",
          paddingTop: 96,
          paddingBottom: 56,
          paddingLeft: 24,
          paddingRight: 24,
          overflow: "hidden",
          background: "var(--luxe-black)",
        }}
      >
        {/* Background image */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `url(${heroImg}) center/cover no-repeat`,
            // Slight saturation/brightness pull so the gold gradient reads.
            filter: "saturate(0.92) brightness(0.78)",
            zIndex: 0,
          }}
        />
        {/* Gradient overlay (dark at bottom for legibility) */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(12,11,10,0.45) 0%, rgba(12,11,10,0.92) 90%)",
            zIndex: 0,
          }}
        />

        <div className="luxe-container" style={{ position: "relative", zIndex: 1, width: "100%" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="luxe-tech" style={{ marginBottom: 16 }}>
              {(cityCountry || "Voyagr Club").toUpperCase()}
              {cityCountry && <span style={{ margin: "0 8px", opacity: 0.5 }}>·</span>}
              {cityCountry && <span style={{ color: "var(--luxe-soft-white-50)" }}>VOYAGR CLUB</span>}
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="luxe-display"
              style={{
                fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                fontSize: "clamp(48px, 7vw, 88px)",
                fontWeight: 300,
                fontStyle: "italic",
                lineHeight: 1.05,
                color: "var(--luxe-soft-white)",
                marginBottom: 18,
                letterSpacing: "-0.02em",
              }}
            >
              {displayName}
            </motion.h1>

            {tagline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 16,
                  color: "var(--luxe-soft-white-70)",
                  fontWeight: 300,
                  lineHeight: 1.7,
                  maxWidth: 560,
                  marginBottom: 24,
                }}
              >
                {tagline}
              </motion.p>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.32 }}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 13,
                color: "var(--luxe-champagne)",
                letterSpacing: "0.06em",
                marginBottom: 28,
              }}
            >
              <span style={{ fontWeight: 600 }}>Preferred rates</span>
              <span style={{ color: "var(--luxe-soft-white-50)", margin: "0 8px" }}>·</span>
              <span style={{ color: "var(--luxe-soft-white-70)" }}>
                Voyagr Club members save on every stay
              </span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <button
                onClick={handleScrollToHotels}
                className="luxe-btn-primary"
                aria-label="Jump to hotels"
              >
                See member rates ↓
              </button>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ================================================================
          2. STICKY SEARCH SUMMARY BAR
          ================================================================ */}
      <div
        style={{
          position: "sticky",
          top: 60, // sit just below the global Header
          zIndex: 60,
          background: "rgba(12,11,10,0.85)",
          borderBottom: "1px solid var(--luxe-hairline)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          padding: "12px 20px",
        }}
        className="md:!px-[60px]"
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <SearchSummaryBar
            destination={displayName}
            onOpen={() => setSearchOpen(true)}
            onBack={() => router.back()}
          />
        </div>
      </div>

      {/* ================================================================
          3. EDITORIAL — "Why {city}?" — admin-curated city guide
          Rendered only if a guide is present; otherwise gracefully hidden.
          ================================================================ */}
      {cityGuide && cityGuide.sections.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{
            padding: "72px 0 56px",
            borderBottom: "1px solid var(--luxe-hairline)",
          }}
        >
          <div className="luxe-container">
            <div style={{ maxWidth: 720, marginBottom: 36 }}>
              <div className="luxe-tech" style={{ marginBottom: 10 }}>
                Why {displayName}
              </div>
              <h2
                className="luxe-display"
                style={{
                  fontSize: "clamp(28px, 3.2vw, 44px)",
                  marginBottom: 14,
                }}
              >
                A city our concierge <em>keeps revisiting</em>
              </h2>
              {cityGuide.lead && (
                <p
                  style={{
                    color: "var(--luxe-soft-white-70)",
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  {cityGuide.lead}
                </p>
              )}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 32,
              }}
            >
              {cityGuide.sections.map((s, i) => (
                <div key={i}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      fontWeight: 500,
                      letterSpacing: "-0.01em",
                      lineHeight: 1.25,
                      color: "var(--luxe-soft-white)",
                      marginBottom: 12,
                    }}
                  >
                    {s.title}
                  </div>
                  <p
                    style={{
                      fontSize: 14.5,
                      color: "var(--luxe-soft-white-70)",
                      lineHeight: 1.75,
                    }}
                  >
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* ================================================================
          4. CURATED PICKS — top 8 across all categories
          Hidden if no curated hotels are available for this city.
          ================================================================ */}
      {curatedPicks.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          style={{
            padding: "72px 0 56px",
            borderBottom: "1px solid var(--luxe-hairline)",
          }}
        >
          <div className="luxe-container">
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 24,
                flexWrap: "wrap",
                marginBottom: 28,
              }}
            >
              <div style={{ maxWidth: 640 }}>
                <div className="luxe-tech" style={{ marginBottom: 10 }}>
                  Editor&rsquo;s Picks
                </div>
                <h2
                  className="luxe-display"
                  style={{
                    fontSize: "clamp(26px, 2.8vw, 36px)",
                    marginBottom: 8,
                  }}
                >
                  Curated for <em>{displayName}</em>
                </h2>
                <p
                  style={{
                    color: "var(--luxe-soft-white-70)",
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  {curatedPicks.length} editor&rsquo;s {curatedPicks.length === 1 ? "pick" : "picks"}
                </p>
              </div>
              <button
                onClick={handleScrollToHotels}
                className="luxe-tech"
                style={{
                  color: "var(--luxe-champagne)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                See All Hotels &rarr;
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {curatedPicks.map((h) => (
                <Link
                  key={h.id}
                  href={hotelUrl(h)}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "4 / 3",
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(200,170,118,0.18)",
                      background: CITY_FALLBACK_GRADIENT,
                      marginBottom: 12,
                    }}
                  >
                    <Image
                      src={safeImg(h.photo1 || h.photo2)}
                      alt={h.hotel_name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--luxe-soft-white-50)",
                      marginBottom: 6,
                    }}
                  >
                    {displayName}
                    {cityCountry ? ` · ${cityCountry}` : ""}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 22,
                      fontWeight: 500,
                      color: "var(--luxe-soft-white)",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.25,
                      marginBottom: 8,
                    }}
                  >
                    {h.hotel_name}
                  </div>
                  {h.rating_average != null && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 10px",
                        background: "var(--luxe-champagne-soft)",
                        border: "1px solid var(--luxe-champagne-line)",
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--luxe-champagne)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {h.rating_average.toFixed(1)}/10
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </motion.section>
      )}


      {/* ================================================================
          5b. ALL HOTELS IN {CITY} — unified Grid/List view.
          excludeIds drops the editor's-pick rows shown in the carousel
          above so the same hotel never appears twice. This is the
          jump-target for the hero "See member rates" CTA — id="hotels".
          ================================================================ */}
      {!loading && !fetchError && (
        <section
          id="hotels"
          style={{
            padding: "40px 24px 80px",
            borderTop: "1px solid var(--luxe-hairline)",
          }}
          className="md:!px-[60px]"
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <HotelResultsView
              query={displayName}
              cityName={displayName}
              excludeIds={new Set(rawAllHotels.map((h) => String(h.id)))}
            />
          </div>
        </section>
      )}


      {/* Search edit modal */}
      <SearchEditModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        defaultDestination={displayName}
      />

      {/* Floating map button */}
      <FloatingMapButton destination={displayName} />

      {/* ================================================================
          7. CONCIERGE CTA STRIP
          ================================================================ */}
      <section
        style={{
          padding: "80px 0 96px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container" style={{ textAlign: "center", maxWidth: 720 }}>
          <div className="luxe-tech" style={{ marginBottom: 16 }}>
            Concierge
          </div>
          <h3
            className="luxe-display"
            style={{
              fontSize: "clamp(28px, 3.4vw, 44px)",
              marginBottom: 16,
            }}
          >
            Can&rsquo;t decide? <em>Speak to our concierge.</em>
          </h3>
          <p
            style={{
              fontSize: 15,
              color: "var(--luxe-soft-white-70)",
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 540,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            A real human on WhatsApp — available 24/7. Send the dates, the vibe,
            the budget. We&rsquo;ll come back with three quietly-perfect options
            for {displayName}.
          </p>
          <div
            style={{
              display: "inline-flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <a
              href={conciergeWhatsappLink(
                `Hi Voyagr, I'm planning a trip to ${displayName}. Could you put together some preferred-rate options?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="luxe-btn-gold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Concierge
            </a>
            <Link href="/preferred-rates" className="luxe-btn-secondary">
              Member Perks
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          8. EXPLORE OTHER DESTINATIONS — italic pills
          ================================================================ */}
      <section
        style={{
          padding: "56px 0 72px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          <div className="luxe-tech" style={{ marginBottom: 8 }}>
            Explore
          </div>
          <h3
            className="luxe-display"
            style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              color: "var(--luxe-soft-white)",
              marginBottom: 28,
            }}
          >
            Other <em>destinations</em>
          </h3>
          <div
            className="city-destination-pills"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {[
              "bangkok", "tokyo", "paris", "london", "dubai", "bali",
              "singapore", "rome", "barcelona", "seoul", "maldives",
              "phuket", "new-york", "kyoto",
            ]
              .filter((s) => s !== slug)
              .slice(0, 10)
              .map((citySlug) => (
                <Link
                  key={citySlug}
                  href={`/city/${citySlug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "10px 18px",
                    border: "1px solid var(--luxe-hairline-strong)",
                    fontSize: 14,
                    fontWeight: 400,
                    color: "var(--luxe-soft-white-70)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: "rgba(255,255,255,0.03)",
                    textDecoration: "none",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    borderRadius: 999,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "var(--luxe-champagne-soft)";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--luxe-champagne)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--luxe-champagne-line)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(255,255,255,0.03)";
                    (e.currentTarget as HTMLElement).style.color =
                      "var(--luxe-soft-white-70)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--luxe-hairline-strong)";
                  }}
                >
                  {slugToName(citySlug)}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          9. FOOTER — shared dark component
          ================================================================ */}
      <Footer />
    </div>
  );
}
