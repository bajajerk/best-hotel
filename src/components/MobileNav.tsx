"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* ────────────────────────────────────────────────────────────
   Voyagr Club — Premium Side-Drawer Menu (Mobile-first)
   Slide-in from right, 85vw width, olive/cream/gold palette
   Rendered via portal to avoid stacking-context issues
   ──────────────────────────────────────────────────────────── */

const PRIMARY_LINKS: {
  label: string;
  href: string;
  icon: string;
  highlighted?: boolean;
  badge?: string;
  subtext?: string;
}[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Hotels", href: "/search", icon: "hotel", highlighted: true, badge: "BROWSE" },
  {
    label: "Rate Challenge",
    href: "/match-my-rates",
    icon: "trending_down",
    subtext: "See if we can beat your current hotel price",
  },
  {
    label: "Preferred Rates",
    href: "/preferred-rates",
    icon: "star",
    highlighted: true,
    badge: "VOYAGR CLUB",
  },
  { label: "My Trips", href: "/booking-history", icon: "luggage" },
  { label: "Profile", href: "/profile", icon: "person" },
];

const SECONDARY_LINKS = [
  { label: "Featured Properties", href: "/featured", icon: "apartment" },
  { label: "Explore Cities", href: "/cities", icon: "location_city" },
  { label: "Offers", href: "/offers", icon: "local_offer" },
];

const BOTTOM_LINKS = [
  { label: "Help & Support", href: "/support" },
  { label: "Contact Us", href: "/contact" },
  { label: "Terms & Policies", href: "/terms" },
];

