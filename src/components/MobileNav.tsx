"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    title: "Explore",
    items: [
      {
        label: "The Lobby",
        href: "/",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        label: "Search Hotels",
        href: "/search",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ),
      },
      {
        label: "Preferred Rates",
        href: "/preferred-rates",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
          </svg>
        ),
      },
      {
        label: "Match My Rates",
        href: "/match-my-rates",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        label: "Compare Hotels",
        href: "/compare",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        label: "Profile",
        href: "/profile",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
      },
      {
        label: "Booking History",
        href: "/booking-history",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Support",
    items: [
      {
        label: "Book via WhatsApp",
        href: "https://wa.me/919876543210?text=Hi%20Voyagr%2C%20I%27d%20like%20to%20book%20a%20hotel",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        ),
      },
    ],
  },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

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
            width: "22px",
            height: "16px",
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
              height: "2px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              top: open ? "7px" : "0",
              transform: open ? "rotate(45deg)" : "none",
            }}
          />
          {/* Middle bar */}
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: open ? 0 : "4px",
              height: "2px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              top: "7px",
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
              height: "2px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              top: open ? "7px" : "14px",
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

      {/* Full-height slide-in panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(320px, 85vw)",
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
        {/* Panel header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--cream-border)",
            minHeight: "60px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "0.02em",
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

        {/* Menu sections */}
        <div style={{ flex: 1, padding: "8px 0" }}>
          {MENU_SECTIONS.map((section, sIdx) => (
            <div key={section.title}>
              {/* Section divider (not before first section) */}
              {sIdx > 0 && (
                <div
                  style={{
                    height: "1px",
                    background: "var(--cream-border)",
                    margin: "4px 20px",
                  }}
                />
              )}

              {/* Section title */}
              <div
                style={{
                  padding: "16px 20px 8px",
                  fontFamily: "var(--font-body)",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--ink-light)",
                }}
              >
                {section.title}
              </div>

              {/* Section items */}
              {section.items.map((item) => {
                const active = !item.href.startsWith("http") && isActive(item.href);
                const isExternal =
                  item.href.startsWith("http") || item.href.startsWith("tel:");
                const Tag = isExternal ? "a" : Link;
                const extraProps = isExternal
                  ? { target: "_blank" as const, rel: "noopener noreferrer" }
                  : {};

                return (
                  <Tag
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    {...(extraProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 20px",
                      fontFamily: "var(--font-body)",
                      fontSize: "14px",
                      fontWeight: 500,
                      letterSpacing: "0.03em",
                      color: active ? "var(--gold)" : "var(--ink)",
                      textDecoration: "none",
                      background: active ? "var(--gold-pale)" : "transparent",
                      borderLeft: active
                        ? "3px solid var(--gold)"
                        : "3px solid transparent",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: active
                          ? "rgba(184, 149, 90, 0.15)"
                          : "var(--cream-deep)",
                        color: active ? "var(--gold)" : "var(--ink-mid)",
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                    {isExternal && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ marginLeft: "auto", opacity: 0.4 }}
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    )}
                  </Tag>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          style={{
            padding: "16px 20px 24px",
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Join Waitlist
          </button>
        </div>
      </div>
    </>
  );
}
