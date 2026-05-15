"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EditorialCard from "@/components/EditorialCard";
import { trackCtaClicked } from "@/lib/analytics";
import { fetchPreferredHotels, type PreferredHotel } from "@/lib/api";
import { hotelUrl } from "@/lib/urls";
import posthog from "posthog-js";

// ── Editorial-luxe palette ────────────────────────────────────────────────
const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const TEXT_SOFT = "rgba(247, 245, 242, 0.45)";
const GOLD = "var(--luxe-champagne)";
const HAIRLINE = "var(--luxe-hairline, rgba(255,255,255,0.08))";

// ── Region taxonomy ───────────────────────────────────────────────────────
// Map a country string to one of six editorial buckets. The order here is the
// order used in the page (Europe → Americas → Asia → India → Middle East →
// Other). India is split out from Asia because it is the home market.
type Region =
  | "europe"
  | "americas"
  | "asia"
  | "india"
  | "middle-east"
  | "other";

const REGION_LABEL: Record<Region, string> = {
  europe: "Europe",
  americas: "Americas",
  asia: "Asia",
  india: "India",
  "middle-east": "Middle East",
  other: "Elsewhere",
};

const REGION_ORDER: Region[] = [
  "europe",
  "americas",
  "asia",
  "india",
  "middle-east",
  "other",
];

const EUROPE = new Set([
  "france", "italy", "spain", "portugal", "greece", "switzerland", "austria",
  "germany", "netherlands", "belgium", "united kingdom", "uk", "england",
  "scotland", "ireland", "iceland", "norway", "sweden", "denmark", "finland",
  "croatia", "czechia", "czech republic", "hungary", "poland", "romania",
  "turkey", "türkiye", "monaco", "luxembourg", "malta",
]);

const AMERICAS = new Set([
  "united states", "usa", "us", "canada", "mexico", "brazil", "argentina",
  "chile", "peru", "colombia", "uruguay", "ecuador", "costa rica", "panama",
  "dominican republic", "jamaica", "bahamas", "barbados", "cuba",
  "saint lucia", "st. lucia", "turks and caicos",
]);

const ASIA = new Set([
  "japan", "china", "south korea", "korea", "taiwan", "hong kong", "singapore",
  "thailand", "vietnam", "indonesia", "malaysia", "philippines", "cambodia",
  "laos", "myanmar", "nepal", "bhutan", "sri lanka", "maldives", "bangladesh",
  "mongolia", "kazakhstan",
]);

const INDIA = new Set(["india"]);

const MIDDLE_EAST = new Set([
  "united arab emirates", "uae", "saudi arabia", "qatar", "oman", "bahrain",
  "kuwait", "jordan", "lebanon", "israel", "egypt", "morocco", "tunisia",
]);

function regionOf(country: string | undefined | null): Region {
  const c = (country ?? "").trim().toLowerCase();
  if (!c) return "other";
  if (INDIA.has(c)) return "india";
  if (EUROPE.has(c)) return "europe";
  if (AMERICAS.has(c)) return "americas";
  if (ASIA.has(c)) return "asia";
  if (MIDDLE_EAST.has(c)) return "middle-east";
  return "other";
}

// ── Filter strip values ───────────────────────────────────────────────────
type Filter = "all" | Region;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "europe", label: "Europe" },
  { key: "americas", label: "Americas" },
  { key: "asia", label: "Asia" },
  { key: "india", label: "India" },
  { key: "middle-east", label: "Middle East" },
];

// Default cinematic hero — a deliberately wide, dusk-lit pool shot. Sourced
// from Unsplash's open editorial library; matches the dark-luxe palette.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=2400&q=85&auto=format&fit=crop";

function safeImg(u: string | null | undefined): string {
  if (!u?.trim()) return "";
  return u.startsWith("http://") ? u.replace("http://", "https://") : u;
}

