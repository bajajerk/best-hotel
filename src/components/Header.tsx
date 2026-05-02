"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import MobileNav from "./MobileNav";
import { useAuth } from "@/context/AuthContext";
import type { User } from "firebase/auth";

/* ────────────────────────────────────────────────────────────
   Voyagr.Club — Sticky Navigation Bar
   72px desktop · 60px mobile · var(--navy) solid
   ──────────────────────────────────────────────────────────── */

const GOLD = "var(--gold)";
const NAVY = "var(--navy)";
const IVORY = "var(--white)";

export const NAV_LINKS = [
  { label: "Hotels", href: "/search" },
  { label: "Flights", href: "/flights" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "My Trips", href: "/booking-history" },
];

/* Desktop nav links */
const DESKTOP_LINKS = [
  { label: "Hotels", href: "/search" },
  { label: "Flights", href: "/flights" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Price Match", href: "/match-my-rates" },
  { label: "Sign In", href: "/login" },
];

export default function Header() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const [joinHover, setJoinHover] = useState(false);
  const { user, loading, signOut } = useAuth();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const showMobileSignIn = !loading && !user;
  // While Firebase is hydrating, hold off rendering auth-dependent CTAs so the
  // header doesn't flash "Sign In / Join the Club" for ~200ms before swapping
  // to the account chip for an already-signed-in user.
  const showJoinCta = !loading && !user;
  const showAccountChip = !loading && !!user;

  // Filter the centre nav based on auth state. Logged-in users don't need a
  // "Sign In" link — they already are signed in.
  const desktopLinks = showAccountChip
    ? DESKTOP_LINKS.filter((l) => l.href !== "/login")
    : DESKTOP_LINKS;

  // Precision Luxury mode — pill-shaped floating nav with glass-morphism
  // and a Gold Glow CTA. Now that the whole site is dark luxe (home, city,
  // hotel, /book/*, /preferred-*, /about, etc.), precision mode is the
  // single brand-coherent header treatment across every route. The classic
  // navy bar fallback is retained as a code path but is no longer used.
  const precisionMode = true;

  // Shrinking Monolith: structured full-width bar → centered floating
  // pill after the first 48px of scroll.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!precisionMode) return;
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [precisionMode]);

  return (
    <>
      <nav
        ref={navRef}
        className={`voyagr-nav${precisionMode ? " precision-nav" : ""}${precisionMode && scrolled ? " is-shrunk" : ""}`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: precisionMode ? undefined : NAVY,
          borderBottom: precisionMode ? "none" : "1px solid rgba(201,168,76,0.1)",
        }}
      >
        <div
          className="voyagr-nav-inner"
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: precisionMode ? "1360px" : "1400px",
            margin: "0 auto",
            padding: precisionMode ? "0 28px" : undefined,
          }}
        >
          {/* ── Left: Logo ── */}
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "22px",
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
                fontSize: "22px",
                letterSpacing: "0.08em",
                color: GOLD,
              }}
            >
              CLUB
            </span>
          </Link>

          {/* ── Centre: Desktop nav links (hidden <768px) ── */}
          <div className="header-nav-center">
            {desktopLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`header-nav-link${isActive(link.href) ? " is-active" : ""}`}
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: "12px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: IVORY,
                  textDecoration: "none",
                  padding: "8px 0",
                  borderBottom: isActive(link.href)
                    ? `2px solid ${GOLD}`
                    : "2px solid transparent",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.25s, border-color 0.25s",
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
            {/* "Join the Club" button — desktop only, logged-out users.
                Precision mode upgrades to a Gold Glow pill. */}
            {showJoinCta && (
              <Link
                href="/login"
                className={`header-join-btn${precisionMode ? " precision-join-btn" : ""}`}
                onMouseEnter={() => setJoinHover(true)}
                onMouseLeave={() => setJoinHover(false)}
                style={
                  precisionMode
                    ? {
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "11px",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }
                    : {
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
                      }
                }
              >
                Join the Club
              </Link>
            )}

            {/* Account chip — desktop only, logged-in users. */}
            {showAccountChip && user && (
              <AccountChip user={user} signOut={signOut} />
            )}

            {/* Mobile-only compact Sign In — mirrors the desktop "Sign In"
                nav link, which is hidden below 768px. */}
            {showMobileSignIn && (
              <Link
                href="/login"
                className={`header-signin-mobile${precisionMode ? " precision-signin-pill" : ""}`}
                aria-label="Sign in"
                style={
                  precisionMode
                    ? {
                        color: IVORY,
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        fontSize: "11px",
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                      }
                    : {
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
                      }
                }
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
  Hotels: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Flights: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
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

/* ── Account chip + dropdown (desktop only, signed-in users) ─────────────
   A small avatar circle (initials) with a chevron. Click opens a menu with
   profile / trips / sign-out. Closes on click-outside, Esc, and route change.
   Hidden under 768px — the side drawer (MobileNav) covers mobile. */

function getInitials(user: User): string {
  const name = (user.displayName || "").trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  const email = (user.email || "").trim();
  if (email) return email[0].toUpperCase();
  return "VC";
}

function AccountChip({
  user,
  signOut,
}: {
  user: User;
  signOut: () => Promise<void>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  const initials = getInitials(user);
  const label = user.displayName || user.email || "Account";

  return (
    <div
      ref={wrapRef}
      className="header-account-chip-wrap"
      style={{ position: "relative", display: "none" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${label}`}
        className="header-account-chip"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 10px 4px 4px",
          background: "transparent",
          border: "1px solid rgba(201,168,76,0.45)",
          borderRadius: "999px",
          cursor: "pointer",
          color: IVORY,
          fontFamily: "var(--font-body)",
          fontWeight: 600,
          fontSize: "12px",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          transition: "border-color 0.25s, background 0.25s",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            borderRadius: "999px",
            background: GOLD,
            color: NAVY,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "13px",
            letterSpacing: "0.04em",
          }}
        >
          {initials}
        </span>
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            opacity: 0.85,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account menu"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            minWidth: "220px",
            background: NAVY,
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "10px",
            boxShadow: "0 18px 48px rgba(0,0,0,0.45)",
            padding: "8px",
            zIndex: 110,
            fontFamily: "var(--font-body)",
          }}
        >
          {/* Identity preview */}
          <div
            style={{
              padding: "8px 12px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              marginBottom: "6px",
              color: IVORY,
            }}
          >
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user.displayName || "Voyagr Member"}
            </div>
            {user.email && (
              <div
                style={{
                  fontSize: "11px",
                  opacity: 0.6,
                  marginTop: "2px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {user.email}
              </div>
            )}
          </div>

          <MenuLink href="/profile" label="My Profile" />
          <MenuLink href="/booking-history" label="My Trips" />

          <div
            role="separator"
            style={{
              height: "1px",
              background: "rgba(255,255,255,0.06)",
              margin: "6px 4px",
            }}
          />

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              background: "transparent",
              border: "none",
              borderRadius: "6px",
              color: IVORY,
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.02em",
              cursor: "pointer",
              transition: "background 0.18s, color 0.18s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(201,168,76,0.10)";
              (e.currentTarget as HTMLButtonElement).style.color = GOLD;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = IVORY;
            }}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      role="menuitem"
      style={{
        display: "block",
        padding: "10px 12px",
        borderRadius: "6px",
        color: IVORY,
        textDecoration: "none",
        fontSize: "13px",
        fontWeight: 500,
        letterSpacing: "0.02em",
        transition: "background 0.18s, color 0.18s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "rgba(201,168,76,0.10)";
        (e.currentTarget as HTMLAnchorElement).style.color = GOLD;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
        (e.currentTarget as HTMLAnchorElement).style.color = IVORY;
      }}
    >
      {label}
    </Link>
  );
}
