"use client";

import Link from "next/link";

/* ────────────────────────── Footer ──────────────────────────
   Editorial closing-page treatment. Dark luxe matches the rest of the
   site (was cream/navy and felt disconnected). Champagne foil-line on
   top, a quiet membership-CTA strip, four link columns under italic
   Playfair headings + champagne mono-caps eyebrows, and a hairline
   bottom row carrying copyright + legal links + a mini wordmark.

   On phone the four link columns collapse to a single column with
   hairline dividers; the CTA strip restacks vertically with a
   full-width button.
   ──────────────────────────────────────────────────────────── */

const FOOTER_DESTINATIONS = [
  { label: "Dubai", href: "/city/dubai" },
  { label: "Paris", href: "/city/paris" },
  { label: "Tokyo", href: "/city/tokyo" },
  { label: "Bali", href: "/city/bali" },
  { label: "Maldives", href: "/city/maldives" },
];

const FOOTER_ABOUT = [
  { label: "Our Story", href: "/about" },
  { label: "Why Voyagr Club", href: "/#the-proof" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Preferred Partners", href: "/preferred-partners" },
  { label: "Match My Rate", href: "/match-my-rates" },
];

const FOOTER_CATEGORIES = [
  { label: "Singles", href: "/search?category=singles" },
  { label: "Couples", href: "/search?category=couples" },
  { label: "Families", href: "/search?category=families" },
  { label: "Luxury Stays", href: "/search?sort=price-high" },
  { label: "Budget Friendly", href: "/search?sort=price-low" },
  { label: "Top Rated", href: "/search?sort=rating" },
];

const FOOTER_SUPPORT = [
  { label: "WhatsApp Concierge", href: "https://wa.me/919876543210", external: true },
  { label: "Email Us", href: "mailto:hello@voyagr.com", external: true },
  { label: "FAQs", href: "/#how-it-works" },
];

/* Hardcoded hex tokens kept local — the site uses route-scoped theme
   remaps (e.g. `.luxe`) which would invert the footer if we used
   --luxe-* tokens directly. Mirrors the same pattern as Header.tsx. */
const C = {
  bg: "#0c0b0a",          // luxe-black
  bgRaised: "#141312",    // luxe-black-2 (raised surface for CTA strip)
  ink: "#f6f1e4",         // luxe-soft-white
  inkMuted: "rgba(246,241,228,0.65)",
  inkFaint: "rgba(246,241,228,0.45)",
  champagne: "#C9A961",
  champagneSoft: "rgba(201,169,97,0.08)",
  hairline: "rgba(246,241,228,0.08)",
  hairlineStrong: "rgba(246,241,228,0.14)",
} as const;

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: C.champagne,
  marginBottom: 18,
};

const linkColStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

