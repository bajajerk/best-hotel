"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";

/* ────────────────────────────────────────────────────────────
   Voyagr.Club — Sticky Navigation Bar + Hotels Mega-Menu
   ──────────────────────────────────────────────────────────── */

const GOLD = "#B8960C";
const NAVY = "#0D1B2A";

export const NAV_LINKS = [
  { label: "Search", href: "/search" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Rate Check", href: "/match-my-rates" },
  { label: "My Trips", href: "/booking-history" },
];

/* ── Mega-menu column data ── */
const MEGA_COLUMNS = [
  {
    title: "By Region",
    links: [
      { label: "Southeast Asia", href: "/search?region=southeast-asia" },
      { label: "Europe", href: "/search?region=europe" },
      { label: "Middle East", href: "/search?region=middle-east" },
      { label: "Americas", href: "/search?region=americas" },
      { label: "Africa & Islands", href: "/search?region=africa" },
    ],
  },
  {
    title: "By Type",
    links: [
      { label: "Luxury & 5-Star", href: "/search?type=luxury" },
      { label: "Boutique Hotels", href: "/search?type=boutique" },
      { label: "Beach Resorts", href: "/search?type=beach" },
      { label: "City Hotels", href: "/search?type=city" },
      { label: "Villas & Retreats", href: "/search?type=villa" },
    ],
  },
  {
    title: "Popular Cities",
    links: [
      { label: "Bangkok", href: "/city/bangkok" },
      { label: "Dubai", href: "/city/dubai" },
      { label: "Bali", href: "/city/bali" },
      { label: "Paris", href: "/city/paris" },
      { label: "Singapore", href: "/city/singapore" },
    ],
  },
  {
    title: "Deals & Collections",
    links: [
      { label: "This Week's Top Deals", href: "/search?sort=deal" },
      { label: "New Arrivals", href: "/search?sort=new" },
      { label: "Preferred Rate Hotels", href: "/preferred-rates" },
      { label: "Last-Minute Escapes", href: "/search?sort=lastminute" },
      { label: "View All Hotels", href: "/search" },
    ],
  },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const megaTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close mega-menu on route change */
  useEffect(() => {
    setMegaOpen(false);
  }, [pathname]);

  /* Close mega-menu on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMegaOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function openMega() {
    if (megaTimeout.current) clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  }

  function closeMega() {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 200);
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const navBg = scrolled
    ? `rgba(13, 27, 42, 0.95)`
    : "transparent";

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
          background: navBg,
          backdropFilter: scrolled ? "blur(10px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
          transition:
            "background 0.3s ease, backdrop-filter 0.3s ease, padding 0.3s ease",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.06)"
            : "1px solid transparent",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: "1400px",
            margin: "0 auto",
            height: "48px",
          }}
        >
          {/* ── Left: Logo ── */}
          <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "20px",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#ffffff",
                transition: "color 0.3s",
              }}
            >
              Voyagr
              <span style={{ color: GOLD }}>.</span>
              Club
            </span>
          </Link>

          {/* ── Centre: Desktop nav links (hidden <768px) ── */}
          <div className="header-nav-center">
            {/* Hotels — mega-menu trigger */}
            <div
              onMouseEnter={openMega}
              onMouseLeave={closeMega}
              style={{ position: "relative" }}
            >
              <button
                onClick={() => setMegaOpen((v) => !v)}
                aria-expanded={megaOpen}
                aria-haspopup="true"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: "12px",
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: GOLD,
                  padding: "8px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "opacity 0.2s",
                }}
              >
                Hotels
                <svg
                  width="10"
                  height="6"
                  viewBox="0 0 10 6"
                  fill="none"
                  style={{
                    transition: "transform 0.25s",
                    transform: megaOpen ? "rotate(180deg)" : "rotate(0)",
                  }}
                >
                  <path
                    d="M1 1L5 5L9 1"
                    stroke={GOLD}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <Link
              href="/match-my-rates"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: "12px",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: GOLD,
                textDecoration: "none",
                padding: "8px 0",
                transition: "opacity 0.2s",
              }}
            >
              Rate Challenge
            </Link>

            <Link
              href="/#how-it-works"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: "12px",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: GOLD,
                textDecoration: "none",
                padding: "8px 0",
                transition: "opacity 0.2s",
              }}
            >
              How It Works
            </Link>
          </div>

          {/* ── Right: Join CTA + Avatar + Hamburger ── */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              marginLeft: "auto",
              flexShrink: 0,
            }}
          >
            {/* Join button — desktop only */}
            <Link
              href="/preferred-rates"
              className="header-join-btn"
              style={{
                background: GOLD,
                color: NAVY,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "12px",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                textDecoration: "none",
                padding: "8px 22px",
                borderRadius: "2px",
                transition: "background 0.2s, color 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              Join
            </Link>

            {/* Hamburger / Drawer toggle */}
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* ── Mega-menu overlay (full-width, below nav) ── */}
      <div
        onMouseEnter={openMega}
        onMouseLeave={closeMega}
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          zIndex: 99,
          background: NAVY,
          borderTop: `1px solid rgba(184, 150, 12, 0.15)`,
          opacity: megaOpen ? 1 : 0,
          transform: megaOpen ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: megaOpen ? "auto" : "none",
          transition:
            "opacity 0.25s ease, transform 0.25s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "40px",
            padding: "36px 40px 40px",
          }}
        >
          {MEGA_COLUMNS.map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: GOLD,
                  marginBottom: "16px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid rgba(184, 150, 12, 0.2)",
                }}
              >
                {col.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setMegaOpen(false)}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        fontWeight: 400,
                        color: "rgba(255, 255, 255, 0.75)",
                        textDecoration: "none",
                        transition: "color 0.2s",
                        display: "block",
                        padding: "2px 0",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLAnchorElement).style.color = "#ffffff";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLAnchorElement).style.color =
                          "rgba(255, 255, 255, 0.75)";
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Click-away backdrop for mega-menu ── */}
      {megaOpen && (
        <div
          onClick={() => setMegaOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 98,
            background: "rgba(0,0,0,0.3)",
          }}
        />
      )}

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
  "Rate Check": (
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
              transition: "color 0.2s",
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
