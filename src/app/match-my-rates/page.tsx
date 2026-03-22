"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function MatchMyRatesPage() {
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
            Match My Rates
          </h1>
          <p
            className="type-body-lg"
            style={{ color: "var(--ink-light)", marginBottom: "40px", maxWidth: "600px" }}
          >
            Found a lower price elsewhere? Share it with us and we&apos;ll match or
            beat it. Voyagr Club guarantees the best rate — always.
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
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h2 className="type-heading-2" style={{ color: "var(--ink)", marginBottom: "12px" }}>
              Coming Soon
            </h2>
            <p className="type-body" style={{ color: "var(--ink-light)" }}>
              Our rate matching tool is under development. Soon you&apos;ll be able to
              submit competing rates and get an instant price match.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
