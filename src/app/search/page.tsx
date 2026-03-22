"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { searchHotels, fetchCuratedCities, CuratedCity } from "@/lib/api";
import { SAMPLE_CITIES, getCityImage, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import MobileNav from "@/components/MobileNav";
import DateBar from "@/components/DateBar";
import DestinationSearch from "@/components/DestinationSearch";

const FALLBACK_IMAGE = FALLBACK_CITY_IMAGE;

function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

// ---------------------------------------------------------------------------
// Popular search suggestions
// ---------------------------------------------------------------------------
const POPULAR_SEARCHES = [
  { label: "Bangkok", slug: "bangkok", type: "city" as const },
  { label: "Tokyo", slug: "tokyo", type: "city" as const },
  { label: "Paris", slug: "paris", type: "city" as const },
  { label: "Dubai", slug: "dubai", type: "city" as const },
  { label: "Bali", slug: "bali", type: "city" as const },
  { label: "Maldives", slug: "maldives", type: "city" as const },
  { label: "Singapore", slug: "singapore", type: "city" as const },
  { label: "London", slug: "london", type: "city" as const },
];

// ---------------------------------------------------------------------------
// Search result type
// ---------------------------------------------------------------------------
interface HotelResult {
  hotel_id: number;
  hotel_name: string;
  city: string;
  country: string;
  star_rating: number | null;
  photo1: string | null;
}

// ============================================================================
// Search Page
// ============================================================================
export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [hotelResults, setHotelResults] = useState<HotelResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load cities for matching
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
      });
  }, []);

  // Auto-focus the search input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Run search if initial query exists
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setHotelResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const results = await searchHotels(q, 20);
      setHotelResults(results || []);
    } catch {
      setHotelResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch(query);
    // Update URL
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.replace(`/search?${params.toString()}`);
  };

  // Filter matching cities based on query
  const matchingCities = query.trim().length >= 2
    ? cities.filter(
        (c) =>
          c.city_name.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", color: "var(--ink)" }}>
      {/* ── Nav ── */}
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
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="type-logo" style={{ letterSpacing: "0.08em", color: "var(--ink)" }}>
            <span style={{ color: "var(--gold)" }}>V</span>oyagr
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div className="nav-links" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
            {[
              { label: "HOME", href: "/" },
              { label: "SEARCH", href: "/search" },
              { label: "LOCATIONS", href: "/locations" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="type-nav"
                style={{
                  color: link.href === "/search" ? "var(--gold)" : "var(--ink-mid)",
                  textDecoration: "none",
                  paddingBottom: "2px",
                  borderBottom: link.href === "/search" ? "1px solid var(--gold)" : "1px solid transparent",
                  transition: "color 0.2s, border-color 0.2s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <MobileNav
            links={[
              { label: "Home", href: "/" },
              { label: "Search", href: "/search" },
              { label: "Locations", href: "/locations" },
            ]}
          />
        </div>
      </nav>

      {/* ── Date bar ── */}
      <div style={{ paddingTop: 60 }}>
        <DateBar variant="dark" />
      </div>

      {/* ── Hero search area ── */}
      <section
        style={{
          paddingTop: "0px",
          background: "var(--ink)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.04,
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--cream) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        <div style={{ position: "relative", padding: "80px 60px 72px", maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "16px", color: "var(--gold)" }}>
              Search Hotels
            </div>
            <h1
              className="type-display-2"
              style={{ color: "var(--cream)", marginBottom: "12px" }}
            >
              Find your perfect{" "}
              <em style={{ fontStyle: "italic", color: "var(--gold)" }}>stay</em>
            </h1>
            <p className="type-body-lg" style={{ color: "rgba(245,240,232,0.5)", marginBottom: "40px" }}>
              Search across 1,500+ hotels in 50+ cities worldwide
            </p>
          </motion.div>

          {/* Search form with autocomplete */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              display: "flex",
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              maxWidth: "680px",
              margin: "0 auto",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ flex: 1, padding: "18px 18px 18px 18px" }}>
              <DestinationSearch
                variant="light"
                placeholder="Search by city, hotel name, or country..."
                autoFocus
                defaultValue={initialQuery}
                onValueChange={(val) => {
                  setQuery(val);
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => {
                    performSearch(val);
                  }, 400);
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "18px 32px",
                background: "var(--ink)",
                color: "var(--cream)",
                border: "none",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget).style.background = "var(--gold)"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.background = "var(--ink)"; }}
            >
              Search
            </button>
          </motion.form>

          {/* Popular searches */}
          {!query.trim() && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{
                marginTop: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "11px", color: "rgba(245,240,232,0.35)", letterSpacing: "0.08em" }}>
                POPULAR:
              </span>
              {POPULAR_SEARCHES.map((s) => (
                <Link
                  key={s.slug}
                  href={`/city/${s.slug}`}
                  style={{
                    fontSize: "12px",
                    color: "rgba(245,240,232,0.6)",
                    textDecoration: "none",
                    padding: "4px 14px",
                    border: "1px solid rgba(245,240,232,0.12)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget).style.borderColor = "var(--gold)";
                    (e.currentTarget).style.color = "var(--gold)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget).style.borderColor = "rgba(245,240,232,0.12)";
                    (e.currentTarget).style.color = "rgba(245,240,232,0.6)";
                  }}
                >
                  {s.label}
                </Link>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Results area ── */}
      <section style={{ padding: "60px 60px 100px", maxWidth: "1400px", margin: "0 auto" }}>
        {/* City matches */}
        {matchingCities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: "56px" }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "20px" }}>
              Matching Destinations
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}>
              {matchingCities.slice(0, 8).map((city) => (
                <Link
                  key={city.city_slug}
                  href={`/city/${city.city_slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <motion.div
                    className="card-hover"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ height: "140px", overflow: "hidden" }}>
                      <img
                        className="card-img"
                        src={safeImageSrc(getCityImage(city.city_slug))}
                        alt={city.city_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          filter: "saturate(0.88)",
                        }}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                      />
                    </div>
                    <div style={{ padding: "14px 16px 16px" }}>
                      <div className="type-heading-3" style={{ color: "var(--ink)", fontStyle: "italic", fontSize: "17px", marginBottom: "2px" }}>
                        {city.city_name}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--ink-light)", letterSpacing: "0.04em" }}>
                        {city.country}
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "10px",
                        paddingTop: "10px",
                        borderTop: "1px solid var(--cream-border)",
                      }}>
                        <span style={{ fontSize: "10px", color: "var(--ink-light)" }}>
                          {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore"}
                        </span>
                        <span className="card-arrow" style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 500 }}>
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Hotel results */}
        {searching && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div className="shimmer" style={{
              width: "200px",
              height: "8px",
              margin: "0 auto 16px",
              background: "var(--cream-deep)",
              borderRadius: "4px",
            }} />
            <p style={{ fontSize: "13px", color: "var(--ink-light)" }}>Searching hotels...</p>
          </div>
        )}

        {!searching && hasSearched && hotelResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "24px" }}>
              <div className="type-eyebrow">
                Hotels Found
              </div>
              <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>
                {hotelResults.length} result{hotelResults.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {hotelResults.map((hotel, i) => (
                <motion.div
                  key={hotel.hotel_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <Link
                    href={`/hotel/${hotel.hotel_id}`}
                    style={{ textDecoration: "none", display: "block" }}
                  >
                    <div
                      className="card-hover"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "200px 1fr",
                        background: "var(--white)",
                        border: "1px solid var(--cream-border)",
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                    >
                      {/* Image */}
                      <div style={{ height: "140px", overflow: "hidden" }}>
                        <img
                          className="card-img"
                          src={hotel.photo1 ? safeImageSrc(hotel.photo1.startsWith("http") ? hotel.photo1 : `https://photos.hotelbeds.com/giata/${hotel.photo1}`) : FALLBACK_IMAGE}
                          alt={hotel.hotel_name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                            filter: "saturate(0.88)",
                          }}
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                        />
                      </div>

                      {/* Content */}
                      <div style={{ padding: "18px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                          {hotel.star_rating && (
                            <span style={{ color: "var(--gold)", fontSize: "10px", letterSpacing: "1px" }}>
                              {"★".repeat(hotel.star_rating)}
                            </span>
                          )}
                        </div>
                        <div className="type-heading-3" style={{
                          color: "var(--ink)",
                          fontStyle: "italic",
                          marginBottom: "4px",
                          fontSize: "18px",
                        }}>
                          {hotel.hotel_name}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--ink-light)", letterSpacing: "0.04em" }}>
                          {hotel.city}, {hotel.country}
                        </div>
                        <div style={{ marginTop: "12px" }}>
                          <span className="card-arrow" style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 500, letterSpacing: "0.04em" }}>
                            View details &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {!searching && hasSearched && hotelResults.length === 0 && matchingCities.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: "center", padding: "80px 0" }}
          >
            <div style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 20px",
              background: "var(--cream-deep)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="type-display-3" style={{ color: "var(--ink)", fontStyle: "italic", marginBottom: "8px" }}>
              No results found
            </h3>
            <p className="type-body" style={{ color: "var(--ink-light)", maxWidth: "400px", margin: "0 auto" }}>
              Try searching with a different city name, hotel, or country.
            </p>
          </motion.div>
        )}

        {/* Empty state — no search yet */}
        {!hasSearched && !query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="type-eyebrow" style={{ marginBottom: "24px" }}>
              Trending Destinations
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "16px",
            }}>
              {cities.slice(0, 8).map((city, i) => (
                <Link
                  key={city.city_slug}
                  href={`/city/${city.city_slug}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <motion.div
                    className="card-hover"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.06 }}
                    style={{
                      background: "var(--white)",
                      border: "1px solid var(--cream-border)",
                      overflow: "hidden",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
                      <img
                        className="card-img"
                        src={safeImageSrc(getCityImage(city.city_slug))}
                        alt={city.city_name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          filter: "saturate(0.88)",
                        }}
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}
                      />
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, rgba(26,23,16,0.5) 0%, transparent 50%)",
                        pointerEvents: "none",
                      }} />
                      <div style={{
                        position: "absolute",
                        bottom: "12px",
                        left: "14px",
                      }}>
                        <div style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "18px",
                          fontWeight: 400,
                          fontStyle: "italic",
                          color: "var(--cream)",
                        }}>
                          {city.city_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(245,240,232,0.7)", marginTop: "2px" }}>
                          {city.country}
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}>
                        <span style={{ fontSize: "10px", color: "var(--ink-light)" }}>
                          {city.hotel_count > 0 ? `${city.hotel_count}+ hotels` : "Explore stays"}
                        </span>
                        <span className="card-arrow" style={{ fontSize: "11px", color: "var(--gold)", fontWeight: 500 }}>
                          View &rarr;
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </section>

      {/* ── Footer ── */}
      <footer
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
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="type-logo" style={{ color: "var(--ink)", letterSpacing: "0.08em" }}>
              <span style={{ color: "var(--gold)" }}>V</span>oyagr
            </span>
          </Link>
          <div className="footer-links" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {[
              { label: "Locations", href: "/locations" },
              { label: "Search", href: "/search" },
              { label: "WhatsApp", href: "https://wa.me/919876543210" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="type-caption"
                style={{
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  color: "var(--ink-light)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
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
