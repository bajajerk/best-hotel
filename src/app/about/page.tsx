"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const TEXT_SOFT = "rgba(247, 245, 242, 0.45)";
const GOLD = "var(--luxe-champagne)";

export default function AboutPage() {
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
        <div style={{ maxWidth: "880px", margin: "0 auto", padding: "0 24px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 18,
            }}
          >
            About Voyagr Club
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
            A members-only door to the world&rsquo;s finest properties.
          </h1>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 18,
              fontWeight: 300,
              color: TEXT_MUTED,
              lineHeight: 1.7,
              maxWidth: 640,
              margin: "0 0 64px",
            }}
          >
            Voyagr Club connects discerning travellers with preferred rates at the
            world&rsquo;s most considered hotels. We negotiate directly with
            properties so you can access insider pricing without markups, hidden
            fees, or noisy comparison engines.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
            <Section
              eyebrow="Mission"
              title="Exceptional travel, accessibly priced."
              body="We build direct relationships with hotels worldwide and pass preferred rates straight to our members. No third-party markup. No spam. No drip-pricing tricks at checkout."
            />
            <Section
              eyebrow="How it works"
              title="Browse, compare, confirm."
              body="Browse our curated collection, compare preferred rates against public prices, and confirm directly through Voyagr Club. Found a better rate elsewhere? Use Rate Match — we&rsquo;ll match it."
            />
            <Section
              eyebrow="Why Voyagr"
              title="Concierge-led booking, not a search engine."
              body="Preferred rates at thousands of properties globally, a dedicated concierge team to handle the messy parts, and a rate-match guarantee on anything we display. That&rsquo;s the brief."
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: 32,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: GOLD,
          marginBottom: 12,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 500,
          color: TEXT_PRIMARY,
          letterSpacing: "-0.015em",
          lineHeight: 1.15,
          margin: "0 0 14px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: 16,
          fontWeight: 300,
          color: TEXT_MUTED,
          lineHeight: 1.75,
          margin: 0,
          maxWidth: 640,
        }}
      >
        {body}
      </p>
    </section>
  );
}
