"use client";

import Link from "next/link";

const FOOTER_DESTINATIONS = [
  { label: "Bangkok", href: "/city/bangkok" },
  { label: "Dubai", href: "/city/dubai" },
  { label: "Paris", href: "/city/paris" },
  { label: "Tokyo", href: "/city/tokyo" },
  { label: "Bali", href: "/city/bali" },
  { label: "London", href: "/city/london" },
  { label: "Singapore", href: "/city/singapore" },
  { label: "Maldives", href: "/city/maldives" },
];

const FOOTER_ABOUT = [
  { label: "Our Story", href: "/#about-us" },
  { label: "Why Voyagr Club", href: "/#the-proof" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Preferred Partners", href: "/preferred-rates#partners" },
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
  { label: "WhatsApp", href: "https://wa.me/919876543210", external: true },
  { label: "Email Us", href: "mailto:hello@voyagr.com", external: true },
  { label: "FAQs", href: "/#how-it-works" },
];

export default function Footer() {
  return (
    <footer
      className="site-footer"
      style={{
        background: "var(--ink)",
        color: "var(--cream)",
        padding: "48px 60px 32px",
      }}
    >
      <div
        className="footer-grid-container"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* Top section — 4-column grid */}
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr",
            gap: "48px",
            marginBottom: "40px",
          }}
        >
          {/* Brand column */}
          <div>
            <Link href="/" style={{ textDecoration: "none" }}>
              <span
                className="type-logo"
                style={{
                  color: "var(--cream)",
                  letterSpacing: "0.08em",
                }}
              >
                <span style={{ color: "var(--gold)" }}>V</span>oyagr Club
              </span>
            </Link>
            <p
              style={{
                fontSize: "13px",
                color: "rgba(245, 240, 232, 0.55)",
                lineHeight: 1.8,
                marginTop: "20px",
                maxWidth: "280px",
              }}
            >
              Enjoy preferred rates at distinguished hotels in over 50 cities worldwide, with uncompromised room quality and a thoughtfully curated travel experience.
            </p>

            {/* Social links */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: "36px",
                  height: "36px",
                  border: "1px solid rgba(245, 240, 232, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  color: "rgba(245, 240, 232, 0.55)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--gold)";
                  e.currentTarget.style.color = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(245, 240, 232, 0.15)";
                  e.currentTarget.style.color = "rgba(245, 240, 232, 0.55)";
                }}
                aria-label="WhatsApp"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <a
                href="mailto:hello@voyagr.com"
                style={{
                  width: "36px",
                  height: "36px",
                  border: "1px solid rgba(245, 240, 232, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  color: "rgba(245, 240, 232, 0.55)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--gold)";
                  e.currentTarget.style.color = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "rgba(245, 240, 232, 0.15)";
                  e.currentTarget.style.color = "rgba(245, 240, 232, 0.55)";
                }}
                aria-label="Email"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* Destinations column */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "20px",
              }}
            >
              Top Destinations
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {FOOTER_DESTINATIONS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    fontSize: "13px",
                    color: "rgba(245, 240, 232, 0.55)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color = "var(--cream)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "rgba(245, 240, 232, 0.55)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* About Us column */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "20px",
              }}
            >
              About Us
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {FOOTER_ABOUT.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    fontSize: "13px",
                    color: "rgba(245, 240, 232, 0.55)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color = "var(--cream)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "rgba(245, 240, 232, 0.55)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Categories column */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "20px",
              }}
            >
              Categories
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {FOOTER_CATEGORIES.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  style={{
                    fontSize: "13px",
                    color: "rgba(245, 240, 232, 0.55)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLAnchorElement).style.color = "var(--cream)";
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLAnchorElement).style.color =
                      "rgba(245, 240, 232, 0.55)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support column */}
          <div>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "20px",
              }}
            >
              Support
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {FOOTER_SUPPORT.map((link) => {
                const Tag = link.external ? "a" : Link;
                const extraProps = link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {};
                return (
                  <Tag
                    key={link.label}
                    href={link.href}
                    {...(extraProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
                    style={{
                      fontSize: "13px",
                      color: "rgba(245, 240, 232, 0.55)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.color = "var(--cream)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.color =
                        "rgba(245, 240, 232, 0.55)";
                    }}
                  >
                    {link.label}
                  </Tag>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom bar — divider + copyright */}
        <div
          className="footer-bottom"
          style={{
            borderTop: "1px solid rgba(245, 240, 232, 0.1)",
            paddingTop: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "rgba(245, 240, 232, 0.35)",
              letterSpacing: "0.05em",
            }}
          >
            &copy; 2026 Voyagr Club. All rights reserved.
          </p>
          <div
            style={{
              display: "flex",
              gap: "24px",
            }}
          >
            <a
              href="/privacy-policy"
              style={{
                fontSize: "11px",
                color: "rgba(245, 240, 232, 0.35)",
                letterSpacing: "0.04em",
                textDecoration: "none",
              }}
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              style={{
                fontSize: "11px",
                color: "rgba(245, 240, 232, 0.35)",
                letterSpacing: "0.04em",
                textDecoration: "none",
              }}
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
