"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PreferredRatesPage() {
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
            Preferred Rates
          </h1>
          <p
            className="type-body-lg"
            style={{ color: "var(--ink-light)", marginBottom: "40px", maxWidth: "600px" }}
          >
            Unlock exclusive negotiated rates at the world&apos;s finest hotels.
            Voyagr Club members enjoy insider pricing that&apos;s not available on
            public booking platforms.
          </p>

          <div
            style={{
              background: "var(--white)",
              border: "1px solid var(--cream-border)",
              borderRadius: "8px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--gold-pale)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--gold)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <h2 className="type-heading-2" style={{ color: "var(--ink)", marginBottom: "12px" }}>
              Coming Soon
            </h2>
            <p className="type-body" style={{ color: "var(--ink-light)" }}>
              We&apos;re curating exclusive preferred rates with our hotel partners.
              Check back soon for members-only pricing.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
