"use client";

// =============================================================================
//  HotelResultsView — unified hotel results section.
//
//  ONE component for /city/[slug] and /search:
//    • Header: "Hotels in {city}" + property count + Grid/List/Gallery toggle
//    • Filters: Stars (Any/4★+/5★) + Perks (Free cancel/Breakfast/Upgrade)
//      → URL-synced when `syncToUrl` is true (e.g. ?stars=5&perks=breakfast)
//    • Three view modes share the same hotel array — toggle is presentational
//    • Initial 8 cards + "Show all" footer; hidden when total ≤ 8
//
//  Theming: tokens (--ink/--gold/--cream/--cream-border/--white) auto-remap
//  to dark luxe under the parent .luxe wrapper. Hardcoded hexes are used only
//  where the spec calls them out (e.g. fallback gradient).
// =============================================================================

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface HotelResultsItem {
  id: string;
  name: string;
  href: string;
  imageUrl: string | null;
  starRating: number | null;
  ratingAverage: number | null;
  /** District / area / addressline1. NULL when missing — never falls back to city. */
  neighbourhood: string | null;
  memberPrice: number | null;
  currency: string;
  /** Pre-discount MRP (or null if no discount to show). */
  marketPrice: number | null;
  discountPct: number | null;
  hasFreeCancel: boolean;
  hasBreakfast: boolean;
  hasUpgrade: boolean;
  isEditorPick: boolean;
}

export type HotelResultsViewMode = "grid" | "list" | "gallery";

export interface HotelResultsViewProps {
  cityName: string;
  hotels: HotelResultsItem[];
  loading?: boolean;
  /** Sync filters to URL query params. Defaults true. */
  syncToUrl?: boolean;
  /** "Browse our top cities →" target. Defaults /search. */
  emptyHref?: string;
}

const VIEW_PREF_KEY = "voyagr_view_pref";
const INITIAL_VISIBLE = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function safeImageSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

function formatPrice(amount: number, currency: string): string {
  const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return `${sym}${Math.round(amount).toLocaleString(locale)}`;
}

const FALLBACK_GRADIENT = "linear-gradient(135deg, #1a1510, #2a1f14)";
const HOVER_BORDER = "rgba(184,149,106,0.4)";

// ---------------------------------------------------------------------------
// FallbackImage — gradient + centered name (no broken-image icons, ever)
// ---------------------------------------------------------------------------
function FallbackImage({ name, fontSize = 14 }: { name: string; fontSize?: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: FALLBACK_GRADIENT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 10px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize,
          fontWeight: 500,
          color: "var(--gold-light, #d4b988)",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {name}
      </span>
    </div>
  );
}

