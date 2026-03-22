"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function BookingHistoryPage() {
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
            Booking History
          </h1>
          <p
            className="type-body-lg"
            style={{ color: "var(--ink-light)", marginBottom: "40px", maxWidth: "600px" }}
          >
            Review your past and upcoming reservations, all in one place.
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h2 className="type-heading-2" style={{ color: "var(--ink)", marginBottom: "12px" }}>
              Coming Soon
            </h2>
            <p className="type-body" style={{ color: "var(--ink-light)" }}>
              Your booking history dashboard is being built. Soon you&apos;ll see all
              your reservations, receipts, and travel stats here.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
