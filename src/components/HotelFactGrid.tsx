"use client";

import React, { useState } from "react";

export interface HotelFactGridData {
  neighbourhood?: string | null;
  city?: string;
  airport_iata?: string | null;
  airport_distance_min?: number | null;
  attraction_nearest?: string | null;
  numberrooms?: number | null;
  rooms_description?: string | null;
  restaurants_count?: number | null;
  room_service_24h?: boolean | null;
  signature_restaurant?: string | null;
  amenities?: string | null;
  parking_type?: string | null;
  shuttle_type?: string | null;
  languages?: string[] | null;
}

const GOLD = "#C9A961";

const WELLNESS_KEYWORDS: [string, string][] = [
  ["spa", "Spa"],
  ["pool", "Pool"],
  ["gym", "Gym"],
  ["hot tub", "Hot Tub"],
  ["sauna", "Sauna"],
  ["steam", "Steam"],
  ["yoga", "Yoga"],
];

const ROOMS_WHITELIST: string[] = [
  "Memory foam",
  "Egyptian cotton",
  "Rainfall shower",
  "Soaking tub",
  "Minibar",
  "Balcony",
  "Ocean view",
];

function parseWellness(amenities: string | null | undefined): string | null {
  if (!amenities) return null;
  const lower = amenities.toLowerCase();
  const found: string[] = [];
  for (const [kw, label] of WELLNESS_KEYWORDS) {
    if (lower.includes(kw) && found.length < 4) found.push(label);
  }
  return found.length ? found.join(", ") : null;
}

function parseRoomsFeatures(description: string | null | undefined): [string | null, string | null] {
  if (!description) return [null, null];
  const lower = description.toLowerCase();
  const found: string[] = [];
  for (const label of ROOMS_WHITELIST) {
    if (lower.includes(label.toLowerCase()) && found.length < 2) found.push(label);
  }
  return [found[0] ?? null, found[1] ?? null];
}

// ── Tab pill ──

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: "0 0 auto",
        padding: "9px 18px",
        borderRadius: 999,
        border: active ? `1px solid ${GOLD}` : "1px solid rgba(201,169,97,0.25)",
        background: active ? "rgba(201,169,97,0.12)" : "transparent",
        color: active ? GOLD : "rgba(255,255,255,0.7)",
        fontFamily: "var(--font-body, Inter, sans-serif)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = GOLD;
          e.currentTarget.style.borderColor = "rgba(201,169,97,0.55)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
          e.currentTarget.style.borderColor = "rgba(201,169,97,0.25)";
        }
      }}
    >
      {label}
    </button>
  );
}

// ── Tabbed Property Highlights ──

export default function HotelFactGrid({
  neighbourhood,
  city,
  airport_iata,
  airport_distance_min,
  attraction_nearest,
  numberrooms,
  rooms_description,
  restaurants_count,
  room_service_24h,
  signature_restaurant,
  amenities,
  parking_type,
  shuttle_type,
  languages,
}: HotelFactGridData) {
  const locationLabel = neighbourhood || city || null;
  const airportLine =
    airport_distance_min != null && airport_iata
      ? `${airport_distance_min} min from ${airport_iata}`
      : null;

  const roomsLine = numberrooms != null ? `${numberrooms} rooms` : null;
  const [roomsFeature1, roomsFeature2] = parseRoomsFeatures(rooms_description);

  const diningLine = restaurants_count != null ? `${restaurants_count} restaurants` : null;
  const roomServiceLine = room_service_24h ? "24-hour room service" : null;

  const wellnessLine = parseWellness(amenities);

  const languagesLine =
    languages && languages.length ? languages.slice(0, 2).join(", ") : null;

  const tabs = [
    { key: "location", label: "Location", lines: [locationLabel, airportLine, attraction_nearest] },
    { key: "rooms", label: "Rooms", lines: [roomsLine, roomsFeature1, roomsFeature2] },
    { key: "dining", label: "Dining", lines: [diningLine, roomServiceLine, signature_restaurant] },
    { key: "wellness", label: "Wellness", lines: [wellnessLine] },
    { key: "practical", label: "Practical", lines: [parking_type, shuttle_type, languagesLine] },
  ];

  const visibleTabs = tabs.filter((t) => t.lines.some((l) => Boolean(l)));

  const [activeKey, setActiveKey] = useState<string>(visibleTabs[0]?.key ?? "");

  if (visibleTabs.length === 0) return null;

  const active = visibleTabs.find((t) => t.key === activeKey) ?? visibleTabs[0];
  const activeLines = active.lines.filter((l): l is string => Boolean(l));

  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-body, Inter, sans-serif)",
          fontWeight: 500,
          fontSize: 11,
          lineHeight: "14px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: GOLD,
          marginBottom: 14,
        }}
      >
        Property Highlights
      </div>

      <div
        role="tablist"
        aria-label="Property highlight categories"
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          paddingBottom: 4,
        }}
      >
        {visibleTabs.map((t) => (
          <TabButton
            key={t.key}
            label={t.label}
            active={t.key === active.key}
            onClick={() => setActiveKey(t.key)}
          />
        ))}
      </div>

      <div
        role="tabpanel"
        style={{
          marginTop: 14,
          padding: "16px 18px",
          borderRadius: 12,
          border: "1px solid rgba(201,169,97,0.22)",
          background: "rgba(201,169,97,0.04)",
          display: "flex",
          flexWrap: "wrap",
          gap: "8px 22px",
        }}
      >
        {activeLines.map((line, i) => (
          <span
            key={i}
            style={{
              fontFamily: "var(--font-body, Inter, sans-serif)",
              fontWeight: 400,
              fontSize: 13,
              lineHeight: "20px",
              color: "#f5f1e8",
            }}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