function HotelImage({
  src,
  name,
  className,
  zoomOnHover,
  fallbackFontSize,
  imgStyle,
}: {
  src: string | null;
  name: string;
  className?: string;
  zoomOnHover?: number;
  fallbackFontSize?: number;
  imgStyle?: React.CSSProperties;
}) {
  const [errored, setErrored] = useState(false);
  const safe = safeImageSrc(src);
  const showFallback = !safe || errored;
  return (
    <>
      {!showFallback && (
        <img
          className={className}
          src={safe!}
          alt={name}
          loading="lazy"
          onError={() => setErrored(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            transition: zoomOnHover ? `transform 0.4s cubic-bezier(0.22,1,0.36,1)` : undefined,
            ...imgStyle,
          }}
        />
      )}
      {showFallback && <FallbackImage name={name} fontSize={fallbackFontSize} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// View toggle (Grid / List / Gallery)
// ---------------------------------------------------------------------------
const VIEW_ICONS: Record<HotelResultsViewMode, React.ReactNode> = {
  grid: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  list: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  ),
  gallery: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
};

const VIEW_LABELS: Record<HotelResultsViewMode, string> = {
  grid: "Compact grid",
  list: "Dense list",
  gallery: "Image gallery",
};

function ViewToggle({
  view,
  onChange,
}: {
  view: HotelResultsViewMode;
  onChange: (v: HotelResultsViewMode) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Result view"
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        background: "var(--white-04, rgba(0,0,0,0.04))",
        border: "1px solid var(--cream-border)",
        borderRadius: 999,
      }}
    >
      {(Object.keys(VIEW_ICONS) as HotelResultsViewMode[]).map((v) => {
        const active = v === view;
        return (
          <button
            key={v}
            type="button"
            aria-label={VIEW_LABELS[v]}
            aria-pressed={active}
            onClick={() => onChange(v)}
            style={{
              width: 32,
              height: 28,
              border: "none",
              borderRadius: 999,
              background: active ? "var(--gold)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-light)",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.18s, color 0.18s",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.color = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.color = "var(--ink-light)";
            }}
          >
            {VIEW_ICONS[v]}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter pill
// ---------------------------------------------------------------------------
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "7px 14px",
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
        border: `1px solid ${active ? "var(--gold)" : "var(--cream-border)"}`,
        borderRadius: 999,
        background: active ? "var(--gold)" : "transparent",
        color: active ? "var(--ink)" : "var(--ink-mid)",
        cursor: "pointer",
        transition: "border-color 0.18s, background 0.18s, color 0.18s",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.borderColor = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.borderColor = "var(--cream-border)";
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Card primitives — perk pill + rating badge + editor pick badge
// ---------------------------------------------------------------------------
function PerkTag({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 7px",
        fontSize: 10,
        fontWeight: 500,
        fontFamily: "var(--font-body)",
        color: "var(--ink-mid)",
        background: "var(--gold-pale, rgba(200,170,118,0.15))",
        border: "1px solid var(--gold-border, rgba(200,170,118,0.28))",
        borderRadius: 999,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function RatingBadge({
  rating,
  variant = "solid",
}: {
  rating: number;
  variant?: "solid" | "frosted";
}) {
  const display = rating > 5 ? rating.toFixed(1) : rating.toFixed(1);
  if (variant === "frosted") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          padding: "3px 8px",
          background: "rgba(12,11,10,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          color: "#f7f5f2",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.02em",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        ★ {display}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 7px",
        background: "var(--gold-pale, rgba(200,170,118,0.18))",
        color: "var(--gold)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.02em",
        borderRadius: 999,
        border: "1px solid var(--gold-border, rgba(200,170,118,0.32))",
      }}
    >
      ★ {display}
    </span>
  );
}

function EditorPickBadge({ size = "sm" }: { size?: "sm" | "md" }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "md" ? "3px 9px" : "2px 7px",
        background: "var(--gold)",
        color: "var(--ink)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        borderRadius: 2,
        fontFamily: "var(--font-body)",
      }}
    >
      Editor&rsquo;s pick
    </span>
  );
}

// ---------------------------------------------------------------------------
// Card — three view-mode renderers
// ---------------------------------------------------------------------------
function PriceBlock({ hotel, align = "right" }: { hotel: HotelResultsItem; align?: "right" | "left" }) {
  if (hotel.memberPrice == null || hotel.memberPrice <= 0) return null;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: align === "right" ? "flex-end" : "flex-start",
        gap: 2,
        textAlign: align === "right" ? "right" : "left",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 600,
          color: "var(--ink)",
          lineHeight: 1.1,
        }}
      >
        {formatPrice(hotel.memberPrice, hotel.currency)}
      </span>
      <span style={{ fontSize: 9, color: "var(--ink-light)", letterSpacing: "0.04em" }}>
        per night
      </span>
    </div>
  );
}

