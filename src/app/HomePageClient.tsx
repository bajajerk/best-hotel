"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES, SAMPLE_CITIES, CITY_IMAGES, FALLBACK_CITY_IMAGE, getCityImage } from "@/lib/constants";
import {
  fetchCuratedCities,
  fetchFeaturedAll,
  fetchBatchRates,
  defaultBookingDates,
  CuratedCity,
  CuratedHotel,
} from "@/lib/api";
import type { FeaturedResponse, BatchRatesResponse } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationSearch from "@/components/DestinationSearch";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { trackCtaClicked, trackWhatsAppClicked } from "@/lib/analytics";
import VoyagerClubComparison from "@/components/VoyagerClubComparison";
import Carousel from "@/components/Carousel";
import CityCard from "@/components/CityCard";
import type { CityCardData } from "@/components/CityCard";

import TopSellers, { computeTopSellers, type TopSellerHotel } from "@/components/TopSellers";
import RecommendationHub from "@/components/RecommendationHub";
import OccasionCarousel from "@/components/OccasionCarousel";
import WhatsAppConcierge from "@/components/WhatsAppConcierge";

export interface HomePageClientProps {
  initialCities: CuratedCity[];
  initialFeatured: FeaturedResponse | null;
}

// ---------------------------------------------------------------------------
// Hero background images (cinematic hotel/travel shots)
// ---------------------------------------------------------------------------
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1920&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80",
];

const FALLBACK_IMAGE = FALLBACK_CITY_IMAGE;

function safeImageSrc(url: string): string {
  if (!url || !url.trim()) return FALLBACK_IMAGE;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Editorial images for the "how it works" section
// ---------------------------------------------------------------------------
const EDITORIAL_IMAGES = [
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80",
];


// ---------------------------------------------------------------------------
// Seasonal trips data
// ---------------------------------------------------------------------------
const SEASONAL_TRIPS = [
  {
    season: "Summer",
    label: "Jun – Aug",
    description: "Summer escapes that create unforgettable family memories — from sun-kissed coastlines to serene island retreats. Members enjoy complimentary perks at every stop.",
    destinations: [
      { name: "Santorini", slug: "santorini", country: "Greece" },
      { name: "Bali", slug: "bali", country: "Indonesia" },
      { name: "Cape Town", slug: "cape-town", country: "South Africa" },
    ],
    img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
    accent: "#e8a87c",
  },
  {
    season: "Autumn",
    label: "Sep – Nov",
    description: "Golden foliage, harvest festivals, and quieter moments of wonder. Experience autumn\u2019s magic with preferred access to handpicked stays.",
    destinations: [
      { name: "Kyoto", slug: "kyoto", country: "Japan" },
      { name: "Prague", slug: "prague", country: "Czech Republic" },
      { name: "Budapest", slug: "budapest", country: "Hungary" },
    ],
    img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
    accent: "#c97b3d",
  },
  {
    season: "Winter",
    label: "Dec – Feb",
    description: "Festive cities, alpine luxury, and tropical winter sun — each stay elevated with exclusive member perks and personal concierge care.",
    destinations: [
      { name: "Dubai", slug: "dubai", country: "UAE" },
      { name: "Maldives", slug: "maldives", country: "Maldives" },
      { name: "Vienna", slug: "vienna", country: "Austria" },
    ],
    img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
    accent: "#7bafd4",
  },
  {
    season: "Spring",
    label: "Mar – May",
    description: "Cherry blossoms, vibrant cityscapes, and the promise of new beginnings. Discover spring\u2019s finest hotels with perks reserved for members.",
    destinations: [
      { name: "Tokyo", slug: "tokyo", country: "Japan" },
      { name: "Amsterdam", slug: "amsterdam", country: "Netherlands" },
      { name: "Lisbon", slug: "lisbon", country: "Portugal" },
    ],
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    accent: "#8fbc8f",
  },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------
const orchestrate = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const fadeSlow = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: "easeOut" },
  },
};

// ---------------------------------------------------------------------------
// Why Voyagr steps
// ---------------------------------------------------------------------------
const WHY_STEPS = [
  {
    num: "01",
    title: "Join Free",
    desc: "Unlock preferred access to a curated collection of luxury hotels with exclusive perks — free forever, no annual fees.",
  },
  {
    num: "02",
    title: "Share Your Plans",
    desc: "Tell us where you\u2019re headed and when via WhatsApp. Our concierge listens, understands, and starts curating.",
  },
  {
    num: "03",
    title: "Receive Curated Options",
    desc: "Get handpicked hotels with exclusive perks — room upgrades, spa credits, late checkout, and more — reserved for members.",
  },
  {
    num: "04",
    title: "Enjoy Your Stay",
    desc: "Confirm and enjoy your extraordinary stay with full concierge support from booking to checkout and beyond.",
  },
];

