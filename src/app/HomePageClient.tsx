"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CuratedCity } from "@/lib/api";
import type { FeaturedResponse } from "@/lib/api";
import Header from "@/components/Header";
import WhatsAppConcierge from "@/components/WhatsAppConcierge";
import { trackCtaClicked } from "@/lib/analytics";

export interface HomePageClientProps {
  initialCities: CuratedCity[];
  initialFeatured: FeaturedResponse | null;
}

// ---------------------------------------------------------------------------
// Palette — the only two greys allowed on this page
// ---------------------------------------------------------------------------
const NAVY = "#0B1B2B";
const NAVY_LIFT = "#132338";
const IVORY = "#f5f1e8";
const GOLD = "#C9A84C";
const GOLD_RULE = "rgba(201,168,76,0.15)";

// ---------------------------------------------------------------------------
// Six curated destinations — hand-picked, not a catalogue dump
// ---------------------------------------------------------------------------
const DESTINATIONS: {
  name: string;
  slug: string;
  editorial: string;
  memberFrom: string;
}[] = [
  {
    name: "Goa",
    slug: "goa",
    editorial: "Where the Arabian Sea meets Portuguese spires.",
    memberFrom: "₹8,400",
  },
  {
    name: "Udaipur",
    slug: "udaipur",
    editorial: "Palace reflections on the Lake Pichola at dusk.",
    memberFrom: "₹11,200",
  },
  {
    name: "Jaipur",
    slug: "jaipur",
    editorial: "A pink city still ruled by hand-carved craft.",
    memberFrom: "₹9,800",
  },
  {
    name: "Bali",
    slug: "bali",
    editorial: "Volcanic coastline, incense-soft mornings.",
    memberFrom: "₹14,600",
  },
  {
    name: "Maldives",
    slug: "maldives",
    editorial: "Overwater quiet, a reef between you and the world.",
    memberFrom: "₹42,100",
  },
  {
    name: "Kyoto",
    slug: "kyoto",
    editorial: "Temple gardens held in the same hands for a century.",
    memberFrom: "₹21,300",
  },
];

// ---------------------------------------------------------------------------
// Three-pillar content for the preferred-rates section
// ---------------------------------------------------------------------------
const PILLARS: { eyebrow: string; title: string; body: string }[] = [
  {
    eyebrow: "01",
    title: "Direct contracts, not scraped inventory.",
    body: "Voyagr sits inside the hotel's preferred-partner tier — the same rate bucket reserved for travel agents, corporate accounts, and industry insiders.",
  },
  {
    eyebrow: "02",
    title: "Rate parity is a rule, not a marketing line.",
    body: "Before a rate reaches a member, we verify it against the hotel's direct site, Booking.com, and MakeMyTrip. If it isn't lower, it doesn't go on the platform.",
  },
  {
    eyebrow: "03",
    title: "A concierge, not a checkout flow.",
    body: "Every booking moves through a person on WhatsApp who knows the property, the room layouts, and which suite actually has the view you're paying for.",
  },
];

// ---------------------------------------------------------------------------
// Founder testimonials
// ---------------------------------------------------------------------------
const FOUNDER_TESTIMONIALS = [
  {
    quote:
      "Booked the Anantara Veli through Voyagr — same room type I'd priced on three OTAs, but ₹18,400 less. The concierge even sorted a seaplane transfer I didn't know was included.",
    name: "Ananya Mehta",
    location: "Mumbai",
    hotel: "Anantara Veli",
    saving: "Saved ₹18,400",
  },
  {
    quote:
      "We were comparing Taj Exotica rates for our anniversary. Voyagr's member rate came in under the hotel's own website. No catch, no upsell — just a genuinely better price and a room upgrade on arrival.",
    name: "Rohan Kapoor",
    location: "Delhi",
    hotel: "Taj Exotica Goa",
    saving: "Saved ₹12,200",
  },
];

// ---------------------------------------------------------------------------
// Footer links — 5 total, per spec
// ---------------------------------------------------------------------------
const FOOTER_LINKS = [
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Destinations", href: "/search" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
];

