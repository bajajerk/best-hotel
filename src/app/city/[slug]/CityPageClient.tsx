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

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  fetchCityCurations,
  fetchBatchRates,
  fetchCityGuide,
  defaultBookingDates,
  searchHotelsPaginated,
  CuratedHotel,
} from "@/lib/api";
import type { BatchRatesResponse, CityGuide } from "@/lib/api";
import { hotelUrl } from "@/lib/urls";
import { useBooking } from "@/context/BookingContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackCityViewed } from "@/lib/analytics";
import DateBar from "@/components/DateBar";
import GuestRoomPicker from "@/components/GuestRoomPicker";
import HotelResultsView, { type HotelResultsItem } from "@/components/HotelResultsView";
import { CITY_IMAGES, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import { conciergeWhatsappLink } from "@/lib/concierge";

// Search-result row shape — mirrors HotelGrid's HotelGridResult.
interface CitySearchHit {
  id?: string;
  short_id?: string | null;
  slug?: string | null;
  name?: string;
  hotel_name?: string;
  city_name?: string;
  country?: string;
  star_rating: number | null;
  rating_average?: number | null;
  rates_from?: number | null;
  rates_currency?: string | null;
  image_url?: string | null;
  photo1?: string | null;
  addressline1?: string | null;
  has_refundable?: boolean;
  has_breakfast?: boolean;
}

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
  const [batchRates, setBatchRates] = useState<BatchRatesResponse | null>(null);
  const [cityGuide, setCityGuide] = useState<CityGuide | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);

  // ── Unified hotel results — fetched from /api/hotels/search by city
  // name. The curated set above feeds the "Editor's pick" badge only —
  // there is no longer a separate visual section for it.
  const [searchHits, setSearchHits] = useState<CitySearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(true);

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

  const rawAllHotels = useMemo(
    () =>
      Array.from(
        new Map(
          [...curations.couples, ...curations.singles, ...curations.families].map(
            (h) => [h.id, h]
          )
        ).values()
      ),
    [curations]
  );

  const displayName = cityName || slugToName(slug);

  // Batch-fetch live rates for every hotel rendered in the unified results
  // section — search hits + any curated hotel IDs not already in the search
  // page (defensive). Unmatched IDs simply won't have a live rate; we fall
  // back to the static `rates_from` from the hit/curated.
  useEffect(() => {
    const ids = Array.from(
      new Set([
        ...searchHits.map((h) => (h.id ? String(h.id) : "")),
        ...rawAllHotels.map((h) => String(h.id)),
      ].filter(Boolean))
    );
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
  }, [searchHits, rawAllHotels, checkIn, checkOut, totalAdults, totalChildren]);

  // ── Fetch the full hotel list for this city (single source of truth) ──
  useEffect(() => {
    if (!displayName) return;
    let cancelled = false;
    searchHotelsPaginated<CitySearchHit>(displayName, 1, 50)
      .then((resp) => {
        if (cancelled) return;
        setSearchHits(resp.hotels || []);
      })
      .catch(() => {
        if (!cancelled) setSearchHits([]);
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [displayName]);

  // ── Build the normalised results list for HotelResultsView ────────────
  // Editor's pick = hotel id is in the curated set.
  // Neighbourhood = curated.addressline1 (fall back to search hit's addressline1).
  // The curated set has authoritative addressline1; search results may not.
  const editorPickIds = useMemo(
    () => new Set(rawAllHotels.map((h) => String(h.id))),
    [rawAllHotels]
  );
  const curatedById = useMemo(() => {
    const m = new Map<string, CuratedHotel>();
    for (const h of rawAllHotels) m.set(String(h.id), h);
    return m;
  }, [rawAllHotels]);

  const resultsItems: HotelResultsItem[] = useMemo(() => {
    return searchHits
      .filter((h) => h && (h.id || h.short_id || h.slug))
      .map((h) => {
        const id = String(h.id || h.short_id || h.slug);
        const curated = curatedById.get(id);
        const live = batchRates?.results[id];
        const livePrice = typeof live?.from_price === "number" ? live.from_price : null;
        const memberPrice = livePrice ?? h.rates_from ?? curated?.rates_from ?? null;
        const currency =
          live?.currency ||
          live?.mrp?.currency ||
          h.rates_currency ||
          curated?.rates_currency ||
          "INR";
        const marketPrice = live?.mrp?.agoda_rate ?? null;
        const discountPct =
          typeof live?.savings_pct === "number" && live.savings_pct > 0
            ? Math.round(live.savings_pct)
            : null;
        const photo = h.image_url || h.photo1 || curated?.photo1 || curated?.photo2 || null;
        const photoUrl = photo
          ? photo.startsWith("http")
            ? photo
            : `https://photos.hotelbeds.com/giata/${photo}`
          : null;
        const neighbourhood =
          (curated?.addressline1?.trim() || h.addressline1?.trim() || null) || null;

        return {
          id,
          name: h.name || h.hotel_name || curated?.hotel_name || "Hotel",
          href: hotelUrl({
            slug: h.slug ?? curated?.slug ?? null,
            short_id: h.short_id ?? curated?.short_id ?? null,
            id,
          }),
          imageUrl: photoUrl,
          starRating: h.star_rating ?? curated?.star_rating ?? null,
          ratingAverage: h.rating_average ?? curated?.rating_average ?? null,
          neighbourhood,
          memberPrice,
          currency,
          marketPrice,
          discountPct,
          hasFreeCancel: !!(live?.has_refundable ?? h.has_refundable),
          hasBreakfast: !!(live?.has_breakfast ?? h.has_breakfast),
          // Backend doesn't surface upgrade as a flag yet — leave false.
          hasUpgrade: false,
          isEditorPick: editorPickIds.has(id),
        };
      });
  }, [searchHits, batchRates, curatedById, editorPickIds]);

  // Hero image — prefer admin-curated `image_url` from the curations endpoint,
  // fall back to legacy hardcoded CITY_IMAGES, then to the global fallback.
  const heroImg = safeImg(cityImage || CITY_IMAGES[slug] || FALLBACK_CITY_IMAGE);

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
          4. UNIFIED HOTEL RESULTS — single section replacing the legacy
          "Editor's Picks" carousel + "All hotels in {city}" grid. The
          curated set still drives the "Editor's pick" badge inside the
          shared card grid; everything else lives in a single component.
          This is the jump-target for the hero "See member rates" CTA.
          ================================================================ */}
      <section
        id="hotels"
        style={{
          padding: "56px 24px 80px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
        className="md:!px-[60px]"
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <HotelResultsView
            cityName={displayName}
            hotels={resultsItems}
            loading={loading || searchLoading}
          />
        </div>
      </section>


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