export default function PreferredPropertiesPage() {
  const [hotels, setHotels] = useState<PreferredHotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    posthog.capture("preferred_properties_page_viewed");
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchPreferredHotels()
      .then((rows) => {
        if (!mounted) return;
        setHotels(rows);
      })
      .catch(() => {
        if (!mounted) return;
        setHotels([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Group by region, in editorial order.
  const grouped = useMemo(() => {
    const buckets: Record<Region, PreferredHotel[]> = {
      europe: [],
      americas: [],
      asia: [],
      india: [],
      "middle-east": [],
      other: [],
    };
    for (const h of hotels) buckets[regionOf(h.country)].push(h);
    return buckets;
  }, [hotels]);

  const visibleRegions = useMemo<Region[]>(() => {
    if (filter === "all")
      return REGION_ORDER.filter((r) => grouped[r].length > 0);
    return grouped[filter].length > 0 ? [filter] : [];
  }, [filter, grouped]);

  const totalShown =
    filter === "all"
      ? hotels.length
      : grouped[filter as Region]?.length ?? 0;

  return (
    <div className="luxe">
      <Header />
      <main style={{ minHeight: "100vh", paddingBottom: 120 }}>
        {/* ── Cinematic hero ───────────────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            width: "100%",
            height: "min(78vh, 720px)",
            minHeight: 520,
            overflow: "hidden",
            background: "#0a0a0a",
          }}
        >
          <Image
            src={HERO_IMAGE}
            alt="A still pool at dusk — emblematic of the Preferred collection."
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover", opacity: 0.62 }}
          />
          {/* Bottom-to-top scrim for legibility */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 40%, rgba(10,10,10,0.85) 100%)",
            }}
          />
          {/* Hero copy */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "0 24px 88px",
            }}
          >
            <div
              style={{
                maxWidth: 880,
                margin: "0 auto",
                width: "100%",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily:
                    "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: GOLD,
                  marginBottom: 22,
                }}
              >
                The Collection
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(40px, 6vw, 76px)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: TEXT_PRIMARY,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.02,
                  margin: "0 0 28px",
                }}
              >
                Stays we&rsquo;d book ourselves.
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 17,
                  fontWeight: 300,
                  color: TEXT_MUTED,
                  lineHeight: 1.75,
                  maxWidth: 620,
                  margin: "0 auto",
                }}
              >
                Every property here is one our concierge personally returns to.
                We don&rsquo;t list places we wouldn&rsquo;t book —
                that&rsquo;s the trade for being members-only.
              </p>
            </div>
          </div>
        </section>

        {/* ── Region filter strip ─────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "72px 24px 0",
          }}
        >
          <div
            role="tablist"
            aria-label="Filter properties by region"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 4,
              paddingBottom: 32,
              borderBottom: `1px solid ${HAIRLINE}`,
            }}
          >
            {FILTERS.map(({ key, label }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(key)}
                  style={{
                    appearance: "none",
                    background: "transparent",
                    border: 0,
                    padding: "12px 18px",
                    minHeight: 44,
                    cursor: "pointer",
                    fontFamily:
                      "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: active ? GOLD : TEXT_SOFT,
                    borderBottom: `1px solid ${
                      active ? GOLD : "transparent"
                    }`,
                    transition: "color 0.18s ease, border-color 0.18s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Region sections ─────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "56px 24px 0",
          }}
        >
          {loading && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: TEXT_SOFT,
                textAlign: "center",
                fontSize: 14,
                letterSpacing: "0.04em",
                padding: "80px 0",
              }}
            >
              Loading the collection…
            </p>
          )}

          {!loading && totalShown === 0 && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: TEXT_MUTED,
                textAlign: "center",
                fontSize: 16,
                lineHeight: 1.7,
                padding: "80px 0",
              }}
            >
              No properties in this region yet.{" "}
              <Link
                href="/search"
                style={{
                  color: GOLD,
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                Search the wider catalogue
              </Link>
              .
            </p>
          )}

          {!loading &&
            visibleRegions.map((region, idx) => (
              <div
                key={region}
                style={{
                  paddingTop: idx === 0 ? 0 : 72,
                  paddingBottom: 8,
                  borderTop:
                    idx === 0 ? "none" : `1px solid ${HAIRLINE}`,
                  marginTop: idx === 0 ? 0 : 72,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 24,
                    flexWrap: "wrap",
                    marginBottom: 36,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily:
                          "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.4em",
                        textTransform: "uppercase",
                        color: GOLD,
                        marginBottom: 12,
                      }}
                    >
                      Region · {String(idx + 1).padStart(2, "0")}
                    </div>
                    <h2
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(28px, 3.2vw, 40px)",
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: TEXT_PRIMARY,
                        letterSpacing: "-0.015em",
                        lineHeight: 1.1,
                        margin: 0,
                      }}
                    >
                      {REGION_LABEL[region]}
                    </h2>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      color: TEXT_SOFT,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {grouped[region].length} propert
                    {grouped[region].length === 1 ? "y" : "ies"}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(min(100%, 360px), 1fr))",
                    gap: 32,
                  }}
                >
                  {grouped[region].map((h) => (
                    <EditorialCard
                      key={h.id}
                      href={hotelUrl(h)}
                      imageUrl={safeImg(h.image_url)}
                      imageAlt={h.name}
                      eyebrow="PREFERRED"
                      name={h.name}
                      subline={
                        h.tagline
                          ? h.tagline
                          : `${h.city_name} · ${h.country}`
                      }
                      chips={h.benefits ?? []}
                      variant="hotel"
                      aspectRatio="4 / 5"
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    />
                  ))}
                </div>
              </div>
            ))}
        </section>

        {/* ── Closing note ────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "120px 24px 0",
            textAlign: "center",
            borderTop: `1px solid ${HAIRLINE}`,
            marginTop: 120,
          }}
        >
          <div
            style={{
              fontFamily:
                "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 18,
            }}
          >
            And beyond
          </div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.4vw, 36px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: TEXT_PRIMARY,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              margin: "0 0 36px",
            }}
          >
            +1,400 more — explore on Search.
          </p>
          <Link
            href="/search"
            className="luxe-btn-gold"
            onClick={() =>
              trackCtaClicked({
                cta_name: "browse_preferred",
                cta_location: "preferred_properties_closing",
                destination_url: "/search",
              })
            }
            style={{ minHeight: 44 }}
          >
            Open the catalogue
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
