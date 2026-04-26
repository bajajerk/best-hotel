"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* ────────────────────────────────────────────────────────────
   Voyagr Club — Right-side cabinet drawer (redesign-v2)
   Keeps the structural skeleton from the previous MobileNav:
   portal, ESC handler, swipe-right-to-close, focus trap, body
   scroll lock. Re-skins the visual surface to dark/gold per
   the voyagr-club-redesign reference.
   ──────────────────────────────────────────────────────────── */

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  subtext?: string;
};

const Icons = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  star: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  trendingDown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </svg>
  ),
  luggage: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 20h0a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h0" />
      <path d="M8 18V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14" />
      <path d="M10 20h4" />
    </svg>
  ),
  user: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  key: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21 2-9.6 9.6" />
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-3 3" />
      <path d="m18 5-3 3" />
    </svg>
  ),
  building: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="9" y2="6.01" />
      <line x1="15" y1="6" x2="15" y2="6.01" />
      <line x1="9" y1="10" x2="9" y2="10.01" />
      <line x1="15" y1="10" x2="15" y2="10.01" />
      <line x1="9" y1="14" x2="9" y2="14.01" />
      <line x1="15" y1="14" x2="15" y2="14.01" />
      <path d="M9 22v-4h6v4" />
    </svg>
  ),
  mapPin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  tag: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  message: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  menu: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
};

const PRIMARY_LINKS: NavItem[] = [
  { label: "Home", href: "/", icon: Icons.home },
  { label: "Search", href: "/search", icon: Icons.search, badge: "BROWSE" },
  { label: "Preferred Rates", href: "/preferred-rates", icon: Icons.star, badge: "VOYAGR CLUB" },
  {
    label: "Price Match",
    href: "/match-my-rates",
    icon: Icons.trendingDown,
    subtext: "See if we can beat your current hotel price",
  },
  { label: "My Trips", href: "/booking-history", icon: Icons.luggage },
  { label: "Profile", href: "/profile", icon: Icons.user },
];

const DISCOVER_LINKS: NavItem[] = [
  { label: "Featured Properties", href: "/preferred-properties", icon: Icons.building },
  { label: "Explore Cities", href: "/search", icon: Icons.mapPin },
  { label: "Offers", href: "/preferred-rates", icon: Icons.tag },
];

const FOOTER_LINKS = [
  { label: "Contact Us", href: "mailto:hello@voyagr.com" },
  { label: "Terms & Policies", href: "/terms" },
];

