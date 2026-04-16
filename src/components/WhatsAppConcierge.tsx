"use client";

import { trackWhatsAppClicked } from "@/lib/analytics";

const WA_LINK =
  "https://wa.me/919876543210?text=Hi%2C%20I%27d%20like%20to%20speak%20with%20a%20Voyagr%20concierge";

export default function WhatsAppConcierge() {
  return (
    <section
      style={{
        background: "#0B1B2B",
        padding: "60px 64px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "48px",
          alignItems: "center",
        }}
      >
        {/* ── Left: Copy ── */}
        <div>
          {/* Eyebrow */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.2em",
              color: "var(--gold)",
              marginBottom: "16px",
              textTransform: "uppercase",
            }}
          >
            CONCIERGE SERVICE
          </div>

          {/* Heading */}
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "38px",
              fontWeight: 300,
              color: "var(--cream)",
              lineHeight: 1.25,
              marginBottom: "24px",
            }}
          >
            A person who knows hotels,
            <br />
            <em style={{ fontStyle: "italic" }}>not a bot that reads reviews.</em>
          </h2>

          {/* Body */}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "rgba(253,250,245,0.55)",
              maxWidth: "420px",
              lineHeight: 1.75,
              marginBottom: "32px",
            }}
          >
            Before you book, during your stay, and when something needs sorting
            &mdash; your Voyagr concierge is one message away. Typically responds
            in under 2 hours.
          </p>

          {/* CTA */}
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClicked({ page: "home_concierge_section" })}
            style={{
              display: "inline-block",
              padding: "10px 20px",
              border: "1px solid rgba(200,170,110,0.3)",
              color: "var(--gold)",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              textDecoration: "none",
              letterSpacing: "0.04em",
              transition: "border-color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(200,170,110,0.6)";
              (e.currentTarget as HTMLAnchorElement).style.background =
                "rgba(200,170,110,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.borderColor =
                "rgba(200,170,110,0.3)";
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
            }}
          >
            Ask our concierge &rarr;
          </a>
        </div>

        {/* ── Right: Phone Mockup ── */}
        <div
          style={{
            background: "#132338",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid rgba(255,255,255,0.06)",
            maxWidth: "380px",
            justifySelf: "end",
          }}
        >
          {/* WA Header */}
          <div
            style={{
              background: "#0e1c2e",
              borderRadius: "8px 8px 0 0",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#6b8f71",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "var(--font-body)",
                flexShrink: 0,
              }}
            >
              P
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--cream)",
                }}
              >
                Priya &middot; Voyagr Concierge
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "11px",
                  color: "rgba(253,250,245,0.5)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "2px",
                }}
              >
                <span style={{ color: "#6b8f71", fontSize: "8px" }}>&bull;</span>
                Online
              </div>
            </div>
          </div>

          {/* Chat Bubbles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* User bubble */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div
                style={{
                  background: "#132338",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "0 8px 8px 8px",
                  padding: "10px 14px",
                  maxWidth: "280px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--cream)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Hi! I&rsquo;m interested in Four Seasons DIFC for 15&ndash;18 March.
                </p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "rgba(253,250,245,0.3)",
                  marginTop: "4px",
                }}
              >
                10:42 AM
              </span>
            </div>

            {/* Priya bubble */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <div
                style={{
                  background: "#1e3a2e",
                  borderRadius: "8px 0 8px 8px",
                  padding: "10px 14px",
                  maxWidth: "280px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    color: "var(--cream)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  Hi Rahul &mdash; member rate for those dates is &#8377;22,200/night. Want
                  me to hold it for 24&nbsp;hours?
                </p>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "rgba(253,250,245,0.3)",
                  marginTop: "4px",
                }}
              >
                10:44 AM
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Responsive: stack on mobile ── */}
      <style>{`
        @media (max-width: 768px) {
          section > div:first-child {
            grid-template-columns: 1fr !important;
          }
          section > div:first-child > div:last-child {
            justify-self: stretch !important;
            max-width: none !important;
          }
        }
      `}</style>
    </section>
  );
}
