"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import posthog from "posthog-js";
import {
  PREFERRED_PARTNERS,
  getPartnersByType,
  type PreferredPartner,
} from "@/lib/preferredPartners";

const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const GOLD = "var(--luxe-champagne)";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";
const ACTIVE_BG = "rgba(200,170,118,0.12)";
const ACTIVE_BORDER = "rgba(200,170,118,0.55)";

type FilterType = "all" | "alliance" | "brand";

export default function PreferredPartnersPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    posthog.capture("preferred_partners_page_viewed");
  }, []);

  const alliances = getPartnersByType("alliance");
  const brands = getPartnersByType("brand");

  const togglePartner = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const renderGroup = (title: string, partners: PreferredPartner[]) => (
    <div style={{ marginBottom: 56 }}>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 28,
          fontWeight: 500,
          color: TEXT_PRIMARY,
          letterSpacing: "-0.015em",
          margin: "0 0 20px",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {partners.map((partner) => {
          const isSelected = selected.has(partner.name);
          return (
            <button
              key={partner.name}
              onClick={() => togglePartner(partner.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                background: isSelected ? ACTIVE_BG : SURFACE,
                color: TEXT_PRIMARY,
                border: `1px solid ${isSelected ? ACTIVE_BORDER : SURFACE_BORDER}`,
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.18s ease",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  border: `2px solid ${isSelected ? GOLD : "rgba(255,255,255,0.25)"}`,
                  background: isSelected ? GOLD : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 12,
                  color: "#0a0a0a",
                  fontWeight: 700,
                }}
              >
                {isSelected ? "✓" : ""}
              </span>
              <span style={{ fontWeight: 500 }}>{partner.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="luxe">
      <Header />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "140px",
          paddingBottom: "120px",
        }}
      >
        {/* Intro */}
        <section
          style={{
            maxWidth: "920px",
            margin: "0 auto",
            padding: "0 24px 56px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 18,
            }}
          >
            Our network
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              margin: "0 0 24px",
            }}
          >
            <em style={{ fontWeight: 400 }}>Preferred</em> Partners
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 17,
              fontWeight: 300,
              color: TEXT_MUTED,
              lineHeight: 1.75,
              maxWidth: 640,
              margin: "0 auto 18px",
            }}
          >
            Our network spans the world&rsquo;s most respected hotel alliances,
            preferred-access programs, and luxury brand families. Select the
            partners you&rsquo;re interested in to personalise your experience.
          </p>
          <p
            style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: GOLD,
            }}
          >
            {PREFERRED_PARTNERS.length} partners · {alliances.length} alliances · {brands.length} brands
          </p>
        </section>

        {/* Filter tabs */}
        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 24px 32px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            {(
              [
                { key: "all", label: "All Partners" },
                { key: "alliance", label: "Alliances & Programs" },
                { key: "brand", label: "Brands & Groups" },
              ] as const
            ).map(({ key, label }) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 9999,
                    border: `1px solid ${active ? GOLD : SURFACE_BORDER}`,
                    background: active ? GOLD : "transparent",
                    color: active ? "#0a0a0a" : TEXT_PRIMARY,
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    transition: "all 0.18s ease",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {selected.size > 0 && (
            <p
              style={{
                fontFamily: "var(--font-body)",
                textAlign: "center",
                color: GOLD,
                marginTop: 14,
                fontWeight: 600,
                fontSize: 14,
                letterSpacing: "0.04em",
              }}
            >
              {selected.size} partner{selected.size !== 1 ? "s" : ""} selected
            </p>
          )}
        </section>

        {/* Partner directory */}
        <section
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          {(filter === "all" || filter === "alliance") &&
            renderGroup("Alliances & Programs", alliances)}
          {(filter === "all" || filter === "brand") &&
            renderGroup("Brands & Groups", brands)}
        </section>
      </main>
      <Footer />
    </div>
  );
}
