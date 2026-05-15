"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

// =============================================================================
//  EditorialCard — the shared luxe-editorial card primitive for home-page
//  carousels (Editor's Picks, Preferred Hotels, Top Cities). Replaces three
//  bespoke per-section card markups so geometry, type scale and hover
//  behaviour are inevitable across sections.
//
//  Geometry — 4:5 portrait by default; pass `aspectRatio="fill"` to let the
//  card fill its parent (used by the bento grid where tile heights are
//  driven by the grid).
//
//  Variants —
//    "hotel"        eyebrow + name + subline + chips + price stack
//    "city"         eyebrow + name + subline + chips (no price stack)
//    "destination"  eyebrow + name only (clean editorial tile)
//
//  All sub-elements are optional via undefined props; the variant only nudges
//  what is *encouraged* — callers can still pass / omit anything.
// =============================================================================

export type EditorialVariant = "hotel" | "city" | "destination";

export interface EditorialCardProps {
  href: string;
  imageUrl: string;
  imageAlt: string;
  /** Mono-caps eyebrow line, e.g. "EDITOR'S PICK", "PREFERRED", "DESTINATION". */
  eyebrow?: string;
  /** Italic Playfair display name (clamp 18–22px). */
  name: string;
  /** Optional sub-line — "City · Country" or a one-line tagline. */
  subline?: string;
  /** Optional champagne chip row — capped at 3. */
  chips?: string[];
  /** Optional price stack — rendered bottom-right when present. */
  priceFrom?: number;
  priceCurrency?: string;
  /** Aspect ratio — "4/5" (default), "3/4", "1/1", or "fill" to fill parent. */
  aspectRatio?: string;
  /** Eager-load image (above-the-fold). */
  eager?: boolean;
  /** next/image `sizes` attribute — pass the right one for your layout. */
  sizes?: string;
  /** Extra className on the root <Link>. */
  className?: string;
  /** Tabbable? Bento carousels disable focus on off-screen slides. */
  tabIndex?: number;
  variant?: EditorialVariant;
  /** Display name larger ("hero" treatment) — used by the bento tile 1. */
  hero?: boolean;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=82&auto=format&fit=crop";

function safeImageSrc(url: string): string {
  if (!url || !url.trim()) return FALLBACK_IMAGE;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

function formatPrice(n: number, currency: string): string {
  if (currency === "INR") return `₹${n.toLocaleString("en-IN")}`;
  return `${currency} ${n.toLocaleString("en-IN")}`;
}

function EditorialCardInner(props: EditorialCardProps) {
  const {
    href,
    imageUrl,
    imageAlt,
    eyebrow,
    name,
    subline,
    chips,
    priceFrom,
    priceCurrency = "INR",
    aspectRatio = "4 / 5",
    eager = false,
    sizes,
    className = "",
    tabIndex,
    variant = "hotel",
    hero = false,
  } = props;

  // Variant nudges — destination is name-only, city drops the price stack.
  const showSubline = variant !== "destination" && Boolean(subline);
  const showChips = variant !== "destination" && Array.isArray(chips) && chips.length > 0;
  const showPrice =
    variant === "hotel" && typeof priceFrom === "number" && priceFrom > 0;

  const cappedChips = showChips ? chips!.slice(0, 3) : [];

  const fillParent = aspectRatio === "fill";
  const rootStyle: React.CSSProperties = fillParent
    ? { aspectRatio: undefined }
    : { aspectRatio };

  return (
    <Link
      href={href}
      className={`edcard edcard--${variant}${hero ? " edcard--hero" : ""}${
        fillParent ? " edcard--fill" : ""
      } ${className}`.trim()}
      style={rootStyle}
      tabIndex={tabIndex}
    >
      {/* Image — full-bleed */}
      <div className="edcard-img-wrap">
        <Image
          src={safeImageSrc(imageUrl)}
          alt={imageAlt}
          fill
          sizes={sizes ?? "(max-width: 767px) 100vw, 33vw"}
          className="edcard-img"
          style={{ objectFit: "cover" }}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
        />
      </div>

      {/* Bottom-to-top gradient overlay for legibility */}
      <div className="edcard-scrim" aria-hidden />

      {/* Text block */}
      <div className="edcard-body">
        {eyebrow && <div className="edcard-eyebrow">{eyebrow}</div>}
        <div className={`edcard-name${hero ? " edcard-name--hero" : ""}`}>
          {name}
        </div>
        {showSubline && <div className="edcard-subline">{subline}</div>}
        {showChips && (
          <div className="edcard-chips">
            {cappedChips.map((c, i) => (
              <span key={`${c}-${i}`} className="edcard-chip">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price stack — bottom-right, mono tabular numerals */}
      {showPrice && (
        <div className="edcard-price">
          <div className="edcard-price-label">From</div>
          <div className="edcard-price-amount">
            {formatPrice(priceFrom!, priceCurrency)}
          </div>
        </div>
      )}
    </Link>
  );
}

const EditorialCard = React.memo(EditorialCardInner);
export default EditorialCard;
