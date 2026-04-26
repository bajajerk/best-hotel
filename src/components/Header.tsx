"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import { useAuth } from "@/context/AuthContext";

/* ────────────────────────────────────────────────────────────
   Voyagr Club — redesign-v2 floating glass pill nav
   Replaces the previous solid navy bar with the obsidian-on-gold
   redesign aesthetic. Mobile bottom tab bar re-skinned for dark.
   ──────────────────────────────────────────────────────────── */

export const NAV_LINKS = [
  { label: "Hotels", href: "/search" },
  { label: "Flights", href: "/flights" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "My Trips", href: "/booking-history" },
];

const DESKTOP_LINKS = [
  { label: "Hotels", href: "/search" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Price Match", href: "/match-my-rates" },
  { label: "My Trips", href: "/booking-history" },
];

export default function Header() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const joinHref = user ? "/profile" : "/login";
  const showSignIn = !loading && !user;

  // Subtle pill compaction after first scroll — mirrors the redesign's
  // "shrinking monolith" idea but more restrained (less radical resize).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        aria-label="Primary"
        className="redesign-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: scrolled ? "12px 24px" : "20px 24px",
          transition: "padding 0.3s ease",
          pointerEvents: "none", // pill catches its own pointer events
        }}
      >
        <div
          className="glass-panel"
          style={{
            pointerEvents: "auto",
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "10px 14px 10px 22px",
            borderRadius: 9999,
            // Stronger blur on the pill itself for legibility over hero imagery
            backdropFilter: "blur(20px) saturate(140%)",
            WebkitBackdropFilter: "blur(20px) saturate(140%)",
            background: "rgba(10, 10, 10, 0.55)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.35)",
          }}
        >
          {/* ── Lockup: VOYAGR (gradient) + Club (gold italic) ── */}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: 8,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <span
              className="luxury-text-gradient"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: scrolled ? 18 : 20,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                transition: "font-size 0.3s ease",
              }}
            >
              VOYAGR
            </span>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: "0.5em",
                color: "var(--color-gold)",
                textTransform: "uppercase",
                paddingTop: 2,
              }}
            >
              Club
            </span>
          </Link>

          {/* ── Desktop nav links (hidden <1024px) ── */}
          <div
            className="redesign-header-links"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginLeft: 12,
              flex: 1,
              justifyContent: "flex-start",
            }}
          >
            {DESKTOP_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className="redesign-header-link"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: isActive(link.href)
                    ? "var(--color-gold)"
                    : "var(--color-white-40)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "color 0.2s",
                  position: "relative",
                  paddingBottom: 2,
                  borderBottom: isActive(link.href)
                    ? "1px solid var(--color-gold)"
                    : "1px solid transparent",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right cluster: Sign In + Join + Hamburger ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {showSignIn && (
              <Link
                href="/login"
                className="redesign-header-signin"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "var(--color-white-40)",
                  textDecoration: "none",
                  transition: "color 0.2s",
                  whiteSpace: "nowrap",
                }}
              >
                Sign In
              </Link>
            )}

            <Link
              href={joinHref}
              className="redesign-header-join"
              style={{
                background: "var(--color-gold)",
                color: "var(--color-black-rich)",
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "10px 18px",
                borderRadius: 9999,
                whiteSpace: "nowrap",
                transition: "background 0.2s, color 0.2s, transform 0.15s",
              }}
            >
              {user ? "Account" : "Join the Club"}
            </Link>

            {/* MobileNav exposes its own hamburger button + drawer */}
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar (visible <640px only via globals.css media query) */}
      <MobileTabBar pathname={pathname} />
    </>
  );
}

/* ────────────────────────────────────────────────────────────
   Mobile bottom tab bar — dark redesign
   Visible only <640px (controlled by .mobile-tab-bar in globals.css).
   ──────────────────────────────────────────────────────────── */

const TAB_ICONS: Record<string, React.ReactNode> = {
  Hotels: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Flights: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  ),
  "Preferred Rates": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
    </svg>
  ),
  "My Trips": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

function MobileTabBar({ pathname }: { pathname: string }) {
  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div
      className="mobile-tab-bar redesign-mobile-tabs"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        background: "rgba(10, 10, 10, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_LINKS.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.label}
            href={link.href}
            aria-current={active ? "page" : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              flex: 1,
              padding: "10px 0 8px",
              textDecoration: "none",
              color: active ? "var(--color-gold)" : "var(--color-white-40)",
              borderTop: active
                ? "1px solid var(--color-gold)"
                : "1px solid transparent",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {TAB_ICONS[link.label]}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 9,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              {link.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
