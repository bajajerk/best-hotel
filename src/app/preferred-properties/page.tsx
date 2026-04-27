"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackCtaClicked } from "@/lib/analytics";
import posthog from "posthog-js";

const TEXT_PRIMARY = "#f7f5f2";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const GOLD = "#c8aa76";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";

const benefitBadges = [
  {
    emoji: "🍳",
    title: "Breakfast included",
    description: "Daily breakfast for two, every morning.",
  },
  {
    emoji: "⬆️",
    title: "Room upgrade on arrival",
    description: "Best available room at check-in.",
  },
  {
    emoji: "🕐",
    title: "Late checkout",
    description: "4 PM guaranteed — no request needed.",
  },
  {
    emoji: "🎁",
    title: "Welcome amenity from the GM",
    description: "A personal greeting awaits at arrival.",
  },
  {
    emoji: "✕",
    title: "Flexible cancellation",
    description: "Cancel free up to 48 hours.",
  },
];

export default function PreferredPropertiesPage() {
  useEffect(() => {
    posthog.capture("preferred_properties_page_viewed");
  }, []);

  return (
    <div className="luxe">
      <Header />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "140px",
          paddingBottom: "120px",
        }}
      >
        {/* Intro section */}
        <section
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            padding: "0 24px 80px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 18,
            }}
          >
            Direct hotel partnerships
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              margin: "0 0 24px",
            }}
          >
            <em style={{ fontWeight: 400 }}>Preferred</em> Properties
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 17,
              fontWeight: 300,
              color: TEXT_MUTED,
              lineHeight: 1.75,
              maxWidth: 640,
              margin: "0 auto 18px",
            }}
          >
            A Preferred property is one we know by name — and that knows yours.
            We hold a direct contract with the hotel, with no intermediary
            between you and the experience. When you arrive, the front desk has
            your name and membership on file before you reach the counter.
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 17,
              fontWeight: 300,
              color: TEXT_MUTED,
              lineHeight: 1.75,
              maxWidth: 640,
              margin: "0 auto 28px",
            }}
          >
            At every Preferred property, Voyagr Club members receive perks that
            standard inventory cannot match — breakfast, upgrades, late checkout,
            and a personal welcome from the General Manager. These aren&rsquo;t
            loyalty-program promises. They&rsquo;re written into our supplier
            agreement.
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 48,
            }}
          >
            50+ properties · 20 destinations
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/search"
              className="luxe-btn-gold"
              onClick={() =>
                trackCtaClicked({
                  cta_name: "browse_preferred",
                  cta_location: "preferred_properties_hero",
                  destination_url: "/search",
                })
              }
            >
              Browse Preferred Properties
            </Link>
          </div>
        </section>

        {/* Benefit badges grid */}
        <section
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 32,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.015em",
              textAlign: "center",
              margin: "0 0 32px",
            }}
          >
            Every Preferred stay includes
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {benefitBadges.map((badge) => (
              <div
                key={badge.title}
                style={{
                  background: SURFACE,
                  border: `1px solid ${SURFACE_BORDER}`,
                  borderRadius: 16,
                  padding: "32px 28px",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{badge.emoji}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    fontWeight: 500,
                    color: TEXT_PRIMARY,
                    letterSpacing: "-0.01em",
                    margin: "0 0 8px",
                  }}
                >
                  {badge.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: TEXT_MUTED,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