const WHATSAPP_URL =
  "https://wa.me/919876543210?text=Hi%20Voyagr%2C%20I%27d%20like%20to%20speak%20with%20a%20concierge";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);

  /* Portal requires client-side mount */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* Lock body scroll when drawer is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Close on route change */
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Focus trap: move focus into drawer when opened */
  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [open]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  /* Overlay + Drawer rendered via portal to escape header stacking context */
  const overlay = mounted
    ? createPortal(
        <>
          {/* ── Backdrop overlay (hidden — full-screen menu) ── */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "transparent",
              pointerEvents: "none",
            }}
          />

          {/* ── Full-screen overlay menu ── */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10001,
              background: "var(--white, #fdfaf5)",
              opacity: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
              transition: "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              outline: "none",
            }}
          >
        {/* ═══════════════════════════════════════════
            TOP SECTION — User Area
            ═══════════════════════════════════════════ */}
        <div
          style={{
            padding: "28px 24px 20px",
            background: "linear-gradient(180deg, var(--cream, #f5f0e8) 0%, var(--white, #fdfaf5) 100%)",
            borderBottom: "1px solid var(--cream-border, #ddd5c3)",
          }}
        >
          {/* Close button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                background: "none",
                border: "1px solid var(--cream-border, #ddd5c3)",
                borderRadius: "50%",
                cursor: "pointer",
                padding: 0,
                color: "var(--ink-mid)",
                fontSize: "16px",
                lineHeight: 1,
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              ✕
            </button>
          </div>

          {/* User avatar + greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "var(--gold-pale, #F2EBDA)",
                border: "2px solid var(--gold, #C9A84C)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "16px",
                letterSpacing: "0.04em",
                color: "var(--gold, #C9A84C)",
                flexShrink: 0,
              }}
            >
              VC
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "18px",
                color: "var(--ink, #1a1710)",
                lineHeight: 1.3,
              }}
            >
              Welcome back
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            PRIMARY NAVIGATION
            ═══════════════════════════════════════════ */}
        <nav style={{ padding: "8px 0" }}>
          {PRIMARY_LINKS.map((link) => {
            const active = isActive(link.href);
            const isHighlighted = link.highlighted;

            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: link.subtext ? "flex-start" : "center",
                  gap: "14px",
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: active || isHighlighted ? 500 : 400,
                  color: active || isHighlighted
                    ? "var(--gold, #C9A84C)"
                    : "var(--ink, #1a1710)",
                  textDecoration: "none",
                  padding: isHighlighted ? "16px 24px" : "14px 24px",
                  transition: "background 0.2s, color 0.2s",
                  background: isHighlighted
                    ? "linear-gradient(90deg, rgba(201, 168, 76, 0.08) 0%, transparent 100%)"
                    : active
                    ? "linear-gradient(90deg, var(--gold-pale, #F2EBDA) 0%, transparent 100%)"
                    : "transparent",
                  borderLeft: active || isHighlighted
                    ? "3px solid var(--gold, #C9A84C)"
                    : "3px solid transparent",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "22px",
                    color: active || isHighlighted
                      ? "var(--gold, #C9A84C)"
                      : "var(--ink-light, #7a7465)",
                    lineHeight: 1,
                    fontVariationSettings: isHighlighted
                      ? "'FILL' 1, 'wght' 400"
                      : "'FILL' 0, 'wght' 300",
                    marginTop: link.subtext ? "2px" : 0,
                  }}
                  aria-hidden="true"
                >
                  {link.icon}
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {link.label}
                    {link.badge && (
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "8px",
                          fontWeight: 600,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "#ffffff",
                          background: "var(--gold, #C9A84C)",
                          padding: "3px 7px 2px",
                          borderRadius: "3px",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {link.badge}
                      </span>
                    )}
                  </span>
                  {link.subtext && (
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "12px",
                        fontWeight: 400,
                        color: "var(--ink-light, #7a7465)",
                        lineHeight: 1.4,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {link.subtext}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* ═══════════════════════════════════════════
            CONCIERGE — compact CTA
            ═══════════════════════════════════════════ */}
        <div
          style={{
            margin: "4px 16px",
            padding: "16px 20px",
            background: "linear-gradient(135deg, #f7f2e8 0%, var(--gold-pale, #F2EBDA) 100%)",
            borderRadius: "12px",
            border: "1px solid var(--gold-light, #D9BC72)",
          }}
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "12px 16px",
              background: "transparent",
              color: "var(--ink, #1a1710)",
              border: "1.5px solid var(--gold, #C9A84C)",
              borderRadius: "8px",
              fontFamily: "var(--font-display)",
              fontSize: "15px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textDecoration: "none",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              textAlign: "center" as const,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ flexShrink: 0, color: "#25d366" }}
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Speak to Concierge
          </a>
        </div>

        {/* ═══════════════════════════════════════════
            SECONDARY SECTION — Discover
            ═══════════════════════════════════════════ */}
        <div style={{ padding: "16px 0 4px" }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "9px",
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "var(--ink-light, #7a7465)",
              padding: "0 24px 8px",
            }}
          >
            Discover
          </div>
          {SECONDARY_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--ink-mid, #3d3929)",
                textDecoration: "none",
                padding: "11px 24px",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "18px",
                  color: "var(--ink-light, #7a7465)",
                  lineHeight: 1,
                  fontVariationSettings: "'FILL' 0, 'wght' 300",
                }}
                aria-hidden="true"
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Spacer to push bottom sections down ── */}
        <div style={{ flex: 1, minHeight: "16px" }} />

        {/* ═══════════════════════════════════════════
            BOTTOM SECTION — Support & Legal
            ═══════════════════════════════════════════ */}
        <div
          style={{
            padding: "16px 24px 12px",
            borderTop: "1px solid var(--cream-border, #ddd5c3)",
          }}
        >
          {BOTTOM_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 400,
                letterSpacing: "0.06em",
                color: "var(--ink-light, #7a7465)",
                textDecoration: "none",
                padding: "8px 0",
                transition: "color 0.2s",
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Branding */}
          <div
            style={{
              marginTop: "20px",
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: "var(--cream-border, #ddd5c3)",
            }}
          >
            <span style={{ color: "var(--gold-light, #D9BC72)" }}>V</span>oyagr<span style={{ color: "#C9A84C" }}>.</span>Club
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            STICKY BOTTOM CTA
            ═══════════════════════════════════════════ */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            padding: "12px 16px 20px",
            background: "linear-gradient(0deg, var(--white, #fdfaf5) 70%, transparent 100%)",
          }}
        >
          <Link
            href="/preferred-rates"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px 20px",
              background: "var(--gold, #C9A84C)",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontFamily: "var(--font-display)",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textDecoration: "none",
              cursor: "pointer",
              transition: "background 0.2s",
              textAlign: "center" as const,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1, 'wght' 400" }}
              aria-hidden="true"
            >
              lock_open
            </span>
            Unlock Preferred Rates
          </Link>
        </div>
      </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      {/* ── Hamburger button (stays in header flow) ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          zIndex: 200,
          position: "relative",
        }}
      >
        <div style={{ width: "20px", height: "14px", position: "relative" }}>
          {[0, 6, 12].map((top, i) => (
            <span
              key={i}
              style={{
                display: "block",
                position: "absolute",
                left: 0,
                right: 0,
                height: "1.5px",
                background: "rgba(253,250,245,0.7)",
                borderRadius: "1px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                top: open ? "6px" : `${top}px`,
                transform:
                  open && i === 0
                    ? "rotate(45deg)"
                    : open && i === 2
                    ? "rotate(-45deg)"
                    : "none",
                opacity: open && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </div>
      </button>

      {/* Portal-rendered overlay + drawer */}
      {overlay}
    </>
  );
}
