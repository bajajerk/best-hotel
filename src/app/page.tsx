"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CONTINENTS, CATEGORIES, SAMPLE_CITIES } from "@/lib/constants";
import { fetchCuratedCities, CuratedCity } from "@/lib/api";

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
// Orchestrated entrance animation
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
    quote: "We planned our honeymoon across three cities. BeatMyRate saved us enough to add an extra night in Santorini. That is not an exaggeration.",
    name: "Arjun & Kavya",
    location: "Bangalore",
    avatar: "AK",
  },
  {
    quote: "As a travel agent myself, I was skeptical. These are genuine B2B rates. I now use BeatMyRate for all my personal trips.",
    name: "Rahul Sharma",
    location: "Delhi",
    avatar: "RS",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
export default function Home() {
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
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

  const featured = cities.slice(0, 6);
  const totalCities = cities.length;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO (100vh, full-bleed cinematic)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ height: "100vh", minHeight: "700px" }}
      >
        {/* Parallax crossfading backgrounds */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <AnimatePresence mode="sync">
            {HERO_IMAGES.map((src, i) =>
              i === heroIdx ? (
                <motion.div
                  key={src}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ minHeight: "120%" }}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </motion.div>

        {/* Gradient overlay — heavy from bottom for text legibility */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `
              linear-gradient(to bottom,
                rgba(12,10,9,0.25) 0%,
                rgba(12,10,9,0.1) 30%,
                rgba(12,10,9,0.4) 55%,
                rgba(12,10,9,0.85) 80%,
                rgba(12,10,9,1) 100%)
            `,
          }}
        />

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-20 pt-8 md:pt-10"
          style={{ opacity: heroOpacity as unknown as number }}
        >
          <Link href="/" className="flex items-center gap-2">
            <span
              className="text-2xl md:text-3xl tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--text-primary)",
              }}
            >
              beatmyrate
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <Link
              href="#destinations"
              className="text-sm hidden md:block transition-opacity duration-300 hover:opacity-100"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
                fontWeight: 300,
              }}
            >
              Destinations
            </Link>
            <Link
              href="#the-proof"
              className="text-sm hidden md:block transition-opacity duration-300 hover:opacity-100"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-body)",
                fontWeight: 300,
              }}
            >
              Pricing
            </Link>
            <a
              href="tel:+919876543210"
              className="text-sm transition-opacity duration-300 hover:opacity-80"
              style={{
                color: "var(--accent)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
              }}
            >
              Call to book
            </a>
          </div>
        </motion.nav>

        {/* Hero content — centered, dramatic */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center px-6"
          style={{ height: "calc(100% - 80px)", opacity: heroOpacity as unknown as number }}
          variants={orchestrate}
          initial="hidden"
          animate="visible"
        >
          <div className="text-center" style={{ maxWidth: "1100px" }}>
            {/* Main headline — the magazine moment */}
            <motion.h1
              variants={fadeUp}
              className="leading-[0.9] tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--text-primary)",
                fontSize: "clamp(2.5rem, 8vw, 8rem)",
              }}
            >
              the rates hotels
              <br />
              <span style={{ color: "var(--accent)" }}>don&apos;t want</span> you to see
            </motion.h1>

            {/* Subtitle — small mono, understated */}
            <motion.p
              variants={fadeUp}
              className="mt-8 md:mt-10 tracking-wide"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                color: "var(--text-tertiary)",
                maxWidth: "480px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              B2B wholesale pricing on 1,500+ hotels across 50 cities. Save 20&ndash;40% on every booking.
            </motion.p>

            {/* Search input — frosted glass */}
            <motion.div
              variants={fadeUp}
              className="mt-10 md:mt-14 mx-auto w-full"
              style={{ maxWidth: "560px" }}
            >
              <div
                className="flex items-center rounded-full px-6 py-4 gap-4"
                style={{
                  background: "rgba(245, 240, 235, 0.06)",
                  backdropFilter: "blur(24px)",
                  WebkitBackdropFilter: "blur(24px)",
                  border: "1px solid rgba(245, 240, 235, 0.1)",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-tertiary)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Where to? Try Bangkok, Bali, Paris..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 300,
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
            </motion.div>
          </div>

          {/* Scroll indicator — thin animated line */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="absolute bottom-12 flex flex-col items-center"
          >
            <div
              className="relative overflow-hidden"
              style={{ width: "1px", height: "48px", background: "var(--text-ghost)" }}
            >
              <motion.div
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "1px",
                  height: "50%",
                  background: "var(--accent)",
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — EDITORIAL STRIP: "How we work differently"
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="how-it-works"
        style={{ paddingTop: "160px", paddingBottom: "160px" }}
      >
        {/* Step 1 — Left text, right image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row items-center"
          style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}
        >
          {/* Text block */}
          <div className="lg:w-[40%] relative" style={{ padding: "0 24px 0 0" }}>
            <span
              className="block absolute"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(120px, 15vw, 200px)",
                fontWeight: 300,
                color: "var(--accent)",
                opacity: 0.08,
                lineHeight: 0.85,
                top: "-40px",
                left: "-20px",
                userSelect: "none",
              }}
            >
              01
            </span>
            <div className="relative">
              <p
                className="mb-4"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                }}
              >
                Browse
              </p>
              <h3
                className="mb-6"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                  lineHeight: 1.1,
                  color: "var(--text-primary)",
                }}
              >
                Handpicked stays across fifty cities
              </h3>
              <p
                className="leading-relaxed"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 300,
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  maxWidth: "380px",
                }}
              >
                Every hotel in our collection has been vetted for quality, location,
                and value. Filtered for singles, couples, or families — so you never
                wade through irrelevant options.
              </p>
            </div>
          </div>

          {/* Image block */}
          <div
            className="lg:w-[60%] mt-10 lg:mt-0 overflow-hidden rounded-sm"
            style={{ aspectRatio: "16/10" }}
          >
            <img
              src={safeImageSrc(EDITORIAL_IMAGES[0])}
              alt="Luxury hotel pool at sunset"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
          </div>
        </motion.div>

        {/* Step 2 — Reversed: left image, right text */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col lg:flex-row-reverse items-center"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 24px",
            marginTop: "120px",
          }}
        >
          <div className="lg:w-[40%] relative" style={{ padding: "0 0 0 24px" }}>
            <span
              className="block absolute"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(120px, 15vw, 200px)",
                fontWeight: 300,
                color: "var(--accent)",
                opacity: 0.08,
                lineHeight: 0.85,
                top: "-40px",
                right: "-20px",
                userSelect: "none",
              }}
            >
              02
            </span>
            <div className="relative">
              <p
                className="mb-4"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                }}
              >
                Compare
              </p>
              <h3
                className="mb-6"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                  lineHeight: 1.1,
                  color: "var(--text-primary)",
                }}
              >
                See the rate travel agents pay
              </h3>
              <p
                className="leading-relaxed"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 300,
                  fontSize: "0.95rem",
                  color: "var(--text-secondary)",
                  maxWidth: "380px",
                }}
              >
                We reveal B2B wholesale pricing that is normally hidden behind agency
                logins. The same room, same dates — just without the 30% markup that
                OTAs quietly add.
              </p>
            </div>
          </div>

          <div
            className="lg:w-[60%] mt-10 lg:mt-0 overflow-hidden rounded-sm"
            style={{ aspectRatio: "16/10" }}
          >
            <img
              src={safeImageSrc(EDITORIAL_IMAGES[1])}
              alt="Grand hotel lobby interior"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
          </div>
        </motion.div>

        {/* Step 3 — Full width */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 24px",
            marginTop: "120px",
          }}
        >
          <div className="relative overflow-hidden rounded-sm" style={{ aspectRatio: "21/9" }}>
            <img
              src={safeImageSrc(EDITORIAL_IMAGES[2])}
              alt="Oceanfront resort at twilight"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
              }}
            />
            {/* Gradient overlay for text */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(12,10,9,0.85) 0%, rgba(12,10,9,0.4) 50%, transparent 100%)",
              }}
            />
            <div
              className="absolute inset-0 flex flex-col justify-center"
              style={{ padding: "clamp(32px, 5vw, 80px)" }}
            >
              <span
                className="block absolute"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(120px, 15vw, 200px)",
                  fontWeight: 300,
                  color: "var(--accent)",
                  opacity: 0.12,
                  lineHeight: 0.85,
                  top: "20px",
                  left: "40px",
                  userSelect: "none",
                }}
              >
                03
              </span>
              <div className="relative" style={{ maxWidth: "420px" }}>
                <p
                  className="mb-4"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                  }}
                >
                  Book
                </p>
                <h3
                  className="mb-6"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontWeight: 300,
                    fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                    lineHeight: 1.1,
                    color: "var(--text-primary)",
                  }}
                >
                  One call, and it&apos;s yours
                </h3>
                <p
                  className="leading-relaxed"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 300,
                    fontSize: "0.95rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Call or WhatsApp us. We confirm availability in minutes and lock in
                  your B2B rate. Zero booking fees, zero surprises.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — FEATURED DESTINATIONS (masonry-ish layout)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="destinations"
        style={{ paddingTop: "120px", paddingBottom: "120px" }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-16 md:mb-20"
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(3rem, 6vw, 5.5rem)",
                lineHeight: 0.95,
                color: "var(--text-primary)",
              }}
            >
              destinations
            </h2>
            <p
              className="mt-5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                color: "var(--text-tertiary)",
              }}
            >
              {totalCities > 0 ? `${totalCities} cities` : "50 cities"} across six continents, curated for you
            </p>
          </motion.div>

          {/* Masonry-ish grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-sm shimmer"
                  style={{
                    height: i < 2 ? "400px" : "320px",
                    gridColumn: i === 0 ? "span 2" : undefined,
                  }}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6 }}
            >
              {/* Row 1: 1 large (2 cols) + 1 tall (1 col) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {featured.slice(0, 2).map((city, i) => (
                  <DestinationCard
                    key={city.city_slug}
                    city={city}
                    tall={i === 1}
                    wide={i === 0}
                  />
                ))}
              </div>
              {/* Row 2: 3 equal cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {featured.slice(2, 5).map((city) => (
                  <DestinationCard
                    key={city.city_slug}
                    city={city}
                  />
                ))}
                {featured[5] && (
                  <DestinationCard
                    key={featured[5].city_slug}
                    city={featured[5]}
                  />
                )}
              </div>
            </motion.div>
          )}

          {/* View all link */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-14 md:mt-16"
          >
            <Link
              href="#destinations"
              className="inline-flex items-center gap-3 group"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                fontSize: "0.95rem",
                color: "var(--text-secondary)",
              }}
            >
              <span className="transition-colors duration-300 group-hover:text-[var(--accent)]">
                View all {totalCities || 50} cities
              </span>
              <span
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: "var(--accent)" }}
              >
                &rarr;
              </span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — PRICE COMPARISON: "the proof"
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="the-proof"
        style={{
          paddingTop: "120px",
          paddingBottom: "120px",
          background: "var(--bg-surface)",
        }}
      >
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="mb-16 md:mb-20"
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "clamp(3rem, 6vw, 5.5rem)",
                lineHeight: 0.95,
                color: "var(--text-primary)",
              }}
            >
              the proof
            </h2>
            <p
              className="mt-5"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                color: "var(--text-tertiary)",
              }}
            >
              same hotel, same room, same dates &mdash; just a better rate
            </p>
          </motion.div>

          {/* Featured comparison — large */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row gap-0 overflow-hidden rounded-sm"
            style={{ background: "var(--bg-deep)" }}
          >
            {/* Hotel image */}
            <div className="lg:w-[45%] relative overflow-hidden" style={{ minHeight: "340px" }}>
              <img
                src="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80"
                alt="Siam Kempinski Bangkok"
                className="w-full h-full object-cover absolute inset-0"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
            </div>
            {/* Price details */}
            <div
              className="lg:w-[55%] flex flex-col justify-center"
              style={{ padding: "clamp(32px, 5vw, 64px)" }}
            >
              <p
                className="mb-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                }}
              >
                Bangkok, Thailand
              </p>
              <h3
                className="mb-10"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 300,
                  fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                  lineHeight: 1.15,
                  color: "var(--text-primary)",
                }}
              >
                Siam Kempinski Bangkok
              </h3>

              <div className="flex items-end gap-10 mb-8 flex-wrap">
                <div>
                  <p
                    className="mb-2"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    OTA price
                  </p>
                  <p
                    className="line-through"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 300,
                      fontSize: "clamp(1.5rem, 2.5vw, 2.2rem)",
                      color: "var(--danger)",
                    }}
                  >
                    &#8377;14,500
                  </p>
                </div>
                <div>
                  <p
                    className="mb-2"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "var(--success)",
                    }}
                  >
                    Our rate
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 300,
                      fontSize: "clamp(2rem, 4vw, 3.5rem)",
                      color: "var(--success)",
                      lineHeight: 1,
                    }}
                  >
                    &#8377;10,500
                  </p>
                </div>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                  fontSize: "0.9rem",
                  color: "var(--accent)",
                }}
              >
                You save &#8377;4,000 per night
              </p>
            </div>
          </motion.div>

          {/* Two smaller comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[
              {
                hotel: "The Oberoi",
                city: "Mumbai",
                ota: 18200,
                our: 12800,
                saved: 5400,
                img: cityImages.mumbai,
              },
              {
                hotel: "Park Hyatt",
                city: "Tokyo",
                ota: 28000,
                our: 19500,
                saved: 8500,
                img: cityImages.tokyo,
              },
            ].map((deal, i) => (
              <motion.div
                key={deal.hotel}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="flex flex-col sm:flex-row overflow-hidden rounded-sm"
                style={{ background: "var(--bg-deep)" }}
              >
                <div className="sm:w-[40%] relative overflow-hidden" style={{ minHeight: "200px" }}>
                  <img
                    src={safeImageSrc(deal.img)}
                    alt={deal.hotel}
                    className="w-full h-full object-cover absolute inset-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
                <div className="sm:w-[60%] p-6 md:p-8 flex flex-col justify-center">
                  <p
                    className="mb-1"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.6rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {deal.city}
                  </p>
                  <h4
                    className="mb-5"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 300,
                      fontSize: "1.3rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {deal.hotel}
                  </h4>
                  <div className="flex items-end gap-6 mb-3">
                    <p
                      className="line-through"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 300,
                        fontSize: "1.1rem",
                        color: "var(--danger)",
                      }}
                    >
                      &#8377;{deal.ota.toLocaleString("en-IN")}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontWeight: 300,
                        fontSize: "1.6rem",
                        color: "var(--success)",
                        lineHeight: 1,
                      }}
                    >
                      &#8377;{deal.our.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 300,
                      fontSize: "0.8rem",
                      color: "var(--accent)",
                    }}
                  >
                    Save &#8377;{deal.saved.toLocaleString("en-IN")}/night
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5 — SOCIAL PROOF (single powerful testimonial)
      ═══════════════════════════════════════════════════════════════════ */}
      <section style={{ paddingTop: "140px", paddingBottom: "140px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            {/* Opening quote mark */}
            <span
              className="block mb-8"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "5rem",
                lineHeight: 0.5,
                color: "var(--accent)",
                opacity: 0.3,
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
                  color: "var(--text-primary)",
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
                className="mt-10 flex items-center justify-center gap-4"
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "var(--accent-soft)",
                    border: "1px solid var(--accent-border)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "var(--accent)",
                    }}
                  >
                    {TESTIMONIALS[testimonialIdx].avatar}
                  </span>
                </div>
                <div className="text-left">
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 400,
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {TESTIMONIALS[testimonialIdx].name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "var(--text-tertiary)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {TESTIMONIALS[testimonialIdx].location}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation dots */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className="transition-all duration-300"
                  style={{
                    width: i === testimonialIdx ? "24px" : "6px",
                    height: "6px",
                    borderRadius: "3px",
                    background:
                      i === testimonialIdx
                        ? "var(--accent)"
                        : "var(--text-ghost)",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label={`View testimonial ${i + 1}`}
                />
              ))}
            </div>

            {/* Stat */}
            <p
              className="mt-12"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                letterSpacing: "0.1em",
                color: "var(--text-tertiary)",
              }}
            >
              2,340+ happy travellers and counting
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6 — TRUST BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          paddingTop: "80px",
          paddingBottom: "80px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}
          className="flex flex-wrap items-center justify-center gap-y-8"
        >
          {[
            { number: "50+", label: "cities" },
            { number: "1,500+", label: "hotels" },
            { number: "20-40%", label: "savings" },
            { number: "0", label: "fees" },
          ].map((stat, i, arr) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center"
            >
              <div className="text-center px-8 md:px-12">
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 300,
                    fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
                    color: "var(--text-primary)",
                    lineHeight: 1,
                  }}
                >
                  {stat.label === "fees" ? (
                    <>
                      &#8377;{stat.number}
                    </>
                  ) : (
                    stat.number
                  )}
                </p>
                <p
                  className="mt-2"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {stat.label}
                </p>
              </div>
              {i < arr.length - 1 && (
                <div
                  className="hidden md:block"
                  style={{
                    width: "1px",
                    height: "48px",
                    background: "var(--border)",
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7 — FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer
        style={{
          paddingTop: "80px",
          paddingBottom: "80px",
        }}
      >
        <div
          style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 24px" }}
          className="flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <Link href="/">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
                fontSize: "1.5rem",
                color: "var(--text-primary)",
              }}
            >
              beatmyrate
            </span>
          </Link>

          <div className="flex items-center gap-8">
            <Link
              href="#destinations"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                fontSize: "0.8rem",
                color: "var(--text-tertiary)",
              }}
              className="transition-colors duration-300 hover:text-[var(--text-secondary)]"
            >
              Destinations
            </Link>
            <Link
              href="#the-proof"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                fontSize: "0.8rem",
                color: "var(--text-tertiary)",
              }}
              className="transition-colors duration-300 hover:text-[var(--text-secondary)]"
            >
              Pricing
            </Link>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 300,
                fontSize: "0.8rem",
                color: "var(--text-tertiary)",
              }}
              className="transition-colors duration-300 hover:text-[var(--text-secondary)]"
            >
              WhatsApp
            </a>
          </div>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              color: "var(--text-ghost)",
              letterSpacing: "0.05em",
            }}
          >
            &copy; 2026 beatmyrate
          </p>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Destination Card — editorial style with full-bleed image
