"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchCityCurations, CuratedHotel } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";

type Category = "singles" | "couples" | "families";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70";

function sanitizePhoto(url: string | null): string {
  if (!url) return PLACEHOLDER_IMG;
  // Convert Agoda HTTP to HTTPS
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  // If it's a relative path, assume hotelbeds
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON CARD
   ───────────────────────────────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="h-[220px] shimmer" />
      <div className="p-5">
        <div className="h-5 w-3/4 rounded-md shimmer mb-3" />
        <div className="h-3 w-1/2 rounded shimmer mb-3" />
        <div className="h-3 w-full rounded shimmer mb-2" />
        <div className="h-3 w-5/6 rounded shimmer mb-4" />
        <div className="flex items-center justify-between">
          <div className="h-6 w-20 rounded shimmer" />
          <div className="h-3 w-24 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HOTEL CARD
   ───────────────────────────────────────────────────────────────────────────── */

function HotelCard({ hotel, index }: { hotel: CuratedHotel; index: number }) {
  const photo = sanitizePhoto(hotel.photo1);

  const ratingColor =
    hotel.rating_average && hotel.rating_average >= 8.5
      ? "var(--green)"
      : hotel.rating_average && hotel.rating_average >= 7
      ? "var(--gold)"
      : "var(--white-30)";

  const ratingBg =
    hotel.rating_average && hotel.rating_average >= 8.5
      ? "var(--green)"
      : hotel.rating_average && hotel.rating_average >= 7
      ? "var(--gold)"
      : "rgba(255,255,255,0.12)";

  const ratingText =
    hotel.rating_average && hotel.rating_average >= 7 ? "#0A0A0A" : "var(--white)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/hotel/${hotel.hotel_id}`} className="block">
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="group rounded-2xl overflow-hidden cursor-pointer h-full"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--white-15)";
            (e.currentTarget as HTMLElement).style.boxShadow =
              "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {/* ── Image Area ── */}
          <div className="relative h-[220px] overflow-hidden">
            <img
              src={photo}
              alt={hotel.hotel_name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
              }}
            />

            {/* Gradient overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.15) 40%, transparent 100%)",
              }}
            />

            {/* Rating badge — top right */}
            {hotel.rating_average && hotel.rating_average > 0 && (
              <div
                className="absolute top-3 right-3 px-2.5 py-1 rounded-lg"
                style={{
                  background: ratingBg,
                  color: ratingText,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  backdropFilter: "blur(8px)",
                }}
              >
                {hotel.rating_average.toFixed(1)}
              </div>
            )}

            {/* Star rating — bottom left */}
            {hotel.star_rating && hotel.star_rating > 0 && (
              <div className="absolute bottom-3 left-3 flex gap-0.5">
                {Array.from({ length: Math.round(hotel.star_rating) }).map(
                  (_, i) => (
                    <svg
                      key={i}
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="var(--gold)"
                      stroke="none"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )
                )}
              </div>
            )}
          </div>

          {/* ── Content ── */}
          <div className="p-5">
            <h3
              className="text-[1.05rem] leading-snug mb-1.5"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--white)",
              }}
            >
              {hotel.hotel_name}
            </h3>

            {hotel.addressline1 && (
              <p
                className="text-xs mb-3 line-clamp-1 flex items-center gap-1.5"
                style={{ color: "var(--white-30)" }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  style={{ opacity: 0.5 }}
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {hotel.addressline1}
              </p>
            )}

            {hotel.overview && (
              <p
                className="text-xs leading-relaxed mb-4 line-clamp-2"
                style={{ color: "var(--white-50)" }}
              >
                {stripHtml(hotel.overview).slice(0, 140)}
              </p>
            )}

            {/* Price & reviews row */}
            <div className="flex items-end justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
              <div>
                {hotel.rates_from ? (
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-xl"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        color: "var(--green)",
                      }}
                    >
                      ${Math.round(hotel.rates_from)}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--white-30)" }}
                    >
                      /night
                    </span>
                  </div>
                ) : (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{
                      color: "var(--gold)",
                      background: "var(--gold-soft)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Call for rates
                  </span>
                )}
              </div>

              {hotel.number_of_reviews && hotel.number_of_reviews > 0 && (
                <span
                  className="text-[0.68rem]"
                  style={{
                    color: "var(--white-30)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {hotel.number_of_reviews.toLocaleString()} reviews
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────────────────────── */

export default function CityPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeCategory, setActiveCategory] = useState<Category>("couples");
  const [curations, setCurations] = useState<Record<Category, CuratedHotel[]>>({
    singles: [],
    couples: [],
    families: [],
  });
  const [cityName, setCityName] = useState("");
  const [cityCountry, setCityCountry] = useState("");
  const [tagline, setTagline] = useState("");
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchCityCurations(slug)
      .then((data) => {
        setCurations(data.curations as Record<Category, CuratedHotel[]>);
        setCityName(data.city.city_name);
        setCityCountry(data.city.country);
        setTagline(data.city.tagline);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const hotels = curations[activeCategory] || [];

  const displayName =
    cityName ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const categoryEntries = Object.entries(CATEGORIES) as [
    Category,
    (typeof CATEGORIES)[keyof typeof CATEGORIES]
  ][];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-black)", color: "var(--white)" }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          STICKY NAVIGATION
          ═══════════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-5 md:px-10 lg:px-16 py-3.5 flex items-center justify-between transition-all duration-300"
        style={{
          background: scrolled ? "rgba(10,10,10,0.88)" : "rgba(10,10,10,0.4)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        }}
      >
        {/* Left: Logo breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <span
              className="text-lg"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--gold)",
              }}
            >
              beatmyrate
            </span>
          </Link>
          <span
            className="text-sm"
            style={{ color: "var(--white-15)" }}
          >
            /
          </span>
          <span
            className="text-sm"
            style={{
              color: scrolled ? "var(--white-80)" : "var(--white-50)",
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              transition: "color 0.3s",
            }}
          >
            {displayName}
          </span>
        </div>

        {/* Right: CTA */}
        <a
          href="tel:+919876543210"
          className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:brightness-110"
          style={{
            background: "var(--gold)",
            color: "#0A0A0A",
          }}
        >
          Call to Book
        </a>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════
          CITY HEADER
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="pt-24 pb-6 px-5 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link
              href="/"
              className="text-xs transition-colors duration-200 hover:text-[var(--gold)]"
              style={{
                color: "var(--white-30)",
                fontFamily: "var(--font-mono)",
              }}
            >
              beatmyrate
            </Link>
            <span className="text-xs" style={{ color: "var(--white-15)" }}>
              /
            </span>
            <span
              className="text-xs"
              style={{
                color: "var(--white-50)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {displayName}
            </span>
          </div>

          {/* City name + country */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {cityCountry && (
              <p
                className="text-xs tracking-[0.25em] uppercase mb-3"
                style={{
                  color: "var(--gold)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {cityCountry}
              </p>
            )}

            <h1
              className="text-5xl md:text-7xl lg:text-8xl leading-[0.92] mb-4"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--white)",
              }}
            >
              {displayName}
            </h1>

            {tagline && (
              <p
                className="text-base md:text-lg max-w-xl leading-relaxed"
                style={{ color: "var(--white-50)" }}
              >
                {tagline}
              </p>
            )}
          </motion.div>

          {/* ── Decorative line ── */}
          <div
            className="mt-10 mb-8"
            style={{
              height: "1px",
              background:
                "linear-gradient(to right, var(--gold-border), var(--border), transparent)",
            }}
          />

          {/* ── Category Tabs ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div
              className="inline-flex rounded-full p-1"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              {categoryEntries.map(([key, cat]) => {
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className="relative px-5 md:px-7 py-2.5 rounded-full text-sm transition-all duration-300"
                    style={{
                      background: isActive ? "var(--gold)" : "transparent",
                      color: isActive ? "#0A0A0A" : "var(--white-50)",
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <p
              className="mt-3 text-sm"
              style={{
                color: "var(--white-30)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {CATEGORIES[activeCategory].description}
            </p>
          </motion.div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════
          HOTEL GRID
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 md:px-10 lg:px-16 py-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {hotels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {hotels.map((hotel, i) => (
                      <HotelCard
                        key={hotel.hotel_id}
                        hotel={hotel}
                        index={i}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-24"
                  >
                    <div
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--white-30)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <p
                      className="text-base mb-2"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        color: "var(--white-50)",
                      }}
                    >
                      No hotels curated yet
                    </p>
                    <p className="text-sm" style={{ color: "var(--white-30)" }}>
                      We are adding {CATEGORIES[activeCategory].label.toLowerCase()} stays
                      in {displayName} soon.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Hotel count */}
          {!loading && hotels.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-10 text-xs"
              style={{
                color: "var(--white-30)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Showing {hotels.length} curated{" "}
              {hotels.length === 1 ? "hotel" : "hotels"} for{" "}
              {CATEGORIES[activeCategory].label.toLowerCase()}
            </motion.p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="px-5 md:px-10 lg:px-16 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto rounded-2xl p-10 text-center relative overflow-hidden"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--gold-border)",
          }}
        >
          {/* Subtle gold glow */}
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(201,169,98,0.06) 0%, transparent 70%)",
            }}
          />

          <p
            className="relative text-xs tracking-[0.3em] uppercase mb-4"
            style={{
              color: "var(--gold)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Ready to book?
          </p>
          <h3
            className="relative text-2xl md:text-3xl mb-3"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
            }}
          >
            Get the best rate in {displayName}
          </h3>
          <p
            className="relative text-sm mb-8 max-w-md mx-auto leading-relaxed"
            style={{ color: "var(--white-50)" }}
          >
            Our team confirms availability and processes your booking at B2B rates.
            No markup, no hidden fees.
          </p>

          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-medium transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                background: "var(--gold)",
                color: "#0A0A0A",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              Call to Book
            </a>

            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                border: "1px solid var(--gold-border)",
                color: "var(--gold)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp Us
            </a>
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════════════════════════════════ */}
      <footer
        className="px-5 md:px-10 lg:px-16 py-10"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <span
              className="text-lg"
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: "var(--gold)",
              }}
            >
              beatmyrate
            </span>
          </Link>
          <p className="text-xs" style={{ color: "var(--white-30)", fontFamily: "var(--font-mono)" }}>
            B2B hotel rates for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}
