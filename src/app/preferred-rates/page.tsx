"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackPreferredRatesViewed, trackCtaClicked } from "@/lib/analytics";
import PreferredPartners from "@/components/PreferredPartners";

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
          paddingTop: "100px",
          paddingBottom: "80px",
          background: "var(--cream)",
        }}
      >
        {/* Hero section */}
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 24px 64px",
            textAlign: "center",
          }}
        >
          <h1
            className="type-display-3"
            style={{
              color: "var(--ink)",
              marginBottom: "24px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Voyagr Preferred Rates
          </h1>
          <p
            className="type-body-lg"
            style={{
              color: "var(--ink-light)",
              marginBottom: "48px",
              maxWidth: "620px",
              margin: "0 auto 48px",
              lineHeight: 1.7,
            }}
          >
            Rates that exist outside the public market. Our concierge team holds
            negotiated contracts with 400+ luxury properties. Members get rates
            that simply aren&apos;t listed anywhere else — plus perks that
            elevate every stay.
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/search"
              className="type-label"
              style={{
                display: "inline-block",
                padding: "14px 36px",
                background: "var(--gold)",
                color: "var(--white)",
                borderRadius: "6px",
                textDecoration: "none",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                transition: "opacity 0.2s",
              }}
              onClick={() => trackCtaClicked({ cta_name: 'enquire_now', cta_location: 'preferred_rates_hero', destination_url: '/search' })}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "1")
              }
            >
              Enquire Now
            </Link>
            <Link
              href="/search"
              className="type-label"
              style={{
                display: "inline-block",
                padding: "14px 36px",
                border: "1px solid var(--ink)",
                color: "var(--ink)",
                borderRadius: "6px",
                textDecoration: "none",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                background: "transparent",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--ink)";
                (e.currentTarget as HTMLElement).style.color = "var(--white)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--ink)";
              }}
            >
              Browse Hotels
            </Link>
          </div>
        </section>

        {/* Perks grid */}
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "24px",
            }}
          >
            {perks.map((perk) => (
              <div
                key={perk.title}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  borderRadius: "8px",
                  padding: "32px 28px",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>
                  {perk.emoji}
                </div>
                <h3
                  className="type-heading-3"
                  style={{ color: "var(--ink)", marginBottom: "8px" }}
                >
                  {perk.title}
                </h3>
                <p
                  className="type-body"
                  style={{ color: "var(--ink-light)", lineHeight: 1.6 }}
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
