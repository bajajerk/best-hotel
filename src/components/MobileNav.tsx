"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NavLink {
  label: string;
  href: string;
}

interface MobileNavProps {
  links: NavLink[];
  menuLinks?: NavLink[];
}

export default function MobileNav({ links, menuLinks }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when menu is open
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

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const allLinks = menuLinks ? [...links, ...menuLinks] : links;

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        className="mobile-nav-toggle"
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
        <div
          style={{
            width: "20px",
            height: "14px",
            position: "relative",
          }}
        >
          {/* Top bar */}
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s ease",
              top: open ? "6px" : "0",
              transform: open ? "rotate(45deg)" : "none",
            }}
          />
          {/* Middle bar */}
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s ease",
              top: "6px",
              opacity: open ? 0 : 1,
            }}
          />
          {/* Bottom bar */}
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s ease",
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
          background: "rgba(26, 23, 16, 0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Slide-down drawer */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          zIndex: 150,
          background: "rgba(245, 240, 232, 0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--cream-border)",
          transform: open ? "translateY(0)" : "translateY(-100%)",
          opacity: open ? 1 : 0,
          transition: "transform 0.3s ease, opacity 0.25s ease",
          pointerEvents: open ? "auto" : "none",
          padding: "16px 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {allLinks.map((link, index) => {
          const isExternal =
            link.href.startsWith("http") || link.href.startsWith("tel:");
          const Tag = isExternal ? "a" : Link;
          const extraProps = isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {};

          const showSeparator =
            menuLinks && index === links.length;

          return (
            <div key={link.label}>
              {showSeparator && (
                <div
                  style={{
                    height: "1px",
                    background: "var(--gold-pale)",
                    margin: "8px 0 4px",
                  }}
                />
              )}
              <Tag
                href={link.href}
                onClick={() => setOpen(false)}
                {...(extraProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 0",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--cream-border)",
                  transition: "color 0.2s",
                }}
              >
                {link.label === "Profile" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
                {link.label === "Booking History" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                )}
                {link.label}
              </Tag>
            </div>
          );
        })}

        {/* Join Waitlist button */}
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
            marginTop: "12px",
            padding: "14px 24px",
            background: "var(--ink)",
            color: "var(--cream)",
            border: "none",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "background 0.2s",
            width: "100%",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Join Waitlist
        </button>
      </div>
    </>
  );
}
