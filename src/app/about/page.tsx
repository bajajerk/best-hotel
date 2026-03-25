"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
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
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          <h1
            className="type-display-3"
            style={{ color: "var(--ink)", marginBottom: "16px" }}
          >
            About Us
          </h1>
          <p
            className="type-body-lg"
            style={{ color: "var(--ink-light)", marginBottom: "40px", maxWidth: "600px" }}
          >
            Voyagr Club is a members-only hotel booking platform that connects
            travellers with preferred rates at the world&apos;s finest properties.
            We negotiate directly with hotels so you can access insider pricing.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <section>
              <h2
                className="type-display-4"
                style={{ color: "var(--ink)", marginBottom: "12px" }}
              >
                Our Mission
              </h2>
              <p className="type-body" style={{ color: "var(--ink-mid)", lineHeight: 1.7 }}>
                We believe exceptional travel should be accessible. By building
                direct relationships with hotels worldwide, we pass preferred
                wholesale rates straight to our members — no markups, no hidden fees.
              </p>
            </section>

            <section>
              <h2
                className="type-display-4"
                style={{ color: "var(--ink)", marginBottom: "12px" }}
              >
                How It Works
              </h2>
              <p className="type-body" style={{ color: "var(--ink-mid)", lineHeight: 1.7 }}>
                Browse our curated collection of hotels, compare preferred rates
                against public prices, and book directly through Voyagr Club.
                Found a better rate elsewhere? Use our Rate Check tool and
                we&apos;ll match it.
              </p>
            </section>

            <section>
              <h2
                className="type-display-4"
                style={{ color: "var(--ink)", marginBottom: "12px" }}
              >
                Why Voyagr Club
              </h2>
              <p className="type-body" style={{ color: "var(--ink-mid)", lineHeight: 1.7 }}>
                With access to preferred rates at thousands of properties across
                the globe, a dedicated concierge team, and a rate-match guarantee,
                Voyagr Club is the smartest way to book your next stay.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
