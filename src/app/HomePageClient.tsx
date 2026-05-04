"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  fetchCuratedCities,
  fetchFeaturedAll,
  fetchHomeFeaturedHotels,
  fetchPreferredHotels,
  CuratedCity,
  CuratedHotel,
} from "@/lib/api";
import type {
  FeaturedResponse,
  HomeFeaturedHotel,
  PreferredHotel,
} from "@/lib/api";
import { SAMPLE_CITIES, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import { hotelUrl } from "@/lib/urls";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationSearch from "@/components/DestinationSearch";
import LuxeDatePicker from "@/components/LuxeDatePicker";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { trackCtaClicked } from "@/lib/analytics";
import TopCitiesMobileCarousel from "@/components/TopCitiesMobileCarousel";
import EditorsBentoCarousel, { type BentoHotel } from "@/components/EditorsBentoCarousel";
import PreferredHotelsCarousel from "@/components/PreferredHotelsCarousel";
import WhyMembersAccordion from "@/components/WhyMembersAccordion";

export interface HomePageClientProps {
  initialCities: CuratedCity[];
  initialFeatured: FeaturedResponse | null;
  initialEditorsPicks: HomeFeaturedHotel[];
  initialPreferredHotels: PreferredHotel[];
}

// Legacy hardcoded "Handpicked Experiences" tiles. Used as a fallback when the
// admin hasn't curated any preferred hotels yet (or the backend is down) so the
// section still feels populated rather than empty.
const FALLBACK_PREFERRED_HOTELS: Array<{
  name: string;
  city: string;
  tagline: string;
  perks: string;
  hue: string;
}> = [
  {
    name: "The Ritz-Carlton, Bali",
    city: "Nusa Dua, Indonesia",
    tagline: "Oceanfront luxury",
    perks: "Room upgrade, late checkout, and welcome drinks for members.",
    hue: "linear-gradient(135deg, rgba(200,170,118,0.18) 0%, rgba(20,18,15,0.6) 100%)",
  },
  {
    name: "The Oberoi, Mumbai",
    city: "Nariman Point, India",
    tagline: "Heritage elegance",
    perks: "Spa credit, breakfast included, and early check-in for members.",
    hue: "linear-gradient(135deg, rgba(180,140,90,0.18) 0%, rgba(20,18,15,0.6) 100%)",
  },
  {
    name: "Park Hyatt Tokyo",
    city: "Shinjuku, Japan",
    tagline: "Sky-high serenity",
    perks: "Club lounge access, late checkout, and welcome amenity for members.",
    hue: "linear-gradient(135deg, rgba(160,170,180,0.18) 0%, rgba(20,18,15,0.6) 100%)",
  },
];

const HERO_BG =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=2400&q=85&auto=format&fit=crop";

function safeImg(u: string | null | undefined): string {
  if (!u || !u.trim()) return FALLBACK_CITY_IMAGE;
  if (u.startsWith("http://")) return u.replace("http://", "https://");
  return u;
}

// Tasteful champagne→charcoal gradient used when a city/hotel has no image_url.

export default function Home({
  initialCities,
  initialFeatured,
  initialEditorsPicks,
  initialPreferredHotels,
}: HomePageClientProps) {
  const {
    checkIn,
    checkOut,
    setDates,
    formatDate,
    totalAdults,
    totalChildren,
    rooms,
  } = useBooking();
  const { user } = useAuth();
  const router = useRouter();

  // `cities` powers the legacy SEO list / fallback flows; we still keep the
  // setter wired for the API rehydration effect below.
  const [, setCities] = useState<CuratedCity[]>(initialCities);
  const [featured, setFeatured] = useState<FeaturedResponse | null>(
    initialFeatured
  );
  // Admin-curated `home_featured_hotels` rows. SSR-prefetched in `page.tsx`,
  // hydrated client-side if SSR was empty (matches the cities pattern).
  const [curatedEditorsPicks, setCuratedEditorsPicks] =
    useState<HomeFeaturedHotel[]>(initialEditorsPicks);
  // Admin-curated `preferred_hotels` rows (with member benefits). SSR-prefetched
  // in `page.tsx`, hydrated client-side if SSR was empty.
  const [preferredHotels, setPreferredHotels] = useState<PreferredHotel[]>(
    initialPreferredHotels
  );
  // Local hero search state — fed by DestinationSearch via onValueChange/onSelect.
  // Without this, the parent had no way to know what the user typed, so the
  // Search button always navigated to /search with no params.
  const [heroDestination, setHeroDestination] = useState("");
  const [heroDestError, setHeroDestError] = useState(false);
  const [heroDateOpen, setHeroDateOpen] = useState(false);


  useEffect(() => {
    if (initialCities.length === 0) {
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
    }
    if (!initialFeatured) {
      fetchFeaturedAll()
        .then((d) => d && setFeatured(d))
        .catch(() => {});
    }
    if (initialEditorsPicks.length === 0) {
      fetchHomeFeaturedHotels()
        .then(setCuratedEditorsPicks)
        .catch(() => {});
    }
    if (initialPreferredHotels.length === 0) {
      fetchPreferredHotels()
        .then(setPreferredHotels)
        .catch(() => {});
    }
  }, [
    initialCities.length,
    initialFeatured,
    initialEditorsPicks.length,
    initialPreferredHotels.length,
  ]);

  // Editor's Picks — admin-curated home_featured_hotels (is_active=TRUE,
  // ordered by display_order ASC, capped at 12 server-side). If the admin
  // hasn't curated anything yet (or the backend is down), fall back to the
  // legacy top-rated bucket so the section is still useful during transition.
  const fallbackEditorsPicks: CuratedHotel[] = (featured?.topRated ?? []).slice(
    0,
    8
  );
  const useCurated = curatedEditorsPicks.length > 0;

  // Normalise hotel data into the unified BentoHotel shape for the carousel
  const bentoHotels: BentoHotel[] = useCurated
    ? curatedEditorsPicks.map((h) => ({
        id: h.id,
        name: h.name,
        city: h.city_name,
        country: h.country,
        imageUrl: safeImg(h.image_url),
        href: hotelUrl(h),
      }))
    : fallbackEditorsPicks.map((h) => ({
        id: h.id,
        name: h.hotel_name,
        city: h.city_name,
        country: h.country,
        imageUrl: safeImg(h.photo1 || h.photo2),
        href: hotelUrl(h),
      }));

  function handleHeroSearch() {
    const q = heroDestination.trim();
    if (!q) {
      // Visible nudge instead of silent failure
      setHeroDestError(true);
      // Clear the highlight after a few seconds so it doesn't get stuck
      setTimeout(() => setHeroDestError(false), 2500);
      // Focus the destination input so the user can type
      const input = document.querySelector<HTMLInputElement>(
        '#hero-search input[role="combobox"]'
      );
      input?.focus();
      return;
    }
    const params = new URLSearchParams();
    params.set("q", q);
    if (checkIn) params.set("checkin", checkIn);
    if (checkOut) params.set("checkout", checkOut);
    if (totalAdults > 0) params.set("adults", String(totalAdults));
    params.set("children", String(totalChildren));
    params.set("rooms", String(rooms.length || 1));
    router.push(`/search?${params.toString()}`);
  }

  function handleSeeMemberRates(e: React.MouseEvent) {
    e.preventDefault();
    const loggedIn = Boolean(user);
    trackCtaClicked({
      cta_name: "see_member_rates_hero",
      cta_location: "hero",
      destination_url: loggedIn ? "/search" : "#hero-search",
    });
    if (loggedIn) {
      router.push("/search");
      return;
    }
    document.getElementById("hero-search")?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  return (
    <div className="luxe">
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative"
        style={{
          paddingTop: 120,
          paddingBottom: 80,
          background: `linear-gradient(180deg, rgba(12,11,10,0.85) 0%, rgba(12,11,10,0.96) 80%), url(${HERO_BG}) center/cover no-repeat fixed`,
        }}
      >
        <div className="luxe-container" style={{ paddingTop: 8 }}>
          <div className="luxe-tech" style={{ marginBottom: 8, fontSize: 10 }}>
            Voyagr Club
          </div>
          <h1
            className="luxe-display"
            style={{
              fontSize: "clamp(36px, 4vw, 56px)",
              lineHeight: 1.05,
              maxWidth: 820,
              marginBottom: 12,
              color: "var(--luxe-soft-white)",
            }}
          >
            Hotel rates your travel agent can&rsquo;t get you.
          </h1>
          <p
            style={{
              maxWidth: 620,
              color: "var(--luxe-soft-white-70)",
              fontSize: 15,
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            Members-only pricing, upgrades and concierge &mdash; at the world&rsquo;s best hotels.
          </p>

          {/* Search bar — glass capsule */}
          <motion.div
            id="hero-search"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`luxe-glass home-hero-search${heroDestError ? " hero-search--flash" : ""}`}
            style={{
              borderRadius: 9999,
              padding: 6,
              maxWidth: 760,
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr auto",
              alignItems: "center",
              gap: 0,
              marginBottom: 20,
              position: "relative",
              pointerEvents: "auto",
            }}
          >
            <div style={{ padding: "7px 14px" }}>
              <div className="luxe-tech" style={{ marginBottom: 4 }}>
                Destination
              </div>
              <DestinationSearch
                variant="dark"
                placeholder="City or hotel"
                onValueChange={(v) => {
                  setHeroDestination(v);
                  if (v.trim()) setHeroDestError(false);
                }}
                onSelect={(_type, _value, label) => {
                  // User picked a suggestion — keep the human-readable label as
                  // the query so the search page surfaces matching results.
                  const filled = label ?? _value;
                  setHeroDestination(filled);
                  setHeroDestError(false);
                }}
              />
            </div>
            {/* Date range — single LuxeDatePicker, dual-column trigger. */}
            <button
              type="button"
              onClick={() => setHeroDateOpen(true)}
              style={{
                padding: "7px 14px",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                borderLeftWidth: 1,
                borderLeftStyle: "solid",
                borderLeftColor: "rgba(255,255,255,0.08)",
                textAlign: "left",
              }}
            >
              <div className="luxe-tech" style={{ marginBottom: 4 }}>
                Check In
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: checkIn ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-50)",
                }}
              >
                {formatDate(checkIn)}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setHeroDateOpen(true)}
              style={{
                padding: "7px 14px",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                borderLeftWidth: 1,
                borderLeftStyle: "solid",
                borderLeftColor: "rgba(255,255,255,0.08)",
                textAlign: "left",
              }}
            >
              <div className="luxe-tech" style={{ marginBottom: 4 }}>
                Check Out
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: checkOut ? "var(--luxe-soft-white)" : "var(--luxe-soft-white-50)",
                }}
              >
                {formatDate(checkOut)}
              </div>
            </button>
            <LuxeDatePicker
              variant="dark"
              checkIn={checkIn || null}
              checkOut={checkOut || null}
              onChange={({ checkIn: ci, checkOut: co }) => setDates(ci ?? "", co ?? "")}
              open={heroDateOpen}
              onClose={() => setHeroDateOpen(false)}
              showTrigger={false}
            />
            <button
              onClick={handleHeroSearch}
              className="luxe-btn-primary"
              style={{ margin: 4, padding: "10px 18px" }}
              aria-label="Search"
            >
              Search
            </button>
          </motion.div>

          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <a href="#hero-search" onClick={handleSeeMemberRates} className="luxe-btn-secondary">
              See Member Rates
            </a>
            <span className="luxe-tech luxe-tech-soft">
              Free Forever &middot; No Annual Fees &middot; 24/7 Concierge
            </span>
          </div>
        </div>
      </motion.section>

      {/* ── Top Cities — mobile-first horizontal carousel ───────────────── */}
      <TopCitiesMobileCarousel />

      {/* ── Editor's Picks — auto-rotating bento carousel ───────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "48px 0 32px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          {/* Header row: eyebrow + headline on the left, "See More →" aligned to baseline on the right */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 20,
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="luxe-tech" style={{ marginBottom: 6 }}>
                Editor&rsquo;s Picks
              </div>
              <h2
                className="luxe-display"
                style={{ fontSize: "clamp(22px, 2.2vw, 28px)", marginBottom: 0 }}
              >
                Stays our concierge <em>keeps revisiting</em>
              </h2>
            </div>
            <Link
              href="/search"
              className="luxe-tech"
              style={{ color: "var(--luxe-champagne)", whiteSpace: "nowrap" }}
            >
              See More &rarr;
            </Link>
          </div>

          {/* Bento carousel — shows loading message only when no data yet */}
          {bentoHotels.length === 0 ? (
            <div
              style={{
                color: "var(--luxe-soft-white-50)",
                fontSize: 13,
                paddingTop: 12,
                paddingBottom: 12,
              }}
            >
              Curating editor&rsquo;s picks&hellip;
            </div>
          ) : (
            <EditorsBentoCarousel hotels={bentoHotels} />
          )}
        </div>
      </motion.section>

      {/* ── The Difference — mobile-first accordion (Voyagr Club spec) ───── */}
      <WhyMembersAccordion />

      {/* ── Preferred Hotels — admin-curated stays with member benefits ─── */}
      {/* Sourced from GET /api/curations/preferred-hotels (admin-curated,
          active=TRUE, ordered, capped 50). Each tile shows hotel image + city
          eyebrow + optional Playfair italic tagline + name + country, with a
          champagne-tinted chip strip at the bottom listing the negotiated
          perks for that property. Falls back to the legacy 3 hardcoded tiles
          when the curation list is empty so the section is never blank. */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "48px 0 32px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 20,
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 640 }}>
              <div className="luxe-tech" style={{ marginBottom: 6 }}>
                Preferred Hotels
              </div>
              <h2
                className="luxe-display"
                style={{ fontSize: "clamp(22px, 2.6vw, 36px)", marginBottom: 0 }}
              >
                Stays we&rsquo;d <em>book ourselves</em>
              </h2>
            </div>
          </div>

          {preferredHotels.length > 0 ? (
            <PreferredHotelsCarousel hotels={preferredHotels} />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {FALLBACK_PREFERRED_HOTELS.map((e) => (
                <div
                  key={e.name}
                  className="luxe-card"
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      height: 180,
                      background: e.hue,
                      borderBottom: "1px solid var(--luxe-hairline)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-display)",
                        fontSize: 64,
                        color: "var(--luxe-champagne)",
                        opacity: 0.18,
                        letterSpacing: "-0.04em",
                        fontStyle: "italic",
                      }}
                    >
                      {e.name.split(" ").slice(-1)[0]}
                    </div>
                  </div>
                  <div style={{ padding: 22, flex: 1 }}>
                    <div className="luxe-tech" style={{ marginBottom: 8 }}>
                      {e.tagline}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        fontWeight: 500,
                        color: "var(--luxe-soft-white)",
                        lineHeight: 1.2,
                        letterSpacing: "-0.015em",
                        marginBottom: 6,
                      }}
                    >
                      {e.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--luxe-soft-white-50)",
                        letterSpacing: "0.04em",
                        marginBottom: 14,
                      }}
                    >
                      {e.city}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        color: "var(--luxe-soft-white-70)",
                        lineHeight: 1.65,
                      }}
                    >
                      {e.perks}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </motion.section>

      {/* ── Travel by Season — 4-up grid ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "40px 0 28px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          <div style={{ maxWidth: 640, marginBottom: 20 }}>
            <h2
              className="luxe-display"
              style={{ fontSize: "clamp(22px, 2.6vw, 36px)", marginBottom: 0 }}
            >
              When to go, <em>where to go</em>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                season: "Summer",
                months: "Jun – Aug",
                cities: ["Santorini", "Bali", "Cape Town"],
                glyph: "☀",
              },
              {
                season: "Autumn",
                months: "Sep – Nov",
                cities: ["Kyoto", "Prague", "Budapest"],
                glyph: "⚘",
              },
              {
                season: "Winter",
                months: "Dec – Feb",
                cities: ["Dubai", "Maldives", "Vienna"],
                glyph: "❄",
              },
              {
                season: "Spring",
                months: "Mar – May",
                cities: ["Tokyo", "Amsterdam", "Lisbon"],
                glyph: "✿",
              },
            ].map((s) => (
              <div key={s.season} className="luxe-card" style={{ paddingTop: 24, paddingBottom: 24 }}>
                <div
                  aria-hidden="true"
                  style={{
                    fontSize: 22,
                    color: "var(--luxe-champagne)",
                    opacity: 0.7,
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  {s.glyph}
                </div>
                <div className="luxe-tech" style={{ marginBottom: 8 }}>
                  {s.months}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 24,
                    fontWeight: 500,
                    color: "var(--luxe-soft-white)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.015em",
                    marginBottom: 16,
                  }}
                >
                  {s.season}
                </div>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {s.cities.map((c) => (
                    <li
                      key={c}
                      style={{
                        fontSize: 13.5,
                        color: "var(--luxe-soft-white-70)",
                        lineHeight: 1.5,
                      }}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Voice + Proof ─────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="vp-section"
        style={{ borderTop: "1px solid var(--luxe-hairline)" }}
      >
        <div className="luxe-container vp-grid" style={{ maxWidth: 1200 }}>
          {/* Left 60%: pull-quote */}
          <div className="vp-quote-col">
            <div style={{ position: "relative" }}>
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -28,
                  left: -8,
                  fontFamily: "Georgia, 'Cormorant Garamond', serif",
                  fontSize: 96,
                  lineHeight: 1,
                  color: "#C9A961",
                  opacity: 0.35,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                &ldquo;
              </span>
              <blockquote
                className="vp-quote-text"
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  lineHeight: 1.35,
                  color: "#f5f1e8",
                  fontWeight: 400,
                  maxWidth: 520,
                }}
              >
                One WhatsApp message. Upgrades, reservations, even a birthday
                surprise — all arranged.
              </blockquote>
            </div>
            <p
              style={{
                marginTop: 20,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.55)",
                fontStyle: "normal",
                fontFamily: "Inter, system-ui, sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 28,
                  height: 1,
                  background: "#C9A961",
                  flexShrink: 0,
                }}
              />
              Rahul Sharma&nbsp;&nbsp;&middot;&nbsp;&nbsp;Delhi
            </p>
          </div>

          {/* Right 40%: three stacked stats */}
          <div className="vp-stats-col" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {[
              { base: "1,500", accent: "+", label: "Partner hotels" },
              { base: "50", accent: "+", label: "Cities" },
              { base: "24", accent: "/7", label: "WhatsApp concierge" },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  paddingBottom: i < 2 ? 24 : 0,
                  borderBottom: i < 2 ? "1px solid rgba(201,169,97,0.18)" : "none",
                }}
              >
                <div
                  className="vp-stat-number"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    lineHeight: 1,
                    color: "#f5f1e8",
                  }}
                >
                  {s.base}
                  <span style={{ color: "#C9A961" }}>{s.accent}</span>
                </div>
                <div
                  style={{
                    width: 40,
                    height: 1,
                    background: "#C9A961",
                    margin: "8px 0",
                  }}
                />
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.55)",
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Footer CTA ────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "36px 0 24px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div
          className="luxe-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <h2
            className="luxe-display"
            style={{ fontSize: "clamp(18px, 2vw, 26px)", margin: 0 }}
          >
            Let us craft your next{" "}
            <em style={{ color: "var(--luxe-champagne)" }}>unforgettable stay</em>
          </h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="https://wa.me/919876543210?text=Hi%2C%20I%27d%20like%20to%20plan%20a%20trip"
              className="luxe-btn-gold"
              target="_blank"
              rel="noreferrer"
            >
              Chat on WhatsApp
            </a>
            <Link href="/search" className="luxe-btn-secondary">
              Search Hotels
            </Link>
          </div>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
