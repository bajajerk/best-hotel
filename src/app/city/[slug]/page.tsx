"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchCityCurations, CuratedHotel } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Category = "singles" | "couples" | "families";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70";

function sanitizePhoto(url: string | null): string {
  if (!url) return PLACEHOLDER_IMG;
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function formatCurrency(amount: number, currency?: string | null): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "\u20AC", GBP: "\u00A3", INR: "\u20B9",
    JPY: "\u00A5", AUD: "A$", SGD: "S$", THB: "\u0E3F",
    AED: "AED ", MYR: "RM ", IDR: "Rp ", KRW: "\u20A9",
  };
  const sym = currency ? (symbols[currency.toUpperCase()] || `${currency} `) : "$";
  const rounded = Math.round(amount);
  const formatted =
    currency?.toUpperCase() === "INR"
      ? rounded.toLocaleString("en-IN")
      : rounded.toLocaleString("en-US");
  return `${sym}${formatted}`;
}

function starDots(count: number | null): string {
  if (!count || count <= 0) return "";
  return Array.from({ length: Math.round(count) }, () => "\u2022").join(" ");
}

function slugToName(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Category labels for the editorial selector
// ---------------------------------------------------------------------------
const CATEGORY_LABELS: Record<Category, string> = {
  singles: "for singles",
  couples: "for couples",
  families: "for families",
};

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------
function FeaturedSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-[60%] h-[300px] lg:h-[420px] shimmer" />
        <div className="lg:w-[40%] p-8 lg:p-10 flex flex-col justify-center">
          <div className="h-3 w-20 rounded shimmer mb-4" />
          <div className="h-8 w-3/4 rounded shimmer mb-3" />
          <div className="h-3 w-1/3 rounded shimmer mb-6" />
          <div className="h-3 w-full rounded shimmer mb-2" />
          <div className="h-3 w-5/6 rounded shimmer mb-2" />
          <div className="h-3 w-4/6 rounded shimmer mb-8" />
          <div className="h-7 w-28 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
    >
      <div className="h-[240px] shimmer" />
      <div className="p-5">
        <div className="h-5 w-3/4 rounded shimmer mb-3" />
        <div className="h-3 w-1/3 rounded shimmer mb-3" />
        <div className="flex items-center justify-between mt-4">
          <div className="h-6 w-24 rounded shimmer" />
          <div className="h-5 w-10 rounded-full shimmer" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Featured Hotel Card (editor's pick — full width)
// ---------------------------------------------------------------------------
function FeaturedHotel({ hotel }: { hotel: CuratedHotel }) {
  const photo = sanitizePhoto(hotel.photo1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Link href={`/hotel/${hotel.hotel_id}`} className="block group">
        <div
          className="rounded-2xl overflow-hidden transition-shadow duration-500"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex flex-col lg:flex-row">
            {/* Image — 60% */}
            <div className="relative lg:w-[60%] h-[300px] lg:h-[420px] overflow-hidden">
              <img
                src={photo}
                alt={hotel.hotel_name}
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 50%)",
                }}
              />
              {/* Editor's pick badge */}
              <div
                className="absolute top-5 left-5 px-3 py-1.5 rounded-lg"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg-deep)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Editor&apos;s Pick
              </div>
            </div>

            {/* Details — 40% */}
            <div className="lg:w-[40%] p-8 lg:p-10 flex flex-col justify-center">
              {/* Stars as dots */}
              {hotel.star_rating && hotel.star_rating > 0 && (
                <p
                  className="text-sm mb-3 tracking-[0.3em]"
                  style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}
                >
                  {starDots(hotel.star_rating)}
                </p>
              )}

              <h2
                className="text-2xl md:text-3xl lg:text-4xl leading-[1.1] mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: "var(--text-primary)",
                }}
              >
                {hotel.hotel_name}
              </h2>

              {/* Rating pill */}
              {hotel.rating_average && hotel.rating_average > 0 && (
                <div className="flex items-center gap-3 mb-5">
                  <span
                    className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-semibold"
                    style={{
                      background:
                        hotel.rating_average >= 8.5
                          ? "var(--success)"
                          : hotel.rating_average >= 7
                          ? "var(--accent)"
                          : "var(--bg-elevated)",
                      color:
                        hotel.rating_average >= 7
                          ? "var(--bg-deep)"
                          : "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {hotel.rating_average.toFixed(1)}
                  </span>
                  {hotel.number_of_reviews && hotel.number_of_reviews > 0 && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                    >
                      {hotel.number_of_reviews.toLocaleString()} reviews
                    </span>
                  )}
                </div>
              )}

              {/* Overview snippet */}
              {hotel.overview && (
                <p
                  className="text-sm leading-relaxed mb-6 line-clamp-4"
                  style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
                >
                  {stripHtml(hotel.overview).slice(0, 280)}
                </p>
              )}

              {/* Price */}
              {hotel.rates_from ? (
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 400,
                      color: "var(--accent)",
                    }}
                  >
                    {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    per night
                  </span>
                </div>
              ) : (
                <span
                  className="text-xs"
                  style={{
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Call for rates
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Grid Hotel Card (minimal, editorial)
// ---------------------------------------------------------------------------
function HotelCard({ hotel, index }: { hotel: CuratedHotel; index: number }) {
  const photo = sanitizePhoto(hotel.photo1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: 0.15 + index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="h-full"
    >
      <Link href={`/hotel/${hotel.hotel_id}`} className="block h-full group">
        <div className="h-full flex flex-col">
          {/* Image */}
          <div className="relative h-[240px] rounded-xl overflow-hidden">
            <img
              src={photo}
              alt={hotel.hotel_name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background:
                  "linear-gradient(to top, rgba(12,10,9,0.5) 0%, transparent 50%)",
              }}
            />
          </div>

          {/* Info */}
          <div className="pt-4 pb-2 flex flex-col flex-1">
            <h3
              className="text-lg leading-snug line-clamp-1 mb-1.5"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                color: "var(--text-primary)",
              }}
            >
              {hotel.hotel_name}
            </h3>

            {/* Star dots + rating pill row */}
            <div className="flex items-center gap-3 mb-3">
              {hotel.star_rating && hotel.star_rating > 0 && (
                <span
                  className="text-xs tracking-[0.25em]"
                  style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                >
                  {starDots(hotel.star_rating)}
                </span>
              )}
              {hotel.rating_average && hotel.rating_average > 0 && (
                <span
                  className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[0.65rem] font-semibold"
                  style={{
                    background:
                      hotel.rating_average >= 8.5
                        ? "var(--success-soft)"
                        : "var(--bg-elevated)",
                    color:
                      hotel.rating_average >= 8.5
                        ? "var(--success)"
                        : "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {hotel.rating_average.toFixed(1)}
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mt-auto">
              {hotel.rates_from ? (
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-lg"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 400,
                      color: "var(--accent)",
                    }}
                  >
                    {formatCurrency(hotel.rates_from, hotel.rates_currency)}
                  </span>
                  <span
                    className="text-[0.65rem]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    per night
                  </span>
                </div>
              ) : (
                <span
                  className="text-xs"
                  style={{
                    color: "var(--accent)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Call for rates
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
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
  const featuredHotel = hotels[0] || null;
  const gridHotels = hotels.slice(1);

  const displayName =
    cityName || slugToName(slug);

  const categoryKeys: Category[] = ["singles", "couples", "families"];

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-deep)", color: "var(--text-primary)" }}
    >
      {/* ================================================================
          STICKY NAV — frosted glass, appears on scroll
          ================================================================ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12 lg:px-20 py-4 flex items-center justify-between transition-all duration-500"
        style={{
          background: scrolled
            ? "rgba(12, 10, 9, 0.85)"
            : "transparent",
          backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
          borderBottom: scrolled
            ? "1px solid var(--border)"
            : "1px solid transparent",
        }}
      >
        <div className="flex items-center gap-3">
          <Link href="/">
            <span
              className="text-lg"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                color: "var(--accent)",
              }}
            >
              beatmyrate
            </span>
          </Link>
          <span style={{ color: "var(--text-ghost)" }}>/</span>
          <span
            className="text-sm"
            style={{
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontSize: "0.7rem",
            }}
          >
            {displayName}
          </span>
        </div>

        <a
          href="tel:+919876543210"
          className="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:brightness-110"
          style={{
            background: "var(--accent)",
            color: "var(--bg-deep)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Book
        </a>
      </nav>

      {/* ================================================================
          CITY HERO — the city name IS the design
          ================================================================ */}
      <header className="pt-28 pb-0 px-6 md:px-12 lg:px-20 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Massive city name */}
            <h1
              className="text-[4.5rem] sm:text-[7rem] md:text-[9rem] lg:text-[10rem] xl:text-[12rem] leading-[0.85] tracking-tight"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 300,
                color: "var(--text-primary)",
                overflow: "hidden",
                maxWidth: "100%",
              }}
            >
              <motion.span
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="block"
              >
                {displayName}
              </motion.span>
            </h1>

            {/* Country in small tracked mono */}
            {cityCountry && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-5 text-xs tracking-[0.35em] uppercase"
                style={{
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {cityCountry}
              </motion.p>
            )}

            {/* Tagline */}
            {tagline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.55 }}
                className="mt-3 text-base md:text-lg max-w-lg"
                style={{
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {tagline}
              </motion.p>
            )}

            {/* Thin accent line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              className="mt-8 origin-left"
              style={{
                height: "1px",
                background: "var(--accent)",
                maxWidth: "120px",
              }}
            />

            {/* Category selector — minimal text links */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.85 }}
              className="mt-8 mb-16 flex items-center gap-2"
            >
              {categoryKeys.map((key, i) => {
                const isActive = activeCategory === key;
                return (
                  <span key={key} className="flex items-center gap-2">
                    {i > 0 && (
                      <span
                        className="text-sm select-none"
                        style={{ color: "var(--text-ghost)" }}
                      >
                        &middot;
                      </span>
                    )}
                    <button
                      onClick={() => setActiveCategory(key)}
                      className="relative text-sm transition-colors duration-300 pb-0.5"
                      style={{
                        color: isActive
                          ? "var(--text-primary)"
                          : "var(--text-tertiary)",
                        fontFamily: "var(--font-body)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        borderBottom: isActive
                          ? "1px solid var(--accent)"
                          : "1px solid transparent",
                      }}
                    >
                      {CATEGORY_LABELS[key]}
                    </button>
                  </span>
                );
              })}
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* ================================================================
          HOTEL GRID — editorial layout
          ================================================================ */}
      <section className="px-6 md:px-12 lg:px-20 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div>
              <FeaturedSkeleton />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {hotels.length > 0 ? (
                  <>
                    {/* Featured hotel — full width editorial spread */}
                    {featuredHotel && <FeaturedHotel hotel={featuredHotel} />}

                    {/* Grid hotels */}
                    {gridHotels.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 mt-14">
                        {gridHotels.map((hotel, i) => (
                          <HotelCard
                            key={hotel.hotel_id}
                            hotel={hotel}
                            index={i}
                          />
                        ))}
                      </div>
                    )}

                    {/* Hotel count */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-center mt-16 text-xs"
                      style={{
                        color: "var(--text-tertiary)",
                        fontFamily: "var(--font-mono)",
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                      }}
                    >
                      {hotels.length} curated{" "}
                      {hotels.length === 1 ? "stay" : "stays"}{" "}
                      {CATEGORY_LABELS[activeCategory]}
                    </motion.p>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-32"
                  >
                    <p
                      className="text-2xl mb-3"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontWeight: 300,
                        color: "var(--text-secondary)",
                      }}
                    >
                      Coming soon
                    </p>
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      We are curating {CATEGORIES[activeCategory].label.toLowerCase()} stays
                      in {displayName}.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* ================================================================
          CTA — editorial, centered
          ================================================================ */}
      <section className="px-6 md:px-12 lg:px-20 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mx-auto text-center"
        >
          <h3
            className="text-3xl md:text-4xl mb-8"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 300,
              color: "var(--text-primary)",
            }}
          >
            Ready to book?
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a
              href="tel:+919876543210"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-medium transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                background: "var(--accent)",
                color: "var(--bg-deep)",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
              Call Us
            </a>

            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                border: "1px solid var(--accent-border)",
                color: "var(--accent)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          <p
            className="text-xs"
            style={{
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
            }}
          >
            B2B rates. No markup. No hidden fees.
          </p>
        </motion.div>
      </section>

      {/* ================================================================
          EXPLORE OTHER CITIES — horizontal text links
          ================================================================ */}
      <section
        className="px-6 md:px-12 lg:px-20 py-16"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto">
          <p
            className="text-xs tracking-[0.25em] uppercase mb-6"
            style={{
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Explore other cities
          </p>
          <div className="flex gap-x-6 gap-y-2 overflow-x-auto pb-4 no-scrollbar flex-wrap md:flex-nowrap">
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
                  className="shrink-0 text-sm transition-colors duration-200 whitespace-nowrap"
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text-tertiary)";
                  }}
                >
                  {slugToName(citySlug)}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer
        className="px-6 md:px-12 lg:px-20 py-10"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/">
            <span
              className="text-lg"
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                color: "var(--accent)",
              }}
            >
              beatmyrate
            </span>
          </Link>
          <p
            className="text-xs"
            style={{
              color: "var(--text-tertiary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            B2B hotel rates for everyone.
          </p>
        </div>
      </footer>
    </div>
  );
}
