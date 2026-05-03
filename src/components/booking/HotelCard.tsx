"use client";

/**
 * Booking-flow HotelCard.
 *
 * Two layouts (horizontal/vertical) sharing one component, both reading
 * exclusively from booking-flow tokens (`--bf-*`). `auto` resolves to
 * horizontal at >=768px and vertical below.
 *
 * Naming: this lives under `components/booking/` to stay distinct from the
 * legacy cream-themed `components/HotelCard.tsx` (cream/gold listings) which
 * remains in use by the home-page carousels. New booking-flow surfaces
 * (search, listings, trending) consume this component.
 */

import React, { useEffect, useState } from "react";
import { Tag, Rating, Button } from "@/components/primitives/booking";

// ── Data shape ──────────────────────────────────────────────────────────────
export type HotelCardLocation = {
  neighbourhood: string;
  minutesFromAirport: number;
  airportCode: string;
};

export type HotelCardCms = {
  /** Pre-trimmed listing-grade prose (1–2 sentences). Preferred when present. */
  search_blurb?: string | null;
  /** Long-form intro from CMS. Used as fallback (truncated to 2 lines via clamp). */
  editorial_intro?: string | null;
};

export type HotelCardModel = {
  id: string | number;
  name: string;
  location: HotelCardLocation;
  image: string;
  imageAlt?: string;
  /** Review score, 0–10 scale. */
  rating: number;
  /** Hotel class, 1–5. Used for the star strip on the desktop rating display. */
  stars?: number;
  amenities: string[];
  member_rate: number;
  /** Public/non-member rate. If present and > member_rate, struck through. */
  public_rate?: number | null;
  currency?: string;
  cms?: HotelCardCms;
};

export type HotelCardLayout = "horizontal" | "vertical" | "auto";

export interface HotelCardProps {
  hotel: HotelCardModel;
  /** Server-set per query for top-3 ranks. Component does not enforce the rule. */
  isConciergePick?: boolean;
  isFavorited?: boolean;
  layout?: HotelCardLayout;
  /** Stay length for the price subline. Hidden if undefined. */
  nights?: number;
  onSelect?: (hotel: HotelCardModel) => void;
  onToggleFavorite?: (hotel: HotelCardModel) => void;
  className?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=70";

function safeImage(url: string): string {
  if (!url || !url.trim()) return FALLBACK_IMAGE;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

function formatMoney(amount: number, currency: string = "USD"): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

function pickBlurb(cms: HotelCardCms | undefined): string | null {
  if (!cms) return null;
  const direct = (cms.search_blurb || "").trim();
  if (direct) return direct;
  const intro = (cms.editorial_intro || "").trim();
  return intro || null;
}

/** matchMedia hook resolving `auto` layout. SSR defaults to horizontal. */
function useResolvedLayout(layout: HotelCardLayout): "horizontal" | "vertical" {
  const [mode, setMode] = useState<"horizontal" | "vertical">(
    layout === "auto" ? "horizontal" : layout,
  );
  useEffect(() => {
    if (layout !== "auto") {
      setMode(layout);
      return;
    }
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(max-width: 767.98px)");
    const apply = () => setMode(mql.matches ? "vertical" : "horizontal");
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [layout]);
  return mode;
}

// ── Sub-components ──────────────────────────────────────────────────────────
function StarStrip({ count = 5, size = 11 }: { count?: number; size?: number }) {
  const stars = Math.max(0, Math.min(5, Math.round(count)));
  return (
    <span
      aria-hidden="true"
      style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
    >
      {Array.from({ length: stars }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" focusable="false">
          <path
            d="M12 2.5l2.95 6.36 6.55.7-4.9 4.5 1.4 6.44L12 17l-5.99 3.5 1.4-6.44L2.5 9.56l6.55-.7L12 2.5z"
            fill="var(--bf-color-accent)"
          />
        </svg>
      ))}
    </span>
  );
}

function ScoreWithStars({ score, stars }: { score: number; stars: number }) {
  return (
    <span
      role="img"
      aria-label={`Rated ${score.toFixed(1)} out of 10, ${stars} star property`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "var(--bf-space-2)",
        fontFamily: "var(--bf-font-sans)",
      }}
    >
      <span
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: "var(--bf-color-text-primary)",
          lineHeight: 1,
        }}
      >
        {score.toFixed(1)}
      </span>
      <StarStrip count={stars} size={11} />
    </span>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? "var(--bf-color-accent)" : "none"}
        stroke={filled ? "var(--bf-color-accent)" : "var(--bf-color-text-primary)"}
        strokeWidth={1.6}
      />
    </svg>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
