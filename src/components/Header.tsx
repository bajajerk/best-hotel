"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";

export const NAV_LINKS = [
  { label: "Search", href: "/search" },
  { label: "Preferred Rates", href: "/preferred-rates" },
  { label: "Rate Check", href: "/match-my-rates" },
  { label: "My Trips", href: "/booking-history" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled
            ? "rgba(245, 240, 232, 0.96)"
            : "rgba(245, 240, 232, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--cream-border)",
          height: "60px",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
          boxShadow: scrolled
            ? "0 2px 20px rgba(26, 23, 16, 0.06)"
            : "none",
        }}
      >
        {/* Left: Wordmark — italic serif uppercase */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "20px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink)",
            }}
          >
            <span style={{ color: "var(--gold)" }}>V</span>oyagr Club
          </span>
        </Link>

        {/* Centre: Nav links (hidden on mobile <640px) */}
        <div className="header-nav-links">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "15px",
                  letterSpacing: "0.03em",
                  color: active ? "var(--gold)" : "var(--ink-mid)",
                  textDecoration: "none",
                  paddingBottom: "4px",
                  borderBottom: active
                    ? "2px solid var(--gold)"
                    : "2px solid transparent",
                  transition: "color 0.2s, border-color 0.2s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.target as HTMLAnchorElement).style.color = "var(--gold)";
                    (e.target as HTMLAnchorElement).style.borderBottomColor =
                      "var(--gold)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.target as HTMLAnchorElement).style.color =
                      "var(--ink-mid)";
                    (e.target as HTMLAnchorElement).style.borderBottomColor =
                      "transparent";
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Avatar + Hamburger */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginLeft: "auto",
            flexShrink: 0,
          }}
        >
          {/* Member avatar initials */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--gold-pale)",
              border: "1.5px solid var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "13px",
              letterSpacing: "0.04em",
              color: "var(--gold)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            VC
          </div>

          {/* Hamburger / Drawer toggle */}
          <MobileNav />
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
              color: active ? "var(--gold)" : "var(--ink-light)",
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