// ═══════════════════════════════════════════════════════════════════════════
function DestinationCard({
  city,
  tall = false,
  wide = false,
}: {
  city: CuratedCity;
  tall?: boolean;
  wide?: boolean;
}) {
  const img = getCityImage(city.city_slug);

  return (
    <Link
      href={`/city/${city.city_slug}`}
      className="block group"
      style={{
        gridColumn: wide ? "span 2" : undefined,
        height: tall ? "100%" : undefined,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-sm h-full"
        style={{
          minHeight: wide ? "420px" : tall ? "420px" : "320px",
        }}
      >
        {/* Image */}
        <img
          src={safeImageSrc(img)}
          alt={city.city_name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
          }}
        />

        {/* Gradient */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background:
              "linear-gradient(to top, rgba(12,10,9,0.8) 0%, rgba(12,10,9,0.15) 50%, transparent 100%)",
          }}
        />

        {/* Content — bottom-left */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <p
            className="mb-1 transition-transform duration-500 group-hover:-translate-y-1"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
            }}
          >
            {city.country}
          </p>
          <h3
            className="transition-transform duration-500 group-hover:-translate-y-1"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: wide ? "clamp(2rem, 3vw, 3rem)" : "clamp(1.5rem, 2vw, 2.2rem)",
              lineHeight: 1.1,
              color: "var(--text-primary)",
            }}
          >
            {city.city_name}
          </h3>
          <p
            className="mt-2 transition-all duration-500 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.08em",
              color: "var(--text-tertiary)",
            }}
          >
            {city.hotel_count > 0 ? `${city.hotel_count}+ stays` : "Explore stays"}
          </p>
        </div>
      </motion.div>
    </Link>
  );
}
