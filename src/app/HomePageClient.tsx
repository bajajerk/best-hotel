"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CATEGORIES, SAMPLE_CITIES, CITY_IMAGES, FALLBACK_CITY_IMAGE, getCityImage } from "@/lib/constants";
import { fetchCuratedCities, fetchFeaturedAll, CuratedCity, CuratedHotel } from "@/lib/api";
import type { FeaturedResponse } from "@/lib/api";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HotelCard from "@/components/HotelCard";
import type { HotelCardData } from "@/components/HotelCard";
import DestinationSearch from "@/components/DestinationSearch";
import { useBooking } from "@/context/BookingContext";
import { getWhyVisitNow } from "@/lib/whyVisitNow";
import { trackCtaClicked, trackWhatsAppClicked } from "@/lib/analytics";
import VoyagerClubComparison from "@/components/VoyagerClubComparison";
import Carousel from "@/components/Carousel";
import CityCard from "@/components/CityCard";
import type { CityCardData } from "@/components/CityCard";

import TopSellers, { computeTopSellers, type TopSellerHotel } from "@/components/TopSellers";

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

function sanitizePhoto(url: string | null): string {
  if (!url) return FALLBACK_IMAGE;
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

/** Returns true if a CuratedHotel has the minimum data needed to render a card */
function isRenderable(hotel: CuratedHotel): boolean {
  return Boolean(hotel.hotel_name && hotel.rates_from && hotel.rates_from > 0);
}

function curatedToCard(hotel: CuratedHotel): HotelCardData {
  const marketRate = hotel.rates_from ? Math.round(hotel.rates_from * 1.25) : 0;
  const savePercent =
    hotel.rates_from && marketRate
      ? Math.round(((marketRate - hotel.rates_from) / marketRate) * 100)
      : 20;
  return {
    name: hotel.hotel_name,
    city: `${hotel.city_name}, ${hotel.country}`,
    citySlug: hotel.city_slug,
    stars: hotel.star_rating || 4,
    rating: hotel.rating_average || 8.0,
    tags: extractTags(hotel.overview),
    priceFrom: hotel.rates_from || 0,
    savePercent,
    img: sanitizePhoto(hotel.photo1),
    whyVisitNow: getWhyVisitNow(hotel.hotel_name) ?? undefined,
  };
}

function extractTags(overview: string | null): string[] {
  if (!overview) return ["Hotel"];
  const tags: string[] = [];
  const keywords: [string, RegExp][] = [
    ["Pool", /pool/i],
    ["Spa", /spa|massage/i],
    ["Gym", /fitness|gym/i],
    ["Beach", /beach|shoreline/i],
    ["Restaurant", /restaurant|dining/i],
    ["Wi-Fi", /wi-?fi/i],
    ["Bar", /bar|nightclub/i],
    ["Room Service", /room service/i],
  ];
  for (const [tag, regex] of keywords) {
    if (regex.test(overview)) tags.push(tag);
    if (tags.length >= 3) break;
  }
  return tags.length > 0 ? tags : ["Hotel"];
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
    description: "Escape the heat with mountain retreats and coastal breezes.",
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
    description: "Golden foliage, harvest festivals, and quieter travel windows.",
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
    description: "Festive cities, alpine luxury, and tropical winter sun.",
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
    description: "Cherry blossoms, mild weather, and vibrant cityscapes.",
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
// Curated sub-section tab keys
// ---------------------------------------------------------------------------



const FEATURED_TAB_KEYS = [
  { key: "topRated", label: "Top Rated" },
  { key: "bestValue", label: "Best Value" },
  { key: "soloTravel", label: "Solo Travel" },
  { key: "familyFriendly", label: "Family Friendly" },
] as const;

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
// Testimonials
// ---------------------------------------------------------------------------
const TESTIMONIALS = [
  {
    quote: "I booked the same suite I found on Booking.com — the Voyagr rate was noticeably better. I genuinely did not believe it until I checked in.",
    name: "Priya Mehta",
    location: "Mumbai",
    avatar: "PM",
  },
  {
    quote: "We planned our honeymoon across three cities. The rates through Voyagr meant we could add an extra night in Santorini. That is not an exaggeration.",
    name: "Arjun & Kavya",
    location: "Bangalore",
    avatar: "AK",
  },
  {
    quote: "As a travel agent myself, I was skeptical. These are genuine B2B rates. I now use Voyagr for all my personal trips.",
    name: "Rahul Sharma",
    location: "Delhi",
    avatar: "RS",
  },
];

// ---------------------------------------------------------------------------
// Why Voyagr steps
// ---------------------------------------------------------------------------
const WHY_STEPS = [
  {
    num: "01",
    title: "Direct Partnerships",
    desc: "We negotiate B2B rates directly with hotels, cutting out the middlemen and their markups.",
  },
  {
    num: "02",
    title: "Real-Time Comparison",
    desc: "See the market price alongside our rate instantly. No guesswork, no hidden fees.",
  },
  {
    num: "03",
    title: "Concierge Booking",
    desc: "One call or WhatsApp message, and our team confirms your stay within minutes.",
  },
  {
    num: "04",
    title: "Guaranteed Savings",
    desc: "Preferred wholesale rates on every booking. Same hotel, same room, same dates. Just a better rate.",
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

// ---------------------------------------------------------------------------
// Featured Properties — single tabbed carousel (calls GET /api/hotels/featured)
// ---------------------------------------------------------------------------
function FeaturedPropertiesSection({ tabData, isLoading, isError }: { tabData: Record<string, HotelCardData[]>; isLoading: boolean; isError: boolean }) {
  const [activeTab, setActiveTab] = useState<string>("topRated");
  const activeData = tabData[activeTab] || [];

  return (
    <section
      className="section-featured section-pad"
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
          style={{ marginBottom: "48px" }}
        >
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}>
            <div>
              <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
                Featured Properties
              </div>
              <h2 className="type-display-2" style={{ color: "var(--ink)" }}>
                Curated{" "}
                <em style={{ fontStyle: "italic", color: "var(--gold)" }}>stays</em>{" "}
                worldwide
              </h2>
            </div>
            <Link
              href="/search"
              className="btn-outline"
              onClick={() => trackCtaClicked({ cta_name: 'view_all_hotels', cta_location: 'home_featured_section', destination_url: '/search' })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              View all
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            gap: "8px",
            borderBottom: "1px solid var(--cream-border)",
            paddingBottom: "0",
          }}>
            {FEATURED_TAB_KEYS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "10px 24px",
                  fontSize: "13px",
                  fontWeight: activeTab === tab.key ? 600 : 400,
                  letterSpacing: "0.04em",
                  color: activeTab === tab.key ? "var(--gold)" : "var(--ink-light)",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab.key ? "2px solid var(--gold)" : "2px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  marginBottom: "-1px",
                  fontFamily: "var(--font-body)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Carousel for active tab */}
        {activeData.length > 0 ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Carousel ariaLabel="Featured properties" showProgressBar>
              {activeData.map((prop) => (
                <HotelCard key={`${prop.name}-${prop.citySlug}`} hotel={prop} />
              ))}
            </Carousel>
          </motion.div>
        ) : isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ height: 320, background: "var(--cream-deep)" }} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-light)" }}>
            <p style={{ fontSize: "14px", marginBottom: "12px" }}>
              {isError ? "Unable to load featured hotels." : "No featured properties available."}
            </p>
            {isError && (
              <button
                onClick={() => window.location.reload()}
                className="btn-outline"
                style={{ fontSize: "12px", padding: "8px 20px", cursor: "pointer" }}
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// Main Page
// ============================================================================
export default function Home({ initialCities, initialFeatured }: HomePageClientProps) {
  const { checkIn, checkOut, setCheckIn, setCheckOut, formatDate } = useBooking();

  // Pre-compute initial featured tab data from server-fetched props
  const initialTabData = initialFeatured
    ? {
        topRated: initialFeatured.topRated.map(curatedToCard),
        bestValue: initialFeatured.bestValue.map(curatedToCard),
        soloTravel: initialFeatured.soloTravel.map(curatedToCard),
        familyFriendly: initialFeatured.familyFriendly.map(curatedToCard),
      }
    : { topRated: [], bestValue: [], soloTravel: [], familyFriendly: [] };

  const [cities, setCities] = useState<CuratedCity[]>(initialCities);
  const [loading, setLoading] = useState(initialCities.length === 0);
  const [heroIdx, setHeroIdx] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [featuredTabData, setFeaturedTabData] = useState<Record<string, HotelCardData[]>>(initialTabData);
  const [hotelsLoading, setHotelsLoading] = useState(!initialFeatured);
  const [hotelsError, setHotelsError] = useState(false);
  const [topSellers, setTopSellers] = useState<TopSellerHotel[]>(
    initialFeatured ? computeTopSellers(initialFeatured.topRated, 8) : []
  );
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
            hotel_count: 100 + Math.floor(Math.random() * 900),
            display_order: i + 1,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [initialCities.length]);

  // Fetch featured hotel data (only if not pre-loaded from server)
  useEffect(() => {
    if (initialFeatured) return;
    async function loadFeaturedHotels() {
      try {
        const data: FeaturedResponse = await fetchFeaturedAll();

        const allHotels = [
          ...data.topRated,
          ...data.bestValue,
          ...data.soloTravel,
          ...data.familyFriendly,
        ];

        if (allHotels.length === 0) {
          console.warn("[Voyagr] API returned no hotels for featured sections");
          setHotelsError(true);
          setHotelsLoading(false);
          return;
        }

        console.log(`[Voyagr] Loaded featured hotels from GET /api/hotels/featured`);

        // Top sellers — most booked properties
        setTopSellers(computeTopSellers(data.topRated, 8));

        // Convert each category to card data for tabs
        setFeaturedTabData({
          topRated: data.topRated.map(curatedToCard),
          bestValue: data.bestValue.map(curatedToCard),
          soloTravel: data.soloTravel.map(curatedToCard),
          familyFriendly: data.familyFriendly.map(curatedToCard),
        });
      } catch (err) {
        console.error("[Voyagr] Failed to load featured hotels:", err);
        setHotelsError(true);
      } finally {
        setHotelsLoading(false);
      }
    }
    loadFeaturedHotels();
  }, [initialFeatured]);

  // Rotate hero background
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const featured = cities.slice(0, 6);


  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", color: "var(--ink)" }}>

      {/* ================================================================
          FIXED NAV — reusable Header component
      ================================================================ */}
      <Header />

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
            className="type-eyebrow"
            style={{
              marginBottom: "20px",
            }}
          >
            Preferred Hotel Rate
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="type-display-1"
            style={{
              color: "var(--ink)",
              marginBottom: "24px",
            }}
          >
            The rates your travel agent will never show you.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="type-body-lg"
            style={{
              color: "var(--ink-light)",
              maxWidth: "380px",
              marginBottom: "40px",
            }}
          >
            Wholesale hotel pricing reserved for Voyagr Club members only.
          </motion.p>

          {/* Search bar */}
          <motion.div
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

          {/* Hero stats */}
          <motion.div
            variants={fadeUp}
            className="hero-stats"
            style={{ display: "flex", gap: "40px", marginTop: "48px" }}
          >
            {[
              { num: "1,500+", label: "Hotels" },
              { num: "50+", label: "Cities" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="type-stat" style={{
                  color: "var(--ink)",
                }}>
                  {stat.num}
                </div>
                <div className="type-label" style={{
                  color: "var(--ink-light)",
                  letterSpacing: "0.08em",
                  marginTop: "4px",
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side — hero image with overlay card */}
        <div className="hero-image" style={{ position: "relative", overflow: "hidden" }}>
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
                    filter: "saturate(0.85) brightness(0.97)",
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

          {/* Gradient overlay — blends into cream on the left edge */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to right, var(--cream) 0%, transparent 30%)",
              pointerEvents: "none",
            }}
          />

          {/* Floating savings card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            style={{
              position: "absolute",
              bottom: "40px",
              left: "-20px",
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              padding: "18px 22px",
              width: "220px",
              boxShadow: "0 8px 40px rgba(26,23,16,0.12)",
              zIndex: 3,
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)" }}>
              Siam Kempinski
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-light)", marginTop: "2px" }}>
              Bangkok, Thailand
            </div>
            <div style={{
              marginTop: "10px",
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              color: "var(--success)",
              fontWeight: 500,
            }}>
              Voyagr Rate
            </div>
            <div style={{ fontSize: "10px", color: "var(--ink-light)", marginTop: "2px" }}>
              &#8377;4,000 less per night
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          FEATURED PROPERTIES — unified tabbed carousel (GET /api/hotels/featured)
      ================================================================ */}
      <FeaturedPropertiesSection tabData={featuredTabData} isLoading={hotelsLoading} isError={hotelsError} />

      {/* ================================================================
          TOP SELLERS — most booked properties
      ================================================================ */}
      <TopSellers hotels={topSellers} />

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
                Seasonal Trips
              </div>
              <h2 className="type-display-2" style={{ color: "var(--ink)" }}>
                Travel by{" "}
                <em style={{ fontStyle: "italic", color: "var(--gold)" }}>season</em>
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
                  <em style={{ fontStyle: "italic", color: "var(--gold)" }}>city</em>
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
              Let&rsquo;s plan your <em style={{ fontStyle: "italic", color: "var(--gold)" }}>stay</em>
            </h2>
            <p className="type-body-lg" style={{
              color: "var(--ink-mid)",
              lineHeight: 1.8,
              maxWidth: "600px",
              margin: "0 auto 16px",
            }}>
              Whether it&rsquo;s a weekend escape, a business trip, or the honeymoon you&rsquo;ve been dreaming of &mdash; we&rsquo;ll
              match you with the right hotel at a rate that makes sense. No algorithms, no upsells. Just a
              concierge who listens and a network of 1,500+ partner hotels worldwide.
            </p>
            <p className="type-body" style={{
              color: "var(--ink-light)",
              lineHeight: 1.8,
              maxWidth: "540px",
              margin: "0 auto 40px",
            }}>
              Tell us where you&rsquo;re headed and when. We&rsquo;ll handle the rest &mdash; from
              sourcing the best available B2B rate to confirming your reservation within minutes
              over WhatsApp.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" as const }}>
              <a
                href="#hero-search"
                className="btn-gold"
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
              <a
                href="https://wa.me/919876543210"
                className="btn-outline"
                onClick={() => trackWhatsAppClicked({ page: 'home' })}
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
                Chat on WhatsApp
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
              Why travellers choose <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Voyagr Club</em>
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
          PRICE COMPARISON — "the proof"
      ================================================================ */}
      <section
        id="the-proof"
        className="section-proof"
        style={{
          padding: "80px 60px",
          background: "var(--white)",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            style={{ marginBottom: "48px" }}
          >
            <div className="type-eyebrow" style={{
              marginBottom: "8px",
            }}>
              The Proof
            </div>
            <h2 className="type-display-2" style={{
              color: "var(--ink)",
            }}>
              Same hotel, same room &mdash; <em style={{ fontStyle: "italic", color: "var(--gold)" }}>better rate</em>
            </h2>
          </motion.div>

          {/* Price comparison cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              {
                hotel: "Siam Kempinski Bangkok",
                city: "Bangkok, Thailand",
                stars: 5,
                tags: ["Pool", "Spa", "City Centre"],
                marketRate: 14500,
                voyagrRate: 10500,
                savePercent: 28,
                img: CITY_IMAGES.bangkok,
              },
              {
                hotel: "The Oberoi",
                city: "Mumbai, India",
                stars: 5,
                tags: ["Sea View", "Fine Dining", "Heritage"],
                marketRate: 18200,
                voyagrRate: 12800,
                savePercent: 30,
                img: CITY_IMAGES.mumbai,
              },
              {
                hotel: "Park Hyatt Tokyo",
                city: "Tokyo, Japan",
                stars: 5,
                tags: ["Skyline View", "Spa", "Shinjuku"],
                marketRate: 28000,
                voyagrRate: 19500,
                savePercent: 30,
                img: CITY_IMAGES.tokyo,
              },
            ].map((deal, i) => (
              <motion.div
                key={deal.hotel}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="price-card card-hover"
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  display: "grid",
                  gridTemplateColumns: "240px 1fr auto",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                {/* Image */}
                <div style={{ height: "180px", overflow: "hidden" }}>
                  <img
                    className="card-img"
                    src={safeImageSrc(deal.img)}
                    alt={deal.hotel}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "saturate(0.88)",
                      display: "block",
                    }}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px" }}>
                  <div style={{ color: "var(--gold)", fontSize: "11px", letterSpacing: "2px", marginBottom: "6px" }}>
                    {"★".repeat(deal.stars)}
                  </div>
                  <div className="type-heading-3" style={{
                    color: "var(--ink)",
                    marginBottom: "4px",
                  }}>
                    {deal.hotel}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--ink-light)", marginBottom: "12px" }}>
                    {deal.city}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                    {deal.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: "10px",
                          padding: "3px 10px",
                          background: "var(--cream)",
                          color: "var(--ink-mid)",
                          border: "1px solid var(--cream-border)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing panel */}
                <div className="price-panel" style={{
                  padding: "20px",
                  borderLeft: "1px solid var(--cream-border)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  minWidth: "180px",
                }}>
                  {/* Market rate */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: "var(--ink-light)", letterSpacing: "0.08em" }}>
                      MARKET RATE
                    </div>
                    <div style={{
                      fontSize: "13px",
                      textDecoration: "line-through",
                      color: "var(--market-rate)",
                    }}>
                      &#8377;{deal.marketRate.toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Voyagr rate */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase" as const,
                      color: "var(--gold)",
                    }}>
                      VOYAGR RATE
                    </div>
                    <div className="type-price" style={{
                      color: "var(--our-rate)",
                    }}>
                      &#8377;{deal.voyagrRate.toLocaleString("en-IN")}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--ink-light)" }}>
                      per night
                    </div>
                  </div>

                  {/* Save badge */}
                  <div style={{
                    background: "var(--gold-pale)",
                    color: "var(--success)",
                    fontSize: "11px",
                    fontWeight: 500,
                    padding: "4px 10px",
                    textAlign: "center",
                  }}>
                    Save {deal.savePercent}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          TESTIMONIALS
      ================================================================ */}
      <section className="section-testimonials" style={{ padding: "80px 60px", background: "var(--cream)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: "center" }}
          >
            {/* Section eyebrow */}
            <div className="type-eyebrow" style={{
              marginBottom: "24px",
            }}>
              Testimonials
            </div>

            {/* Opening quote mark */}
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontSize: "5rem",
                lineHeight: 0.5,
                color: "var(--gold)",
                opacity: 0.3,
                marginBottom: "32px",
              }}
            >
              &ldquo;
            </span>

            {/* Testimonial text */}
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={testimonialIdx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                  lineHeight: 1.6,
                  color: "var(--ink)",
                }}
              >
                {TESTIMONIALS[testimonialIdx].quote}
              </motion.blockquote>
            </AnimatePresence>

            {/* Attribution */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`attr-${testimonialIdx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  marginTop: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "var(--gold-pale)",
                    border: "1px solid var(--gold-light)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--gold)",
                    fontWeight: 500,
                  }}>
                    {TESTIMONIALS[testimonialIdx].avatar}
                  </span>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: "14px",
                    color: "var(--ink)",
                  }}>
                    {TESTIMONIALS[testimonialIdx].name}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--ink-light)",
                  }}>
                    {TESTIMONIALS[testimonialIdx].location}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation dots */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginTop: "28px",
            }}>
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  style={{
                    width: i === testimonialIdx ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background: i === testimonialIdx ? "var(--gold)" : "var(--cream-border)",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                  aria-label={`View testimonial ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          WHY BOOK WITH US — benefit highlights
      ================================================================ */}
      <section
        className="section-why-book"
        style={{
          padding: "80px 60px",
          background: "var(--cream-deep)",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: "center", marginBottom: "56px" }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "8px" }}>
              The Voyagr Club Difference
            </div>
            <h2 className="type-display-2" style={{ color: "var(--ink)" }}>
              Why book with <em style={{ fontStyle: "italic", color: "var(--gold)" }}>us?</em>
            </h2>
          </motion.div>

          <div className="why-book-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "32px",
          }}>
            {[
              {
                title: "Rates You Won\u2019t Find Online",
                desc: "Our prices come from direct B2B contracts with hotels \u2014 the same wholesale rates that travel agencies use internally. These never appear on public booking sites.",
                accent: "01",
              },
              {
                title: "No Hidden Fees, Ever",
                desc: "The price we quote is the price you pay. No resort fees tucked into the fine print, no credit-card surcharges, no last-minute \u201ctaxes\u201d at checkout.",
                accent: "02",
              },
              {
                title: "A Human, Not a Chatbot",
                desc: "Every booking is handled by a real concierge on WhatsApp. Change of plans? Need a late checkout? Just message us \u2014 no hold music, no ticket numbers.",
                accent: "03",
              },
              {
                title: "Verified Five-Star Partners",
                desc: "We only work with properties we\u2019ve vetted ourselves. Every hotel in our network meets our standards for service, cleanliness, and guest satisfaction.",
                accent: "04",
              },
              {
                title: "Flexible Cancellations",
                desc: "Plans change \u2014 we get it. Most of our partner hotels offer free cancellation up to 48 hours before check-in, and we\u2019ll always fight for the best terms on your behalf.",
                accent: "05",
              },
              {
                title: "Loyalty Without Lock-In",
                desc: "No points programmes that expire, no membership tiers to maintain. Book once or book every month \u2014 you get the same wholesale rate from day one.",
                accent: "06",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                style={{
                  padding: "32px",
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                }}
              >
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "36px",
                  fontWeight: 300,
                  color: "var(--gold)",
                  opacity: 0.35,
                  lineHeight: 1,
                  marginBottom: "16px",
                }}>
                  {item.accent}
                </div>
                <div className="type-heading-3" style={{
                  color: "var(--ink)",
                  marginBottom: "10px",
                }}>
                  {item.title}
                </div>
                <div className="type-body" style={{
                  color: "var(--ink-light)",
                  lineHeight: 1.7,
                }}>
                  {item.desc}
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
            { number: "Direct", label: "Partnerships" },
            { number: "0", label: "Booking fees", prefix: "₹" },
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
                  {stat.prefix || ""}{stat.number}
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
              Stay Updated
            </div>
            <h2 className="type-display-2" style={{ color: "var(--ink)", marginBottom: "16px" }}>
              Curated <em style={{ fontStyle: "italic", color: "var(--gold)" }}>picks</em> in your inbox
            </h2>
            <p className="type-body" style={{
              color: "var(--ink-light)",
              lineHeight: 1.7,
              marginBottom: "32px",
              maxWidth: "480px",
              margin: "0 auto 32px",
            }}>
              Get early access to new destination launches, seasonal highlights, and curated hotel picks
              delivered once a week.
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
                  Voyagr Club was built on a simple idea — luxury travel should be
                  accessible. We leverage B2B wholesale hotel networks to bring you the same
                  rooms, same dates, at rates well below what you'd find on retail booking
                  platforms.
                </p>
                <p
                  className="type-body"
                  style={{
                    color: "rgba(245, 240, 232, 0.7)",
                    lineHeight: 1.8,
                  }}
                >
                  Our curated selection spans 50+ cities worldwide — from the beaches of
                  Bali to the streets of Paris — handpicked to ensure quality, value, and
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
                    { number: "B2B", label: "Wholesale Rates" },
                    { number: "24/7", label: "WhatsApp Support" },
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
  // Generate a fake savings percentage for display
  const savePercent = 20 + Math.floor(Math.random() * 21);

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
          <span style={{
            fontSize: "11px",
            background: "var(--gold)",
            color: "var(--ink)",
            padding: "2px 8px",
            fontWeight: 500,
          }}>
            Save up to {savePercent}%
          </span>
        </div>
      </div>
    </Link>
  );
}

