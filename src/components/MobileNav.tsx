"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* Primary nav links with Material Symbol icon names */
const PRIMARY_LINKS = [
  { label: "Search", href: "/search", icon: "search" },
  { label: "Preferred Rates", href: "/preferred-rates", icon: "star" },
  { label: "Rate Check", href: "/match-my-rates", icon: "balance" },
  { label: "My Trips", href: "/booking-history", icon: "luggage" },
];

/* Secondary account links */
const SECONDARY_LINKS: { label: string; href: string; red?: boolean }[] = [
  { label: "My Profile", href: "/profile" },
  { label: "Membership", href: "/membership" },
  { label: "Concierge", href: "https://wa.me/919876543210?text=Hi%20Voyagr%2C%20I%27d%20like%20to%20book%20a%20hotel" },
  { label: "Sign Out", href: "/sign-out", red: true },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  return (
    <>
      {/* ── Hamburger button: 36px tap target ── */}
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
                top:
                  open
                    ? "6px"
                    : `${top}px`,
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

      {/* ── Overlay: 38% opacity dark ── */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 149,
          background: "rgba(0, 0, 0, 0.38)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* ── Drawer: 320px, white, 1px left border ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "320px",
          maxWidth: "85vw",
          zIndex: 150,
          background: "#ffffff",
          borderLeft: "1px solid var(--cream-border)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* ── Close ✕ top-right ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "16px 20px 0",
          }}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
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
              color: "var(--ink)",
              fontSize: "22px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Primary links: 22px Cormorant Garamond, amber icons ── */}
        <nav style={{ padding: "12px 24px 0" }}>
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 400,
                color: "var(--ink)",
                textDecoration: "none",
                padding: "16px 0",
                borderBottom: "1px solid var(--cream-border)",
                transition: "color 0.2s",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: "22px",
                  color: "var(--gold)",
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                {link.icon}
              </span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* ── Divider ── */}
        <div
          style={{
            margin: "16px 24px 0",
            borderTop: "1px solid var(--cream-border)",
          }}
        />

        {/* ── Secondary links: 10px uppercase tracking-wide ── */}
        <div style={{ padding: "16px 24px", flex: 1 }}>
          {SECONDARY_LINKS.map((link) => {
            const isExternal = link.href.startsWith("http");
            const Tag = isExternal ? "a" : Link;
            const extraProps = isExternal
              ? { target: "_blank" as const, rel: "noopener noreferrer" }
              : {};

            return (
              <Tag
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                {...(extraProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
                style={{
                  display: "block",
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase" as const,
                  color: link.red ? "#a3543a" : "var(--ink-mid)",
                  textDecoration: "none",
                  padding: "10px 0",
                  transition: "color 0.2s",
                }}
              >
                {link.label}
              </Tag>
            );
          })}
        </div>
      </div>
    </>
  );
}
