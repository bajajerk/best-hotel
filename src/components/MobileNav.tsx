"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* ────────────────────────────────────────────────────────────
   Voyagr Club — Members' drawer (luxe redesign)

   Spec: solid --luxe-black-2 surface, champagne foil-edge on the
   left rail (mirrors the /login card's top edge), Playfair italic
   nav rows, hairline dividers, sticky champagne bottom CTA.
   The portal is wrapped in `<div className="luxe" style={{display:"contents"}}>`
   so design tokens cascade in even though the portal target is
   document.body (which sits OUTSIDE any page-level .luxe scope).
   ──────────────────────────────────────────────────────────── */

const PRIMARY_LINKS: {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  subtext?: string;
}[] = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Search", href: "/search", icon: "search", badge: "BROWSE" },
  { label: "Flights", href: "/flights", icon: "flight" },
  {
    label: "Preferred Rates",
    href: "/preferred-rates",
    icon: "star",
    badge: "VOYAGR CLUB",
  },
  {
    label: "Price Match",
    href: "/match-my-rates",
    icon: "trending_down",
    subtext: "See if we can beat your current hotel price",
  },
  { label: "My Trips", href: "/booking-history", icon: "luggage" },
  { label: "Profile", href: "/profile", icon: "person" },
];

const SECONDARY_LINKS = [
  { label: "Preferred Properties", href: "/preferred-properties", icon: "apartment" },
  { label: "Preferred Rates", href: "/preferred-rates", icon: "local_offer" },
];