// ---------------------------------------------------------------------------
// Rate-reveal card (inline, matches section 3 spec)
// ---------------------------------------------------------------------------
function RateCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const memberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    const member = memberRef.current;
    if (!el || !member) return;

    const reveal = () => {
      member.style.filter = "blur(0px)";
      member.style.opacity = "1";
    };

    if (sessionStorage.getItem("voyagr_rate_revealed")) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          sessionStorage.setItem("voyagr_rate_revealed", "1");
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      style={{
        background: NAVY,
        border: `1px solid ${GOLD_RULE}`,
        padding: "36px 40px",
        maxWidth: "520px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: `rgba(245,241,232,0.4)`,
          marginBottom: "10px",
        }}
      >
        Public Rate
      </div>
      <div style={{ marginBottom: "28px" }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "30px",
            fontWeight: 400,
            color: `rgba(245,241,232,0.35)`,
            textDecoration: "line-through",
            lineHeight: 1,
          }}
        >
          ₹18,900
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: `rgba(245,241,232,0.3)`,
            marginLeft: "10px",
            letterSpacing: "0.08em",
          }}
        >
          BOOKING.COM · TONIGHT
        </span>
      </div>

      <div
        style={{
          height: "1px",
          background: GOLD_RULE,
          marginBottom: "28px",
        }}
      />

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: GOLD,
          marginBottom: "10px",
        }}
      >
        Member Rate
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
        <span
          ref={memberRef}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "40px",
            fontWeight: 500,
            color: GOLD,
            lineHeight: 1,
            filter: "blur(6px)",
            opacity: 0.4,
            transition: "filter 0.6s ease-out, opacity 0.4s ease-out",
            display: "inline-block",
          }}
        >
          ₹12,400
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: `rgba(201,168,76,0.7)`,
            letterSpacing: "0.08em",
          }}
        >
          TONIGHT
        </span>
      </div>

      <div
        style={{
          marginTop: "22px",
          fontFamily: "var(--font-body)",
          fontSize: "12px",
          color: `rgba(245,241,232,0.45)`,
          lineHeight: 1.75,
          fontStyle: "italic",
        }}
      >
        Rate verified against the hotel&rsquo;s direct site minutes before you read this.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Home(_: HomePageClientProps) {
  return (
    <div
      style={{
        background: NAVY,
        color: IVORY,
        minHeight: "100vh",
        fontFamily: "var(--font-body)",
      }}
    >
      <Header />

      {/* ==========================================================
          SECTION 1 · HERO
      ========================================================== */}
      <section
        className="voyagr-hero"
        style={{
          position: "relative",
          minHeight: "calc(100vh - 72px)",
          paddingTop: "calc(72px + 40px)",
          paddingBottom: "60px",
          background: NAVY,
          overflow: "hidden",
        }}
      >
        {/* Gold radial glow — top-right, 5% */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "-20%",
            right: "-15%",
            width: "70vw",
            height: "70vw",
            maxWidth: "900px",
            maxHeight: "900px",
            background:
              "radial-gradient(closest-side, rgba(201,168,76,0.08), rgba(201,168,76,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="voyagr-hero-inner"
          style={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 64px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minHeight: "calc(100vh - 72px - 100px)",
          }}
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: GOLD,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: "32px",
            }}
          >
            Private Hotel Membership · India
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.1 }}
            className="voyagr-hero-h1"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontSize: "clamp(40px, 6.2vw, 80px)",
              lineHeight: 1.02,
              color: IVORY,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            <span style={{ display: "block" }}>Hotels you know.</span>
            <span
              style={{
                display: "block",
                fontStyle: "italic",
                color: GOLD,
              }}
            >
              Rates they don&rsquo;t show.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: `rgba(245,241,232,0.55)`,
              lineHeight: 1.8,
              maxWidth: "460px",
              marginTop: "36px",
              marginBottom: 0,
            }}
          >
            Voyagr members access the same rates reserved for travel agents and preferred partners —
            never on MakeMyTrip, Booking.com, or any public platform.
          </motion.p>

          {/* Rate proof block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="voyagr-rate-proof"
            style={{
              marginTop: "40px",
              display: "inline-flex",
              alignItems: "center",
              gap: "32px",
              background: IVORY,
              padding: "24px 36px",
              alignSelf: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "rgba(26,23,16,0.4)",
                  textDecoration: "line-through",
                  lineHeight: 1,
                }}
              >
                ₹18,900
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "rgba(26,23,16,0.5)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: "6px",
                }}
              >
                Booking.com · tonight
              </div>
            </div>

            <div
              aria-hidden
              style={{
                width: "1px",
                alignSelf: "stretch",
                background: "rgba(11,27,43,0.15)",
              }}
            />

            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "36px",
                  fontWeight: 500,
                  color: GOLD,
                  lineHeight: 1,
                }}
              >
                ₹12,400
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "rgba(201,168,76,0.7)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginTop: "6px",
                }}
              >
                Member rate · tonight
              </div>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55 }}
            className="voyagr-hero-ctas"
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "40px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/search"
              onClick={() =>
                trackCtaClicked({
                  cta_name: "see_member_rates",
                  cta_location: "hero",
                  destination_url: "/search",
                })
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "14px 36px",
                border: `1px solid ${GOLD}`,
                color: IVORY,
                background: "transparent",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textDecoration: "none",
                transition: "background 0.25s, color 0.25s",
                borderRadius: "2px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = GOLD;
                (e.currentTarget as HTMLAnchorElement).style.color = NAVY;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background =
                  "transparent";
                (e.currentTarget as HTMLAnchorElement).style.color = IVORY;
              }}
            >
              See Member Rates →
            </Link>
            <Link
              href="#how-it-works"
              onClick={() =>
                trackCtaClicked({
                  cta_name: "how_it_works",
                  cta_location: "hero",
                  destination_url: "#how-it-works",
                })
              }
              style={{
                color: "rgba(245,241,232,0.4)",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 400,
                textDecoration: "none",
                letterSpacing: "0.02em",
                padding: "14px 8px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = IVORY;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(245,241,232,0.4)";
              }}
            >
              How it works
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, delay: 0.8 }}
            className="voyagr-hero-trust"
            style={{
              marginTop: "48px",
              display: "flex",
              flexWrap: "wrap",
              gap: "0 20px",
              rowGap: "8px",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(245,241,232,0.3)",
            }}
          >
            {[
              "1,500+ hotels",
              "Rate verified daily",
              "WhatsApp concierge",
              "Free to join",
            ].map((item, i, arr) => (
              <span key={item} style={{ display: "inline-flex", alignItems: "center" }}>
                {item}
                {i < arr.length - 1 && (
                  <span style={{ color: GOLD, margin: "0 0 0 20px" }}>·</span>
                )}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionRule />

      {/* ==========================================================
          SECTION 2 · SOCIAL PROOF BAR
      ========================================================== */}
      <section
        className="voyagr-proof-bar"
        style={{
          background: NAVY,
          borderTop: `1px solid ${GOLD_RULE}`,
          padding: "28px 64px",
        }}
      >
        <div
          className="voyagr-proof-inner"
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0",
            flexWrap: "wrap",
            rowGap: "14px",
          }}
        >
          {[
            "₹2.4Cr saved by members",
            "237 bookings last month",
            "4.9 · Member satisfaction",
          ].map((stat, i, arr) => (
            <span
              key={stat}
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(245,241,232,0.4)",
              }}
            >
              {stat}
              {i < arr.length - 1 && (
                <span
                  style={{
                    color: GOLD,
                    margin: "0 28px",
                    fontSize: "10px",
                  }}
                >
                  ·
                </span>
              )}
            </span>
          ))}
        </div>
      </section>

      <SectionRule />

      {/* ==========================================================
          SECTION 3 · PREFERRED RATES (replaces How It Works)
      ========================================================== */}
      <section
        id="how-it-works"
        className="voyagr-section"
        style={{
          background: NAVY_LIFT,
          padding: "100px 64px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: "center", marginBottom: "56px" }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: "20px",
              }}
            >
              Preferred Rates
            </div>
            <h2
              className="voyagr-h2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 4vw, 52px)",
                fontWeight: 300,
                lineHeight: 1.12,
                color: IVORY,
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              The rate behind the{" "}
              <em style={{ fontStyle: "italic", color: GOLD }}>rate</em>.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9 }}
          >
            <RateCard />
          </motion.div>

          {/* Three pillars */}
          <div
            className="voyagr-pillars"
            style={{
              marginTop: "84px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "48px",
            }}
          >
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.eyebrow}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "44px",
                    fontWeight: 300,
                    color: GOLD,
                    opacity: 0.5,
                    lineHeight: 1,
                    marginBottom: "20px",
                  }}
                >
                  {p.eyebrow}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "22px",
                    fontWeight: 400,
                    color: IVORY,
                    lineHeight: 1.3,
                    margin: "0 0 16px 0",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "14px",
                    color: "rgba(245,241,232,0.55)",
                    lineHeight: 1.75,
                    margin: 0,
                  }}
                >
                  {p.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SectionRule />

      {/* ==========================================================
          SECTION 4 · DESTINATIONS
      ========================================================== */}
      <section
        className="voyagr-section"
        style={{
          background: NAVY,
          padding: "100px 64px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            style={{ marginBottom: "56px" }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: "16px",
              }}
            >
              Destinations
            </div>
            <h2
              className="voyagr-h2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(30px, 3.6vw, 48px)",
                fontWeight: 300,
                lineHeight: 1.12,
                color: IVORY,
                margin: 0,
                letterSpacing: "-0.005em",
              }}
            >
              Where members are{" "}
              <em style={{ fontStyle: "italic", color: GOLD }}>travelling</em>.
            </h2>
          </motion.div>

          <div
            className="voyagr-dest-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1px",
              background: GOLD_RULE,
              border: `1px solid ${GOLD_RULE}`,
            }}
          >
            {DESTINATIONS.map((d, i) => (
              <motion.div
                key={d.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                style={{ background: NAVY }}
              >
                <Link
                  href={`/city/${d.slug}`}
                  className="voyagr-dest-card"
                  style={{
                    display: "block",
                    padding: "44px 36px",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.3s",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      NAVY_LIFT;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      NAVY;
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(245,241,232,0.35)",
                      marginBottom: "24px",
                    }}
                  >
                    0{i + 1}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: "17px",
                      fontWeight: 300,
                      color: "rgba(245,241,232,0.7)",
                      lineHeight: 1.6,
                      margin: "0 0 28px 0",
                    }}
                  >
                    {d.editorial}
                  </p>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "30px",
                      fontWeight: 400,
                      color: IVORY,
                      letterSpacing: "-0.005em",
                      lineHeight: 1.1,
                      marginBottom: "14px",
                    }}
                  >
                    {d.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: GOLD,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span>Member rate from</span>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontStyle: "normal",
                        fontSize: "18px",
                        letterSpacing: "0",
                        textTransform: "none",
                      }}
                    >
                      {d.memberFrom}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div
            style={{
              marginTop: "40px",
              textAlign: "left",
            }}
          >
            <Link
              href="/search"
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                letterSpacing: "0.04em",
                color: GOLD,
                textDecoration: "none",
                borderBottom: `1px solid ${GOLD_RULE}`,
                paddingBottom: "4px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor = GOLD;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderColor =
                  GOLD_RULE;
              }}
            >
              See all destinations →
            </Link>
          </div>
        </div>
      </section>

      <SectionRule />

      {/* ==========================================================
          SECTION 5 · FOUNDER + TRUST
      ========================================================== */}
      <section
        className="voyagr-section"
        style={{
          background: NAVY_LIFT,
          padding: "100px 64px",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: GOLD,
                marginBottom: "16px",
              }}
            >
              Why Members Trust Voyagr
            </div>
            <h2
              className="voyagr-h2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(30px, 3.6vw, 48px)",
                fontWeight: 300,
                lineHeight: 1.15,
                color: IVORY,
                margin: "0 0 56px 0",
                letterSpacing: "-0.005em",
              }}
            >
              Built by someone who knows{" "}
              <em style={{ fontStyle: "italic", color: GOLD }}>
                the other side
              </em>
              .
            </h2>
          </motion.div>

          <div
            className="voyagr-founder-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "56px",
              alignItems: "start",
            }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              <div
                style={{
                  borderLeft: `1px solid ${GOLD_RULE}`,
                  paddingLeft: "32px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "22px",
                    fontWeight: 300,
                    fontStyle: "italic",
                    color: "rgba(245,241,232,0.78)",
                    lineHeight: 1.55,
                    margin: "0 0 24px 0",
                  }}
                >
                  &ldquo;I spent a decade on the hotel supply side — managing
                  rates, contracts, and the inventory that never makes it to
                  public platforms. Voyagr exists because that access
                  shouldn&rsquo;t be reserved for corporations.&rdquo;
                </p>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: GOLD,
                  }}
                >
                  — Founder, Voyagr Club · Mumbai
                </div>
              </div>

              <div
                className="voyagr-founder-stats"
                style={{
                  display: "flex",
                  gap: "40px",
                  marginTop: "48px",
                  paddingLeft: "32px",
                }}
              >
                {[
                  { number: "10+", label: "Years supply side" },
                  { number: "1,500+", label: "Hotels on platform" },
                  { number: "₹2.4Cr", label: "Saved by members" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "32px",
                        fontWeight: 400,
                        color: GOLD,
                        lineHeight: 1,
                        marginBottom: "10px",
                      }}
                    >
                      {stat.number}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(245,241,232,0.4)",
                        lineHeight: 1.7,
                      }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: 0.25 }}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {FOUNDER_TESTIMONIALS.map((t) => (
                <div
                  key={t.name}
                  style={{
                    background: NAVY,
                    border: `1px solid ${GOLD_RULE}`,
                    padding: "28px 32px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      color: "rgba(245,241,232,0.7)",
                      lineHeight: 1.75,
                      margin: "0 0 20px 0",
                    }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "9px",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "rgba(245,241,232,0.4)",
                      }}
                    >
                      {t.name} · {t.location} · {t.hotel}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "18px",
                        color: GOLD,
                      }}
                    >
                      {t.saving}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <SectionRule />

      {/* ==========================================================
          SECTION 6 · WHATSAPP CONCIERGE
      ========================================================== */}
      <WhatsAppConcierge />

      <SectionRule />

      {/* ==========================================================
          SECTION 7 · MINIMAL FOOTER
      ========================================================== */}
      <footer
        className="voyagr-footer"
        style={{
          background: NAVY,
          padding: "56px 64px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "32px",
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "18px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: IVORY,
              }}
            >
              VOYAGR
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "18px",
                letterSpacing: "0.08em",
                color: GOLD,
              }}
            >
              .CLUB
            </span>
          </Link>

          <nav
            className="voyagr-footer-links"
            style={{
              display: "flex",
              gap: "32px",
              flexWrap: "wrap",
            }}
          >
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  color: "rgba(245,241,232,0.45)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = IVORY;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color =
                    "rgba(245,241,232,0.45)";
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.1em",
              color: "rgba(245,241,232,0.3)",
              margin: 0,
            }}
          >
            © 2026 Voyagr Club
          </p>
        </div>
      </footer>

      {/* ==========================================================
          Responsive overrides
      ========================================================== */}
      <style>{`
        @media (max-width: 900px) {
          .voyagr-hero-inner,
          .voyagr-proof-inner,
          .voyagr-section > div,
          .voyagr-footer > div {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
          .voyagr-section {
            padding: 60px 24px !important;
          }
          .voyagr-proof-bar {
            padding: 24px !important;
          }
          .voyagr-hero {
            padding-top: calc(72px + 24px) !important;
          }
          .voyagr-hero-h1 {
            font-size: 40px !important;
          }
          .voyagr-pillars,
          .voyagr-dest-grid,
          .voyagr-founder-grid {
            grid-template-columns: 1fr !important;
          }
          .voyagr-founder-stats {
            flex-wrap: wrap !important;
            gap: 24px !important;
          }
          .voyagr-rate-proof {
            gap: 20px !important;
            padding: 20px 24px !important;
          }
          .voyagr-hero-trust {
            font-size: 9px !important;
          }
        }
        @media (max-width: 600px) {
          .voyagr-rate-proof {
            flex-wrap: wrap !important;
          }
          .voyagr-footer > div {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

function SectionRule() {
  return (
    <div
      aria-hidden
      style={{
        height: "1px",
        background: GOLD_RULE,
      }}
    />
  );
}
