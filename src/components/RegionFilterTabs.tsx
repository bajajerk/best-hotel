"use client";

import { CONTINENTS, type Continent } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Continent display metadata
// ---------------------------------------------------------------------------
const CONTINENT_ICONS: Record<string, string> = {
  Asia: "\u{1F3EF}",
  Europe: "\u{1F3F0}",
  "North America": "\u{1F5FD}",
  "South America": "\u{1F30E}",
  Africa: "\u{1F30D}",
  Oceania: "\u{1F3DD}\uFE0F",
};

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------
export type RegionTabsVariant = "pills" | "underline";

interface RegionFilterTabsProps {
  active: string;
  onChange: (continent: string) => void;
  /** Optional counts per continent — shown as a badge when provided */
  counts?: Record<string, number>;
  /** Visual variant — "pills" (default, filled bg) or "underline" (text tabs with bottom border) */
  variant?: RegionTabsVariant;
  /** Show emoji icons before label */
  showIcons?: boolean;
  /** Subset of continents to display (default: all from CONTINENTS) */
  continents?: readonly string[];
}

export default function RegionFilterTabs({
  active,
  onChange,
  counts,
  variant = "pills",
  showIcons = false,
  continents = CONTINENTS,
}: RegionFilterTabsProps) {
  if (variant === "underline") {
    return (
      <div
        className="region-filter-tabs region-filter-underline"
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid var(--cream-border)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {continents.map((cont) => {
          const isActive = active === cont;
          return (
            <button
              key={cont}
              onClick={() => onChange(cont)}
              style={{
                padding: "12px 20px",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                border: "none",
                borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
                background: "transparent",
                color: isActive ? "var(--gold)" : "var(--ink-light)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "var(--font-body)",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {showIcons && CONTINENT_ICONS[cont] && (
                <span style={{ fontSize: "14px" }}>{CONTINENT_ICONS[cont]}</span>
              )}
              {cont}
              {counts && counts[cont] !== undefined && (
                <span
                  style={{
                    fontSize: "10px",
                    color: isActive ? "var(--gold)" : "var(--ink-light)",
                    opacity: 0.7,
                  }}
                >
                  ({counts[cont]})
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: pills variant
  return (
    <div
      className="region-filter-tabs region-filter-pills"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      {continents.map((cont) => {
        const isActive = active === cont;
        return (
          <button
            key={cont}
            onClick={() => onChange(cont)}
            style={{
              padding: "8px 20px",
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              border: "1px solid",
              borderColor: isActive ? "var(--gold)" : "var(--cream-border)",
              background: isActive ? "var(--gold)" : "transparent",
              color: isActive ? "var(--white)" : "var(--ink-mid)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {showIcons && CONTINENT_ICONS[cont] && (
              <span style={{ fontSize: "13px" }}>{CONTINENT_ICONS[cont]}</span>
            )}
            {cont}
            {counts && counts[cont] !== undefined && (
              <span
                style={{
                  fontSize: "10px",
                  color: isActive ? "var(--white)" : "var(--ink-light)",
                  opacity: isActive ? 0.85 : 0.7,
                }}
              >
                ({counts[cont]})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
