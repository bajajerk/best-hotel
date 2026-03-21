"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CONTINENTS, CATEGORIES, SAMPLE_CITIES } from "@/lib/constants";
import { fetchCuratedCities, CuratedCity } from "@/lib/api";

// ---------------------------------------------------------------------------
// Category SVG Icons (replacing emojis for a professional look)
// ---------------------------------------------------------------------------
function CategoryIcon({ type, size = 16 }: { type: string; size?: number }) {
  switch (type) {
    case "solo":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "couple":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      );
    case "family":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Hero background images (cinematic hotel/travel shots)
// ---------------------------------------------------------------------------
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1920&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920&q=80",
];

// ---------------------------------------------------------------------------
// City image map (high-quality Unsplash per city)
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

/** Convert Agoda http:// URLs to https:// */
function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Stagger animation variants
// ---------------------------------------------------------------------------
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// City Card
// ═══════════════════════════════════════════════════════════════════════════
function CityCard({ city }: { city: CuratedCity }) {
  const img = getCityImage(city.city_slug);

  return (
    <Link href={`/city/${city.city_slug}`} className="block">
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -6 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="group relative rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden" style={{ height: "240px" }}>
          <img
            src={safeImageSrc(img)}
            alt={city.city_name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
            }}
          />
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
            }}
          />
          {/* Hover glow */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background:
                "linear-gradient(to top, rgba(201,169,98,0.15) 0%, transparent 50%)",
            }}
          />
          {/* Country badge */}
          <div
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] tracking-wider uppercase"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "var(--white-80)",
              fontFamily: "var(--font-mono)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {city.country_code}
          </div>
          {/* City name on image */}
          <div className="absolute bottom-4 left-5 right-5">
            <h3
              className="text-2xl font-normal leading-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--white)",
              }}
            >
              {city.city_name}
            </h3>
            <p
              className="text-xs mt-1 tracking-wide"
              style={{
                color: "var(--white-50)",
                fontFamily: "var(--font-sans)",
              }}
            >
              {city.country}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <p
            className="text-xs leading-relaxed line-clamp-2"
            style={{
              color: "var(--white-50)",
              minHeight: "2.5em",
            }}
          >
            {city.tagline}
          </p>
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span
              className="text-[11px] px-3 py-1 rounded-full tracking-wide"
              style={{
                background: "var(--gold-soft)",
                color: "var(--gold)",
                fontFamily: "var(--font-mono)",
                border: "1px solid var(--gold-border)",
              }}
            >
              {city.hotel_count}+ hotels
            </span>
            <span
              className="text-xs flex items-center gap-1.5 transition-all duration-300 group-hover:gap-2.5"
              style={{ color: "var(--gold)" }}
            >
              Explore
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Page
// ═══════════════════════════════════════════════════════════════════════════
export default function Home() {
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [activeContinent, setActiveContinent] = useState("All");
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);
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

  const filtered =
    activeContinent === "All"
      ? cities
      : cities.filter((c) => c.continent === activeContinent);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-black)", color: "var(--white)" }}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION — 90vh, cinematic, parallax
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative overflow-hidden"
        style={{ height: "90vh", minHeight: "700px" }}
      >
        {/* Parallax background images */}
        <motion.div className="absolute inset-0" style={{ y: heroY }}>
          <AnimatePresence mode="sync">
            {HERO_IMAGES.map((src, i) =>
              i === heroIdx ? (
                <motion.div
                  key={src}
                  className="absolute inset-0"
                  initial={{ opacity: 0, scale: 1.08 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  <img
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ minHeight: "120%" }}
                  />
                </motion.div>
              ) : null
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dark gradient overlay */}
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background: `
              linear-gradient(to bottom,
                rgba(10,10,10,0.4) 0%,
                rgba(10,10,10,0.3) 30%,
                rgba(10,10,10,0.6) 60%,
                rgba(10,10,10,0.95) 85%,
                rgba(10,10,10,1) 100%)
            `,
          }}
        />

        {/* Subtle grain texture overlay */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-20 pt-8"
          style={{ opacity: heroOpacity as unknown as number }}
        >
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: "36px",
                height: "36px",
                background: "var(--gold)",
              }}
            >
              <span
                className="text-sm font-bold"
                style={{ color: "#0A0A0A", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
              >
                b
              </span>
            </div>
            <span
              className="text-2xl tracking-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--white)",
              }}
            >
              beatmyrate
            </span>
          </div>
          <div className="flex items-center gap-8">
            <Link
              href="#destinations"
              className="text-sm hidden md:block transition-colors duration-300 hover:opacity-100"
              style={{ color: "var(--white-50)" }}
            >
              Destinations
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm hidden md:block transition-colors duration-300 hover:opacity-100"
              style={{ color: "var(--white-50)" }}
            >
              How it works
            </Link>
            <a
              href="tel:+919876543210"
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105"
              style={{
                background: "var(--gold)",
                color: "#0A0A0A",
                fontFamily: "var(--font-sans)",
              }}
            >
              Call to Book
            </a>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center px-6"
          style={{ height: "calc(100% - 80px)", opacity: heroOpacity as unknown as number }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center"
            style={{ maxWidth: "900px" }}
          >
            {/* Eyebrow */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-[11px] tracking-[0.35em] uppercase mb-6"
              style={{
                color: "var(--gold)",
                fontFamily: "var(--font-mono)",
              }}
            >
              They overcharge. We don&apos;t.
            </motion.p>

            {/* Main headline */}
            <h1
              className="text-5xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] leading-[0.92] tracking-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--white)",
              }}
            >
              hotels at rates
              <br />
              <span style={{ color: "var(--gold)" }}>you weren&apos;t</span>
              <br />
              supposed to see
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-8 text-base md:text-lg lg:text-xl leading-relaxed mx-auto"
              style={{
                color: "var(--white-50)",
                maxWidth: "560px",
                fontFamily: "var(--font-sans)",
              }}
            >
              We negotiate directly with hotels so you get B2B wholesale rates.
              Save 20-40% on every booking, worldwide.
            </motion.p>

            {/* Category pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="flex items-center justify-center gap-3 md:gap-4 mt-10"
            >
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <Link
                  key={key}
                  href="#destinations"
                  className="inline-flex items-center gap-2 px-5 md:px-7 py-3 rounded-full text-sm transition-all duration-300 hover:scale-105"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "var(--white-80)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <CategoryIcon type={cat.icon} size={16} />
                  {cat.label}
                </Link>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-10 flex flex-col items-center gap-2"
          >
            <span
              className="text-[10px] tracking-[0.3em] uppercase"
              style={{
                color: "var(--white-30)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Scroll
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--white-30)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS — 3 elegant cards
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="px-6 md:px-12 lg:px-20 py-24 lg:py-32">
        <div className="mx-auto" style={{ maxWidth: "1200px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p
              className="text-[11px] tracking-[0.35em] uppercase mb-4"
              style={{
                color: "var(--gold)",
                fontFamily: "var(--font-mono)",
              }}
            >
              How it works
            </p>
            <h2
              className="text-3xl md:text-5xl lg:text-[3.5rem]"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--white)",
              }}
            >
              Three steps to better rates
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                num: "01",
                title: "Browse curated stays",
                desc: "Explore handpicked hotels across 50+ cities, thoughtfully filtered for singles, couples, or families.",
              },
              {
                num: "02",
                title: "See B2B pricing",
                desc: "We reveal wholesale rates that travel agents pay \u2014 not the inflated prices you see on booking sites.",
              },
              {
                num: "03",
                title: "Book & save big",
                desc: "Call or WhatsApp us. We confirm availability in minutes and lock in your B2B rate. Zero booking fees.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative p-8 lg:p-10 rounded-2xl group transition-all duration-500"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                {/* Large number */}
                <span
                  className="text-5xl lg:text-6xl font-light block mb-6"
                  style={{
                    color: "var(--gold)",
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1,
                  }}
                >
                  {step.num}
                </span>
                {/* Thin gold accent line */}
                <div
                  className="mb-6"
                  style={{
                    width: "40px",
                    height: "1px",
                    background: "var(--gold-border)",
                  }}
                />
                <h3
                  className="text-xl lg:text-2xl mb-3"
                  style={{
                    color: "var(--white)",
                    fontFamily: "var(--font-sans)",
                    fontWeight: 500,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm lg:text-base leading-relaxed"
                  style={{
                    color: "var(--white-50)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FEATURED DEALS (Top rated hotels across all cities)
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-12 lg:px-20 py-20">
        <div className="mx-auto" style={{ maxWidth: "1200px" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p
              className="text-[11px] tracking-[0.3em] uppercase mb-3"
              style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}
            >
              Why people love us
            </p>
            <h2
              className="text-3xl md:text-4xl mb-4"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
            >
              Real savings, real hotels
            </h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: "var(--white-50)" }}>
              Here is what a typical booking looks like. Same hotel, same dates — just a better rate.
            </p>
          </motion.div>

          {/* Price comparison example cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { hotel: "Siam Kempinski Bangkok", city: "Bangkok", ota: 285, our: 199, stars: 5, saved: 86 },
              { hotel: "The Oberoi Mumbai", city: "Mumbai", ota: 320, our: 215, stars: 5, saved: 105 },
              { hotel: "Park Hyatt Tokyo", city: "Tokyo", ota: 450, our: 315, stars: 5, saved: 135 },
            ].map((deal, i) => (
              <motion.div
                key={deal.hotel}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: deal.stars }).map((_, j) => (
                    <svg key={j} width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <h3
                  className="text-base mb-0.5"
                  style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--white)" }}
                >
                  {deal.hotel}
                </h3>
                <p className="text-xs mb-4" style={{ color: "var(--white-30)" }}>{deal.city}</p>

                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase mb-1" style={{ color: "var(--white-30)", fontFamily: "var(--font-mono)" }}>OTA Price</p>
                    <p className="text-lg line-through" style={{ color: "var(--red)", fontFamily: "var(--font-mono)" }}>${deal.ota}</p>
                  </div>
                  <div className="text-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--white-15)" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase mb-1" style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}>Our Rate</p>
                    <p
                      className="text-2xl"
                      style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--green)" }}
                    >
                      ${deal.our}
                    </p>
                  </div>
                </div>

                <div
                  className="text-center py-2 rounded-lg text-xs font-medium"
                  style={{
                    background: "var(--green-soft)",
                    color: "var(--green)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  You save ${deal.saved} per night
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          DESTINATIONS GRID
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="destinations" className="px-6 md:px-12 lg:px-20 py-24 lg:py-32">
        <div className="mx-auto" style={{ maxWidth: "1400px" }}>
          {/* Section header + filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12"
          >
            <div>
              <p
                className="text-[11px] tracking-[0.35em] uppercase mb-4"
                style={{
                  color: "var(--gold)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Destinations
              </p>
              <h2
                className="text-3xl md:text-5xl lg:text-[3.5rem]"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  color: "var(--white)",
                }}
              >
                50 cities, curated for you
              </h2>
              <p
                className="mt-3 text-base"
                style={{
                  color: "var(--white-30)",
                  maxWidth: "480px",
                }}
              >
                From the neon streets of Tokyo to the sun-soaked coasts of Santorini.
              </p>
            </div>

            {/* Continent filter pills */}
            <div className="flex flex-wrap gap-2 mt-6 lg:mt-0">
              {CONTINENTS.map((continent) => {
                const isActive = activeContinent === continent;
                return (
                  <button
                    key={continent}
                    onClick={() => setActiveContinent(continent)}
                    className="px-4 py-2 rounded-full text-xs transition-all duration-300"
                    style={{
                      background: isActive ? "var(--gold)" : "transparent",
                      color: isActive ? "#0A0A0A" : "var(--white-50)",
                      border: `1px solid ${isActive ? "var(--gold)" : "var(--border)"}`,
                      fontFamily: "var(--font-mono)",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {continent}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ height: "240px" }} className="shimmer" />
                  <div className="p-5">
                    <div className="h-4 w-28 rounded shimmer mb-3" />
                    <div className="h-3 w-full rounded shimmer mb-2" />
                    <div className="h-3 w-2/3 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((city) => (
                  <CityCard key={city.city_slug} city={city} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {filtered.length === 0 && !loading && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-sm"
              style={{ color: "var(--white-30)" }}
            >
              No cities found for this continent.
            </motion.p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          STATS / TRUST BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 md:px-12 lg:px-20 py-24 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 p-10 md:p-14 rounded-3xl"
          style={{
            maxWidth: "1100px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {[
            { value: "50+", label: "Curated cities" },
            { value: "1,500+", label: "Handpicked hotels" },
            { value: "20\u201340%", label: "Average savings" },
            { value: "\u20B90", label: "Booking fee" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <p
                className="text-3xl md:text-4xl lg:text-5xl mb-2"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  color: "var(--gold)",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </p>
              <p
                className="text-[11px] md:text-xs tracking-wider uppercase"
                style={{
                  color: "var(--white-30)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════ */}
      <footer
        className="px-6 md:px-12 lg:px-20 py-16"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ maxWidth: "1400px" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: "28px",
                height: "28px",
                background: "var(--gold)",
              }}
            >
              <span
                className="text-xs font-bold"
                style={{ color: "#0A0A0A", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
              >
                b
              </span>
            </div>
            <span
              className="text-lg"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--white-50)",
              }}
            >
              beatmyrate
            </span>
          </div>

          {/* Copyright */}
          <p
            className="text-xs"
            style={{
              color: "var(--white-30)",
              fontFamily: "var(--font-mono)",
            }}
          >
            &copy; 2025 BeatMyRate. B2B hotel rates for everyone.
          </p>

          {/* Contact links */}
          <div className="flex items-center gap-6">
            <a
              href="tel:+919876543210"
              className="text-xs transition-colors duration-300"
              style={{
                color: "var(--white-50)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Call Us
            </a>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs transition-colors duration-300"
              style={{
                color: "var(--white-50)",
                fontFamily: "var(--font-mono)",
              }}
            >
              WhatsApp
            </a>
            <a
              href="mailto:hello@beatmyrate.com"
              className="text-xs transition-colors duration-300"
              style={{
                color: "var(--white-50)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
