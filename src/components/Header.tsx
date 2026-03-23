"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";

const NAV_LINKS = [
  { label: "DESTINATIONS", href: "/#destinations" },
  { label: "TOP DEALS", href: "/#top-deals" },
  { label: "SEASONAL TRIPS", href: "/#seasonal-trips" },
  { label: "CURATED COLLECTIONS", href: "/#curated-collections" },
  { label: "HOW IT WORKS", href: "/#how-it-works" },
  { label: "JOIN CLUB", href: "/#join-club" },
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
    if (href.startsWith("/#")) return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav
      className={`site-header${scrolled ? " site-header--scrolled" : ""}`}
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
        justifyContent: "space-between",
        padding: "0 24px",
        transition: "background 0.3s ease, box-shadow 0.3s ease",
        boxShadow: scrolled
          ? "0 2px 20px rgba(26, 23, 16, 0.06)"
          : "none",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
        <span
          className="type-logo"
          style={{ letterSpacing: "0.08em", color: "var(--ink)" }}
        >
          <span style={{ color: "var(--gold)" }}>V</span>oyagr Club
        </span>
      </Link>

      {/* Desktop nav links + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div className="header-nav-links">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <a
                key={link.label}
                href={link.href}
                className="type-nav"
                style={{
                  color: active ? "var(--gold)" : "var(--ink-mid)",
                  textDecoration: "none",
                  paddingBottom: "2px",
                  borderBottom: active
                    ? "1.5px solid var(--gold)"
                    : "1.5px solid transparent",
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
              </a>
            );
          })}
        </div>

        {/* Account icon (desktop) */}
        <Link
          href="/profile"
          className="header-account-btn"
          aria-label="Account"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: pathname === "/profile" ? "var(--gold-pale)" : "var(--cream-deep)",
            color: pathname === "/profile" ? "var(--gold)" : "var(--ink-mid)",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--gold-pale)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--gold)";
          }}
          onMouseLeave={(e) => {
            if (pathname !== "/profile") {
              (e.currentTarget as HTMLAnchorElement).style.background = "var(--cream-deep)";
              (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink-mid)";
            }
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </Link>

        {/* Mobile hamburger menu */}
        <MobileNav />
      </div>
    </nav>
  );
}
