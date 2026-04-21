"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";
import { useAuth } from "@/context/AuthContext";

/* ────────────────────────────────────────────────────────────
   Voyagr.Club — Sticky Navigation Bar
   72px desktop · 60px mobile · #0B1B2B solid
   ──────────────────────────────────────────────────────────── */

const GOLD = "#C9A84C";
const NAVY = "#0B1B2B";
const IVORY = "#fdfaf5";

export const NAV_LINKS = [
  { label: "Search", href: "/search" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Price Match", href: "/match-my-rates" },
  { label: "My Trips", href: "/booking-history" },
];

/* Desktop nav links */
const DESKTOP_LINKS = [
  { label: "Search", href: "/search" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Price Match", href: "/match-my-rates" },
  { label: "Sign In", href: "/login" },
];

export default function Header() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [joinHover, setJoinHover] = useState(false);
  const { user, loading } = useAuth();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const joinHref = user ? "/profile" : "/login";
  // Show a compact Sign In on mobile (the desktop Sign In link lives in
  // .header-nav-center which is display:none < 768px). Hide while auth is
  // resolving to avoid a flash, and hide when logged in.
  const showMobileSignIn = !loading && !user;

  return (
    <>
      <nav
        ref={navRef}
        className="voyagr-nav"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: NAVY,
          borderBottom: "1px solid rgba(201,168,76,0.1)",
        }}
      >
        <div
          className="voyagr-nav-inner"
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          {/* ── Left: Logo ── */}
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "20px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: IVORY,
              }}
            >
              VOYAGR
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: "20px",
                letterSpacing: "0.08em",
                color: GOLD,
              }}
            >
              .CLUB
            </span>
          </Link>

          {/* ── Centre: Desktop nav links (hidden <768px) ── */}
          <div className="header-nav-center">
            {DESKTOP_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isActive(link.href)
                    ? IVORY
                    : `rgba(253,250,245,0.6)`,
                  textDecoration: "none",
                  padding: "8px 0",
                  borderBottom: isActive(link.href)
                    ? `2px solid ${GOLD}`
                    : "2px solid transparent",
                  transition: "color 0.25s, border-color 0.25s",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Right: CTA + Hamburger ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {/* "Join the Club" button — desktop only.
                Logged out → /login (signup/OTP flow). Logged in → /profile dashboard. */}
            <Link
              href={joinHref}
              className="header-join-btn"
              onMouseEnter={() => setJoinHover(true)}
              onMouseLeave={() => setJoinHover(false)}
              style={{
                background: joinHover ? GOLD : "transparent",
                color: joinHover ? NAVY : IVORY,
                border: `1px solid ${GOLD}`,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "8px 22px",
                borderRadius: "2px",
                transition: "background 0.25s, color 0.25s",
                whiteSpace: "nowrap",
              }}
            >
              Join the Club
            </Link>

            {/* Mobile-only compact Sign In — mirrors the desktop "Sign In"
                nav link, which is hidden below 768px. Link gets native
                keyboard (Enter) activation for free. */}
            {showMobileSignIn && (
              <Link
                href="/login"
                className="header-signin-mobile"
                aria-label="Sign in"
                style={{
                  color: IVORY,
                  border: `1px solid ${GOLD}`,
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  padding: "7px 14px",
                  borderRadius: "2px",
                  whiteSpace: "nowrap",
                }}
              >
                Sign In
              </Link>
            )}

            {/* Hamburger / Drawer toggle */}
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar (visible <640px only) */}
      <MobileTabBar pathname={pathname} />
    </>
  );
}

/* ── Mobile bottom tab bar ── */

const TAB_ICONS: Record<string, React.ReactNode> = {
  Search: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  "Preferred Rates": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
    </svg>
  ),
  "Price Match": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  "My Trips": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="mobile-tab-bar">
      {NAV_LINKS.map((link) => {
        const active = isActive(link.href);
        return (
          <Link
            key={link.label}
            href={link.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              flex: 1,
              padding: "6px 0 2px",
              textDecoration: "none",
              color: active ? GOLD : "var(--ink-light)",
              borderTop: active
                ? `2px solid ${GOLD}`
                : "2px solid transparent",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {TAB_ICONS[link.label]}
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: active ? 600 : 400,
                letterSpacing: "0.02em",
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
