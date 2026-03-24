"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./Header";

/* Primary nav links shown in large serif inside drawer */
const DRAWER_NAV = NAV_LINKS;

/* Secondary account links */
const ACCOUNT_LINKS = [
  { label: "Profile", href: "/profile" },
  { label: "About Us", href: "/about" },
  { label: "Book via WhatsApp", href: "https://wa.me/919876543210?text=Hi%20Voyagr%2C%20I%27d%20like%20to%20book%20a%20hotel", external: true },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Hamburger button — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          zIndex: 200,
          position: "relative",
        }}
      >
        <div style={{ width: "20px", height: "14px", position: "relative" }}>
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              top: open ? "6px" : "0",
              transform: open ? "rotate(45deg)" : "none",
            }}
          />
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              top: "6px",
              opacity: open ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              top: open ? "6px" : "12px",
              transform: open ? "rotate(-45deg)" : "none",
            }}
          />
        </div>
      </button>

      {/* Overlay backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 149,
          background: "rgba(26, 23, 16, 0.5)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Slide-in drawer (from right, 320px wide) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "320px",
          maxWidth: "85vw",
          zIndex: 150,
          background: "var(--cream)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderBottom: "1px solid var(--cream-border)",
            minHeight: "60px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "18px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink)",
            }}
          >
            <span style={{ color: "var(--gold)" }}>V</span>oyagr Club
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--ink)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Primary nav — large serif display type */}
        <div style={{ padding: "24px 24px 16px" }}>
          {DRAWER_NAV.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontSize: "26px",
                  fontWeight: 400,
                  letterSpacing: "0.02em",
                  color: active ? "var(--gold)" : "var(--ink)",
                  textDecoration: "none",
                  padding: "14px 0",
                  borderBottom: "1px solid var(--cream-border)",
                  transition: "color 0.2s",
                }}
              >
                {link.label}
                {active && (
                  <span
                    style={{
                      display: "inline-block",
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "var(--gold)",
                      marginLeft: "10px",
                      verticalAlign: "middle",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Secondary account links */}
        <div style={{ padding: "8px 24px", flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--ink-light)",
              marginBottom: "12px",
            }}
          >
            Account
          </div>
          {ACCOUNT_LINKS.map((link) => {
            const isExternal = link.external;
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
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: "var(--ink-mid)",
                  textDecoration: "none",
                  padding: "10px 0",
                  transition: "color 0.2s",
                }}
              >
                {link.label}
                {isExternal && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                )}
              </Tag>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            padding: "16px 24px 24px",
            borderTop: "1px solid var(--cream-border)",
          }}
        >
          <button
            onClick={() => {
              setOpen(false);
              window.location.hash = "waitlist";
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px 24px",
              background: "var(--ink)",
              color: "var(--cream)",
              border: "none",
              borderRadius: "4px",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </>
  );
}
