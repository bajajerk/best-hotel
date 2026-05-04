"use client";

import React from "react";

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

// ── Icon components — monoline, 1.5px stroke, #C9A961, 18×18 ──

function PinIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={GOLD} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={GOLD} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      <path d="M2 20V10a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10" />
      <path d="M2 14h20" />
      <path d="M2 20h20" />
      <path d="M7 14V9" />
      <path d="M17 14V9" />
    </svg>
  );
}

function UtensilsIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={GOLD} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      <path d="M3 2v7c0 1.1.9 2 2 2s2-.9 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2h-4c0 0 0 7 2 7v6" />
      <path d="M19 22v-7" />
    </svg>
  );
}

function SpaIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={GOLD} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v1" />
      <path d="M12 20v1" />
      <path d="M3 12h1" />
      <path d="M20 12h1" />
      <path d="M5.64 5.64l.71.71" />
      <path d="M17.66 17.66l.71.71" />
      <path d="M5.64 18.36l.71-.71" />
      <path d="M17.66 6.34l.71-.71" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke={GOLD} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

// ── Column ──

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-body, Inter, sans-serif)",
  fontWeight: 500,
  fontSize: 11,
  lineHeight: "14px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: GOLD,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "var(--font-body, Inter, sans-serif)",
  fontWeight: 400,
  fontSize: 13,
  lineHeight: "20px",
  color: "#f5f1e8",
  margin: 0,
};

interface FactColumnProps {
  icon: React.ReactNode;
  label: string;
  lines: (string | null | undefined)[];
}

function FactColumn({ icon, label, lines }: FactColumnProps) {
  const visibleLines = lines.filter((l): l is string => Boolean(l)).slice(0, 3);
  if (visibleLines.length === 0) return null;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        {icon}
        <span style={labelStyle}>{label}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {visibleLines.map((line, i) => (
          <p key={i} style={bodyStyle}>{line}</p>
        ))}
      </div>
    </div>
  );
}

// ── Grid ──

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

  const columns = [
    { icon: <PinIcon />, label: "Location", lines: [locationLabel, airportLine, attraction_nearest] },
    { icon: <BedIcon />, label: "Rooms", lines: [roomsLine, roomsFeature1, roomsFeature2] },
    { icon: <UtensilsIcon />, label: "Dining", lines: [diningLine, roomServiceLine, signature_restaurant] },
    { icon: <SpaIcon />, label: "Wellness", lines: [wellnessLine] },
    { icon: <InfoIcon />, label: "Practical", lines: [parking_type, shuttle_type, languagesLine] },
  ];

  const visibleColumns = columns.filter(
    (col) => col.lines.some((l) => Boolean(l))
  );

  if (visibleColumns.length === 0) return null;

  return (
    <div
      className="hotel-fact-grid"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "24px 0",
      }}
    >
      {visibleColumns.map((col) => (
        <FactColumn key={col.label} icon={col.icon} label={col.label} lines={col.lines} />
      ))}
    </div>
  );
}