export default function Footer() {
  return (
    <footer
      className="site-footer"
      data-testid="site-footer"
      style={{
        background: C.bg,
        color: C.ink,
        position: "relative",
        // Champagne foil-line at the very top edge — quiet but present.
        borderTop: `1px solid ${C.champagne}`,
        boxShadow: `inset 0 1px 0 rgba(201,169,97,0.18)`,
      }}
    >
      {/* ── Membership CTA strip ── */}
      <div
        className="footer-cta-strip"
        style={{
          background: C.bgRaised,
          borderBottom: `1px solid ${C.hairline}`,
        }}
      >
        <div
          className="footer-cta-inner"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "28px 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: C.champagne,
                margin: 0,
                marginBottom: 6,
              }}
            >
              Voyagr Club
            </p>
            <h3
              style={{
                fontFamily: "var(--font-display), serif",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "clamp(22px, 3vw, 30px)",
                lineHeight: 1.18,
                letterSpacing: "-0.01em",
                color: C.ink,
                margin: 0,
              }}
            >
              Travel, considered.
            </h3>
          </div>
          <Link
            href="/preferred-rates"
            className="footer-cta-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 22px",
              background: C.champagne,
              color: "#1a1816",
              fontFamily: "var(--font-body), sans-serif",
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "none",
              borderRadius: 999,
              whiteSpace: "nowrap",
              transition: "transform 220ms ease, box-shadow 220ms ease",
            }}
          >
            See member rates
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div
        className="footer-main"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "56px 48px 36px",
        }}
      >
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr",
            columnGap: 32,
            rowGap: 40,
            marginBottom: 48,
          }}
        >
          {/* Brand column */}
          <div className="footer-col footer-col-brand">
            <Link href="/" style={{ textDecoration: "none", display: "inline-block" }}>
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontWeight: 600,
                  fontSize: 22,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: C.ink,
                }}
              >
                VOYAGR
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontStyle: "italic",
                  fontWeight: 500,
                  fontSize: 22,
                  letterSpacing: "0.08em",
                  color: C.champagne,
                  marginLeft: 6,
                }}
              >
                Club
              </span>
            </Link>
            <p
              data-testid="footer-desc"
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 13.5,
                lineHeight: 1.7,
                color: C.inkMuted,
                marginTop: 18,
                maxWidth: 320,
              }}
            >
              Preferred rates at distinguished hotels in over 50 cities worldwide, with uncompromised quality and a thoughtfully curated travel experience.
            </p>

            {/* Social */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 28,
              }}
            >
              <SocialIcon
                href="https://wa.me/919876543210"
                external
                label="WhatsApp"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="mailto:hello@voyagr.com" external label="Email">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </SocialIcon>
              <SocialIcon href="https://instagram.com/voyagrclub" external label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <FooterCol heading="Top Destinations" links={FOOTER_DESTINATIONS} />
          <FooterCol heading="The Club" links={FOOTER_ABOUT} />
          <FooterCol heading="Browse" links={FOOTER_CATEGORIES} />
          <FooterCol heading="Support" links={FOOTER_SUPPORT} />
        </div>

        {/* Bottom hairline + legal row */}
        <div
          className="footer-bottom"
          style={{
            borderTop: `1px solid ${C.hairline}`,
            paddingTop: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p
            data-testid="footer-copyright"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11,
              letterSpacing: "0.14em",
              color: C.inkFaint,
              margin: 0,
            }}
          >
            © 2026 Voyagr Club · Made for travellers, considered.
          </p>
          <div
            style={{
              display: "flex",
              gap: 24,
            }}
          >
            <Link
              href="/privacy-policy"
              data-testid="footer-legal"
              style={legalLinkStyle}
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              data-testid="footer-legal"
              style={legalLinkStyle}
            >
              Terms
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-link {
          font-family: var(--font-body), sans-serif;
          font-size: 13px;
          color: ${C.inkMuted};
          text-decoration: none;
          transition: color 200ms ease;
          line-height: 1.5;
        }
        .footer-link:hover {
          color: ${C.champagne};
        }
        .footer-cta-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(201, 169, 97, 0.28);
        }

        /* Tablet — compress horizontal padding */
        @media (max-width: 1024px) {
          .footer-cta-inner,
          .footer-main {
            padding-left: 32px !important;
            padding-right: 32px !important;
          }
          .footer-grid {
            grid-template-columns: 1fr 1fr 1fr !important;
            column-gap: 28px !important;
          }
          .footer-col-brand {
            grid-column: 1 / -1 !important;
            padding-bottom: 20px;
            border-bottom: 1px solid ${C.hairline};
          }
        }

        /* Phone — stack to single column with hairlines */
        @media (max-width: 640px) {
          .footer-cta-inner {
            padding: 24px 20px !important;
            flex-direction: column;
            align-items: flex-start;
          }
          .footer-cta-btn {
            width: 100%;
            justify-content: center;
          }
          .footer-main {
            padding: 36px 20px 28px !important;
          }
          .footer-grid {
            grid-template-columns: 1fr !important;
            row-gap: 28px !important;
            margin-bottom: 32px !important;
          }
          .footer-col {
            padding-bottom: 24px;
            border-bottom: 1px solid ${C.hairline};
          }
          .footer-col:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }
          .footer-col-brand {
            grid-column: auto !important;
            border-bottom: 1px solid ${C.hairline};
            padding-bottom: 24px;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
        }
      `}</style>
    </footer>
  );
}

const legalLinkStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: C.inkFaint,
  textDecoration: "none",
  transition: "color 200ms ease",
};

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}) {
  return (
    <div className="footer-col">
      <div data-testid="footer-heading" style={headingStyle}>
        {heading}
      </div>
      <div style={linkColStyle}>
        {links.map((link) => {
          if (link.external) {
            return (
              <a
                key={link.label}
                href={link.href}
                className="footer-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            );
          }
          return (
            <Link key={link.label} href={link.href} className="footer-link">
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SocialIcon({
  href,
  external,
  label,
  children,
}: {
  href: string;
  external?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const props = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <a
      href={href}
      aria-label={label}
      className="footer-social"
      style={{
        width: 38,
        height: 38,
        borderRadius: "50%",
        border: `1px solid ${C.hairlineStrong}`,
        background: C.champagneSoft,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.inkMuted,
        transition: "color 220ms ease, border-color 220ms ease, background 220ms ease",
        textDecoration: "none",
      }}
      {...props}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = C.champagne;
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(201,169,97,0.45)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = C.inkMuted;
        (e.currentTarget as HTMLAnchorElement).style.borderColor = C.hairlineStrong;
      }}
    >
      {children}
    </a>
  );
}
