"use client";

// ---------------------------------------------------------------------------
// Amenity definitions: keyword patterns matched against hotel overview text
// ---------------------------------------------------------------------------
export interface Amenity {
  key: string;
  label: string;
  /** SVG path(s) for a 24x24 viewBox */
  icon: string;
  /** Regex patterns to detect this amenity in overview text */
  patterns: RegExp[];
}

const AMENITIES: Amenity[] = [
  {
    key: "pool",
    label: "Pool",
    icon: "M2 18c.6.5 1.2 1 2.5 1C6.5 19 6.5 17 9 17s2.5 2 4.5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M2 14c.6.5 1.2 1 2.5 1C6.5 15 6.5 13 9 13s2.5 2 4.5 2 2.5-2 5-2c1.3 0 1.9.5 2.5 1M8 9V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3M16 9V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3",
    patterns: [/\bpool\b/i, /\bswimming\b/i],
  },
  {
    key: "spa",
    label: "Spa",
    icon: "M12 22c-4.97 0-9-2.24-9-5v-1c0-2.76 4.03-5 9-5s9 2.24 9 5v1c0 2.76-4.03 5-9 5zM7 11.5c0-2.5 2-5 5-7.5 3 2.5 5 5 5 7.5",
    patterns: [/\bspa\b/i, /\bwellness\b/i, /\bsauna\b/i, /\bsteam room\b/i],
  },
  {
    key: "wifi",
    label: "Wi-Fi",
    icon: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01",
    patterns: [/\bwi-?fi\b/i, /\binternet\b/i, /\bwireless\b/i],
  },
  {
    key: "restaurant",
    label: "Restaurant",
    icon: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
    patterns: [/\brestaurant\b/i, /\bdining\b/i, /\bcuisine\b/i],
  },
  {
    key: "gym",
    label: "Fitness",
    icon: "M6.5 6.5h11M6.5 17.5h11M2 12h3M19 12h3M6.5 6.5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2M17.5 6.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2M4 10v4M20 10v4",
    patterns: [/\bgym\b/i, /\bfitness\b/i, /\bexercise\b/i, /\bwork.?out\b/i],
  },
  {
    key: "parking",
    label: "Parking",
    icon: "M9 17V7h4a3 3 0 0 1 0 6H9M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    patterns: [/\bparking\b/i, /\bvalet\b/i, /\bgarage\b/i],
  },
  {
    key: "bar",
    label: "Bar",
    icon: "M8 22h8M12 18v4M12 2L4 10h16L12 2zM7.5 10C7.5 14 12 18 12 18s4.5-4 4.5-8",
    patterns: [/\bbar\b/i, /\blounge\b/i, /\bcocktail\b/i],
  },
  {
    key: "ac",
    label: "Air Conditioning",
    icon: "M12 2v20M2 12h20M12 2a5 5 0 0 1 5 5M12 2a5 5 0 0 0-5 5M12 22a5 5 0 0 0 5-5M12 22a5 5 0 0 1-5-5M17 12a5 5 0 0 1-5 5M7 12a5 5 0 0 1 5-5",
    patterns: [/\bair.?condition/i, /\ba\/c\b/i, /\bclimate control\b/i],
  },
  {
    key: "breakfast",
    label: "Breakfast",
    icon: "M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3",
    patterns: [/\bbreakfast\b/i, /\bbrunch\b/i],
  },
  {
    key: "beach",
    label: "Beach",
    icon: "M17.5 19H6.5l-.447-2.236A1 1 0 0 1 7.031 15.5h9.938a1 1 0 0 1 .978 1.264L17.5 19zM2 22h20M12 2L8 15M12 2l4 13M12 2l-7 8h14l-7-8",
    patterns: [/\bbeach\b/i, /\bbeachfront\b/i, /\bseaside\b/i, /\boceanfront\b/i],
  },
  {
    key: "concierge",
    label: "Concierge",
    icon: "M2 18h20M12 4v2M6.34 7.34l1.42 1.42M17.66 7.34l-1.42 1.42M4 14h16a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z",
    patterns: [/\bconcierge\b/i, /\bbutler\b/i, /\b24.?hour.*(service|desk|reception)\b/i],
  },
  {
    key: "roomservice",
    label: "Room Service",
    icon: "M4 18h16M12 4C7 4 3 8 3 13h18c0-5-4-9-9-9zM12 4V2",
    patterns: [/\broom service\b/i, /\bin.?room dining\b/i],
  },
  {
    key: "petfriendly",
    label: "Pet Friendly",
    icon: "M10 5.172C10 3.782 8.884 2.5 7.5 2.5S5 3.782 5 5.172c0 1.39 2.5 4.328 2.5 4.328S10 6.562 10 5.172zM19 5.172C19 3.782 17.884 2.5 16.5 2.5S14 3.782 14 5.172c0 1.39 2.5 4.328 2.5 4.328S19 6.562 19 5.172zM7.5 14.5c0-1.38-1.12-2.5-2.5-2.5S2.5 13.12 2.5 14.5 3.62 17 5 17s2.5-1.12 2.5-2.5zM21.5 14.5c0-1.38-1.12-2.5-2.5-2.5s-2.5 1.12-2.5 2.5S17.62 17 19 17s2.5-1.12 2.5-2.5zM8 18c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-2-4-2-4-.21-4 2z",
    patterns: [/\bpet.?friendly\b/i, /\bpets? (allowed|welcome)\b/i],
  },
];