function HotelCardInner(props: HotelCardProps) {
  const {
    hotel,
    isConciergePick = false,
    isFavorited = false,
    layout = "auto",
    nights,
    onSelect,
    onToggleFavorite,
    className,
  } = props;

  const mode = useResolvedLayout(layout);
  const isHorizontal = mode === "horizontal";

  const blurb = pickBlurb(hotel.cms);
  const showStrikethrough =
    typeof hotel.public_rate === "number" &&
    hotel.public_rate > hotel.member_rate;
  const memberPriceText = formatMoney(hotel.member_rate, hotel.currency);
  const publicPriceText = showStrikethrough
    ? formatMoney(hotel.public_rate as number, hotel.currency)
    : null;
  const topAmenities = hotel.amenities.slice(0, 4);

  const handleSelect = () => onSelect?.(hotel);
  const handleFav = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onToggleFavorite?.(hotel);
  };

  const cardArticleStyle: React.CSSProperties = {
    display: isHorizontal ? "grid" : "flex",
    flexDirection: isHorizontal ? undefined : "column",
    gridTemplateColumns: isHorizontal ? "220px 1fr 200px" : undefined,
    gap: isHorizontal ? "var(--bf-space-7)" : 0,
    alignItems: isHorizontal ? "stretch" : "stretch",
    background: "var(--bf-color-bg-surface)",
    border: "1px solid var(--bf-color-border-soft)",
    borderRadius: "var(--bf-radius-lg)",
    overflow: "hidden",
    transition:
      "border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
    color: "var(--bf-color-text-primary)",
    fontFamily: "var(--bf-font-sans)",
  };

  const imageWrapStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    aspectRatio: isHorizontal ? "4 / 3" : "16 / 9",
    overflow: "hidden",
    background: "var(--bf-color-bg-surface-soft)",
  };

  const imageStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };

  const conciergeTagStyle: React.CSSProperties = {
    position: "absolute",
    top: "var(--bf-space-3)",
    left: "var(--bf-space-3)",
  };

  const heartButtonStyle: React.CSSProperties = {
    position: "absolute",
    top: "var(--bf-space-3)",
    right: "var(--bf-space-3)",
    width: 36,
    height: 36,
    borderRadius: "var(--bf-radius-pill)",
    border: "1px solid var(--bf-color-border-default)",
    background: "var(--bf-color-bg-overlay)",
    backdropFilter: "blur(10px)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "var(--bf-color-text-primary)",
  };

  const ratingChipStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "var(--bf-space-3)",
    left: "var(--bf-space-3)",
    padding: "var(--bf-space-1) var(--bf-space-3)",
    borderRadius: "var(--bf-radius-pill)",
    background: "var(--bf-color-bg-overlay)",
    backdropFilter: "blur(10px)",
    border: "1px solid var(--bf-color-border-default)",
  };

  const infoColStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "var(--bf-space-2)",
    padding: isHorizontal
      ? "var(--bf-space-5) 0"
      : "var(--bf-space-5) var(--bf-space-5) var(--bf-space-3)",
    minWidth: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontFamily: "var(--bf-font-serif)",
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: 22,
    lineHeight: "26px",
    color: "var(--bf-color-text-primary)",
    margin: 0,
  };

  const locationStyle: React.CSSProperties = {
    fontSize: 12,
    lineHeight: "18px",
    color: "var(--bf-color-text-soft)",
    margin: 0,
    letterSpacing: "0.01em",
  };

  const blurbStyle: React.CSSProperties = {
    fontSize: 13,
    lineHeight: "20px",
    color: "var(--bf-color-text-muted)",
    margin: "var(--bf-space-1) 0 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  };

  const amenityRowStyle: React.CSSProperties = {
    display: "flex",
    flexWrap: "wrap",
    gap: 0,
    marginTop: "var(--bf-space-3)",
    fontSize: 10,
    lineHeight: "14px",
    fontWeight: 500,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: "var(--bf-color-text-soft)",
  };

  const amenityItemStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
  };

  const amenityBulletStyle: React.CSSProperties = {
    display: "inline-block",
    width: 3,
    height: 3,
    borderRadius: "50%",
    background: "var(--bf-color-accent)",
    margin: "0 var(--bf-space-2)",
  };

  const priceColStyle: React.CSSProperties = isHorizontal
    ? {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "var(--bf-space-5) var(--bf-space-5) var(--bf-space-5) 0",
        gap: "var(--bf-space-3)",
        textAlign: "right",
      }
    : {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--bf-space-3) var(--bf-space-5) var(--bf-space-5)",
        borderTop: "1px solid var(--bf-color-border-soft)",
        gap: "var(--bf-space-4)",
      };

  const memberTagStyle: React.CSSProperties = {
    fontSize: 9,
    lineHeight: "12px",
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--bf-color-accent)",
    background: "var(--bf-color-accent-soft)",
    padding: "var(--bf-space-1) var(--bf-space-3)",
    borderRadius: "var(--bf-radius-sm)",
    alignSelf: isHorizontal ? "flex-end" : "flex-start",
    whiteSpace: "nowrap",
  };

  const priceAmountStyle: React.CSSProperties = {
    fontFamily: "var(--bf-font-serif)",
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: 22,
    lineHeight: "26px",
    color: "var(--bf-color-text-primary)",
  };

  const priceSublineStyle: React.CSSProperties = {
    fontSize: 11,
    lineHeight: "16px",
    color: "var(--bf-color-text-soft)",
    margin: 0,
  };

  const strikePriceStyle: React.CSSProperties = {
    fontSize: 12,
    lineHeight: "16px",
    color: "var(--bf-color-text-faint)",
    textDecoration: "line-through",
    marginTop: 2,
  };

  // Vertical price row: cluster price/CTA differently than horizontal column.
  const priceCluster = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isHorizontal ? "flex-end" : "flex-start",
        gap: "var(--bf-space-1)",
      }}
    >
      <span style={memberTagStyle}>Member rate</span>
      <span style={priceAmountStyle}>{memberPriceText}</span>
      {publicPriceText && (
        <span style={strikePriceStyle}>{publicPriceText}</span>
      )}
      <p style={priceSublineStyle}>
        per night{typeof nights === "number" ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}
      </p>
    </div>
  );

  const cta = (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleSelect}
      aria-label={`View ${hotel.name}`}
    >
      {isHorizontal ? "View hotel" : "View"}
    </Button>
  );

  // ── Render ──
  return (
    <article
      className={className}
      data-bf-card="hotel"
      data-bf-layout={mode}
      style={cardArticleStyle}
    >
      {/* Image */}
      <div style={imageWrapStyle}>
        <img
          src={safeImage(hotel.image)}
          alt={hotel.imageAlt ?? `${hotel.name} — exterior`}
          style={imageStyle}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
          }}
        />
        {isConciergePick && (
          <div style={conciergeTagStyle}>
            <Tag tone="amber">Concierge pick</Tag>
          </div>
        )}
        {!isHorizontal && (
          <button
            type="button"
            onClick={handleFav}
            aria-pressed={isFavorited}
            aria-label={isFavorited ? "Remove from favourites" : "Save to favourites"}
            style={heartButtonStyle}
          >
            <HeartIcon filled={isFavorited} />
          </button>
        )}
        {!isHorizontal && (
          <div style={ratingChipStyle}>
            <Rating value={hotel.rating} size="sm" showOutOf={false} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={infoColStyle}>
        <h3 style={nameStyle}>{hotel.name}</h3>
        <p style={locationStyle}>
          {hotel.location.neighbourhood}
          {" · "}
          {hotel.location.minutesFromAirport} min from {hotel.location.airportCode}
        </p>
        {isHorizontal && blurb && <p style={blurbStyle}>{blurb}</p>}
        {topAmenities.length > 0 && (
          <div style={amenityRowStyle} aria-label="Amenities">
            {topAmenities.map((amenity, i) => (
              <span key={amenity} style={amenityItemStyle}>
                {amenity}
                {i < topAmenities.length - 1 && (
                  <span aria-hidden="true" style={amenityBulletStyle} />
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Pricing */}
      <div style={priceColStyle}>
        {isHorizontal && (
          <ScoreWithStars score={hotel.rating} stars={hotel.stars ?? 5} />
        )}
        {priceCluster}
        {cta}
      </div>
    </article>
  );
}

export const HotelCard = React.memo(HotelCardInner);
export default HotelCard;
