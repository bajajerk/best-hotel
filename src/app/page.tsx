"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { CONTINENTS, CATEGORIES, SAMPLE_CITIES } from "@/lib/constants";
import { fetchCuratedCities, CuratedCity } from "@/lib/api";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1600&q=80",
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1600&q=80",
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill={star <= rating ? "var(--gold)" : "none"}
          stroke="var(--gold)"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function CityCard({ city }: { city: CuratedCity }) {
  // Use a curated unsplash image based on city
  const imageUrl = `https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=70`;

  const cityImages: Record<string, string> = {
    bangkok: "https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=70",
    tokyo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=70",
    paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=70",
    london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=70",
    dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=70",
    singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=70",
    "new-york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=70",
    barcelona: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=70",
    rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=70",
    bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=70",
    phuket: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=600&q=70",
    sydney: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&q=70",
    mumbai: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=70",
    delhi: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=70",
    seoul: "https://images.unsplash.com/photo-1538485399081-7191377e8241?w=600&q=70",
    "hong-kong": "https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=600&q=70",
    amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=70",
    prague: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=600&q=70",
    budapest: "https://images.unsplash.com/photo-1549877452-9c387954fbc2?w=600&q=70",
    marrakech: "https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=600&q=70",
    "cape-town": "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=70",
    maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=600&q=70",
    jaipur: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=600&q=70",
    goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=70",
    osaka: "https://images.unsplash.com/photo-1590559899731-a382839e5549?w=600&q=70",
    hanoi: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=70",
    lisbon: "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&q=70",
    vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=70",
    florence: "https://images.unsplash.com/photo-1543429258-0a3e78096a93?w=600&q=70",
    berlin: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=600&q=70",
    "kuala-lumpur": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&q=70",
    athens: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=600&q=70",
    santorini: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=70",
    milan: "https://images.unsplash.com/photo-1520440229-6469d1bfe80a?w=600&q=70",
    melbourne: "https://images.unsplash.com/photo-1514395462725-fb4566210144?w=600&q=70",
    "rio-de-janeiro": "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=600&q=70",
    cancun: "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?w=600&q=70",
    "mexico-city": "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=600&q=70",
    colombo: "https://images.unsplash.com/photo-1586211082529-c2fc67e099b9?w=600&q=70",
    kathmandu: "https://images.unsplash.com/photo-1558799401-1dcba79834c2?w=600&q=70",
    "ho-chi-minh-city": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=70",
    "buenos-aires": "https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=600&q=70",
  };

  const img = cityImages[city.city_slug] || imageUrl;

  return (
    <Link href={`/city/${city.city_slug}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="group relative rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={img}
            alt={city.city_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)",
            }}
          />
          {/* Country badge */}
          <div
            className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              color: "var(--white-80)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {city.country_code}
          </div>
          {/* City name overlay */}
          <div className="absolute bottom-3 left-4 right-4">
            <h3
              className="text-xl font-normal"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--white)",
              }}
            >
              {city.city_name}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--white-50)" }}
            >
              {city.country}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p
            className="text-xs leading-relaxed"
            style={{ color: "var(--white-50)" }}
          >
            {city.tagline}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{
                background: "var(--gold-soft)",
                color: "var(--gold)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {city.hotel_count}+ hotels
            </span>
            <span
              className="text-xs"
              style={{ color: "var(--gold)" }}
            >
              Explore →
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function Home() {
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [activeContinent, setActiveContinent] = useState("All");
  const [loading, setLoading] = useState(true);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    fetchCuratedCities()
      .then(setCities)
      .catch(() => {
        // Fallback to sample data
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

  // Rotate hero image
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
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
      {/* ─── HERO ─── */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        {/* Background */}
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className="absolute inset-0 transition-opacity duration-1000"
            style={{ opacity: i === heroIdx ? 1 : 0 }}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,1) 100%)",
          }}
        />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 lg:px-20 pt-6">
          <div className="flex items-center gap-2">
            <span
              className="text-2xl tracking-tight"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--gold)",
              }}
            >
              beatmyrate
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="#destinations"
              className="text-sm hidden md:block"
              style={{ color: "var(--white-80)" }}
            >
              Destinations
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm hidden md:block"
              style={{ color: "var(--white-80)" }}
            >
              How it works
            </Link>
            <a
              href="tel:+919876543210"
              className="px-4 py-2 rounded-full text-sm font-medium transition-all hover:brightness-110"
              style={{
                background: "var(--gold)",
                color: "#0A0A0A",
              }}
            >
              Call to Book
            </a>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 -mt-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl"
          >
            <p
              className="text-xs tracking-[0.3em] uppercase mb-4"
              style={{
                color: "var(--gold)",
                fontFamily: "var(--font-mono)",
              }}
            >
              They overcharge. We don&apos;t.
            </p>
            <h1
              className="text-5xl md:text-7xl lg:text-8xl leading-[0.95]"
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
            <p
              className="mt-6 text-base md:text-lg max-w-lg mx-auto"
              style={{ color: "var(--white-50)" }}
            >
              We negotiate directly with hotels so you get B2B rates —
              the same prices travel agents pay. Save 20–40% on every booking.
            </p>

            {/* Category Pills */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <Link
                  key={key}
                  href={`#destinations`}
                  className="px-5 py-2.5 rounded-full text-sm transition-all hover:brightness-110"
                  style={{
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    color: "var(--white-80)",
                  }}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--white-30)"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-5xl mx-auto">
          <p
            className="text-xs tracking-[0.3em] uppercase mb-3"
            style={{
              color: "var(--gold)",
              fontFamily: "var(--font-mono)",
            }}
          >
            How it works
          </p>
          <h2
            className="text-3xl md:text-4xl mb-12"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
            }}
          >
            Three steps to better rates
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Browse curated stays",
                desc: "Explore handpicked hotels across 50+ cities, filtered for singles, couples, or families.",
              },
              {
                num: "02",
                title: "See B2B pricing",
                desc: "We show you wholesale rates that travel agents pay — not the inflated OTA prices.",
              },
              {
                num: "03",
                title: "Book & save big",
                desc: "Call or WhatsApp us. We confirm availability and process your booking at the B2B rate.",
              },
            ].map((step) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="text-3xl font-medium"
                  style={{
                    color: "var(--gold)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {step.num}
                </span>
                <h3 className="text-lg mt-3 mb-2" style={{ color: "var(--white)" }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--white-50)" }}>
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DESTINATIONS ─── */}
      <section id="destinations" className="px-6 md:px-12 lg:px-20 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8">
            <div>
              <p
                className="text-xs tracking-[0.3em] uppercase mb-3"
                style={{
                  color: "var(--gold)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Destinations
              </p>
              <h2
                className="text-3xl md:text-4xl"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                }}
              >
                50 cities, curated for you
              </h2>
            </div>

            {/* Continent filter */}
            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
              {CONTINENTS.map((continent) => (
                <button
                  key={continent}
                  onClick={() => setActiveContinent(continent)}
                  className="px-3 py-1.5 rounded-full text-xs transition-all"
                  style={{
                    background:
                      activeContinent === continent
                        ? "var(--gold)"
                        : "var(--bg-elevated)",
                    color:
                      activeContinent === continent
                        ? "#0A0A0A"
                        : "var(--white-50)",
                    border: `1px solid ${
                      activeContinent === continent
                        ? "var(--gold)"
                        : "var(--border)"
                    }`,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {continent}
                </button>
              ))}
            </div>
          </div>

          {/* City Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="h-48 shimmer" />
                  <div className="p-4">
                    <div
                      className="h-4 w-24 rounded shimmer mb-2"
                    />
                    <div className="h-3 w-full rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
            >
              {filtered.map((city, i) => (
                <motion.div
                  key={city.city_slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <CityCard city={city} />
                </motion.div>
              ))}
            </motion.div>
          )}

          {filtered.length === 0 && !loading && (
            <p
              className="text-center py-12 text-sm"
              style={{ color: "var(--white-30)" }}
            >
              No cities found for this continent.
            </p>
          )}
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="px-6 md:px-12 lg:px-20 py-16">
        <div
          className="max-w-4xl mx-auto rounded-2xl p-8 flex flex-col md:flex-row items-center justify-around gap-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {[
            { value: "50+", label: "Curated cities" },
            { value: "1,500+", label: "Handpicked hotels" },
            { value: "20–40%", label: "Average savings" },
            { value: "₹0", label: "Booking fee" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p
                className="text-2xl md:text-3xl"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  color: "var(--gold)",
                }}
              >
                {stat.value}
              </p>
              <p
                className="text-xs mt-1"
                style={{
                  color: "var(--white-50)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="px-6 md:px-12 lg:px-20 py-12"
        style={{
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span
            className="text-xl"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "var(--gold)",
            }}
          >
            beatmyrate
          </span>
          <p className="text-xs" style={{ color: "var(--white-30)" }}>
            © 2025 BeatMyRate. B2B hotel rates for everyone.
          </p>
          <div className="flex gap-4">
            <a
              href="tel:+919876543210"
              className="text-xs"
              style={{ color: "var(--white-50)" }}
            >
              Call Us
            </a>
            <a
              href="https://wa.me/919876543210"
              className="text-xs"
              style={{ color: "var(--white-50)" }}
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
