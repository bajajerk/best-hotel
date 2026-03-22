"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProfilePage() {
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
            My Profile
          </h1>
          <p
            className="type-body-lg"
            style={{ color: "var(--ink-light)", marginBottom: "40px", maxWidth: "600px" }}
          >
            Manage your Voyagr Club account, preferences, and travel details.
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="type-heading-2" style={{ color: "var(--ink)", marginBottom: "12px" }}>
              Coming Soon
            </h2>
            <p className="type-body" style={{ color: "var(--ink-light)" }}>
              Your personal profile and account management is on the way.
              Stay tuned for a seamless travel identity experience.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
