"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackPreferredRatesViewed, trackCtaClicked } from "@/lib/analytics";
import PreferredPartners from "@/components/PreferredPartners";

const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const GOLD = "var(--luxe-champagne)";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";

const perks = [
  {
    emoji: "🍳",
    title: "Free breakfast daily",
    description:
      "Full breakfast for two guests, every morning of your stay.",
  },
  {
    emoji: "💳",
    title: "$100 property credit",
    description:
      "Spend at the spa, restaurants, or room service at any Preferred property.",
  },
  {
    emoji: "⬆️",
    title: "Room upgrade on arrival",
    description:
      "Best available room at check-in, subject to availability.",
  },
  {
    emoji: "🕐",
    title: "Flexible check-in/out",
    description:
      "Early check-in from 10am and late check-out until 4pm.",
  },
];

export default function PreferredRatesPage() {
  useEffect(() => {
    trackPreferredRatesViewed();
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
        {/* Hero section */}
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
            Members-only access
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
            Voyagr <em style={{ fontWeight: 400 }}>Preferred</em> Rates
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 18,
              fontWeight: 300,
              color: TEXT_MUTED,
              lineHeight: 1.7,
              maxWidth: 620,
              margin: "0 auto 48px",
            }}
          >
            Rates that exist outside the public market. Our concierge team holds
            negotiated contracts with 400+ luxury properties. Members get rates
            that simply aren&rsquo;t listed anywhere else — plus perks that
            elevate every stay.
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
                  cta_name: "enquire_now",
                  cta_location: "preferred_rates_hero",
                  destination_url: "/search",
                })
              }
            >
              Enquire Now
            </Link>
            <Link href="/search" className="luxe-btn-secondary">
              Browse Hotels
            </Link>
          </div>
        </section>

        {/* Perks grid */}
        <section
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 20,
            }}
          >
            {perks.map((perk) => (
              <div
                key={perk.title}
                style={{
                  background: SURFACE,
                  border: `1px solid ${SURFACE_BORDER}`,
                  borderRadius: 16,
                  padding: "32px 28px",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{perk.emoji}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 22,
                    fontWeight: 500,
                    color: TEXT_PRIMARY,
                    letterSpacing: "-0.01em",
                    margin: "0 0 8px",
                  }}
                >
                  {perk.title}
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
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Preferred Partners directory */}
        <PreferredPartners />
      </main>
      <Footer />
    </div>
  );
}