function GridCard({ hotel }: { hotel: HotelResultsItem }) {
  const [hover, setHover] = useState(false);
  const perks = useMemo(() => {
    const p: string[] = [];
    if (hotel.hasFreeCancel) p.push("Free cancel");
    if (hotel.hasBreakfast) p.push("Breakfast");
    if (hotel.hasUpgrade) p.push("Upgrade");
    return p.slice(0, 2);
  }, [hotel.hasFreeCancel, hotel.hasBreakfast, hotel.hasUpgrade]);

  return (
    <Link
      href={hotel.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        background: "var(--white)",
        border: `1px solid ${hover ? HOVER_BORDER : "var(--cream-border)"}`,
        borderRadius: 10,
        overflow: "hidden",
        transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.25s",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Image area — 80px tall per spec, with rating badge top-left + gradient fade bottom */}
      <div
        style={{
          position: "relative",
          height: 80,
          width: "100%",
          overflow: "hidden",
          background: FALLBACK_GRADIENT,
        }}
      >
        <HotelImage
          src={hotel.imageUrl}
          name={hotel.name}
          fallbackFontSize={13}
          imgStyle={{
            transform: hover ? "scale(1.06)" : "scale(1)",
          }}
          zoomOnHover={1.06}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.45) 100%)",
            pointerEvents: "none",
          }}
        />
        {hotel.ratingAverage != null && hotel.ratingAverage > 0 && (
          <div style={{ position: "absolute", top: 6, left: 6 }}>
            <RatingBadge rating={hotel.ratingAverage} />
          </div>
        )}
        {hotel.isEditorPick && (
          <div style={{ position: "absolute", top: 6, right: 6 }}>
            <EditorPickBadge />
          </div>
        )}
      </div>

      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
            margin: 0,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            minHeight: 35,
          }}
        >
          {hotel.name}
        </h3>
        <div
          style={{
            fontSize: 10,
            color: "var(--ink-light)",
            letterSpacing: "0.02em",
            minHeight: 12,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {hotel.neighbourhood || " "}
        </div>
        {perks.length > 0 && (
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {perks.map((p) => (
              <PerkTag key={p} label={p} />
            ))}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 2,
          }}
        >
          <PriceBlock hotel={hotel} align="left" />
          {hotel.discountPct != null && hotel.discountPct > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#4a8c5c",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.02em",
              }}
            >
              −{hotel.discountPct}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ListRow({ hotel, isLast }: { hotel: HotelResultsItem; isLast: boolean }) {
  const [hover, setHover] = useState(false);
  const perks = useMemo(() => {
    const p: string[] = [];
    if (hotel.hasFreeCancel) p.push("Free cancel");
    if (hotel.hasBreakfast) p.push("Breakfast");
    if (hotel.hasUpgrade) p.push("Upgrade");
    return p.slice(0, 2);
  }, [hotel.hasFreeCancel, hotel.hasBreakfast, hotel.hasUpgrade]);

  return (
    <Link
      href={hotel.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        background: hover ? "var(--white-04, rgba(255,255,255,0.025))" : "transparent",
        borderBottom: isLast ? "none" : "1px solid var(--cream-border)",
        transition: "background 0.18s",
        padding: "10px 12px",
      }}
      className="hrv-list-row"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 56,
            height: 42,
            flexShrink: 0,
            borderRadius: 4,
            overflow: "hidden",
            background: FALLBACK_GRADIENT,
          }}
        >
          <HotelImage src={hotel.imageUrl} name={hotel.name} fallbackFontSize={9} />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--ink)",
                lineHeight: 1.25,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {hotel.name}
            </span>
            {hotel.isEditorPick && <EditorPickBadge />}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "var(--ink-light)",
              letterSpacing: "0.02em",
              flexWrap: "wrap",
            }}
          >
            {hotel.ratingAverage != null && hotel.ratingAverage > 0 && (
              <span style={{ color: "var(--gold)", fontWeight: 600 }}>
                ★ {hotel.ratingAverage.toFixed(1)}
              </span>
            )}
            {hotel.neighbourhood && (
              <>
                <span aria-hidden>·</span>
                <span>{hotel.neighbourhood}</span>
              </>
            )}
            {perks.map((p) => (
              <span key={p}>
                <span aria-hidden style={{ marginRight: 8 }}>·</span>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
            {hotel.memberPrice != null && hotel.memberPrice > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--ink)",
                  lineHeight: 1.1,
                }}
              >
                {formatPrice(hotel.memberPrice, hotel.currency)}
              </span>
            )}
            {hotel.discountPct != null && hotel.discountPct > 0 && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#4a8c5c",
                  letterSpacing: "0.02em",
                }}
              >
                −{hotel.discountPct}%
              </span>
            )}
          </div>
          <span
            className="hrv-list-cta"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--gold)",
              letterSpacing: "0.04em",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              transition: "transform 0.18s",
              transform: hover ? "translateX(3px)" : "translateX(0)",
            }}
          >
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