/**
 * Extract amenities from overview text by pattern matching
 */
export function extractAmenities(overview: string | null): Amenity[] {
  if (!overview) return [];
  const text = overview.replace(/<[^>]*>/g, " "); // strip HTML
  return AMENITIES.filter((a) => a.patterns.some((p) => p.test(text)));
}

/**
 * Get a specific amenity by key (for use with pricing flags like freeWifi)
 */
export function getAmenityByKey(key: string): Amenity | undefined {
  return AMENITIES.find((a) => a.key === key);
}

// ---------------------------------------------------------------------------
// AmenityIcon — renders a single amenity with its SVG icon
// ---------------------------------------------------------------------------
function AmenityIcon({ amenity, size = "normal" }: { amenity: Amenity; size?: "small" | "normal" }) {
  const iconSize = size === "small" ? 16 : 20;
  const fontSize = size === "small" ? "9px" : "11px";
  const gap = size === "small" ? 4 : 6;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap,
        minWidth: size === "small" ? 48 : 64,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--gold)" }}
      >
        <path d={amenity.icon} />
      </svg>
      <span
        style={{
          fontSize,
          color: "var(--ink-light)",
          letterSpacing: "0.03em",
          textAlign: "center",
          lineHeight: 1.3,
          fontFamily: "var(--font-body)",
        }}
      >
        {amenity.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AmenityGrid — full amenity display for hotel detail pages
// ---------------------------------------------------------------------------
export function AmenityGrid({ overview }: { overview: string | null }) {
  const amenities = extractAmenities(overview);
  if (amenities.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "20px 16px",
        padding: "20px 24px",
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
      }}
    >
      {amenities.map((a) => (
        <AmenityIcon key={a.key} amenity={a} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AmenityChips — compact inline display for cards
// ---------------------------------------------------------------------------
export function AmenityChips({
  overview,
  freeWifi,
  includeBreakfast,
  max = 3,
}: {
  overview?: string | null;
  freeWifi?: boolean;
  includeBreakfast?: boolean;
  max?: number;
}) {
  const fromOverview = extractAmenities(overview || null);

  // Merge pricing flags with overview-derived amenities, deduplicating
  const keys = new Set(fromOverview.map((a) => a.key));
  const merged = [...fromOverview];
  if (freeWifi && !keys.has("wifi")) {
    const wifi = getAmenityByKey("wifi");
    if (wifi) merged.unshift(wifi);
  }
  if (includeBreakfast && !keys.has("breakfast")) {
    const breakfast = getAmenityByKey("breakfast");
    if (breakfast) merged.unshift(breakfast);
  }

  const display = merged.slice(0, max);
  if (display.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {display.map((a) => (
        <span
          key={a.key}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10,
            padding: "3px 8px",
            background: "var(--cream)",
            color: "var(--ink-mid)",
            border: "1px solid var(--cream-border)",
            fontFamily: "var(--font-body)",
          }}
        >
          <svg
            width={12}
            height={12}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--gold)", flexShrink: 0 }}
          >
            <path d={a.icon} />
          </svg>
          {a.label}
        </span>
      ))}
    </div>
  );
}
