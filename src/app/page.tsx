"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CONTINENTS, CATEGORIES, SAMPLE_CITIES } from "@/lib/constants";
import { fetchCuratedCities, CuratedCity } from "@/lib/api";
import MobileNav from "@/components/MobileNav";

// ---------------------------------------------------------------------------
// Hero background images (cinematic hotel/travel shots)
// ---------------------------------------------------------------------------
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1920&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80",
];

// ---------------------------------------------------------------------------
// City image map
// ---------------------------------------------------------------------------
const cityImages: Record<string, string> = {
  bangkok: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=800&q=80",
  tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
  "new-york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
  rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
  phuket: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=800&q=80",
  sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80",
  mumbai: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
  delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
  seoul: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800&q=80",
  "hong-kong": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=800&q=80",
  amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80",
  prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=80",
  budapest: "https://images.unsplash.com/photo-1549877452-9c387954fbc2?w=800&q=80",
  marrakech: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&q=80",
  "cape-town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=80",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=80",
  jaipur: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80",
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
  osaka: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80",
  hanoi: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
  lisbon: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
  vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&q=80",
  florence: "https://images.unsplash.com/photo-1543429258-0a3e78096a93?w=800&q=80",
  berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&q=80",
  "kuala-lumpur": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80",
  athens: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&q=80",
  santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=80",
  milan: "https://images.unsplash.com/photo-1520440229-6469d1bfe80a?w=800&q=80",
  melbourne: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&q=80",
  "rio-de-janeiro": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
  cancun: "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=800&q=80",
  "mexico-city": "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=800&q=80",
  colombo: "https://images.unsplash.com/photo-1586211082529-c2fc67e099b9?w=800&q=80",
  kathmandu: "https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=800&q=80",
  "ho-chi-minh-city": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
  "buenos-aires": "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=800&q=80",
  "chiang-mai": "https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=800&q=80",
  pattaya: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&q=80",
  kyoto: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
  taipei: "https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&q=80",
  geneva: "https://images.unsplash.com/photo-1573108037329-37aa135a142e?w=800&q=80",
  lima: "https://images.unsplash.com/photo-1531968455001-5c5272a67c71?w=800&q=80",
  edinburgh: "https://images.unsplash.com/photo-1454537468202-b7ff71d51c2e?w=800&q=80",
  dublin: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

function getCityImage(slug: string): string {
  return cityImages[slug] || FALLBACK_IMAGE;
}

function safeImageSrc(url: string): string {
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
    quote: "I booked the same suite I found on Booking.com and saved over four thousand rupees a night. I genuinely did not believe it until I checked in.",
    name: "Priya Mehta",
    location: "Mumbai",
    avatar: "PM",
  },
  {
    quote: "We planned our honeymoon across three cities. Voyagr saved us enough to add an extra night in Santorini. That is not an exaggeration.",
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
    desc: "Save 20-40% on every booking. Same hotel, same room, same dates. Just a better rate.",
  },
];

