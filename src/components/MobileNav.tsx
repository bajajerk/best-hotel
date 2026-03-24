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

const PRIMARY_LINKS = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Search Hotels", href: "/search", icon: "search" },
  { label: "My Trips", href: "/booking-history", icon: "luggage" },
  { label: "Saved Hotels", href: "/saved", icon: "bookmark" },
];

const TRUST_LINKS = [
  { label: "Why Choose Us", href: "/about#why-us" },
  { label: "How It Works", href: "/about#how-it-works" },
  { label: "Reviews", href: "/about#reviews" },
];

const SECONDARY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Help & Support", href: "/support" },
  { label: "Terms & Privacy", href: "/terms" },
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
          {/* ── Backdrop overlay ── */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(26, 23, 16, 0.45)",
              backdropFilter: open ? "blur(4px)" : "none",
              WebkitBackdropFilter: open ? "blur(4px)" : "none",
              opacity: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
              transition: "opacity 0.3s ease",
            }}
          />

          {/* ── Drawer: slides from RIGHT, 85vw ── */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "85vw",
              maxWidth: "380px",
              zIndex: 10001,
              background: "var(--white, #fdfaf5)",
              boxShadow: open
                ? "-8px 0 40px rgba(26, 23, 16, 0.12)"
                : "none",
              transform: open ? "translateX(0)" : "translateX(100%)",
              transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
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

          {/* User avatar + info */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "var(--gold-pale, #f0e6d0)",
                border: "2px solid var(--gold, #b8955a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "16px",
                letterSpacing: "0.04em",
                color: "var(--gold, #b8955a)",
                flexShrink: 0,
              }}
            >
              VC
            </div>
            <div>
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
              <Link
                href="/booking-history"
                onClick={() => setOpen(false)}
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "var(--gold, #b8955a)",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "2px",
                  transition: "color 0.2s",
                }}
              >
                My Trips
                <span style={{ fontSize: "14px", lineHeight: 1 }}>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            PRIMARY NAVIGATION
            ═══════════════════════════════════════════ */}
        <nav style={{ padding: "8px 0" }}>
          {PRIMARY_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: active ? 500 : 400,
                  color: active ? "var(--gold, #b8955a)" : "var(--ink, #1a1710)",
                  textDecoration: "none",
                  padding: "14px 24px",
                  transition: "background 0.2s, color 0.2s",
                  background: active
                    ? "linear-gradient(90deg, var(--gold-pale, #f0e6d0) 0%, transparent 100%)"
                    : "transparent",
                  borderLeft: active
                    ? "3px solid var(--gold, #b8955a)"
                    : "3px solid transparent",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "22px",
                    color: active ? "var(--gold, #b8955a)" : "var(--ink-light, #7a7465)",
                    lineHeight: 1,
                    fontVariationSettings: "'FILL' 0, 'wght' 300",
                  }}
                  aria-hidden="true"
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* ═══════════════════════════════════════════
            CONVERSION SECTION — highlighted CTA area
            ═══════════════════════════════════════════ */}
        <div
          style={{
            margin: "4px 16px",
            padding: "20px",
            background: "linear-gradient(135deg, #f7f2e8 0%, var(--gold-pale, #f0e6d0) 100%)",
            borderRadius: "12px",
            border: "1px solid var(--gold-light, #d4ae78)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "9px",
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase" as const,
              color: "var(--gold, #b8955a)",
              marginBottom: "14px",
            }}
          >
            Exclusive Access
          </div>

          {/* Unlock a Preferred Rate */}
          <Link
            href="/preferred-rates"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "13px 16px",
              background: "var(--gold, #b8955a)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontFamily: "var(--font-display)",
              fontSize: "15px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textDecoration: "none",
              cursor: "pointer",
              transition: "background 0.2s, transform 0.15s",
              marginBottom: "10px",
              textAlign: "center" as const,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "18px", lineHeight: 1 }}
              aria-hidden="true"
            >
              lock_open
            </span>
            Unlock a Preferred Rate
          </Link>

          {/* Speak to Concierge */}
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
              border: "1.5px solid var(--gold, #b8955a)",
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
            {/* WhatsApp icon */}
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
            TRUST SECTION
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
            Learn More
          </div>
          {TRUST_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--ink-mid, #3d3929)",
                textDecoration: "none",
                padding: "11px 24px",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Spacer to push secondary to bottom ── */}
        <div style={{ flex: 1, minHeight: "16px" }} />

        {/* ═══════════════════════════════════════════
            SECONDARY SECTION
            ═══════════════════════════════════════════ */}
        <div
          style={{
            padding: "16px 24px 32px",
            borderTop: "1px solid var(--cream-border, #ddd5c3)",
          }}
        >
          {SECONDARY_LINKS.map((link) => (
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
            <span style={{ color: "var(--gold-light, #d4ae78)" }}>V</span>oyagr Club
          </div>
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
                background: "var(--ink-mid)",
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