const BOTTOM_LINKS = [
  { label: "About", href: "/about" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms" },
];

const WHATSAPP_URL =
  "https://wa.me/919876543210?text=Hi%20Voyagr%2C%20I%27d%20like%20to%20speak%20with%20a%20concierge";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  /* Swipe-right-to-close handlers on the drawer itself.
     Only tracks rightward motion so vertical scrolling and taps still work. */
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

  /* "See Member Rates →" CTA — auth-aware destination.
     Logged out + on homepage → smooth-scroll to the hero search bar.
     Logged out elsewhere → /search. Logged in → /search directly. */
  function handleSeeMemberRates(e: React.MouseEvent) {
    e.preventDefault();
    setOpen(false);
    if (!user && pathname === "/") {
      setTimeout(() => {
        const target = document.getElementById("hero-search");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          router.push("/search");
        }
      }, 250);
      return;
    }
    router.push("/search");
  }

  /* Portal requires client-side mount */
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

  /* Initials for the signed-in member chip — first letters of given+family
     name; fall back to the email's leading char. Stays at 2 letters max so
     the square chip never wraps. */
  const initials = (() => {
    const name = user?.displayName?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      const first = parts[0]?.[0] ?? "";
      const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
      return (first + last).toUpperCase().slice(0, 2);
    }
    const email = user?.email?.trim();
    if (email) return email[0].toUpperCase();
    return "VC";
  })();

  const overlay = mounted
    ? createPortal(
        <div className="luxe" style={{ display: "contents" }}>
          {/* ── Backdrop scrim — opaque warm-black + 8px blur. The page
                behind needs to recede, not just dim. ── */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10000,
              background: "var(--luxe-scrim)",
              backdropFilter: "blur(8px) saturate(110%)",
              WebkitBackdropFilter: "blur(8px) saturate(110%)",
              opacity: open ? 1 : 0,
              pointerEvents: open ? "auto" : "none",
              transition: open
                ? "opacity 240ms cubic-bezier(0.2, 0.8, 0.2, 1)"
                : "opacity 200ms cubic-bezier(0.4, 0, 1, 1)",
            }}
          />

          {/* ── Drawer surface — solid --luxe-black-2 with a champagne
                foil-edge inset on the left rail. Width clamps wider than v1
                (Playfair italic nav rows need the room). ── */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            className={`mobile-menu${open ? " open" : ""}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "min(86vw, 360px)",
              height: "100dvh",
              zIndex: 10001,
              background: "var(--luxe-black-2)",
              borderLeft: "1px solid var(--luxe-hairline-strong)",
              // Champagne foil hairline inset 1px from the left edge —
              // the single signature element shared with /login card top.
              boxShadow: open
                ? [
                    "inset 1px 0 0 var(--luxe-champagne-line)",
                    "-24px 0 60px -20px rgba(0,0,0,0.6)",
                  ].join(", ")
                : "inset 1px 0 0 var(--luxe-champagne-line)",
              transform: open
                ? `translateX(${dragOffset}px)`
                : "translateX(100%)",
              transition: dragOffset > 0
                ? "none"
                : open
                ? "transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 320ms cubic-bezier(0.2, 0.8, 0.2, 1)"
                : "transform 220ms cubic-bezier(0.4, 0, 1, 1)",
              pointerEvents: open ? "auto" : "none",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              outline: "none",
            }}
          >
            {/* ═══════════════════════════════════════════
                Header — solid surface, no gradient (the v1 cream→white
                gradient was the source of the milky look). Differs by
                auth state per the design spec.
                ═══════════════════════════════════════════ */}
            <div
              style={{
                padding: "28px 24px 24px",
                background: "var(--luxe-black-2)",
                borderBottom: "1px solid var(--luxe-hairline)",
              }}
            >
              {/* Close button — 36px round, hairline border, champagne on hover (CSS) */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="luxe-drawer-close"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    background: "transparent",
                    border: "1px solid var(--luxe-hairline-strong)",
                    borderRadius: "50%",
                    cursor: "pointer",
                    padding: 0,
                    color: "var(--luxe-soft-white-70)",
                    transition: "border-color 180ms ease-out, color 180ms ease-out",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {user ? (
                /* Signed-in: square champagne chip with initials + member eyebrow + name */
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 2,
                      background: "var(--luxe-champagne-soft)",
                      border: "1px solid var(--luxe-champagne-line)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      letterSpacing: "0.06em",
                      color: "var(--luxe-champagne)",
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: "0.4em",
                        textTransform: "uppercase",
                        color: "var(--luxe-champagne)",
                      }}
                    >
                      MEMBER
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                        fontStyle: "italic",
                        fontSize: 18,
                        color: "var(--luxe-soft-white)",
                        lineHeight: 1.2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.displayName || user.email || "Member"}
                    </span>
                  </div>
                </div>
              ) : (
                /* Signed-out: brand wordmark + door eyebrow + outline Sign-in CTA */
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                      fontStyle: "italic",
                      fontSize: 24,
                      fontWeight: 400,
                      letterSpacing: "0.04em",
                      color: "var(--luxe-soft-white)",
                      lineHeight: 1.1,
                    }}
                  >
                    Voyagr
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 9,
                      fontWeight: 500,
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      color: "var(--luxe-champagne)",
                      marginTop: 6,
                    }}
                  >
                    MEMBERS&rsquo; DOOR
                  </div>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="luxe-drawer-signin"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: 44,
                      marginTop: 16,
                      border: "1px solid var(--luxe-champagne)",
                      background: "transparent",
                      color: "var(--luxe-champagne)",
                      fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      borderRadius: 2,
                      transition: "background 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                    }}
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════
                Primary nav — Playfair italic 19px rows, champagne
                hairline-rail active state.
                ═══════════════════════════════════════════ */}
            <nav style={{ padding: 0 }}>
              {PRIMARY_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`luxe-drawer-row${active ? " is-active" : ""}`}
                  >
                    <span
                      className="material-symbols-outlined luxe-drawer-icon"
                      aria-hidden="true"
                    >
                      {link.icon}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <span className="luxe-drawer-label">{link.label}</span>
                        {link.badge && <span className="luxe-drawer-badge">{link.badge}</span>}
                      </span>
                      {link.subtext && <span className="luxe-drawer-sub">{link.subtext}</span>}
                    </span>
                  </Link>
                );
              })}

              {user && (
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setOpen(false);
                  }}
                  className="luxe-drawer-row"
                >
                  <span
                    className="material-symbols-outlined luxe-drawer-icon"
                    aria-hidden="true"
                  >
                    logout
                  </span>
                  <span className="luxe-drawer-label">Sign Out</span>
                </button>
              )}
            </nav>

            {/* ═══════════════════════════════════════════
                Concierge strip — outline button, WhatsApp glyph keeps
                its native green (single permitted exception to the
                one-accent rule, brand recognition).
                ═══════════════════════════════════════════ */}
            <div
              style={{
                padding: "20px 24px",
                borderTop: "1px solid var(--luxe-hairline)",
                borderBottom: "1px solid var(--luxe-hairline)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "var(--luxe-champagne)",
                  marginBottom: 10,
                }}
              >
                CONCIERGE
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 17,
                  color: "var(--luxe-soft-white)",
                  marginBottom: 14,
                  lineHeight: 1.3,
                }}
              >
                Speak to a curator
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="luxe-drawer-concierge"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  height: 44,
                  border: "1px solid var(--luxe-champagne)",
                  background: "transparent",
                  color: "var(--luxe-champagne)",
                  fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 2,
                  transition: "background 200ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  style={{ flexShrink: 0, color: "#25d366" }}
                  aria-hidden
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Concierge
              </a>
            </div>

            {/* ═══════════════════════════════════════════
                Discover — secondary list, smaller rows
                ═══════════════════════════════════════════ */}
            <div>
              <div className="luxe-drawer-section-label">Discover</div>
              {SECONDARY_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="luxe-drawer-row luxe-drawer-row--small"
                >
                  <span
                    className="material-symbols-outlined luxe-drawer-icon"
                    aria-hidden="true"
                  >
                    {link.icon}
                  </span>
                  <span className="luxe-drawer-label">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* ── Spacer to push the footer down ── */}
            <div style={{ flex: 1, minHeight: 16 }} />

            {/* ═══════════════════════════════════════════
                Footer — legal inline-dot list + brand line
                ═══════════════════════════════════════════ */}
            <div
              style={{
                padding: "20px 24px 16px",
                borderTop: "1px solid var(--luxe-hairline)",
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
                {BOTTOM_LINKS.map((link, idx) => (
                  <span key={link.label} style={{ display: "inline-flex", alignItems: "center" }}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="luxe-drawer-legal"
                      style={{
                        fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--luxe-soft-white-50)",
                        textDecoration: "none",
                        padding: "4px 0",
                        transition: "color 180ms ease-out",
                      }}
                    >
                      {link.label}
                    </Link>
                    {idx < BOTTOM_LINKS.length - 1 && (
                      <span
                        aria-hidden
                        style={{
                          color: "var(--luxe-soft-white-30)",
                          padding: "0 10px",
                          fontSize: 11,
                        }}
                      >
                        ·
                      </span>
                    )}
                  </span>
                ))}
              </div>

              <div
                style={{
                  marginTop: 14,
                  fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: 13,
                  letterSpacing: "0.04em",
                  color: "var(--luxe-soft-white-30)",
                }}
              >
                Voyagr <span style={{ color: "var(--luxe-champagne)" }}>·</span> Club
              </div>
            </div>

            {/* ═══════════════════════════════════════════
                Sticky bottom CTA — solid champagne, fades the rows
                above behind it on scroll.
                ═══════════════════════════════════════════ */}
            <div
              style={{
                position: "sticky",
                bottom: 0,
                padding: "16px 20px 24px",
                background:
                  "linear-gradient(0deg, var(--luxe-black-2) 75%, transparent 100%)",
              }}
            >
              <Link
                href="/search"
                onClick={handleSeeMemberRates}
                className="luxe-drawer-cta"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  height: 52,
                  background: "var(--luxe-champagne)",
                  color: "var(--luxe-black)",
                  fontFamily: "var(--font-body), 'Manrope', system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  borderRadius: 2,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
                  transition: "filter 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                See Member Rates
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* ── Hamburger button (stays in header flow) ── */}
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
                background: "rgba(253,250,245,0.7)",
                borderRadius: "1px",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                top: open ? "6px" : `${top}px`,
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

      {/* Portal-rendered overlay + drawer */}
      {overlay}
    </>
  );
}