// ============================================================================
// Main Page
// ============================================================================
export default function Home() {
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [activeContinent, setActiveContinent] = useState<string>("All");
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Fetch cities
  useEffect(() => {
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
  }, []);

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
  const totalCities = cities.length;

  // Group cities by continent for sub-division display
  const filteredCities = activeContinent === "All"
    ? cities
    : cities.filter((c) => c.continent === activeContinent);

  const continentGroups = filteredCities.reduce<Record<string, CuratedCity[]>>((acc, city) => {
    const cont = city.continent || "Other";
    if (!acc[cont]) acc[cont] = [];
    acc[cont].push(city);
    return acc;
  }, {});

  // Order continents consistently
  const continentOrder = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Other"];
  const sortedContinents = continentOrder.filter((c) => continentGroups[c]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", color: "var(--ink)" }}>

      {/* ================================================================
          FIXED NAV — frosted cream glass
      ================================================================ */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(245, 240, 232, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--cream-border)",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              color: "var(--ink)",
              fontStyle: "italic",
            }}
          >
            <span style={{ color: "var(--gold)" }}>V</span>oyagr
          </span>
        </Link>

        {/* Nav links + basket */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            className="nav-links"
            style={{ display: "flex", gap: "24px", alignItems: "center" }}
          >
            {[
              { label: "HOME", href: "/" },
              { label: "SEARCH", href: "#search" },
              { label: "ACCOUNT", href: "#account" },
              { label: "PREFERRED RATES", href: "#preferred-rates" },
              { label: "MATCH MY PRICE", href: "#match-my-price" },
              { label: "BOOKING HISTORY", href: "#booking-history" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase" as const,
                  color: "var(--ink-mid)",
                  textDecoration: "none",
                  paddingBottom: "2px",
                  borderBottom: "1px solid transparent",
                  transition: "color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLAnchorElement).style.color = "var(--gold)";
                  (e.target as HTMLAnchorElement).style.borderBottomColor = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLAnchorElement).style.color = "var(--ink-mid)";
                  (e.target as HTMLAnchorElement).style.borderBottomColor = "transparent";
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Basket icon */}
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "var(--ink)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "var(--ink)";
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>

          {/* Mobile hamburger menu */}
          <MobileNav
            links={[
              { label: "Home", href: "/" },
              { label: "Search", href: "#search" },
              { label: "Account", href: "#account" },
              { label: "Preferred Rates", href: "#preferred-rates" },
              { label: "Match My Price", href: "#match-my-price" },
              { label: "Booking History", href: "#booking-history" },
            ]}
          />
        </div>
      </nav>

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
            style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: "var(--gold)",
              marginBottom: "20px",
            }}
          >
            Preferred Hotel Rate
          </motion.p>

          <motion.h1
            variants={fadeUp}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(42px, 5vw, 68px)",
              fontWeight: 300,
              lineHeight: 1.1,
              color: "var(--ink)",
              marginBottom: "24px",
            }}
          >
            The rates hotels{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
              don&apos;t want
            </em>{" "}
            you to see
          </motion.h1>

          <motion.p
            variants={fadeUp}
            style={{
              fontSize: "15px",
              fontWeight: 300,
              color: "var(--ink-light)",
              lineHeight: 1.7,
              maxWidth: "380px",
              marginBottom: "40px",
              fontFamily: "var(--font-body)",
            }}
          >
            B2B wholesale pricing on 1,500+ hotels across 50 cities.
            Save 20&ndash;40% on every booking. No markup, no hidden fees.
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
            {/* Destination field */}
            <div
              className="search-field"
              style={{
                padding: "12px 16px",
                borderRight: "1px solid var(--cream-border)",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                color: "var(--ink-light)",
                marginBottom: "3px",
              }}>
                DESTINATION
              </div>
              <input
                type="text"
                placeholder="City or hotel"
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: "var(--ink)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                  width: "100%",
                  outline: "none",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim().toLowerCase();
                    if (val) {
                      const slug = val.replace(/\s+/g, "-");
                      window.location.href = `/city/${slug}`;
                    }
                  }
                }}
              />
            </div>

            {/* Check in */}
            <div
              className="search-field"
              style={{
                padding: "12px 16px",
                borderRight: "1px solid var(--cream-border)",
                cursor: "pointer",
              }}
            >
              <div style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                color: "var(--ink-light)",
                marginBottom: "3px",
              }}>
                CHECK IN
              </div>
              <div style={{ fontSize: "13px", color: "var(--ink-light)", fontWeight: 400 }}>
                Select date
              </div>
            </div>

            {/* Check out */}
            <div
              className="search-field"
              style={{
                padding: "12px 16px",
                cursor: "pointer",
              }}
            >
              <div style={{
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.16em",
                textTransform: "uppercase" as const,
                color: "var(--ink-light)",
                marginBottom: "3px",
              }}>
                CHECK OUT
              </div>
              <div style={{ fontSize: "13px", color: "var(--ink-light)", fontWeight: 400 }}>
                Select date
              </div>
            </div>

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
              { num: "50+", label: "Destinations" },
              { num: "1,500+", label: "Hotels" },
              { num: "20-40%", label: "Average savings" },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "var(--ink)",
                  lineHeight: 1,
                }}>
                  {stat.num}
                </div>
                <div style={{
                  fontSize: "10px",
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
                    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
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
              Save 28%
            </div>
            <div style={{ fontSize: "10px", color: "var(--ink-light)", marginTop: "2px" }}>
              &#8377;4,000 saved per night
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================
          FEATURED HOTELS — asymmetric grid
      ================================================================ */}
      <section className="section-featured" style={{ padding: "100px 60px 80px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          {/* Section header */}
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
              <div style={{
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.22em",
                textTransform: "uppercase" as const,
                color: "var(--gold)",
                marginBottom: "8px",
              }}>
                Featured Properties
              </div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3vw, 40px)",
                fontWeight: 400,
                lineHeight: 1.15,
                color: "var(--ink)",
              }}>
                Curated <em style={{ fontStyle: "italic", color: "var(--gold)" }}>stays</em> worldwide
              </h2>
            </div>
            <Link
              href="#destinations"
              className="btn-outline"
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
          </motion.div>

          {/* Hotel grid — asymmetric 2fr 1fr 1fr, 2 rows */}
          {loading ? (
            <div className="featured-grid" style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gridTemplateRows: "260px 260px",
              gap: "12px",
            }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="shimmer"
                  style={{
                    gridRow: i === 0 ? "span 2" : undefined,
                    minHeight: i === 0 ? "520px" : "200px",
                    background: "var(--cream-deep)",
                  }}
                />
              ))}
            </div>
          ) : (
            <motion.div
              className="featured-grid"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr",
                gridTemplateRows: "auto auto",
                gap: "12px",
              }}
            >
              {featured.slice(0, 5).map((city, i) => (
                <HotelCard
                  key={city.city_slug}
                  city={city}
                  isLarge={i === 0}
                />
              ))}
            </motion.div>
          )}
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
          padding: "96px 60px",
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
            <div style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: "var(--gold)",
              marginBottom: "8px",
            }}>
              How It Works
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3vw, 40px)",
              fontWeight: 400,
              lineHeight: 1.15,
              color: "var(--cream)",
            }}>
              Why travellers choose <em style={{ fontStyle: "italic", color: "var(--gold)" }}>Voyagr</em>
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
          DESTINATIONS — city cards grouped by continent sub-divisions
      ================================================================ */}
      <section
        id="destinations"
        className="section-destinations"
        style={{ padding: "80px 60px" }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              marginBottom: "48px",
            }}
          >
            <div>
              <div style={{
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.22em",
                textTransform: "uppercase" as const,
                color: "var(--gold)",
                marginBottom: "8px",
              }}>
                Destinations
              </div>
              <h2 style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(28px, 3vw, 40px)",
                fontWeight: 400,
                lineHeight: 1.15,
                color: "var(--ink)",
              }}>
                Explore{" "}
                <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
                  {totalCities > 0 ? totalCities : 50}
                </em>{" "}
                curated cities
              </h2>
            </div>

            {/* Continent filter pills */}
            <div
              className="continent-pills"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {CONTINENTS.map((cont) => (
                <button
                  key={cont}
                  onClick={() => setActiveContinent(cont)}
                  style={{
                    padding: "8px 20px",
                    fontSize: "12px",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                    border: "1px solid",
                    borderColor: activeContinent === cont ? "var(--gold)" : "var(--cream-border)",
                    background: activeContinent === cont ? "var(--gold)" : "transparent",
                    color: activeContinent === cont ? "var(--white)" : "var(--ink-mid)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {cont}
                </button>
              ))}
            </div>
          </motion.div>

          {/* City cards — grouped by continent sub-divisions */}
          {loading ? (
            <div className="destinations-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="shimmer"
                  style={{ height: "320px", background: "var(--cream-deep)" }}
                />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeContinent}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                style={{ display: "flex", flexDirection: "column", gap: "56px" }}
              >
                {sortedContinents.map((continent) => (
                  <div key={continent}>
                    {/* Continent sub-division header */}
                    {activeContinent === "All" && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "24px",
                      }}>
                        <h3 style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "22px",
                          fontWeight: 400,
                          fontStyle: "italic",
                          color: "var(--ink)",
                          whiteSpace: "nowrap",
                        }}>
                          {continent}
                        </h3>
                        <div style={{
                          flex: 1,
                          height: "1px",
                          background: "var(--cream-border)",
                        }} />
                        <span style={{
                          fontSize: "11px",
                          color: "var(--ink-light)",
                          letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}>
                          {continentGroups[continent].length} {continentGroups[continent].length === 1 ? "city" : "cities"}
                        </span>
                      </div>
                    )}

                    {/* City cards grid */}
                    <div
                      className="destinations-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "20px",
                      }}
                    >
                      {continentGroups[continent].map((city) => (
                        <DestinationCard key={city.city_slug} city={city} />
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
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
            <div style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: "var(--gold)",
              marginBottom: "8px",
            }}>
              The Proof
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3vw, 40px)",
              fontWeight: 400,
              lineHeight: 1.15,
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
                img: cityImages.bangkok,
              },
              {
                hotel: "The Oberoi",
                city: "Mumbai, India",
                stars: 5,
                tags: ["Sea View", "Fine Dining", "Heritage"],
                marketRate: 18200,
                voyagrRate: 12800,
                savePercent: 30,
                img: cityImages.mumbai,
              },
              {
                hotel: "Park Hyatt Tokyo",
                city: "Tokyo, Japan",
                stars: 5,
                tags: ["Skyline View", "Spa", "Shinjuku"],
                marketRate: 28000,
                voyagrRate: 19500,
                savePercent: 30,
                img: cityImages.tokyo,
              },
            ].map((deal, i) => (
              <motion.div
                key={deal.hotel}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="price-card"
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  display: "grid",
                  gridTemplateColumns: "240px 1fr auto",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}
                whileHover={{
                  boxShadow: "0 4px 24px rgba(26,23,16,0.08)",
                }}
              >
                {/* Image */}
                <div style={{ height: "180px", overflow: "hidden" }}>
                  <img
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
                  <div style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "20px",
                    fontWeight: 400,
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
                      color: "var(--ink-light)",
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
                    <div style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "28px",
                      fontWeight: 500,
                      color: "var(--ink)",
                      lineHeight: 1.1,
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
      <section className="section-testimonials" style={{ padding: "100px 60px", background: "var(--cream)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: "center" }}
          >
            {/* Section eyebrow */}
            <div style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: "var(--gold)",
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
            { number: "20-40%", label: "Savings" },
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
                <div style={{
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
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
          FOOTER — minimal, elegant
      ================================================================ */}
      <footer
        className="site-footer"
        style={{
          padding: "60px 60px 96px",
          background: "var(--cream)",
          borderTop: "1px solid var(--cream-border)",
        }}
      >
        <div
          className="footer-inner"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap" as const,
            gap: "24px",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: "22px",
              color: "var(--ink)",
              letterSpacing: "0.08em",
            }}>
              <span style={{ color: "var(--gold)" }}>V</span>oyagr
            </span>
          </Link>

          {/* Footer links */}
          <div className="footer-links" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {[
              { label: "Destinations", href: "#destinations" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "WhatsApp", href: "https://wa.me/919876543210" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  color: "var(--ink-light)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLAnchorElement).style.color = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLAnchorElement).style.color = "var(--ink-light)";
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--ink-light)",
            letterSpacing: "0.05em",
          }}>
            &copy; 2026 Voyagr
          </p>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Hotel Card — for the featured asymmetric grid
// ============================================================================
function HotelCard({
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
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.6s ease",
          display: "block",
          minHeight: "200px",
        }}
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLImageElement).style.transform = "scale(1.04)";
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLImageElement).style.transform = "scale(1)";
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
        <div style={{
          fontFamily: "var(--font-display)",
          fontSize: isLarge ? "26px" : "22px",
          fontWeight: 400,
          fontStyle: "italic",
          lineHeight: 1.2,
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

// ============================================================================
// Destination Card — clean white card with cream border
// ============================================================================
function DestinationCard({ city }: { city: CuratedCity }) {
  const img = getCityImage(city.city_slug);

  return (
    <Link
      href={`/city/${city.city_slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          background: "var(--white)",
          border: "1px solid var(--cream-border)",
          overflow: "hidden",
          cursor: "pointer",
          transition: "box-shadow 0.3s, border-color 0.3s",
        }}
        whileHover={{
          boxShadow: "0 8px 32px rgba(26,23,16,0.08)",
        }}
      >
        {/* Image */}
        <div style={{ height: "220px", overflow: "hidden" }}>
          <img
            src={safeImageSrc(img)}
            alt={city.city_name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.6s ease",
              display: "block",
              filter: "saturate(0.88)",
            }}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "20px 24px 28px" }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: "22px",
            fontWeight: 400,
            color: "var(--ink)",
            lineHeight: 1.2,
            marginBottom: "4px",
          }}>
            {city.city_name}
          </h3>
          <p style={{
            fontSize: "12px",
            color: "var(--ink-light)",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}>
            {city.country}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{
              fontSize: "11px",
              color: "var(--ink-light)",
              fontWeight: 400,
            }}>
              {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore stays"}
            </span>
            <span style={{
              fontSize: "11px",
              color: "var(--gold)",
              fontWeight: 500,
              letterSpacing: "0.06em",
            }}>
              View &rarr;
            </span>
          </div>
          {/* Divider */}
          <div style={{
            width: "40px",
            height: "1px",
            background: "var(--gold)",
            marginTop: "12px",
          }} />
        </div>
      </motion.div>
    </Link>
  );
}