function GalleryCard({ hotel }: { hotel: HotelResultsItem }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      href={hotel.href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        position: "relative",
        aspectRatio: "4 / 3",
        borderRadius: 10,
        overflow: "hidden",
        background: FALLBACK_GRADIENT,
        border: `1px solid ${hover ? HOVER_BORDER : "var(--cream-border)"}`,
        transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.25s",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      <HotelImage
        src={hotel.imageUrl}
        name={hotel.name}
        fallbackFontSize={20}
        imgStyle={{ transform: hover ? "scale(1.05)" : "scale(1)" }}
        zoomOnHover={1.05}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.0) 35%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />
      {hotel.ratingAverage != null && hotel.ratingAverage > 0 && (
        <div style={{ position: "absolute", top: 10, right: 10 }}>
          <RatingBadge rating={hotel.ratingAverage} variant="frosted" />
        </div>
      )}
      {hotel.isEditorPick && (
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <EditorPickBadge size="md" />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 14,
          color: "#f7f5f2",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 18,
            fontWeight: 500,
            lineHeight: 1.2,
            marginBottom: 4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {hotel.name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "rgba(247,245,242,0.8)",
              letterSpacing: "0.02em",
              minHeight: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {hotel.neighbourhood || " "}
          </span>
          {hotel.memberPrice != null && hotel.memberPrice > 0 && (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 600,
                color: "#f7f5f2",
                whiteSpace: "nowrap",
              }}
            >
              {formatPrice(hotel.memberPrice, hotel.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Skeleton — pulses match active view's card dimensions
// ---------------------------------------------------------------------------
function SkeletonRect({ height, width = "100%", radius = 8 }: { height: number; width?: number | string; radius?: number }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background:
          "linear-gradient(90deg, var(--white-04, rgba(0,0,0,0.04)) 0%, var(--white-08, rgba(0,0,0,0.08)) 50%, var(--white-04, rgba(0,0,0,0.04)) 100%)",
        backgroundSize: "200% 100%",
        animation: "hrv-pulse 1.4s ease-in-out infinite",
      }}
    />
  );
}

function Skeleton({ view, count }: { view: HotelResultsViewMode; count: number }) {
  if (view === "list") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          border: "1px solid var(--cream-border)",
          borderRadius: 10,
          overflow: "hidden",
          background: "var(--white)",
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: "10px 12px",
              borderBottom: i === count - 1 ? "none" : "1px solid var(--cream-border)",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <SkeletonRect height={42} width={56} radius={4} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <SkeletonRect height={12} width="60%" />
              <SkeletonRect height={10} width="40%" />
            </div>
            <SkeletonRect height={16} width={70} />
          </div>
        ))}
      </div>
    );
  }
  if (view === "gallery") {
    return (
      <div className="hrv-gallery-grid">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ aspectRatio: "4 / 3" }}>
            <SkeletonRect height={9999} width="100%" radius={10} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="hrv-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          <SkeletonRect height={80} radius={0} />
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            <SkeletonRect height={12} width="80%" />
            <SkeletonRect height={10} width="50%" />
            <SkeletonRect height={14} width="55%" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// URL filter sync
// ---------------------------------------------------------------------------
type FilterState = {
  stars: 0 | 4 | 5;
  freeCancel: boolean;
  breakfast: boolean;
  upgrade: boolean;
};

