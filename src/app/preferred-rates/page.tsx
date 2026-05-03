"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackPreferredRatesViewed, trackCtaClicked } from "@/lib/analytics";
import PreferredPartners from "@/components/PreferredPartners";

const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";

const AMBER = "#C9A961";
const ICON_SIZE = 28;
const ICON_STROKE = 1.5;

function CoffeeIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="M21 2 11.5 11.5" />
      <path d="M15 6 19 10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={AMBER} strokeWidth={ICON_STROKE} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

const perks = [
  {
    Icon: CoffeeIcon,
    title: "Free breakfast daily",
    description: "For two guests, every morning.",
  },
  {
    Icon: CreditCardIcon,
    title: "$100 property credit",
    description: "Spa, dining, or room service.",
  },
  {
    Icon: KeyIcon,
    title: "Room upgrade on arrival",
    description: "Best room available at check-in.",
  },
  {
    Icon: ClockIcon,
    title: "Flexible check-in/out",
    description: "10am check-in. 4pm check-out.",
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
            Direct contracts with 400+ luxury properties. Rates and perks you won&rsquo;t find anywhere else.
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 32px",
                borderRadius: "100px",
                background: "#f5f1e8",
                color: "#0a0a0a",
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                fontWeight: 500,
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
            >
              Browse Hotels
            </Link>
            <Link
              href="/search"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "14px 32px",
                borderRadius: "100px",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.22)",
                color: TEXT_PRIMARY,
                fontFamily: "var(--font-body)",
                fontSize: "15px",
                fontWeight: 400,
                textDecoration: "none",
                letterSpacing: "0.01em",
              }}
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
          <div className="perks-grid">
            {perks.map((perk) => (
              <div
                key={perk.title}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "32px 24px",
                }}
              >
                <div style={{ marginBottom: 22 }}>
                  <perk.Icon />
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 21,
                    fontStyle: "italic",
                    fontWeight: 400,
                    color: "#f5f1e8",
                    lineHeight: 1.2,
                    margin: "0 0 10px",
                  }}
                >
                  {perk.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.55)",
                    lineHeight: 1.55,
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
