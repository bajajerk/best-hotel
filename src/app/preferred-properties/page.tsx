"use client";

import { useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackCtaClicked } from "@/lib/analytics";
import posthog from "posthog-js";

const benefitBadges = [
  {
    emoji: "🍳",
    title: "Breakfast included",
    description: "Full daily breakfast for every guest.",
  },
  {
    emoji: "⬆️",
    title: "Room upgrade on arrival",
    description: "Best available room, subject to availability.",
  },
  {
    emoji: "🕐",
    title: "Late checkout",
    description: "4 PM guaranteed, no need to ask.",
  },
  {
    emoji: "🎁",
    title: "Welcome amenity from the GM",
    description: "A personal touch waiting at check-in.",
  },
  {
    emoji: "✕",
    title: "Flexible cancellation",
    description: "Plans change. Cancel free within 48 hrs.",
  },
];

export default function PreferredPropertiesPage() {
  useEffect(() => {
    posthog.capture("preferred_properties_page_viewed");
  }, []);

  return (
    <>
      <Header />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
          background: "var(--cream)",
        }}
      >
        {/* Intro section */}
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
            Preferred Properties
          </h1>
          <p
            className="type-body-lg"
            style={{
              color: "var(--ink-light)",
              marginBottom: "16px",
              maxWidth: "640px",
              margin: "0 auto 16px",
              lineHeight: 1.7,
            }}
          >
            A Preferred property is one we know personally. We hold a direct
            contract with the hotel — no intermediaries, no aggregator markup.
            When you arrive, the front desk already has your name and your
            membership status. That relationship is what makes the difference.
          </p>
          <p
            className="type-body-lg"
            style={{
              color: "var(--ink-light)",
              marginBottom: "16px",
              maxWidth: "640px",
              margin: "0 auto 16px",
              lineHeight: 1.7,
            }}
          >
            At every Preferred property, Voyagr Club members receive guaranteed
            perks that standard bookings simply cannot offer — breakfast, upgrades,
            late checkout, and a personal welcome from the General Manager. These
            aren&apos;t loyalty-program promises. They&apos;re written into our
            contract.
          </p>
          <p
            className="type-label"
            style={{
              color: "var(--ink-mid)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "48px",
              maxWidth: "640px",
              margin: "0 auto 48px",
            }}
          >
            50+ properties across 20 destinations
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
              onClick={() =>
                trackCtaClicked({
                  cta_name: "browse_preferred",
                  cta_location: "preferred_properties_hero",
                  destination_url: "/search",
                })
              }
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "0.85")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.opacity = "1")
              }
            >
              Browse Preferred Properties
            </Link>
          </div>
        </section>

        {/* Benefit badges grid */}
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <h2
            className="type-heading-2"
            style={{
              color: "var(--ink)",
              textAlign: "center",
              marginBottom: "32px",
            }}
          >
            Every Preferred stay includes
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {benefitBadges.map((badge) => (
              <div
                key={badge.title}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  borderRadius: "8px",
                  padding: "32px 28px",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>
                  {badge.emoji}
                </div>
                <h3
                  className="type-heading-3"
                  style={{ color: "var(--ink)", marginBottom: "8px" }}
                >
                  {badge.title}
                </h3>
                <p
                  className="type-body"
                  style={{ color: "var(--ink-light)", lineHeight: 1.6 }}
                >
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
