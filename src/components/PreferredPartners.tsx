"use client";

import { useState, useCallback } from "react";
import { getPartnersByType, type Partner, type PartnerType } from "@/lib/partners";

const TABS: { key: PartnerType; label: string }[] = [
  { key: "Alliance", label: "Alliances / Programs" },
  { key: "Brand", label: "Hotel Brands / Groups" },
  { key: "Property", label: "Iconic Properties" },
];

const TAG_COLORS: Record<PartnerType, { bg: string; text: string }> = {
  Alliance: { bg: "var(--gold-pale)", text: "var(--gold)" },
  Brand: { bg: "#e8ede9", text: "var(--success)" },
  Property: { bg: "#ebe4f0", text: "#6b4c8a" },
};

function LogoFallback({ name }: { name: string }) {
  const initials = name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream-deep)",
        borderRadius: "8px",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: "22px",
        letterSpacing: "0.04em",
        color: "var(--ink-light)",
      }}
    >
      {initials}
    </div>
  );
}

function PartnerTile({ partner }: { partner: Partner }) {
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const tagStyle = TAG_COLORS[partner.type];

  return (
    <div
      style={{
        background: "var(--white)",
        border: `1px solid ${hovered ? "var(--gold)" : "var(--cream-border)"}`,
        borderRadius: "10px",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered
          ? "0 4px 20px rgba(201, 168, 76, 0.12)"
          : "0 1px 4px rgba(26, 23, 16, 0.04)",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Logo */}
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "8px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {imgError ? (
          <LogoFallback name={partner.name} />
        ) : (
          <img
            src={partner.logo_url}
            alt={`${partner.name} logo`}
            loading="lazy"
            width={72}
            height={72}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              background: "var(--cream-deep)",
              borderRadius: "8px",
              padding: "8px",
            }}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      {/* Name */}
      <h3
        className="type-heading-3"
        style={{
          color: "var(--ink)",
          textAlign: "center",
          fontSize: "15px",
          lineHeight: 1.3,
          margin: 0,
        }}
      >
        {partner.name}
      </h3>

      {/* Location (properties only) */}
      {partner.location && (
        <p
          style={{
            fontSize: "12px",
            color: "var(--ink-light)",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          {partner.location}
        </p>
      )}

      {/* Tags row */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Category tag */}
        <span
          style={{
            fontSize: "10px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "3px 10px",
            borderRadius: "20px",
            background: tagStyle.bg,
            color: tagStyle.text,
          }}
        >
          {partner.type}
        </span>

        {/* Perks badge */}
        {partner.has_perks && (
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: "20px",
              background: "var(--gold)",
              color: "var(--ink)",
            }}
          >
            Perks Available
          </span>
        )}
      </div>
    </div>
  );
}

export default function PreferredPartners() {
  const [activeTab, setActiveTab] = useState<PartnerType>("Alliance");
  const grouped = getPartnersByType();

  const handleTabClick = useCallback((key: PartnerType) => {
    setActiveTab(key);
  }, []);

  return (
    <section
      id="partners"
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "80px 24px 0",
      }}
    >
      {/* Section header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: "12px",
          }}
        >
          Our Network
        </p>
        <h2
          className="type-display-3"
          style={{
            color: "var(--ink)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "16px",
          }}
        >
          Preferred Partners
        </h2>
        <p
          className="type-body-lg"
          style={{
            color: "var(--ink-light)",
            maxWidth: "600px",
            margin: "0 auto",
            lineHeight: 1.7,
          }}
        >
          Alliances, brands &amp; iconic properties — our curated network of
          partners where Voyagr Club members enjoy exclusive rates and elevated
          experiences.
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "36px",
          flexWrap: "wrap",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabClick(tab.key)}
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "14px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                padding: "10px 24px",
                borderRadius: "6px",
                border: isActive
                  ? "1.5px solid var(--gold)"
                  : "1px solid var(--cream-border)",
                background: isActive ? "var(--gold)" : "var(--ink)",
                color: isActive ? "var(--ink)" : "var(--ink-mid)",
                cursor: "pointer",
                transition:
                  "background 0.2s, color 0.2s, border-color 0.2s",
              }}
            >
              {tab.label}
              <span
                style={{
                  marginLeft: "8px",
                  fontSize: "11px",
                  opacity: 0.7,
                }}
              >
                ({grouped[tab.key].length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Logo grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        {grouped[activeTab].map((partner) => (
          <PartnerTile key={partner.name} partner={partner} />
        ))}
      </div>
    </section>
  );
}