function parseFiltersFromQuery(sp: URLSearchParams | null): FilterState {
  const empty: FilterState = { stars: 0, freeCancel: false, breakfast: false, upgrade: false };
  if (!sp) return empty;
  const starsRaw = sp.get("stars");
  const stars: FilterState["stars"] = starsRaw === "5" ? 5 : starsRaw === "4" ? 4 : 0;
  const perks = (sp.get("perks") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return {
    stars,
    freeCancel: perks.includes("free-cancel"),
    breakfast: perks.includes("breakfast"),
    upgrade: perks.includes("upgrade"),
  };
}

function filtersToQuery(prev: URLSearchParams, f: FilterState): URLSearchParams {
  const out = new URLSearchParams(prev.toString());
  if (f.stars > 0) out.set("stars", String(f.stars));
  else out.delete("stars");
  const perks: string[] = [];
  if (f.freeCancel) perks.push("free-cancel");
  if (f.breakfast) perks.push("breakfast");
  if (f.upgrade) perks.push("upgrade");
  if (perks.length) out.set("perks", perks.join(","));
  else out.delete("perks");
  return out;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function HotelResultsView({
  cityName,
  hotels,
  loading = false,
  syncToUrl = true,
  emptyHref = "/search",
}: HotelResultsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── View mode (Grid/List/Gallery) — persisted in localStorage ───────────
  const [view, setView] = useState<HotelResultsViewMode>("grid");
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(VIEW_PREF_KEY);
      if (saved === "grid" || saved === "list" || saved === "gallery") {
        setView(saved);
      }
    } catch {
      // ignore
    }
  }, []);
  const handleViewChange = useCallback((v: HotelResultsViewMode) => {
    setView(v);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(VIEW_PREF_KEY, v);
      } catch {
        // ignore
      }
    }
  }, []);

  // ── Filters ─────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(() =>
    parseFiltersFromQuery(syncToUrl ? searchParams : null),
  );

  // Pull filters from URL on mount + when URL changes externally
  useEffect(() => {
    if (!syncToUrl) return;
    const next = parseFiltersFromQuery(searchParams);
    setFilters((cur) => {
      const same =
        cur.stars === next.stars &&
        cur.freeCancel === next.freeCancel &&
        cur.breakfast === next.breakfast &&
        cur.upgrade === next.upgrade;
      return same ? cur : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  const updateFilters = useCallback(
    (next: FilterState) => {
      setFilters(next);
      if (!syncToUrl) return;
      const newQuery = filtersToQuery(
        new URLSearchParams(searchParams ? searchParams.toString() : ""),
        next,
      );
      const qs = newQuery.toString();
      const path = typeof window !== "undefined" ? window.location.pathname : "";
      router.replace(`${path}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams, syncToUrl],
  );

  const clearFilters = useCallback(() => {
    updateFilters({ stars: 0, freeCancel: false, breakfast: false, upgrade: false });
  }, [updateFilters]);

  // ── Filtered list ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return hotels.filter((h) => {
      if (filters.stars > 0 && (h.starRating ?? 0) < filters.stars) return false;
      if (filters.freeCancel && !h.hasFreeCancel) return false;
      if (filters.breakfast && !h.hasBreakfast) return false;
      if (filters.upgrade && !h.hasUpgrade) return false;
      return true;
    });
  }, [hotels, filters]);

  const filtersActive =
    filters.stars > 0 || filters.freeCancel || filters.breakfast || filters.upgrade;

  // ── Visible-count (8 → all) ────────────────────────────────────────────
  const [showAll, setShowAll] = useState(false);
  // Reset show-all when filters or hotel list change underneath us
  useEffect(() => {
    setShowAll(false);
  }, [filters, hotels.length]);
  const visible = showAll ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const showFooter = filtered.length > INITIAL_VISIBLE;

  // ── Header ──────────────────────────────────────────────────────────────
  const total = hotels.length;
  const propertyLabel = total === 1 ? "1 property" : `${total.toLocaleString()} properties`;

  return (
    <div className="hrv-root">
      {/* Local CSS — animations + view-specific responsive grids */}
      <style jsx>{`
        @keyframes hrv-pulse {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
        .hrv-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .hrv-gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1023px) {
          .hrv-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .hrv-gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 767px) {
          .hrv-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .hrv-gallery-grid { grid-template-columns: 1fr; }
          .hrv-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .hrv-toggle-wrap { align-self: flex-end; }
        }
      `}</style>

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div
        className="hrv-header"
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 500,
              fontStyle: "italic",
              color: "var(--ink)",
              margin: 0,
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            Hotels in {cityName}
          </h2>
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-light)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.02em",
            }}
          >
            {propertyLabel}
          </span>
        </div>

        <div className="hrv-toggle-wrap">
          <ViewToggle view={view} onChange={handleViewChange} />
        </div>
      </div>

      {/* ── Filter pills ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <Pill active={filters.stars === 0} onClick={() => updateFilters({ ...filters, stars: 0 })}>
          Any
        </Pill>
        <Pill active={filters.stars === 4} onClick={() => updateFilters({ ...filters, stars: 4 })}>
          4★+
        </Pill>
        <Pill active={filters.stars === 5} onClick={() => updateFilters({ ...filters, stars: 5 })}>
          5★
        </Pill>

        <span
          aria-hidden
          style={{
            display: "inline-block",
            width: 1,
            height: 18,
            background: "var(--cream-border)",
            margin: "0 6px",
          }}
        />

        <Pill
          active={filters.freeCancel}
          onClick={() => updateFilters({ ...filters, freeCancel: !filters.freeCancel })}
        >
          Free cancel
        </Pill>
        <Pill
          active={filters.breakfast}
          onClick={() => updateFilters({ ...filters, breakfast: !filters.breakfast })}
        >
          Breakfast
        </Pill>
        <Pill
          active={filters.upgrade}
          onClick={() => updateFilters({ ...filters, upgrade: !filters.upgrade })}
        >
          Upgrade
        </Pill>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {loading ? (
        <Skeleton view={view} count={INITIAL_VISIBLE} />
      ) : total === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            border: "1px dashed var(--cream-border)",
            borderRadius: 10,
            color: "var(--ink-light)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          No properties available in {cityName} yet.{" "}
          <Link
            href={emptyHref}
            style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}
          >
            Browse our top cities &rarr;
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: "48px 24px",
            textAlign: "center",
            border: "1px dashed var(--cream-border)",
            borderRadius: 10,
            color: "var(--ink-light)",
            fontFamily: "var(--font-body)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          No properties match your filters.{" "}
          <button
            type="button"
            onClick={clearFilters}
            style={{
              color: "var(--gold)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              padding: 0,
            }}
          >
            Clear filters
          </button>
        </div>
      ) : view === "list" ? (
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {visible.map((h, i) => (
            <ListRow key={h.id} hotel={h} isLast={i === visible.length - 1} />
          ))}
        </div>
      ) : view === "gallery" ? (
        <div className="hrv-gallery-grid">
          {visible.map((h) => (
            <GalleryCard key={h.id} hotel={h} />
          ))}
        </div>
      ) : (
        <div className="hrv-grid">
          {visible.map((h) => (
            <GridCard key={h.id} hotel={h} />
          ))}
        </div>
      )}

      {/* ── Footer (only when total > 8) ──────────────────────────────── */}
      {!loading && filtered.length > 0 && showFooter && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 18,
            borderTop: "1px solid var(--cream-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-light)",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.02em",
            }}
          >
            Showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()} propert
            {filtered.length === 1 ? "y" : "ies"}
            {filtersActive ? " (filtered)" : ""}
          </span>
          {!showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--gold)",
                background: "transparent",
                border: "1px solid var(--gold-border, rgba(200,170,118,0.32))",
                borderRadius: 999,
                padding: "8px 18px",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                letterSpacing: "0.04em",
                transition: "background 0.18s, border-color 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gold-pale, rgba(200,170,118,0.15))";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Show all &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
