"use client";

import Link from "next/link";

/* ────────────────────────────────────────────────────────────
   Voyagr Club — redesign-v2 dark Footer
   Source: voyagr-club-redesign/src/components/Footer.tsx
   Adapted to best-hotel routes + WhatsApp/Email integrations.
   ──────────────────────────────────────────────────────────── */

const FOOTER_DESTINATIONS = [
  { label: "Bangkok", href: "/city/bangkok" },
  { label: "Tokyo", href: "/city/tokyo" },
  { label: "Paris", href: "/city/paris" },
  { label: "London", href: "/city/london" },
  { label: "Dubai", href: "/city/dubai" },
  { label: "Bali", href: "/city/bali" },
  { label: "Singapore", href: "/city/singapore" },
  { label: "Maldives", href: "/city/maldives" },
];

const FOOTER_DIRECTORY = [
  { label: "Search Collection", href: "/search" },
  { label: "Preferred Access", href: "/preferred-rates" },
  { label: "Price Match Protocol", href: "/match-my-rates" },
  { label: "Preferred Partners", href: "/preferred-partners" },
  { label: "About Voyagr", href: "/about" },
];

const FOOTER_SUPPORT = [
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
];

const WHATSAPP_HREF = "https://wa.me/919833534627";

/* Inline SVG icons (lucide equivalents) — avoids adding lucide-react dep */
const InstagramIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const TwitterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753c0-.249 1.51-2.772 1.818-4.013z" />
  </svg>
);
const MailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const MessageIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export default function Footer() {
  return (
    <footer
      className="redesign-footer"
      style={{
        background: "var(--color-black-deeper)",
        padding: "120px 24px 48px",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* ── Top grid: brand + 3 columns ── */}
        <div
          className="redesign-footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 64,
            marginBottom: 96,
          }}
        >
          {/* Brand column */}
          <div>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 10,
                textDecoration: "none",
                marginBottom: 24,
              }}
            >
              <span
                className="luxury-text-gradient"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 28,
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                VOYAGR
              </span>
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.6em",
                  color: "var(--color-gold)",
                  textTransform: "uppercase",
                }}
              >
                Club
              </span>
            </Link>

            <p
              style={{
                maxWidth: 360,
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--color-white-30)",
                marginBottom: 40,
                marginTop: 24,
              }}
            >
              The modern standard for boutique hotel booking. Bridging the gap
              between digital precision and human hospitality.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <SocialIcon href="https://instagram.com" label="Instagram">
                <InstagramIcon />
              </SocialIcon>
              <SocialIcon href="https://twitter.com" label="Twitter">
                <TwitterIcon />
              </SocialIcon>
              <SocialIcon href={WHATSAPP_HREF} label="WhatsApp">
                <MessageIcon />
              </SocialIcon>
            </div>
          </div>

          {/* Directory column */}
          <FooterColumn title="Directory">
            {FOOTER_DIRECTORY.map((link) => (
              <FooterLink key={link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* Destinations column */}
          <FooterColumn title="Destinations">
            {FOOTER_DESTINATIONS.map((link) => (
              <FooterLink key={link.label} href={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </FooterColumn>

          {/* Liaison column */}
          <FooterColumn title="Liaison">
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 12,
                color: "var(--color-white-50)",
                marginBottom: 14,
              }}
            >
              <span style={{ color: "rgba(212, 175, 55, 0.6)" }}>
                <MailIcon />
              </span>
              <a
                href="mailto:hello@voyagr.com"
                style={{
                  color: "inherit",
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                }}
              >
                hello@voyagr.com
              </a>
            </li>
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 12,
                color: "var(--color-white-50)",
              }}
            >
              <span style={{ color: "rgba(212, 175, 55, 0.6)" }}>
                <MessageIcon />
              </span>
              <a
                href={WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "inherit",
                  textDecoration: "none",
                  letterSpacing: "0.01em",
                }}
              >
                +91 98335 34627
              </a>
            </li>
          </FooterColumn>
        </div>

        {/* ── Bottom strip: copyright + meta links ── */}
        <div
          style={{
            paddingTop: 24,
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 8,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: "var(--color-white-10)",
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} VOYAGR CLUB — PRIVATE MEMBERSHIP ONLY
          </p>
          <div style={{ display: "flex", gap: 32 }}>
            {FOOTER_SUPPORT.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="redesign-footer-meta"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 8,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "var(--color-white-10)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── Composition helpers ──────────────────────────────────────────── */

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          color: "var(--color-white-60)",
          margin: "0 0 32px 0",
        }}
      >
        {title}
      </h4>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {children}
      </ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="redesign-footer-link"
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 12,
          color: "var(--color-white-30)",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
      >
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");
  const props = isExternal
    ? { target: "_blank" as const, rel: "noopener noreferrer" }
    : {};
  return (
    <a
      href={href}
      aria-label={label}
      {...props}
      className="redesign-footer-social"
      style={{
        width: 36,
        height: 36,
        borderRadius: 9999,
        border: "1px solid rgba(255, 255, 255, 0.05)",
        color: "var(--color-white-20)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        textDecoration: "none",
        transition: "color 0.2s, border-color 0.2s",
      }}
    >
      {children}
    </a>
  );
}
