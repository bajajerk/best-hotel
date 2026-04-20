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
import RecommendationHub from "@/components/RecommendationHub";
import OccasionCarousel from "@/components/OccasionCarousel";
import FeaturedDestinationsGrid from "@/components/FeaturedDestinationsGrid";
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
                Handpicked{" "}
                <em style={{ fontStyle: "italic", color: "var(--gold)" }}>experiences</em>{" "}
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
            Voyagr Club
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="type-display-1"
            style={{
              color: "var(--ink)",
              marginBottom: "24px",
            }}
          >
            Preferred access to hotels that turn every stay into an unforgettable experience.
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="type-body-lg"
            style={{
              color: "var(--ink-light)",
              maxWidth: "420px",
              marginBottom: "32px",
            }}
          >
            Enjoy preferred rates at distinguished hotels in over 50 cities worldwide, with uncompromised room quality and a thoughtfully curated travel experience.
          </motion.p>

          {/* Join Free CTA + micro-copy */}
          <motion.div variants={fadeUp} style={{ marginBottom: "32px" }}>
            <a
              href="https://wa.me/919876543210?text=Hi%2C%20I%27d%20like%20to%20join%20Voyagr%20Club"
              className="btn-emerald"
              onClick={() => trackCtaClicked({ cta_name: 'join_free_hero', cta_location: 'hero', destination_url: 'whatsapp' })}
              style={{
                padding: "16px 40px",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Join Free &rarr; Begin Your Journey
            </a>
            <p style={{
              fontSize: "11px",
              color: "var(--ink-light)",
              marginTop: "14px",
              letterSpacing: "0.02em",
              lineHeight: 1.6,
            }}>
              Free forever &bull; No annual fees &bull; 24/7 personal concierge &bull; Perks included on every stay
            </p>
          </motion.div>

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

          {/* Floating perks card */}
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
              width: "240px",
              boxShadow: "0 8px 40px rgba(26,23,16,0.12)",
              zIndex: 3,
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink)" }}>
              The Ritz-Carlton, Bali
            </div>
            <div style={{ fontSize: "11px", color: "var(--ink-light)", marginTop: "2px" }}>
              Member Perks Included
            </div>
            <div style={{
              marginTop: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}>
              {["Room upgrade", "Late checkout", "Welcome drinks"].map((perk) => (
                <div key={perk} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--ink-mid)" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          FEATURED PROPERTIES — unified tabbed carousel (GET /api/hotels/featured)
      ================================================================ */}
      <FeaturedPropertiesSection tabData={featuredTabData} isLoading={hotelsLoading} isError={hotelsError} />

      {/* ================================================================
          FEATURED DESTINATIONS — curated hotel card grid
      ================================================================ */}
      <FeaturedDestinationsGrid />

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