// ---------------------------------------------------------------------------
// Carousel arrow SVG
// ---------------------------------------------------------------------------
function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 6 15 12 9 18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// useCarousel hook
// ---------------------------------------------------------------------------
function useCarousel(itemCount: number, visibleCount: number = 4) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const maxIdx = Math.max(0, itemCount - visibleCount);

  const scrollTo = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track || !track.children[0]) return;
    const child = track.children[0] as HTMLElement;
    const gap = 20;
    const cardWidth = child.offsetWidth + gap;
    track.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
    setActiveIdx(idx);
  }, []);

  const prev = useCallback(() => {
    scrollTo(Math.max(0, activeIdx - 1));
  }, [activeIdx, scrollTo]);

  const next = useCallback(() => {
    scrollTo(Math.min(maxIdx, activeIdx + 1));
  }, [activeIdx, maxIdx, scrollTo]);

  // Sync active dot on manual scroll
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          if (!track.children[0]) { ticking = false; return; }
          const child = track.children[0] as HTMLElement;
          const gap = 20;
          const cardWidth = child.offsetWidth + gap;
          const newIdx = Math.round(track.scrollLeft / cardWidth);
          setActiveIdx(Math.min(newIdx, maxIdx));
          ticking = false;
        });
      }
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [maxIdx]);

  const dotCount = maxIdx + 1;

  return { trackRef, activeIdx, dotCount, prev, next, scrollTo, maxIdx };
}


// ---------------------------------------------------------------------------
// Seasonal Trips Carousel
// ---------------------------------------------------------------------------
type SeasonalTrip = (typeof SEASONAL_TRIPS)[number];

