"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { fetchCuratedCities, searchHotelsByName, CuratedCity, SearchHotelHit } from "@/lib/api";
import { SAMPLE_CITIES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type HotelSuggestion = SearchHotelHit;

interface DestinationSearchProps {
  /** Visual variant */
  variant?: "light" | "dark";
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus the input on mount */
  autoFocus?: boolean;
  /** Called when user selects a suggestion (instead of default navigation) */
  onSelect?: (type: "city" | "hotel", value: string, label?: string) => void;
  /** Initial value */
  defaultValue?: string;
  /** Called when value changes */
  onValueChange?: (value: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function DestinationSearch({
  variant = "light",
  placeholder = "Search city, hotel, or country...",
  autoFocus = false,
  onSelect,
  defaultValue = "",
  onValueChange,
}: DestinationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [cities, setCities] = useState<CuratedCity[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<CuratedCity[]>([]);
  const [hotelSuggestions, setHotelSuggestions] = useState<HotelSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Total suggestion count for keyboard nav
  const totalSuggestions = citySuggestions.length + hotelSuggestions.length;

  // Load cities once
  useEffect(() => {
    fetchCuratedCities()
      .then(setCities)
      .catch(() => {
        setCities(
          SAMPLE_CITIES.map((c, i) => ({
            ...c,
            city_id: null,
            hotel_count: 0,
            display_order: i + 1,
          }))
        );
      });
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter cities client-side, search hotels via API
  const performSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim().toLowerCase();
      if (trimmed.length < 2) {
        setCitySuggestions([]);
        setHotelSuggestions([]);
        setIsOpen(false);
        return;
      }

      // Instant: filter cities locally
      const matched = cities.filter(
        (c) =>
          c.city_name.toLowerCase().includes(trimmed) ||
          c.country.toLowerCase().includes(trimmed)
      ).slice(0, 5);
      setCitySuggestions(matched);
      setIsOpen(true);
      setActiveIndex(-1);

      // Async: search hotels via API
      setLoading(true);
      try {
        const hotels = await searchHotelsByName(q, 8);
        const transitPattern = /\b(railway station|train station|bus stop|bus station|bus stand|bus terminal|metro station|airport shuttle|rail station)\b/i;
        setHotelSuggestions(
          (hotels || [])
            .filter((h) => !transitPattern.test(h.hotel_name))
            .slice(0, 8)
        );
      } catch {
        setHotelSuggestions([]);
      } finally {
        setLoading(false);
      }
    },
    [cities]
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    onValueChange?.(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleSelectCity = (city: CuratedCity) => {
    setQuery(city.city_name);
    setIsOpen(false);
    if (onSelect) {
      onSelect("city", city.city_slug, city.city_name);
    } else {
      router.push(`/city/${city.city_slug}`);
    }
  };

  const handleSelectHotel = (hotel: HotelSuggestion) => {
    setQuery(hotel.hotel_name);
    setIsOpen(false);
    if (onSelect) {
      onSelect("hotel", String(hotel.hotel_id), hotel.hotel_name);
    } else {
      router.push(`/hotel/${hotel.hotel_id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || totalSuggestions === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
          setIsOpen(false);
          if (onSelect) {
            onSelect("city", trimmed.toLowerCase().replace(/\s+/g, "-"));
          } else {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
          }
        }
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % totalSuggestions);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + totalSuggestions) % totalSuggestions);
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0) {
          if (activeIndex < citySuggestions.length) {
            handleSelectCity(citySuggestions[activeIndex]);
          } else {
            handleSelectHotel(hotelSuggestions[activeIndex - citySuggestions.length]);
          }
        } else {
          const trimmed = query.trim();
          if (trimmed) {
            setIsOpen(false);
            if (onSelect) {
              onSelect("city", trimmed.toLowerCase().replace(/\s+/g, "-"));
            } else {
              router.push(`/search?q=${encodeURIComponent(trimmed)}`);
            }
          }
        }
        break;
      case "Escape":
        setIsOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Style config
  const isDark = variant === "dark";
  const styles = {
    input: {
      border: "none",
      background: "transparent",
      fontSize: "14px",
      color: isDark ? "var(--cream)" : "var(--ink)",
      fontFamily: "var(--font-body)",
      fontWeight: 400 as const,
      width: "100%",
      outline: "none",
      padding: "0",
    },
    dropdown: {
      position: "absolute" as const,
      top: "calc(100% + 4px)",
      left: 0,
      right: 0,
      background: isDark ? "#1a1710" : "var(--white)",
      border: `1px solid ${isDark ? "rgba(245,240,232,0.1)" : "var(--cream-border)"}`,
      boxShadow: isDark
        ? "0 12px 48px rgba(0,0,0,0.5)"
        : "0 12px 48px rgba(26,23,16,0.12)",
      zIndex: 1000,
      maxHeight: "400px",
      overflowY: "auto" as const,
    },
    sectionLabel: {
      padding: "10px 16px 6px",
      fontSize: "10px",
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.1em",
      textTransform: "uppercase" as const,
      color: isDark ? "rgba(245,240,232,0.35)" : "var(--ink-light)",
    },
    item: (isActive: boolean) => ({
      display: "flex" as const,
      alignItems: "center" as const,
      gap: "12px",
      padding: "10px 16px",
      cursor: "pointer" as const,
      transition: "background 0.15s",
      background: isActive
        ? isDark
          ? "rgba(245,240,232,0.06)"
          : "var(--cream)"
        : "transparent",
    }),
    cityName: {
      fontSize: "13px",
      fontFamily: "var(--font-display)",
      fontWeight: 400,
      fontStyle: "italic" as const,
      color: isDark ? "var(--cream)" : "var(--ink)",
    },
    cityCountry: {
      fontSize: "11px",
      color: isDark ? "rgba(245,240,232,0.4)" : "var(--ink-light)",
    },
    hotelName: {
      fontSize: "13px",
      fontWeight: 500,
      color: isDark ? "var(--cream)" : "var(--ink)",
    },
    hotelLocation: {
      fontSize: "11px",
      color: isDark ? "rgba(245,240,232,0.4)" : "var(--ink-light)",
    },
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      {/* Search icon */}
      <div style={{
        position: "absolute",
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none",
      }}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDark ? "rgba(245,240,232,0.4)" : "var(--ink-light)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          ...styles.input,
          paddingLeft: "24px",
        }}
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />

      {/* Autocomplete dropdown */}
      <AnimatePresence>
        {isOpen && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={styles.dropdown}
            role="listbox"
          >
            {/* City suggestions */}
            {citySuggestions.length > 0 && (
              <>
                <div style={styles.sectionLabel}>Cities</div>
                {citySuggestions.map((city, i) => (
                  <div
                    key={city.city_slug}
                    role="option"
                    aria-selected={activeIndex === i}
                    style={styles.item(activeIndex === i)}
                    onClick={() => handleSelectCity(city)}
                    onMouseEnter={() => setActiveIndex(i)}
                  >
                    {/* Location pin icon */}
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: isDark ? "rgba(245,240,232,0.06)" : "var(--cream)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? "var(--gold)" : "var(--gold)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={styles.cityName}>
                        {highlightMatch(city.city_name, query)}
                      </div>
                      <div style={styles.cityCountry}>
                        {city.country}
                        {city.hotel_count > 0 && (
                          <span style={{ marginLeft: "8px", color: "var(--gold)", fontSize: "10px" }}>
                            {city.hotel_count}+ hotels
                          </span>
                        )}
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(245,240,232,0.2)" : "var(--cream-border)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                ))}
              </>
            )}

            {/* Hotel suggestions */}
            {hotelSuggestions.length > 0 && (
              <>
                <div style={{
                  ...styles.sectionLabel,
                  borderTop: citySuggestions.length > 0
                    ? `1px solid ${isDark ? "rgba(245,240,232,0.06)" : "var(--cream-border)"}`
                    : "none",
                  paddingTop: citySuggestions.length > 0 ? "12px" : "10px",
                }}>
                  Hotels
                </div>
                {hotelSuggestions.map((hotel, i) => {
                  const idx = citySuggestions.length + i;
                  return (
                    <div
                      key={hotel.hotel_id}
                      role="option"
                      aria-selected={activeIndex === idx}
                      style={styles.item(activeIndex === idx)}
                      onClick={() => handleSelectHotel(hotel)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      {/* Hotel icon */}
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: isDark ? "rgba(245,240,232,0.06)" : "var(--cream)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? "var(--gold)" : "var(--gold)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 21h18" />
                          <path d="M5 21V7l8-4v18" />
                          <path d="M19 21V11l-6-4" />
                          <line x1="9" y1="9" x2="9" y2="9.01" />
                          <line x1="9" y1="13" x2="9" y2="13.01" />
                          <line x1="9" y1="17" x2="9" y2="17.01" />
                        </svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={styles.hotelName}>
                          {highlightMatch(hotel.hotel_name, query)}
                        </div>
                        <div style={styles.hotelLocation}>
                          {[hotel.city, hotel.country].filter(Boolean).join(", ")}
                          {hotel.star_rating ? (
                            <span style={{ marginLeft: "6px", color: "var(--gold)", fontSize: "10px" }}>
                              {"★".repeat(hotel.star_rating)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? "rgba(245,240,232,0.2)" : "var(--cream-border)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  );
                })}
              </>
            )}

            {/* Loading indicator */}
            {loading && hotelSuggestions.length === 0 && (
              <div style={{
                padding: "12px 16px",
                fontSize: "12px",
                color: isDark ? "rgba(245,240,232,0.35)" : "var(--ink-light)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span className="shimmer" style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: isDark ? "rgba(245,240,232,0.1)" : "var(--cream-deep)",
                }} />
                Searching hotels...
              </div>
            )}

            {/* Empty state */}
            {!loading &&
              citySuggestions.length === 0 &&
              hotelSuggestions.length === 0 && (
                <div
                  style={{
                    padding: "14px 16px",
                    fontSize: "12px",
                    color: isDark
                      ? "rgba(245,240,232,0.5)"
                      : "var(--ink-light)",
                  }}
                >
                  No cities or hotels match
                </div>
              )}

            {/* Search all results footer */}
            {query.trim().length >= 2 && (
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: `1px solid ${isDark ? "rgba(245,240,232,0.06)" : "var(--cream-border)"}`,
                  cursor: "pointer",
                  transition: "background 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDark ? "rgba(245,240,232,0.04)" : "var(--cream)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span style={{
                  fontSize: "12px",
                  color: "var(--gold)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}>
                  See all results for &ldquo;{query.trim()}&rdquo;
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Highlight matching text
// ---------------------------------------------------------------------------
function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
  if (idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.trim().length);
  const after = text.slice(idx + query.trim().length);
  return (
    <>
      {before}
      <span style={{ color: "var(--gold)", fontWeight: 600 }}>{match}</span>
      {after}
    </>
  );
}
