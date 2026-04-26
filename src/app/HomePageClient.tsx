"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchCuratedCities,
  fetchFeaturedAll,
  CuratedCity,
  CuratedHotel,
} from "@/lib/api";
import type { FeaturedResponse } from "@/lib/api";
import {
  SAMPLE_CITIES,
  FALLBACK_CITY_IMAGE,
  getCityImage,
} from "@/lib/constants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DestinationSearch from "@/components/DestinationSearch";
import BentoCarousel, { type BentoItem } from "@/components/BentoCarousel";
import { useBooking } from "@/context/BookingContext";
import { useAuth } from "@/context/AuthContext";
import { trackCtaClicked } from "@/lib/analytics";

export interface HomePageClientProps {
  initialCities: CuratedCity[];
  initialFeatured: FeaturedResponse | null;
}

const HERO_BG =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=2400&q=85&auto=format&fit=crop";

function safeImg(u: string | null | undefined): string {
  if (!u || !u.trim()) return FALLBACK_CITY_IMAGE;
  if (u.startsWith("http://")) return u.replace("http://", "https://");
  return u;
}

// ---------------------------------------------------------------------------
// Build the Bento items from cities + featured hotels (interleaved)
// ---------------------------------------------------------------------------
function buildBentoItems(
  cities: CuratedCity[],
  featured: FeaturedResponse | null
): BentoItem[] {
  const items: BentoItem[] = [];

  const allHotels: CuratedHotel[] = featured
    ? [
        ...featured.topRated,
        ...featured.bestValue,
        ...featured.familyFriendly,
        ...featured.soloTravel,
      ]
    : [];

  const seenHotel = new Set<number>();
  const uniqueHotels = allHotels.filter((h) => {
    if (seenHotel.has(h.hotel_id)) return false;
    seenHotel.add(h.hotel_id);
    return true;
  });

  const cityList = cities.slice(0, 12);
  const hotelList = uniqueHotels.slice(0, 12);

  // Interleave city → hotel → hotel → city for an asymmetric feel
  const max = Math.max(cityList.length, hotelList.length);
  for (let i = 0; i < max; i++) {
    if (cityList[i]) {
      items.push({
        key: `city-${cityList[i].city_slug}`,
        title: cityList[i].city_name,
        meta: cityList[i].country.toUpperCase(),
        img: safeImg(getCityImage(cityList[i].city_slug)),
        href: `/city/${cityList[i].city_slug}`,
      });
    }
    if (hotelList[i]) {
      const h = hotelList[i];
      items.push({
        key: `hotel-${h.hotel_id}`,
        title: h.hotel_name,
        meta: `${h.city_name.toUpperCase()} · ${h.country.toUpperCase()}`,
        img: safeImg(h.photo1 || h.photo2 || getCityImage(h.city_slug)),
        href: `/hotel/${h.hotel_id}`,
      });
    }
  }

  return items;
}

export default function Home({
  initialCities,
  initialFeatured,
}: HomePageClientProps) {
  const {
    checkIn,
    checkOut,
    setCheckIn,
    setCheckOut,
    formatDate,
    totalAdults,
    totalChildren,
    rooms,
  } = useBooking();
  const { user } = useAuth();
  const router = useRouter();

  const [cities, setCities] = useState<CuratedCity[]>(initialCities);
  const [featured, setFeatured] = useState<FeaturedResponse | null>(initialFeatured);
  // Local hero search state — fed by DestinationSearch via onValueChange/onSelect.
  // Without this, the parent had no way to know what the user typed, so the
  // Search button always navigated to /search with no params.
  const [heroDestination, setHeroDestination] = useState("");
  const [heroDestError, setHeroDestError] = useState(false);

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
  }, [initialCities.length, initialFeatured]);

  const bentoItems = useMemo(() => buildBentoItems(cities, featured), [cities, featured]);

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

      {/* ── HERO with Bento Carousel ──────────────────────────────────────── */}
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
            className="luxe-glass"
            style={{
              borderRadius: 9999,
              padding: 6,
              maxWidth: 760,
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr auto",
              alignItems: "center",
              gap: 0,
              marginBottom: 20,
              outline: heroDestError ? "1px solid var(--luxe-champagne)" : "none",
              boxShadow: heroDestError
                ? "0 0 0 3px rgba(201,168,76,0.25)"
                : undefined,
              transition: "outline 0.2s, box-shadow 0.2s",
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
            <label
              style={{
                padding: "10px 18px",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                position: "relative",
                cursor: "pointer",
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
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                }}
              />
            </label>
            <label
              style={{
                padding: "10px 18px",
                borderLeft: "1px solid rgba(255,255,255,0.08)",
                position: "relative",
                cursor: "pointer",
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
              <input
                type="date"
                value={checkOut}
                min={checkIn || undefined}
                onChange={(e) => setCheckOut(e.target.value)}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                }}
              />
            </label>
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

        {/* Bento Carousel — auto-rotates every 5s */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ marginTop: 36 }}
        >
          <div
            className="luxe-container"
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <div className="luxe-tech" style={{ marginBottom: 8 }}>
                Featured Now
              </div>
              <h2 className="luxe-display" style={{ fontSize: "clamp(24px, 2.4vw, 32px)" }}>
                Destinations &amp; <em>handpicked stays</em>
              </h2>
            </div>
            <Link href="/search" className="luxe-tech" style={{ color: "var(--luxe-champagne)" }}>
              Browse All &rarr;
            </Link>
          </div>
          {bentoItems.length > 0 ? (
            <BentoCarousel items={bentoItems} />
          ) : (
            <div
              className="luxe-container"
              style={{
                color: "var(--luxe-soft-white-50)",
                fontSize: 13,
                paddingTop: 24,
                paddingBottom: 24,
              }}
            >
              Curating featured stays&hellip;
            </div>
          )}
        </motion.div>
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

      {/* ── Handpicked Experiences — 3 marquee properties ────────────────── */}
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
                Handpicked Experiences
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
                A glimpse of properties our concierge returns to — quiet
                corners of the world where the perks make a real difference.
              </p>
            </div>
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
            ].map((e) => (
              <div
                key={e.name}
                className="luxe-card"
                style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}
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
        </div>
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
