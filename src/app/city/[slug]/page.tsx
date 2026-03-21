"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { fetchCityCurations, CuratedHotel } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";

type Category = "singles" | "couples" | "families";

function HotelCard({ hotel }: { hotel: CuratedHotel }) {
  const photo = hotel.photo1
    ? hotel.photo1.startsWith("http")
      ? hotel.photo1
      : `https://photos.hotelbeds.com/giata/${hotel.photo1}`
    : "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=70";

  return (
    <Link href={`/hotel/${hotel.hotel_id}`}>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        className="group rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={photo}
            alt={hotel.hotel_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=70";
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
            }}
          />

          {/* Rating badge */}
          {hotel.rating_average && (
            <div
              className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                background:
                  hotel.rating_average >= 8.5
                    ? "var(--green)"
                    : hotel.rating_average >= 7
                    ? "var(--gold)"
                    : "var(--white-30)",
                color: "#0A0A0A",
                fontFamily: "var(--font-mono)",
              }}
            >
              {hotel.rating_average.toFixed(1)}
            </div>
          )}

          {/* Stars */}
          {hotel.star_rating && (
            <div className="absolute bottom-3 left-3 flex gap-0.5">
              {Array.from({ length: Math.round(hotel.star_rating) }).map(
                (_, i) => (
                  <svg
                    key={i}
                    width="12"
                    height="12"
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

        {/* Content */}
        <div className="p-4">
          <h3
            className="text-base font-normal leading-snug mb-1"
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
              className="text-xs mb-3 line-clamp-1"
              style={{ color: "var(--white-30)" }}
            >
              {hotel.addressline1}
            </p>
          )}

          {hotel.overview && (
            <p
              className="text-xs leading-relaxed mb-3 line-clamp-2"
              style={{ color: "var(--white-50)" }}
            >
              {hotel.overview.replace(/<[^>]*>/g, "").slice(0, 120)}...
            </p>
          )}

          <div className="flex items-center justify-between">
            <div>
              {hotel.rates_from ? (
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-lg"
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
                  className="text-xs"
                  style={{ color: "var(--white-30)" }}
                >
                  Call for rates
                </span>
              )}
            </div>

            {hotel.number_of_reviews && hotel.number_of_reviews > 0 && (
              <span
                className="text-xs"
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
  );
}

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

  const hotels = curations[activeCategory] || [];

  // Format slug for display if API fails
  const displayName =
    cityName ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-black)", color: "var(--white)" }}
    >
      {/* ─── HEADER ─── */}
      <div
        className="sticky top-0 z-50 px-6 md:px-12 lg:px-20 py-4 flex items-center justify-between"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-4">
          <Link href="/">
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
          </Link>
          <span style={{ color: "var(--white-15)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--white-50)" }}>
            {displayName}
          </span>
        </div>
        <a
          href="tel:+919876543210"
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: "var(--gold)", color: "#0A0A0A" }}
        >
          Call to Book
        </a>
      </div>

      {/* ─── CITY HERO ─── */}
      <section className="px-6 md:px-12 lg:px-20 pt-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs mb-4"
            style={{ color: "var(--white-30)" }}
          >
            ← Back to all cities
          </Link>
          <h1
            className="text-4xl md:text-6xl"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
            }}
          >
            {displayName}
          </h1>
          {cityCountry && (
            <p className="text-sm mt-1" style={{ color: "var(--white-50)" }}>
              {cityCountry}
            </p>
          )}
          {tagline && (
            <p
              className="text-base mt-2 max-w-lg"
              style={{ color: "var(--white-30)" }}
            >
              {tagline}
            </p>
          )}
        </div>
      </section>

      {/* ─── CATEGORY TABS ─── */}
      <section className="px-6 md:px-12 lg:px-20 pb-4 sticky top-[65px] z-40">
        <div className="max-w-7xl mx-auto">
          <div
            className="inline-flex rounded-full p-1"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
            }}
          >
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES.singles][]).map(
              ([key, cat]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className="relative px-5 py-2.5 rounded-full text-sm transition-all"
                  style={{
                    background:
                      activeCategory === key ? "var(--gold)" : "transparent",
                    color: activeCategory === key ? "#0A0A0A" : "var(--white-50)",
                    fontWeight: activeCategory === key ? 500 : 400,
                  }}
                >
                  <span className="mr-1.5">{cat.icon}</span>
                  {cat.label}
                </button>
              )
            )}
          </div>
          <p
            className="text-xs mt-2"
            style={{ color: "var(--white-30)", fontFamily: "var(--font-mono)" }}
          >
            {CATEGORIES[activeCategory].description}
          </p>
        </div>
      </section>

      {/* ─── HOTEL GRID ─── */}
      <section className="px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="h-52 shimmer" />
                  <div className="p-4">
                    <div className="h-4 w-32 rounded shimmer mb-2" />
                    <div className="h-3 w-full rounded shimmer mb-2" />
                    <div className="h-3 w-20 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {hotels.length === 0 && !loading && (
            <div className="text-center py-20">
              <p style={{ color: "var(--white-30)" }}>
                No hotels curated for this category yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-6 md:px-12 lg:px-20 py-16">
        <div
          className="max-w-2xl mx-auto rounded-2xl p-8 text-center"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--gold-border)",
          }}
        >
          <p
            className="text-xs tracking-[0.3em] uppercase mb-3"
            style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}
          >
            Ready to book?
          </p>
          <h3
            className="text-2xl md:text-3xl mb-2"
            style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
          >
            Get the best rate in {displayName}
          </h3>
          <p className="text-sm mb-6" style={{ color: "var(--white-50)" }}>
            Our team confirms availability and processes your booking at B2B
            rates. No markup, no hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="tel:+919876543210"
              className="px-6 py-3 rounded-full text-sm font-medium"
              style={{ background: "var(--gold)", color: "#0A0A0A" }}
            >
              📞 Call to Book
            </a>
            <a
              href="https://wa.me/919876543210"
              className="px-6 py-3 rounded-full text-sm"
              style={{
                border: "1px solid var(--gold-border)",
                color: "var(--gold)",
              }}
            >
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
