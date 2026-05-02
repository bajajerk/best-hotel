"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  fetchCuratedCities,
  fetchFeaturedAll,
  fetchHomeFeaturedCities,
  fetchHomeFeaturedHotels,
  fetchPreferredHotels,
  CuratedCity,
  CuratedHotel,
} from "@/lib/api";
import type {
  FeaturedResponse,
  HomeFeaturedCity,
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

export interface HomePageClientProps {
  initialCities: CuratedCity[];
  initialFeatured: FeaturedResponse | null;
  initialHomeCities: HomeFeaturedCity[];
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
const CITY_FALLBACK_GRADIENT =
  "linear-gradient(135deg, rgba(200,170,118,0.32) 0%, rgba(20,18,15,0.92) 100%)";

export default function Home({
  initialCities,
  initialFeatured,
  initialHomeCities,
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
  const [homeCities, setHomeCities] =
    useState<HomeFeaturedCity[]>(initialHomeCities);
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
    if (initialHomeCities.length === 0) {
      fetchHomeFeaturedCities()
        .then(setHomeCities)
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
    initialHomeCities.length,
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
          paddingTop: 96,
          paddingBottom: 32,
          background: `linear-gradient(180deg, rgba(12,11,10,0.85) 0%, rgba(12,11,10,0.96) 80%), url(${HERO_BG}) center/cover no-repeat fixed`,
        }}
      >
        <div className="luxe-container" style={{ paddingTop: 8 }}>
          <div className="luxe-tech" style={{ marginBottom: 18 }}>
            Voyagr Club &middot; Est. Mumbai
          </div>
          <h1
            className="luxe-display"
            style={{
              fontSize: "clamp(40px, 6vw, 84px)",
              maxWidth: 920,
              marginBottom: 18,
              color: "var(--luxe-soft-white)",
            }}
          >
            Hotels you{" "}
            <em style={{ color: "var(--luxe-champagne)" }}>know</em>.<br />
            Rates they{" "}
            <span className="luxe-text-gradient">don&rsquo;t show</span>.
          </h1>
          <p
            style={{
              maxWidth: 560,
              color: "var(--luxe-soft-white-70)",
              fontSize: 15,
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            Member access to hotel rates travel agents have always paid &mdash;
            never on MakeMyTrip or Booking.com. A real human concierge on
            WhatsApp, available 24/7.
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
            <div style={{ padding: "10px 18px" }}>
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
                padding: "10px 18px",
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
                padding: "10px 18px",
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
              style={{ margin: 4, padding: "12px 22px" }}
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

        {/* ── Top Cities — admin-curated grid ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ marginTop: 44 }}
        >
          <div
            className="luxe-container"
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 18,
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 640 }}>
              <div className="luxe-tech" style={{ marginBottom: 8 }}>
                Top Cities
              </div>
              <h2
                className="luxe-display"
                style={{ fontSize: "clamp(26px, 2.8vw, 36px)", marginBottom: 8 }}
              >
                India travellers&rsquo; <em>favourites</em>
              </h2>
              <p
                style={{
                  color: "var(--luxe-soft-white-70)",
                  fontSize: 14,
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                The cities our members keep returning to &mdash; quietly curated.
              </p>
            </div>
            <Link
              href="/search"
              className="luxe-tech"
              style={{ color: "var(--luxe-champagne)" }}
            >
              Browse All &rarr;
            </Link>
          </div>

          <div className="luxe-container">
            {homeCities.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {homeCities.map((c) => (
                  <Link
                    key={c.city_slug}
                    href={`/city/${c.city_slug}`}
                    className="top-city-tile"
                    style={{
                      display: "block",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "4 / 5",
                        borderRadius: 14,
                        overflow: "hidden",
                        border: "1px solid rgba(200,170,118,0.22)",
                        background: CITY_FALLBACK_GRADIENT,
                        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
                      }}
                    >
                      {c.image_url ? (
                        <Image
                          src={safeImg(c.image_url)}
                          alt={`${c.city_name}, ${c.country}`}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="top-city-img"
                          style={{ objectFit: "cover" }}
                        />
                      ) : null}
                      {/* Bottom gradient for legibility */}
                      <div
                        aria-hidden="true"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Hotel-count chip */}
                      <div
                        style={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          padding: "4px 10px",
                          borderRadius: 9999,
                          background: "rgba(12,11,10,0.65)",
                          backdropFilter: "blur(6px)",
                          border: "1px solid rgba(200,170,118,0.28)",
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--luxe-champagne)",
                        }}
                      >
                        {c.hotel_count} stays
                      </div>
                      {/* Title block */}
                      <div
                        style={{
                          position: "absolute",
                          left: 14,
                          right: 14,
                          bottom: 14,
                          color: "var(--luxe-soft-white)",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "var(--font-mono, monospace)",
                            fontSize: 10,
                            letterSpacing: "0.18em",
                            textTransform: "uppercase",
                            color: "var(--luxe-soft-white-70)",
                            marginBottom: 6,
                          }}
                        >
                          {c.country}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: 22,
                            fontWeight: 500,
                            letterSpacing: "-0.015em",
                            lineHeight: 1.15,
                          }}
                        >
                          {c.city_name}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div
                style={{
                  color: "var(--luxe-soft-white-50)",
                  fontSize: 13,
                  paddingTop: 24,
                  paddingBottom: 24,
                }}
              >
                Curating featured cities&hellip;
              </div>
            )}
          </div>
        </motion.div>
      </motion.section>

      {/* ── Editor's Picks — single row of top-rated stays ──────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "64px 0 48px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 24,
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 640 }}>
              <div className="luxe-tech" style={{ marginBottom: 8 }}>
                Editor&rsquo;s Picks
              </div>
              <h2
                className="luxe-display"
                style={{ fontSize: "clamp(26px, 2.8vw, 36px)", marginBottom: 8 }}
              >
                Stays our concierge <em>keeps revisiting</em>
              </h2>
            </div>
            <Link
              href="/search"
              className="luxe-tech"
              style={{ color: "var(--luxe-champagne)" }}
            >
              See More &rarr;
            </Link>
          </div>

          {useCurated ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {curatedEditorsPicks.map((h) => (
                <Link
                  key={h.id}
                  href={hotelUrl(h)}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "4 / 3",
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(200,170,118,0.18)",
                      background: CITY_FALLBACK_GRADIENT,
                      marginBottom: 12,
                    }}
                  >
                    <Image
                      src={safeImg(h.image_url)}
                      alt={h.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--luxe-soft-white-50)",
                      marginBottom: 4,
                    }}
                  >
                    {h.city_name} &middot; {h.country}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      fontWeight: 500,
                      color: "var(--luxe-soft-white)",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.25,
                      marginBottom: 4,
                    }}
                  >
                    {h.name}
                  </div>
                  {h.rating_average != null ? (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--luxe-soft-white-70)",
                      }}
                    >
                      {h.rating_average.toFixed(1)}/10
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : fallbackEditorsPicks.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 16,
              }}
            >
              {fallbackEditorsPicks.map((h) => (
                <Link
                  key={h.id}
                  href={hotelUrl(h)}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "4 / 3",
                      borderRadius: 14,
                      overflow: "hidden",
                      border: "1px solid rgba(200,170,118,0.18)",
                      background: CITY_FALLBACK_GRADIENT,
                      marginBottom: 12,
                    }}
                  >
                    <Image
                      src={safeImg(h.photo1 || h.photo2)}
                      alt={h.hotel_name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--luxe-soft-white-50)",
                      marginBottom: 4,
                    }}
                  >
                    {h.city_name} &middot; {h.country}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 17,
                      fontWeight: 500,
                      color: "var(--luxe-soft-white)",
                      letterSpacing: "-0.01em",
                      lineHeight: 1.25,
                      marginBottom: 4,
                    }}
                  >
                    {h.hotel_name}
                  </div>
                  {h.rating_average ? (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: "var(--luxe-soft-white-70)",
                      }}
                    >
                      {h.rating_average.toFixed(1)}/10
                      {h.star_rating ? (
                        <span style={{ marginLeft: 8, color: "var(--luxe-champagne)" }}>
                          {"★".repeat(Math.round(h.star_rating))}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </motion.section>

      {/* ── Why Voyagr — concise 4-up grid ────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{ padding: "56px 0 48px" }}
      >
        <div className="luxe-container">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 28,
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div className="luxe-tech" style={{ marginBottom: 8 }}>
                The Membership
              </div>
              <h2 className="luxe-display" style={{ fontSize: "clamp(28px, 3vw, 40px)" }}>
                A more rewarding way to <em>travel</em>
              </h2>
            </div>
            <Link href="/preferred-rates" className="luxe-btn-secondary">
              Member Perks
            </Link>
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
                num: "01",
                title: "Join Free",
                desc: "Unlock preferred access — no annual fees, no lock-in.",
              },
              {
                num: "02",
                title: "Share Your Plans",
                desc: "WhatsApp our concierge. We listen, then curate.",
              },
              {
                num: "03",
                title: "Member Perks",
                desc: "Upgrades, late checkout, spa credits — handpicked.",
              },
              {
                num: "04",
                title: "Full Concierge",
                desc: "From booking to checkout — quietly attended.",
              },
            ].map((s) => (
              <div key={s.num} className="luxe-card">
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 36,
                    color: "var(--luxe-champagne)",
                    opacity: 0.5,
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--luxe-soft-white)",
                    marginBottom: 8,
                  }}
                >
                  {s.title}
                </div>
                <div style={{ fontSize: 13, color: "var(--luxe-soft-white-70)", lineHeight: 1.6 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── The Voyagr Club Difference — 6-up grid ───────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{ padding: "80px 0 64px" }}
      >
        <div className="luxe-container">
          <div style={{ maxWidth: 720, marginBottom: 40 }}>
            <div className="luxe-tech" style={{ marginBottom: 10 }}>
              The Difference
            </div>
            <h2
              className="luxe-display"
              style={{ fontSize: "clamp(28px, 3.2vw, 44px)", marginBottom: 14 }}
            >
              Why members <em>stay</em> with us
            </h2>
            <p
              style={{
                color: "var(--luxe-soft-white-70)",
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              Six small things that quietly add up to a different way of
              travelling — preferred access, real concierge care, and perks
              that aren&rsquo;t advertised anywhere else.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                num: "01",
                title: "Preferred Access to Top Hotels",
                desc: "Elevated access to a curated collection of the world's finest hotels with exclusive member privileges.",
              },
              {
                num: "02",
                title: "A Real Human Concierge",
                desc: "Every booking handled by a real concierge on WhatsApp, available 24/7.",
              },
              {
                num: "03",
                title: "Handpicked Perks on Every Stay",
                desc: "Room upgrades, spa credits, welcome drinks, early check-in, breakfast, lounge access, and more.",
              },
              {
                num: "04",
                title: "Verified Luxury Properties",
                desc: "Only properties we've vetted ourselves for service, cleanliness, and guest satisfaction.",
              },
              {
                num: "05",
                title: "Flexible Support, Always",
                desc: "24/7 concierge team for modifications, special requests, and anything that comes up.",
              },
              {
                num: "06",
                title: "Free Membership, No Lock-In",
                desc: "No annual fees, no points programs that expire. Same privileged access from day one.",
              },
            ].map((d) => (
              <div key={d.num} className="luxe-card">
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 28,
                    color: "var(--luxe-champagne)",
                    opacity: 0.55,
                    lineHeight: 1,
                    marginBottom: 14,
                  }}
                >
                  {d.num}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 19,
                    fontWeight: 500,
                    color: "var(--luxe-soft-white)",
                    lineHeight: 1.25,
                    letterSpacing: "-0.01em",
                    marginBottom: 10,
                  }}
                >
                  {d.title}
                </div>
                <div
                  style={{
                    fontSize: 13.5,
                    color: "var(--luxe-soft-white-70)",
                    lineHeight: 1.65,
                  }}
                >
                  {d.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

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
          padding: "80px 0 64px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 36,
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ maxWidth: 640 }}>
              <div className="luxe-tech" style={{ marginBottom: 10 }}>
                Preferred Hotels
              </div>
              <h2
                className="luxe-display"
                style={{ fontSize: "clamp(28px, 3.2vw, 44px)", marginBottom: 12 }}
              >
                Stays we&rsquo;d <em>book ourselves</em>
              </h2>
              <p
                style={{
                  color: "var(--luxe-soft-white-70)",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                Quietly negotiated perks at properties our concierge revisits
                &mdash; for members, on every stay.
              </p>
            </div>
          </div>

          {preferredHotels.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 18,
              }}
            >
              {preferredHotels.map((h) => (
                <Link
                  key={h.id}
                  href={hotelUrl(h)}
                  className="preferred-tile"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    textDecoration: "none",
                    color: "inherit",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid var(--luxe-hairline)",
                    background: "var(--luxe-card-bg, rgba(20,18,15,0.4))",
                    transition:
                      "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "4 / 3",
                      overflow: "hidden",
                      background: CITY_FALLBACK_GRADIENT,
                    }}
                  >
                    <Image
                      src={safeImg(h.image_url)}
                      alt={h.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="preferred-tile-img"
                      style={{
                        objectFit: "cover",
                        transition: "transform 360ms ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "var(--luxe-champagne)",
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 10,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "var(--luxe-soft-white-50)",
                        }}
                      >
                        {h.city_name}
                      </span>
                    </div>
                    {h.tagline ? (
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontStyle: "italic",
                          fontSize: 14,
                          color: "var(--luxe-champagne)",
                          letterSpacing: "-0.005em",
                          opacity: 0.92,
                        }}
                      >
                        {h.tagline}
                      </div>
                    ) : null}
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        fontWeight: 500,
                        color: "var(--luxe-soft-white)",
                        lineHeight: 1.22,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {h.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--luxe-soft-white-50)",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {h.country}
                    </div>
                    {h.benefits && h.benefits.length > 0 ? (
                      <div
                        style={{
                          marginTop: "auto",
                          paddingTop: 14,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                        }}
                      >
                        {h.benefits.slice(0, 5).map((b, i) => (
                          <span
                            key={`${h.id}-b-${i}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "5px 10px",
                              borderRadius: 999,
                              fontSize: 11.5,
                              lineHeight: 1.2,
                              color: "var(--luxe-champagne)",
                              background: "rgba(200,170,118,0.10)",
                              border: "1px solid rgba(200,170,118,0.28)",
                              letterSpacing: "0.005em",
                            }}
                          >
                            <span
                              aria-hidden="true"
                              style={{ fontSize: 10, lineHeight: 1 }}
                            >
                              ★
                            </span>
                            {b}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
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

        <style jsx>{`
          .preferred-tile:hover {
            transform: translateY(-3px);
            box-shadow: 0 14px 36px rgba(0, 0, 0, 0.32);
            border-color: rgba(200, 170, 118, 0.35);
          }
          .preferred-tile:hover :global(.preferred-tile-img) {
            transform: scale(1.04);
          }
        `}</style>
      </motion.section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "80px 0 64px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          <div style={{ maxWidth: 640, marginBottom: 36 }}>
            <div className="luxe-tech" style={{ marginBottom: 10 }}>
              In Their Words
            </div>
            <h2
              className="luxe-display"
              style={{ fontSize: "clamp(28px, 3.2vw, 44px)", marginBottom: 12 }}
            >
              Travellers who <em>noticed the details</em>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {[
              {
                quote:
                  "The perks and personal touch made our anniversary trip truly unforgettable. From the room upgrade to the late checkout, every detail was taken care of.",
                name: "Priya Mehta",
                city: "Mumbai",
              },
              {
                quote:
                  "We planned our honeymoon across three cities. The exclusive perks through Voyagr Club — spa credits, welcome drinks, early check-in — turned every stay into a celebration.",
                name: "Arjun & Kavya",
                city: "Bangalore",
              },
              {
                quote:
                  "What sets Voyagr apart is the human concierge. One WhatsApp message and everything was arranged — upgrades, restaurant reservations, even a surprise for my wife's birthday.",
                name: "Rahul Sharma",
                city: "Delhi",
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="luxe-card"
                style={{
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 56,
                    lineHeight: 0.6,
                    color: "var(--luxe-champagne)",
                    opacity: 0.5,
                    height: 26,
                  }}
                >
                  &ldquo;
                </div>
                <blockquote
                  style={{
                    margin: 0,
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 17,
                    lineHeight: 1.55,
                    color: "var(--luxe-soft-white)",
                    fontWeight: 400,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {t.quote}
                </blockquote>
                <figcaption
                  style={{
                    marginTop: "auto",
                    paddingTop: 12,
                    borderTop: "1px solid var(--luxe-hairline)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--luxe-soft-white)",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {t.name}
                  </div>
                  <div className="luxe-tech luxe-tech-soft" style={{ marginTop: 4 }}>
                    {t.city}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Travel by Season — 4-up grid ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "80px 0 64px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          <div style={{ maxWidth: 640, marginBottom: 36 }}>
            <div className="luxe-tech" style={{ marginBottom: 10 }}>
              Travel by Season
            </div>
            <h2
              className="luxe-display"
              style={{ fontSize: "clamp(28px, 3.2vw, 44px)", marginBottom: 12 }}
            >
              When to go, <em>where to go</em>
            </h2>
            <p
              style={{
                color: "var(--luxe-soft-white-70)",
                fontSize: 15,
                lineHeight: 1.7,
              }}
            >
              A short almanac of where the weather is kind and the rooms are
              quiet. Tell our concierge a season — we&rsquo;ll do the rest.
            </p>
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
              <div key={s.season} className="luxe-card">
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

      {/* ── About Voyagr Club — narrative + stat strip ───────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        style={{
          padding: "80px 0 64px",
          borderTop: "1px solid var(--luxe-hairline)",
        }}
      >
        <div className="luxe-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 56,
              alignItems: "start",
            }}
          >
            <div>
              <div className="luxe-tech" style={{ marginBottom: 10 }}>
                About Voyagr Club
              </div>
              <h2
                className="luxe-display"
                style={{ fontSize: "clamp(28px, 3.2vw, 44px)", marginBottom: 18 }}
              >
                Built on a <em>simple idea</em>
              </h2>
              <p
                style={{
                  color: "var(--luxe-soft-white-70)",
                  fontSize: 15.5,
                  lineHeight: 1.75,
                  marginBottom: 16,
                }}
              >
                Voyagr Club was built on a simple idea — luxury travel should
                come with extraordinary experiences. We partner directly with
                the world&rsquo;s finest hotels to offer our members preferred
                access, exclusive perks, and a personal concierge who makes
                every trip unforgettable.
              </p>
              <p
                style={{
                  color: "var(--luxe-soft-white-70)",
                  fontSize: 15.5,
                  lineHeight: 1.75,
                }}
              >
                Our curated selection spans 50+ cities worldwide — from the
                beaches of Bali to the streets of Paris — handpicked to ensure
                quality and unforgettable experiences for every type of
                traveller.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 1,
                background: "var(--luxe-hairline)",
                border: "1px solid var(--luxe-hairline)",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              {[
                { num: "50+", label: "Cities Worldwide" },
                { num: "10,000+", label: "Hotels Listed" },
                { num: "Free", label: "Membership" },
                { num: "24/7", label: "WhatsApp Concierge" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: "var(--luxe-black)",
                    padding: "28px 24px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 32,
                      fontWeight: 500,
                      color: "var(--luxe-soft-white)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      marginBottom: 10,
                    }}
                  >
                    {s.num}
                  </div>
                  <div className="luxe-tech luxe-tech-soft">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Trust strip ───────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          borderTop: "1px solid var(--luxe-hairline)",
          borderBottom: "1px solid var(--luxe-hairline)",
          padding: "40px 0",
        }}
      >
        <div
          className="luxe-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          {[
            { num: "1,500+", label: "Partner Hotels" },
            { num: "50+", label: "Cities Worldwide" },
            { num: "24/7", label: "WhatsApp Concierge" },
            { num: "Free", label: "Membership" },
          ].map((s) => (
            <div key={s.label} style={{ flex: "1 1 160px", minWidth: 160 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 32,
                  fontWeight: 500,
                  color: "var(--luxe-soft-white)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {s.num}
              </div>
              <div className="luxe-tech luxe-tech-soft" style={{ marginTop: 8 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── Footer CTA ────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{ padding: "64px 0" }}
      >
        <div className="luxe-container" style={{ textAlign: "center", maxWidth: 720 }}>
          <div className="luxe-tech" style={{ marginBottom: 12 }}>
            Your Journey Starts Here
          </div>
          <h2
            className="luxe-display"
            style={{ fontSize: "clamp(28px, 3.4vw, 44px)", marginBottom: 14 }}
          >
            Let us craft your next{" "}
            <em style={{ color: "var(--luxe-champagne)" }}>unforgettable stay</em>
          </h2>
          <p
            style={{
              color: "var(--luxe-soft-white-70)",
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto 28px",
            }}
          >
            Tell us where you&rsquo;re headed. We&rsquo;ll handle the rest &mdash;
            from curating handpicked options with exclusive perks to confirming
            within minutes over WhatsApp.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
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
