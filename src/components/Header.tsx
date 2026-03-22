"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "./MobileNav";

const NAV_LINKS = [
  { label: "HOME", href: "/" },
  { label: "SEARCH", href: "/search" },
  { label: "DESTINATIONS", href: "/locations" },
  { label: "HOW IT WORKS", href: "/#how-it-works" },
  { label: "PREFERRED RATES", href: "/#the-proof" },
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
      <Link href="/" style={{ textDecoration: "none" }}>
        <span
          className="type-logo"
          style={{ letterSpacing: "0.08em", color: "var(--ink)" }}
        >
          <span style={{ color: "var(--gold)" }}>V</span>oyagr Club
        </span>
      </Link>

      {/* Desktop nav links + actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div className="header-nav-links">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
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

        {/* WhatsApp CTA button (desktop only) */}
        <a
          href="https://wa.me/919876543210?text=Hi%20Voyagr%2C%20I%27d%20like%20to%20book%20a%20hotel"
          target="_blank"
          rel="noopener noreferrer"
          className="header-cta-btn"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "var(--ink)",
            color: "var(--cream)",
            border: "none",
            padding: "9px 20px",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            cursor: "pointer",
            transition: "background 0.2s",
            fontFamily: "var(--font-body)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "var(--gold)";
            (e.currentTarget as HTMLAnchorElement).style.color = "var(--ink)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background =
              "var(--ink)";
            (e.currentTarget as HTMLAnchorElement).style.color =
              "var(--cream)";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Book Now
        </a>

        {/* Mobile hamburger menu */}
        <MobileNav
          links={[
            { label: "Home", href: "/" },
            { label: "Search", href: "/search" },
            { label: "Destinations", href: "/locations" },
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Preferred Rates", href: "/#the-proof" },
            { label: "WhatsApp", href: "https://wa.me/919876543210" },
          ]}
        />
      </div>
    </nav>
  );
}