function SeasonalCarousel({ trips }: { trips: SeasonalTrip[] }) {
  const { trackRef, activeIdx, dotCount, prev, next, scrollTo, maxIdx } =
    useCarousel(trips.length, 4);

  return (
    <motion.div
      className="carousel-container"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <button className="carousel-btn carousel-btn-prev" onClick={prev} disabled={activeIdx === 0} aria-label="Previous">
        <ChevronLeft />
      </button>
      <button className="carousel-btn carousel-btn-next" onClick={next} disabled={activeIdx >= maxIdx} aria-label="Next">
        <ChevronRight />
      </button>

      <div className="carousel-track" ref={trackRef}>
        {trips.map((trip) => (
          <div key={trip.season} style={{ width: "calc(25% - 15px)" }}>
            <div
              className="card-hover"
              style={{
                background: "var(--white)",
                border: "1px solid var(--cream-border)",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
                <img
                  className="card-img"
                  src={safeImageSrc(trip.img)}
                  alt={trip.season}
                  style={{
                    width: "100%", height: "100%", objectFit: "cover",
                    display: "block", filter: "saturate(0.88)",
                  }}
                  loading="lazy"
                  onError={(e) => { const img = e.target as HTMLImageElement; if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE; }}
                />
                <div style={{
                  position: "absolute", top: "12px", left: "12px",
                  background: "var(--ink)", color: "var(--cream)",
                  fontSize: "10px", fontWeight: 600, padding: "5px 12px",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}>
                  {trip.season}
                </div>
                <div style={{
                  position: "absolute", bottom: "12px", right: "12px",
                  background: "rgba(26,23,16,0.7)", color: "var(--cream)",
                  fontSize: "10px", fontWeight: 500, padding: "4px 10px",
                  letterSpacing: "0.04em", backdropFilter: "blur(4px)",
                }}>
                  {trip.label}
                </div>
              </div>

              <div style={{ padding: "20px 20px 24px" }}>
                <p className="type-body-sm" style={{ color: "var(--ink-mid)", lineHeight: 1.7, marginBottom: "18px" }}>
                  {trip.description}
                </p>
                <div style={{
                  borderTop: "1px solid var(--cream-border)", paddingTop: "16px",
                  display: "flex", flexDirection: "column", gap: "8px",
                }}>
                  {trip.destinations.map((dest) => (
                    <Link key={dest.slug} href={`/city/${dest.slug}`} style={{
                      textDecoration: "none", display: "flex",
                      alignItems: "center", justifyContent: "space-between",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)" }}>
                        {dest.name}
                      </span>
                      <span className="card-arrow" style={{ fontSize: "11px", color: "var(--ink-light)" }}>
                        {dest.country} &rarr;
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {dotCount > 1 && (
        <div className="carousel-dots">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === activeIdx ? " active" : ""}`}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function Home({ initialCities, initialFeatured }: HomePageClientProps) {
  const {
    checkIn,
    checkOut,
    setCheckIn,
    setCheckOut,
    formatDate,
    totalAdults,
    totalChildren,
  } = useBooking();
  const { user } = useAuth();
  const router = useRouter();

  /* "See Member Rates →" hero CTA — auth-aware destination.
     Logged out → smooth-scroll to the hero search bar (it's right below the CTA).
     Logged in → /search directly (skip the discovery step). */
  function handleSeeMemberRates(e: React.MouseEvent) {
    e.preventDefault();
    const loggedIn = Boolean(user);
    trackCtaClicked({
      cta_name: 'see_member_rates_hero',
      cta_location: 'hero',
      destination_url: loggedIn ? '/search' : '#hero-search',
    });
    if (loggedIn) {
      router.push('/search');
      return;
    }
    const target = document.getElementById('hero-search');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      router.push('/search');
    }
  }

  const [cities, setCities] = useState<CuratedCity[]>(initialCities);
  const [loading, setLoading] = useState(initialCities.length === 0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [featured, setFeatured] = useState<FeaturedResponse | null>(initialFeatured);
  const [batchRates, setBatchRates] = useState<BatchRatesResponse | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Fetch cities (only if not pre-loaded from server)
  useEffect(() => {
    if (initialCities.length > 0) return;
    fetchCuratedCities()
      .then(setCities)
      .catch(() => {
        setCities(
          SAMPLE_CITIES.map((c, i) => ({
            ...c,
            city_id: null,
            hotel_count: 0,
            display_order: i + 1,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [initialCities.length]);

  // Fetch featured hotel data for top sellers (only if not pre-loaded from server)
  useEffect(() => {
    if (initialFeatured) return;
    async function loadFeaturedHotels() {
      try {
        const data = await fetchFeaturedAll();
        if (data) setFeatured(data);
      } catch (err) {
        console.error("[Voyagr] Failed to load featured hotels:", err);
      }
    }
    loadFeaturedHotels();
  }, [initialFeatured]);

  // Batch-fetch live rates for all featured hotel IDs. Merge into card data
  // and filter out unmatched hotels (those with no TripJack availability).
  useEffect(() => {
    if (!featured) return;
    const allHotels: CuratedHotel[] = [
      ...(featured.topRated ?? []),
      ...(featured.bestValue ?? []),
      ...(featured.soloTravel ?? []),
      ...(featured.familyFriendly ?? []),
    ];
    const ids = Array.from(new Set(allHotels.map((h) => h.hotel_id))).filter(Boolean);
    if (ids.length === 0) return;

    const { checkin: defIn, checkout: defOut } = defaultBookingDates();
    const checkin = checkIn || defIn;
    const checkout = checkOut || defOut;
    const adults = totalAdults > 0 ? totalAdults : 2;
    const children = totalChildren;

    let cancelled = false;
    setBatchLoading(true);
    fetchBatchRates(ids, checkin, checkout, adults, children)
      .then((data) => {
        if (!cancelled) setBatchRates(data);
      })
      .catch((err) => {
        console.error("[Voyagr] Batch rates failed:", err);
      })
      .finally(() => {
        if (!cancelled) setBatchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [featured, checkIn, checkOut, totalAdults, totalChildren]);

  /**
   * Derive the `topSellers` list for the carousel.
   * - While batch rates are loading: render with the stale `rates_from` so the UI
   *   is never empty (the spec calls this the "skeleton with static data first" UX).
   * - Once rates arrive: hide hotels in `unmatched_ids`, override `rates_from` with
   *   the live `from_price`, and let `computeTopSellers` pick up real `savePercent`
   *   from the MRP (via the ranking scorer; we also expose `batchRates` to cards).
   */
  const topSellers: TopSellerHotel[] = (() => {
    if (!featured) return [];
    const source = featured.topRated ?? [];
    if (!batchRates) {
      return computeTopSellers(source, 8);
    }
    const unmatched = new Set(batchRates.unmatched_ids);
    const merged = source
      .filter((h) => !unmatched.has(h.hotel_id))
      .map((h): CuratedHotel => {
        const rate = batchRates.results[String(h.hotel_id)];
        if (!rate) return h;
        return {
          ...h,
          rates_from: rate.from_price,
          rates_currency: rate.mrp?.currency || h.rates_currency || "INR",
        };
      })
      // Defensive: drop any hotel that has no live price
      .filter((h) => batchRates.results[String(h.hotel_id)]);

    const sellers = computeTopSellers(merged, 8);
    // Override savePercent with the server-computed value when present
    return sellers.map((s) => {
      const rate = batchRates.results[String(s.hotelId)];
      if (rate?.savings_pct != null) {
        return { ...s, savePercent: rate.savings_pct };
      }
      return s;
    });
  })();

  // Rotate hero background
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const featuredCities = cities.slice(0, 6);


  return (
    <div
      className="precision-theme"
      style={{
        minHeight: "100vh",
        background: "#080808",
        color: "var(--pl-ivory)",
      }}
    >

      {/* ================================================================
          FIXED NAV — reusable Header component
      ================================================================ */}
      <Header />

      {/* Film Grain — SVG turbulence overlay (editorial "print" texture) */}
      <div className="film-grain" aria-hidden="true" />

      {/* ================================================================
          HERO — split layout: text left, image right
      ================================================================ */}
      <section
        ref={heroRef}
        className="hero-section"
        style={{
          paddingTop: "60px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "calc(100vh - 0px)",
          overflow: "hidden",
        }}
      >
        {/* Left side — text content */}
        <motion.div
          className="hero-text-container"
          variants={orchestrate}
          initial="hidden"
          animate="visible"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "80px 60px",
            background: "var(--cream)",
            zIndex: 2,
          }}
        >
          <motion.p
            variants={fadeUp}
            className="type-tech"
            style={{
              marginBottom: "28px",
            }}
          >
            Voyagr Club &mdash; Est. Mumbai
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="type-manifesto"
            style={{
              marginBottom: "28px",
            }}
          >
            Hotels you <em>know</em>.
            <br />
            Rates they <em>don&rsquo;t show</em>.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="editorial-body"
            style={{
              color: "var(--pl-ivory-60)",
              maxWidth: "440px",
              marginBottom: "36px",
              fontSize: "15px",
            }}
          >
            Member access to hotel rates travel agents have always paid.
            <br />
            Never on MakeMyTrip or Booking.com.
          </motion.p>

          {/* See Member Rates — ghost-to-solid tactile switch CTA */}
          <motion.div variants={fadeUp} style={{ marginBottom: "36px" }}>
            <a
              href={user ? "/search" : "#hero-search"}
              className="btn-tactile"
              onClick={handleSeeMemberRates}
            >
              See Member Rates
            </a>
            <p
              className="type-tech"
              style={{
                color: "var(--slate-muted)",
                marginTop: "18px",
                lineHeight: 1.8,
              }}
            >
              Free forever &middot; No annual fees &middot; 24/7 concierge
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            id="hero-search"
            variants={fadeUp}
            className="hero-search-form"
            style={{
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              padding: "10px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr auto",
              gap: 0,
              maxWidth: "600px",
              boxShadow: "0 4px 32px rgba(26,23,16,0.06)",
            }}
          >
            {/* Destination field with autocomplete */}
            <div
              className="search-field"
              style={{
                padding: "12px 16px",
                borderRight: "1px solid var(--cream-border)",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <div className="type-micro" style={{
                color: "var(--ink-light)",
                marginBottom: "3px",
              }}>
                DESTINATION
              </div>
              <DestinationSearch
                variant="light"
                placeholder="City or hotel"
              />
            </div>

            {/* Check in */}
            <label
              className="search-field"
              style={{
                padding: "12px 16px",
                borderRight: "1px solid var(--cream-border)",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div className="type-micro" style={{
                color: "var(--ink-light)",
                marginBottom: "3px",
              }}>
                CHECK IN
              </div>
              <div style={{ fontSize: "13px", color: checkIn ? "var(--ink)" : "var(--ink-light)", fontWeight: 400 }}>
                {formatDate(checkIn)}
              </div>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                }}
              />
            </label>

            {/* Check out */}
            <label
              className="search-field"
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <div className="type-micro" style={{
                color: "var(--ink-light)",
                marginBottom: "3px",
              }}>
                CHECK OUT
              </div>
              <div style={{ fontSize: "13px", color: checkOut ? "var(--ink)" : "var(--ink-light)", fontWeight: 400 }}>
                {formatDate(checkOut)}
              </div>
              <input
                type="date"
                value={checkOut}
                min={checkIn || undefined}
                onChange={(e) => setCheckOut(e.target.value)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                }}
              />
            </label>

            {/* Search button */}
            <button
              className="hero-search-btn"
              style={{
                width: "52px",
                background: "var(--ink)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
                border: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--ink)";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </motion.div>

          {/* Hero stats — editorial data strip */}
          <motion.div
            variants={fadeUp}
            className="hero-stats"
            style={{
              display: "flex",
              gap: "0",
              marginTop: "56px",
              paddingTop: "28px",
              borderTop: "0.5px solid rgba(255,255,255,0.08)",
            }}
          >
            {[
              { num: "1,500+", label: "Partner Hotels" },
              { num: "50+", label: "Cities Worldwide" },
              { num: "24/7", label: "Concierge" },
            ].map((stat, i, arr) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  paddingRight: "24px",
                  borderRight:
                    i < arr.length - 1
                      ? "0.5px solid rgba(255,255,255,0.08)"
                      : "none",
                  paddingLeft: i > 0 ? "24px" : 0,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 300,
                    fontSize: "36px",
                    color: "var(--white-soft)",
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {stat.num}
                </div>
                <div
                  className="type-tech"
                  style={{
                    color: "var(--slate-muted)",
                    marginTop: "10px",
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side — hero image with overlay card */}
        <div
          className="hero-image anim-mask-unreveal"
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 0,
            margin: 0,
          }}
        >
          <AnimatePresence mode="sync">
            {HERO_IMAGES.map((src, i) =>
              i === heroIdx ? (
                <motion.img
                  key={src}
                  src={src}
                  alt="Luxury hotel"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "grayscale(0.2) saturate(0.88) contrast(1.08) brightness(0.86)",
                  }}
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
                  }}
                />
              ) : null
            )}
          </AnimatePresence>

          {/* Depth via Shadow Gradient — transparent to obsidian. No blur. */}
          <div className="depth-overlay-left" style={{ zIndex: 1 }} />
          <div className="depth-overlay-bottom" style={{ zIndex: 1 }} />

          {/* Floating dossier card — hairline-framed, no glass blur */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            style={{
              position: "absolute",
              bottom: "40px",
              left: "28px",
              padding: "22px 24px",
              width: "260px",
              zIndex: 3,
              background: "rgba(8, 8, 8, 0.78)",
              border: "0.5px solid rgba(255,255,255,0.08)",
              borderRadius: 0,
            }}
          >
            <div className="type-tech" style={{ marginBottom: "14px" }}>
              Member Dossier
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "22px",
                color: "var(--white-soft)",
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
                marginBottom: "10px",
              }}
            >
              The Ritz-Carlton, Bali
            </div>
            <div
              className="type-tech"
              style={{
                color: "var(--brass-raw)",
                marginBottom: "14px",
              }}
            >
              Perks Included
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}>
              {["Room upgrade", "Late checkout", "Welcome drinks"].map((perk) => (
                <div key={perk} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", fontWeight: 300, letterSpacing: "0.02em", color: "var(--white-soft)", lineHeight: 1.6 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--brass-raw)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {perk}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          TOP SELLERS — most booked properties
      ================================================================ */}
      <TopSellers hotels={topSellers} />

      {/* ================================================================
          BY OCCASION — horizontal carousel with auto-rotation
      ================================================================ */}
      <OccasionCarousel />

      {/* ================================================================
          RECOMMENDATION HUB — curated category tabs with hotel grid
      ================================================================ */}
      <RecommendationHub />

      {/* ================================================================
          VOYAGER CLUB — market rate vs club rate comparison
      ================================================================ */}
      <VoyagerClubComparison />

      {/* ================================================================
          SEASONAL TRIPS — travel by season
      ================================================================ */}
      <section
        className="section-seasonal section-pad"
        style={{
          background: "var(--cream)",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="section-header"
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: "48px",
            }}
          >
            <div>
              <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
                Seasonal Escapes
              </div>
              <h2 className="type-display-2" style={{ color: "var(--ink)" }}>
                Extraordinary moments,{" "}
                <em style={{ fontStyle: "italic", color: "var(--gold)" }}>every season</em>
              </h2>
            </div>
          </motion.div>

          <SeasonalCarousel trips={SEASONAL_TRIPS} />
        </div>
      </section>

      {/* ================================================================
          CITY TILES — discover by destination (carousel)
      ================================================================ */}
      {cities.length > 0 && (
        <section
          className="section-city-tiles section-pad"
          style={{
            background: "var(--white)",
          }}
        >
          <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className="section-header"
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                marginBottom: "48px",
              }}
            >
              <div>
                <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
                  Explore Destinations
                </div>
                <h2 className="type-display-2" style={{ color: "var(--ink)" }}>
                  Discover your next{" "}
                  <em style={{ fontStyle: "italic", color: "var(--gold)" }}>extraordinary escape</em>
                </h2>
              </div>
              <Link
                href="/search"
                className="btn-outline"
                onClick={() => trackCtaClicked({ cta_name: 'view_all_cities', cta_location: 'home_city_tiles', destination_url: '/search' })}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                }}
              >
                All cities
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Carousel ariaLabel="City destinations" showProgressBar>
                {cities.slice(0, 15).map((city) => (
                  <CityCard
                    key={city.city_slug}
                    city={{
                      name: city.city_name,
                      slug: city.city_slug,
                      country: city.country,
                      tagline: city.tagline || undefined,
                      img: getCityImage(city.city_slug),
                    }}
                  />
                ))}
              </Carousel>
            </motion.div>
          </div>
        </section>
      )}

      {/* ================================================================
          LET'S PLAN YOUR STAY — editorial CTA
      ================================================================ */}
      <section
        className="section-plan-stay"
        style={{
          padding: "80px 60px",
          background: "var(--white)",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
              Your Journey Starts Here
            </div>
            <h2 className="type-display-2" style={{ color: "var(--ink)", marginBottom: "24px" }}>
              Let us craft your next{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>unforgettable stay</em>
            </h2>
            <p className="type-body-lg" style={{
              color: "var(--ink-mid)",
              lineHeight: 1.8,
              maxWidth: "600px",
              margin: "0 auto 16px",
            }}>
              Whether it&rsquo;s a weekend escape, a business trip, or the honeymoon you&rsquo;ve been dreaming of &mdash; we&rsquo;ll
              match you with the right hotel and curate exclusive perks that turn your trip into something extraordinary. No algorithms, no upsells. Just a
              concierge who listens and a network of 1,500+ partner hotels worldwide.
            </p>
            <p className="type-body" style={{
              color: "var(--ink-light)",
              lineHeight: 1.8,
              maxWidth: "540px",
              margin: "0 auto 40px",
            }}>
              Tell us where you&rsquo;re headed and when. We&rsquo;ll handle the rest &mdash; from
              curating handpicked options with exclusive perks to confirming your reservation within minutes
              over WhatsApp.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" as const }}>
              <a
                href="https://wa.me/919876543210?text=Hi%2C%20I%27d%20like%20to%20plan%20a%20trip"
                className="btn-emerald"
                onClick={() => trackWhatsAppClicked({ page: 'home' })}
                style={{
                  padding: "14px 36px",
                  fontSize: "13px",
                  textDecoration: "none",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                Chat on WhatsApp
              </a>
              <a
                href="#hero-search"
                className="btn-outline"
                onClick={() => trackCtaClicked({ cta_name: 'search_hotels', cta_location: 'home_how_it_works', destination_url: '#hero-search' })}
                style={{
                  padding: "14px 36px",
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "inline-block",
                }}
              >
                Search Hotels
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          WHY VOYAGR — dark ink section
      ================================================================ */}
      <section
        id="how-it-works"
        className="section-why"
        style={{
          background: "var(--ink)",
          padding: "80px 60px",
          color: "var(--cream)",
        }}
      >
        <div className="dark-section-container" style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="type-eyebrow" style={{
              marginBottom: "8px",
            }}>
              How It Works
            </div>
            <h2 className="type-display-2" style={{
              color: "var(--cream)",
            }}>
              A more rewarding way to{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>travel</em>
            </h2>
          </motion.div>

          <div className="why-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "40px",
            marginTop: "56px",
          }}>
            {WHY_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "48px",
                  fontWeight: 300,
                  color: "var(--gold)",
                  opacity: 0.5,
                  lineHeight: 1,
                  marginBottom: "16px",
                }}>
                  {step.num}
                </div>
                <div style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: "var(--cream)",
                  marginBottom: "10px",
                }}>
                  {step.title}
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "rgba(245,240,232,0.55)",
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}>
                  {step.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          TRUST STATS BAR
      ================================================================ */}
      <section
        className="section-trust"
        style={{
          padding: "80px 60px",
          borderTop: "1px solid var(--cream-border)",
          borderBottom: "1px solid var(--cream-border)",
          background: "var(--white)",
        }}
      >
        <div
          className="trust-stats"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: "wrap" as const,
            gap: "0",
          }}
        >
          {[
            { number: "50+", label: "Cities" },
            { number: "1,500+", label: "Hotels" },
            { number: "24/7", label: "Concierge" },
            { number: "Free", label: "Membership" },
          ].map((stat, i, arr) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <div style={{ textAlign: "center", padding: "0 48px" }}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                  color: "var(--ink)",
                  lineHeight: 1,
                }}>
                  {stat.number}
                </div>
                <div className="type-label" style={{
                  color: "var(--ink-light)",
                  marginTop: "6px",
                }}>
                  {stat.label}
                </div>
              </div>
              {i < arr.length - 1 && (
                <div
                  className="trust-divider"
                  style={{
                    width: "1px",
                    height: "48px",
                    background: "var(--cream-border)",
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ================================================================
          TRUST & FOUNDER — why members trust Voyagr
      ================================================================ */}
      <section
        className="section-trust-founder"
        style={{
          padding: "80px 64px",
          background: "#132338",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "12px",
              }}
            >
              Why Members Trust Voyagr
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "44px",
                fontWeight: 400,
                color: "#f5f0e8",
                lineHeight: 1.2,
                marginBottom: "56px",
              }}
            >
              Built by Someone Who Knows{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                the Other Side
              </em>
            </h2>
          </motion.div>

          {/* 2-column grid: founder left, testimonials right */}
          <div
            className="trust-founder-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
              alignItems: "start",
            }}
          >
            {/* LEFT — Founder block */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <div
                style={{
                  borderLeft: "2px solid rgba(201, 168, 76, 0.2)",
                  paddingLeft: "28px",
                  marginBottom: "40px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "20px",
                    fontWeight: 300,
                    fontStyle: "italic",
                    color: "rgba(245, 240, 232, 0.75)",
                    lineHeight: 1.6,
                    margin: "0 0 20px 0",
                  }}
                >
                  &ldquo;I spent a decade on the hotel supply side &mdash; managing
                  rates, contracts, and the inventory that never makes it to
                  public platforms. Voyagr exists because that access
                  shouldn&rsquo;t be reserved for corporations.&rdquo;
                </p>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                  }}
                >
                  &mdash; Founder, Voyagr Club &middot; Mumbai
                </div>
              </div>

              {/* Stat blocks */}
              <div
                className="founder-stats"
                style={{
                  display: "flex",
                  gap: "32px",
                }}
              >
                {[
                  { number: "10+", label: "Years in Hospitality" },
                  { number: "1,500+", label: "Hotels Worldwide" },
                  { number: "50+", label: "Cities Covered" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "36px",
                        fontWeight: 400,
                        color: "var(--gold)",
                        lineHeight: 1,
                        marginBottom: "6px",
                      }}
                    >
                      {stat.number}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "rgba(245, 240, 232, 0.45)",
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* RIGHT — Testimonials */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {[
                {
                  quote:
                    "Booked the Anantara Veli through Voyagr — same room type I'd priced on three OTAs, but ₹18,400 less. The concierge even sorted a seaplane transfer I didn't know was included.",
                  name: "Ananya Mehta",
                  location: "Mumbai",
                  hotel: "Anantara Veli",
                  saving: "Saved ₹18,400",
                },
                {
                  quote:
                    "We were comparing Taj Exotica rates for our anniversary. Voyagr's member rate came in under the hotel's own website. No catch, no upsell — just a genuinely better price and a room upgrade on arrival.",
                  name: "Rohan Kapoor",
                  location: "Delhi",
                  hotel: "Taj Exotica Goa",
                  saving: "Saved ₹12,200",
                },
              ].map((testimonial) => (
                <div
                  key={testimonial.name}
                  style={{
                    background: "#0B1B2B",
                    border: "1px solid rgba(201, 168, 76, 0.08)",
                    padding: "20px 24px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "rgba(245, 240, 232, 0.65)",
                      lineHeight: 1.65,
                      margin: "0 0 16px 0",
                    }}
                  >
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "rgba(245, 240, 232, 0.4)",
                      }}
                    >
                      {testimonial.name} &middot; {testimonial.location} &middot;{" "}
                      {testimonial.hotel}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "16px",
                        color: "var(--gold)",
                      }}
                    >
                      {testimonial.saving}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Trust badges row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{
              display: "flex",
              gap: "32px",
              marginTop: "56px",
              opacity: 0.4,
            }}
          >
            {["Secure Payments", "SSL Encrypted", "GST Registered"].map(
              (badge) => (
                <div
                  key={badge}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(245, 240, 232, 0.5)",
                  }}
                >
                  {badge}
                </div>
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          NEWSLETTER CTA — before footer
      ================================================================ */}
      <section
        className="newsletter-section"
        style={{
          padding: "80px 60px",
          background: "var(--cream)",
          borderTop: "1px solid var(--cream-border)",
        }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
              Member Updates
            </div>
            <h2 className="type-display-2" style={{ color: "var(--ink)", marginBottom: "16px" }}>
              Be the <em style={{ fontStyle: "italic", color: "var(--gold)" }}>first</em> to know
            </h2>
            <p className="type-body" style={{
              color: "var(--ink-light)",
              lineHeight: 1.7,
              marginBottom: "32px",
              maxWidth: "480px",
              margin: "0 auto 32px",
            }}>
              New destinations, member rates, and exclusive perks &mdash; straight to your inbox.
            </p>

            <div
              className="newsletter-form"
              style={{
                display: "flex",
                gap: "0",
                maxWidth: "480px",
                margin: "0 auto",
              }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  border: "1px solid var(--cream-border)",
                  borderRight: "none",
                  background: "var(--white)",
                  fontSize: "14px",
                  fontFamily: "var(--font-body)",
                  color: "var(--ink)",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--gold)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--cream-border)";
                }}
              />
              <button
                className="btn-gold"
                style={{
                  padding: "14px 28px",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Subscribe
              </button>
            </div>

            <p style={{
              fontSize: "11px",
              color: "var(--ink-light)",
              marginTop: "12px",
              opacity: 0.6,
            }}>
              No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          ABOUT US — company story section
      ================================================================ */}
      <section
        id="about-us"
        style={{
          padding: "80px 60px",
          background: "var(--ink)",
          borderTop: "1px solid rgba(245, 240, 232, 0.08)",
        }}
      >
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <div
              className="type-eyebrow"
              style={{ marginBottom: "8px", color: "var(--gold)" }}
            >
              About Us
            </div>
            <h2
              className="type-display-2"
              style={{ color: "var(--cream)", marginBottom: "24px" }}
            >
              The team behind{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                Voyagr Club
              </em>
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "48px",
                marginTop: "40px",
              }}
              className="about-us-grid"
            >
              <div>
                <p
                  className="type-body"
                  style={{
                    color: "rgba(245, 240, 232, 0.7)",
                    lineHeight: 1.8,
                    marginBottom: "20px",
                  }}
                >
                  Voyagr Club was built on a simple idea — luxury travel should come with
                  extraordinary experiences. We partner directly with the world&rsquo;s finest
                  hotels to offer our members preferred access, exclusive perks, and a
                  personal concierge who makes every trip unforgettable.
                </p>
                <p
                  className="type-body"
                  style={{
                    color: "rgba(245, 240, 232, 0.7)",
                    lineHeight: 1.8,
                  }}
                >
                  Our curated selection spans 50+ cities worldwide — from the beaches of
                  Bali to the streets of Paris — handpicked to ensure quality and
                  unforgettable experiences for every type of traveller.
                </p>
              </div>

              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "24px",
                  }}
                >
                  {[
                    { number: "50+", label: "Cities Worldwide" },
                    { number: "10K+", label: "Hotels Listed" },
                    { number: "Free", label: "Membership" },
                    { number: "24/7", label: "WhatsApp Concierge" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      style={{
                        padding: "24px",
                        border: "1px solid rgba(245, 240, 232, 0.1)",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          fontFamily: "var(--font-display)",
                          color: "var(--gold)",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        {stat.number}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "rgba(245, 240, 232, 0.5)",
                        }}
                      >
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          WHATSAPP CONCIERGE — contextual section
      ================================================================ */}
      <WhatsAppConcierge />

      {/* ================================================================
          FOOTER — multi-column layout
      ================================================================ */}
      <Footer />
    </div>
  );
}

// ============================================================================
// Hotel Card — for the featured asymmetric grid
// ============================================================================
function FeaturedCityCard({
  city,
  isLarge = false,
}: {
  city: CuratedCity;
  isLarge?: boolean;
}) {
  const img = getCityImage(city.city_slug);

  return (
    <Link
      href={`/city/${city.city_slug}`}
      style={{
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        background: "var(--cream-deep)",
        gridRow: isLarge ? "span 2" : undefined,
        minHeight: isLarge ? "520px" : "200px",
        display: "block",
        textDecoration: "none",
      }}
    >
      <img
        src={safeImageSrc(img)}
        alt={city.city_name}
        className="card-img"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.6s ease",
          display: "block",
          minHeight: "200px",
          filter: "saturate(0.88)",
        }}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLImageElement).style.transform = "scale(1.06)";
          (e.target as HTMLImageElement).style.filter = "saturate(1)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLImageElement).style.transform = "scale(1)";
          (e.target as HTMLImageElement).style.filter = "saturate(0.88)";
        }}
      />

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(26,23,16,0.75) 0%, transparent 60%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "24px",
          color: "var(--cream)",
          pointerEvents: "none",
        }}
      >
        <div className="type-display-3" style={{
          fontStyle: "italic",
          fontSize: isLarge ? "26px" : undefined,
        }}>
          {city.city_name}
        </div>
        <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px", letterSpacing: "0.06em" }}>
          {city.country}
        </div>
        <div style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          marginTop: "12px",
        }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "18px",
            fontWeight: 500,
            color: "var(--cream)",
          }}>
            {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore"}
          </span>
        </div>
      </div>
    </Link>
  );
}

