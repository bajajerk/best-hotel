"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
  { label: "Search", href: "/search", icon: "search", highlighted: true, badge: "BROWSE" },
  { label: "Flights", href: "/flights", icon: "flight" },
  {
    label: "Preferred Rates",
    href: "/preferred-rates",
    icon: "star",
    highlighted: true,
    badge: "VOYAGR CLUB",
  },
  {
    label: "Price Match",
    href: "/match-my-rates",
    icon: "trending_down",
    subtext: "See if we can beat your current hotel price",
  },
  { label: "My Trips", href: "/booking-history", icon: "luggage" },
  { label: "Profile", href: "/profile", icon: "person" },
];

const SECONDARY_LINKS = [
  { label: "Preferred Properties", href: "/preferred-properties", icon: "apartment" },
  { label: "Preferred Rates", href: "/preferred-rates", icon: "local_offer" },
];

const BOTTOM_LINKS = [
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
];

const WHATSAPP_URL =
  "https://wa.me/919876543210?text=Hi%20Voyagr%2C%20I%27d%20like%20to%20speak%20with%20a%20concierge";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  /* Swipe-right-to-close handlers on the drawer itself.
     Only tracks rightward motion so vertical scrolling and taps still work. */
  function onTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartXRef.current == null) return;
    const delta = e.touches[0].clientX - touchStartXRef.current;
    setDragOffset(delta > 0 ? delta : 0);
  }
  function onTouchEnd() {
    if (dragOffset > 60) setOpen(false);
    setDragOffset(0);
    touchStartXRef.current = null;
  }

  /* "See Member Rates →" CTA — auth-aware destination.
     Logged out + on homepage → smooth-scroll to the hero search bar (it's right there).
     Logged out elsewhere → /search.
     Logged in → /search directly (skip the discovery step). */
  function handleSeeMemberRates(e: React.MouseEvent) {
    e.preventDefault();
    setOpen(false);
    if (!user && pathname === "/") {
      // Wait for the drawer close transition before scrolling so the target is in view.
      setTimeout(() => {
        const target = document.getElementById("hero-search");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          router.push("/search");
        }
      }, 250);
      return;
    }
    router.push("/search");
  }

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

  /* Overlay + Drawer rendered via portal to escape header stacking context.
     Wrapped in `.luxe` with display:contents so the dark-theme design
     tokens (--cream/--ink/--white/--gold) cascade into the drawer's
     inline styles — the portal target is document.body, which sits
     OUTSIDE any page-level `.luxe` wrapper, so without this scope the
     drawer would render in light theme even on a dark page.
     `display: contents` keeps the wrapper inert (no box, no min-height,
     no background) so the existing fixed-position layout is unchanged. */
  const overlay = mounted
    ? createPortal(
        <div className="luxe" style={{ display: "contents" }}>
          {/* ── Dark backdrop overlay — covers the area left of the drawer,
                tapping it closes the drawer. Full-screen underneath so it
                still covers the 25% gap regardless of drawer max-width cap. ── */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(0,0,0,0.4)",
              opacity: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
              transition: open
                ? "opacity 0.28s ease-out"
                : "opacity 0.22s ease-in",
            }}
          />

          {/* ── Right-side slide-in drawer ── */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            className={`mobile-menu${open ? " open" : ""}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "75%",
              maxWidth: "300px",
              height: "100vh",
              zIndex: 10001,
              background: "var(--white, var(--white))",
              transform: open
                ? `translateX(${dragOffset}px)`
                : "translateX(100%)",
              transition: dragOffset > 0
                ? "none"
                : open
                ? "transform 0.28s ease-out"
                : "transform 0.22s ease-in",
              pointerEvents: open ? "auto" : "none",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              outline: "none",
              boxShadow: open ? "-4px 0 24px rgba(0,0,0,0.15)" : "none",
            }}
          >
        {/* ═══════════════════════════════════════════
            TOP SECTION — User Area
            ═══════════════════════════════════════════ */}
        <div
          style={{
            padding: "28px 24px 20px",
            background: "linear-gradient(180deg, var(--cream, var(--cream)) 0%, var(--white, var(--white)) 100%)",
            borderBottom: "1px solid var(--cream-border, var(--cream-border))",
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
                border: "1px solid var(--cream-border, var(--cream-border))",
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
                border: "2px solid var(--gold, var(--gold))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "16px",
                letterSpacing: "0.04em",
                color: "var(--gold, var(--gold))",
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
                color: "var(--ink, var(--ink))",
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
                    ? "var(--gold, var(--gold))"
                    : "var(--ink, var(--ink))",
                  textDecoration: "none",
                  padding: isHighlighted ? "16px 24px" : "14px 24px",
                  transition: "background 0.2s, color 0.2s",
                  background: isHighlighted
                    ? "linear-gradient(90deg, rgba(201, 168, 76, 0.08) 0%, transparent 100%)"
                    : active
                    ? "linear-gradient(90deg, var(--gold-pale, #F2EBDA) 0%, transparent 100%)"
                    : "transparent",
                  borderLeft: active || isHighlighted
                    ? "3px solid var(--gold, var(--gold))"
                    : "3px solid transparent",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: "22px",
                    color: active || isHighlighted
                      ? "var(--gold, var(--gold))"
                      : "var(--ink-light, var(--ink-light))",
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
                          background: "var(--gold, var(--gold))",
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
                        color: "var(--ink-light, var(--ink-light))",
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

          {user ? (
            <button
              type="button"
              onClick={async () => {
                await signOut();
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                width: "100%",
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 400,
                color: "var(--ink, var(--ink))",
                textAlign: "left",
                background: "transparent",
                border: "none",
                borderLeft: "3px solid transparent",
                padding: "14px 24px",
                cursor: "pointer",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "22px",
                  color: "var(--ink-light, var(--ink-light))",
                  lineHeight: 1,
                  fontVariationSettings: "'FILL' 0, 'wght' 300",
                }}
                aria-hidden="true"
              >
                key
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  Sign Out
                </span>
              </span>
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontFamily: "var(--font-display)",
                fontSize: "20px",
                fontWeight: 400,
                color: "var(--ink, var(--ink))",
                textDecoration: "none",
                padding: "14px 24px",
                transition: "background 0.2s, color 0.2s",
                background: "transparent",
                borderLeft: "3px solid transparent",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "22px",
                  color: "var(--ink-light, var(--ink-light))",
                  lineHeight: 1,
                  fontVariationSettings: "'FILL' 0, 'wght' 300",
                }}
                aria-hidden="true"
              >
                key
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  Sign In
                </span>
              </span>
            </Link>
          )}
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
            border: "1px solid var(--gold-light, var(--gold-light))",
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
              color: "var(--ink, var(--ink))",
              border: "1.5px solid var(--gold, var(--gold))",
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
              color: "var(--ink-light, var(--ink-light))",
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
                color: "var(--ink-mid, var(--ink-mid))",
                textDecoration: "none",
                padding: "11px 24px",
                transition: "background 0.2s, color 0.2s",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "18px",
                  color: "var(--ink-light, var(--ink-light))",
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
            borderTop: "1px solid var(--cream-border, var(--cream-border))",
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
                color: "var(--ink-light, var(--ink-light))",
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
              color: "var(--cream-border, var(--cream-border))",
            }}
          >
            <span style={{ color: "var(--gold-light, var(--gold-light))" }}>V</span>oyagr<span style={{ color: "var(--gold)" }}>.</span>Club
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
            background: "linear-gradient(0deg, var(--white, var(--white)) 70%, transparent 100%)",
          }}
        >
          <Link
            href="/search"
            onClick={handleSeeMemberRates}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px 20px",
              background: "var(--gold, var(--gold))",
              color: "var(--ink)",
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
            See Member Rates &rarr;
          </Link>
        </div>
      </div>
        </div>,
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