const WHATSAPP_URL =
  "https://wa.me/919833534627?text=Hi%20Voyagr%2C%20I%27d%20like%20to%20speak%20with%20a%20concierge";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  /* Swipe-right-to-close handlers (vertical scroll + taps still work). */
  function onTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartXRef.current == null) return;
    const delta = e.touches[0].clientX - touchStartXRef.current;
    setDragOffset(delta > 0 ? delta : 0);
  }
  function onTouchEnd() {
    if (dragOffset > 60) setOpen(false);
    setDragOffset(0);
    touchStartXRef.current = null;
  }

  function handleSignOut() {
    signOut();
    setOpen(false);
    router.push("/");
  }

  useEffect(() => {
    setMounted(true);
  }, []);

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

  /* Focus trap: move focus into drawer when opened */
  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [open]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const drawer = mounted
    ? createPortal(
        <>
          {/* ── Backdrop ── */}
          <div
            onClick={() => setOpen(false)}
            aria-hidden={!open}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "rgba(10, 10, 10, 0.78)",
              backdropFilter: open ? "blur(6px)" : "none",
              WebkitBackdropFilter: open ? "blur(6px)" : "none",
              opacity: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
              transition: open
                ? "opacity 0.28s ease-out, backdrop-filter 0.28s ease-out"
                : "opacity 0.22s ease-in",
            }}
          />

          {/* ── Right-side cabinet drawer ── */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "100%",
              maxWidth: 450,
              height: "100vh",
              zIndex: 10001,
              background: "var(--color-black-rich)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.05)",
              transform: open
                ? `translateX(${dragOffset}px)`
                : "translateX(100%)",
              transition: dragOffset > 0
                ? "none"
                : open
                  ? "transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)"
                  : "transform 0.24s ease-in",
              pointerEvents: open ? "auto" : "none",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              outline: "none",
              boxShadow: "-20px 0 40px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* ── Header bar with VOYAGR lockup + close ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "32px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  gap: 8,
                }}
              >
                <span
                  className="luxury-text-gradient"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: 22,
                    letterSpacing: "-0.02em",
                    lineHeight: 1,
                  }}
                >
                  VOYAGR
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: "0.5em",
                    color: "var(--color-gold)",
                    textTransform: "uppercase",
                  }}
                >
                  Club
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 9999,
                  background: "transparent",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                  color: "var(--color-white-40)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--color-white-soft)";
                  e.currentTarget.style.borderColor = "var(--color-gold)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--color-white-40)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.10)";
                }}
              >
                {Icons.close}
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              className="no-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "32px 36px 24px",
              }}
            >
              {/* Welcome back section */}
              <DrawerSection title={user ? "Welcome back" : "Welcome"}>
                {PRIMARY_LINKS.map((item) => (
                  <DrawerItem
                    key={item.label}
                    item={item}
                    active={isActive(item.href)}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
                {user ? (
                  <DrawerActionRow
                    label="Sign Out"
                    icon={Icons.key}
                    onClick={handleSignOut}
                  />
                ) : (
                  <DrawerItem
                    item={{ label: "Sign In", href: "/login", icon: Icons.key }}
                    active={isActive("/login")}
                    onNavigate={() => setOpen(false)}
                  />
                )}
              </DrawerSection>

              {/* Discover section */}
              <DrawerSection title="Discover">
                {DISCOVER_LINKS.map((item) => (
                  <DrawerItem
                    key={item.label}
                    item={item}
                    active={false}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </DrawerSection>

              {/* Help & Support section */}
              <DrawerSection title="Help & Support">
                {FOOTER_LINKS.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "block",
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontWeight: 400,
                      fontSize: 16,
                      color: "var(--color-white-50)",
                      textDecoration: "none",
                      padding: "10px 0",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-white-soft)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-white-50)";
                    }}
                  >
                    {link.label}
                  </Link>
                ))}
              </DrawerSection>

              {/* Concierge CTA */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="gold-glow"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  width: "100%",
                  marginTop: 32,
                  padding: "20px",
                  background: "var(--color-gold)",
                  color: "var(--color-black-rich)",
                  borderRadius: 16,
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 10,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-white-soft)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-gold)";
                }}
              >
                {Icons.message}
                <span>Concierge Access</span>
              </a>
            </div>

            {/* ── Footer ribbon ── */}
            <div
              style={{
                padding: "24px 32px",
                borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                display: "flex",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  fontSize: 9,
                  letterSpacing: "0.6em",
                  textTransform: "uppercase",
                  color: "var(--color-white-20)",
                }}
              >
                VOYAGR.CLUB
              </span>
            </div>
          </div>
        </>,
        document.body
      )
    : null;

  return (
    <>
      {/* ── Hamburger trigger (rendered inline by Header) ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        style={{
          width: 36,
          height: 36,
          borderRadius: 9999,
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          color: "var(--color-white-soft)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          flexShrink: 0,
          transition: "border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-gold)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
        }}
      >
        {Icons.menu}
      </button>
      {drawer}
    </>
  );
}

/* ── Drawer composition helpers ───────────────────────────────────── */

function DrawerSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 40 }}>
      <span
        style={{
          display: "block",
          fontFamily: "var(--font-body)",
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          color: "rgba(212, 175, 55, 0.6)",
          paddingBottom: 12,
          borderBottom: "1px solid rgba(212, 175, 55, 0.1)",
          marginBottom: 20,
        }}
      >
        {title}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </section>
  );
}

function DrawerItem({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        textDecoration: "none",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          color: active ? "var(--color-gold)" : "var(--color-white-30)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "color 0.2s, border-color 0.2s",
        }}
      >
        {item.icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <span
            className="serif-italic"
            style={{
              fontSize: 17,
              color: active ? "var(--color-white-soft)" : "var(--color-white-60)",
              transition: "color 0.2s",
            }}
          >
            {item.label}
          </span>
          {item.badge ? (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 8,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(212, 175, 55, 0.7)",
                background: "rgba(212, 175, 55, 0.05)",
                border: "1px solid rgba(212, 175, 55, 0.1)",
                borderRadius: 9999,
                padding: "4px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {item.badge}
            </span>
          ) : null}
        </span>
        {item.subtext ? (
          <span
            style={{
              display: "block",
              marginTop: 4,
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: 11,
              color: "var(--color-white-30)",
              lineHeight: 1.5,
            }}
          >
            {item.subtext}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function DrawerActionRow({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 18,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          color: "var(--color-white-30)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "color 0.2s",
        }}
      >
        {icon}
      </span>
      <span
        className="serif-italic"
        style={{
          fontSize: 17,
          color: "var(--color-white-60)",
          transition: "color 0.2s",
        }}
      >
        {label}
      </span>
    </button>
  );
}
