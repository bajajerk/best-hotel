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
    <div style={{ marginBottom: "48px" }}>
      <h2
        className="type-heading-2"
        style={{
          color: "var(--ink)",
          marginBottom: "20px",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "12px",
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
                gap: "12px",
                padding: "14px 18px",
                background: isSelected ? "var(--ink)" : "var(--white)",
                color: isSelected ? "var(--cream)" : "var(--ink)",
                border: isSelected
                  ? "1px solid var(--ink)"
                  : "1px solid var(--cream-border)",
                borderRadius: "8px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
                fontFamily: "inherit",
                fontSize: "14px",
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "4px",
                  border: isSelected
                    ? "2px solid var(--gold)"
                    : "2px solid var(--ink-light)",
                  background: isSelected ? "var(--gold)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: "12px",
                  color: "#1a1710",
                  fontWeight: 700,
                }}
              >
                {isSelected ? "\u2713" : ""}
              </span>
              <span style={{ fontWeight: 500 }}>{partner.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <Header />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
          background: "var(--cream)",
        }}
      >
        {/* Intro */}
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 24px 48px",
            textAlign: "center",
          }}
        >
          <h1
            className="type-display-3"
            style={{
              color: "var(--ink)",
              marginBottom: "24px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Preferred Partners
          </h1>
          <p
            className="type-body-lg"
            style={{
              color: "var(--ink-light)",
              maxWidth: "640px",
              margin: "0 auto 16px",
              lineHeight: 1.7,
            }}
          >
            Our network spans the world&apos;s most respected hotel alliances,
            preferred-access programs, and luxury brand families. Select the
            partners you&apos;re interested in to personalise your experience.
          </p>
          <p
            className="type-label"
            style={{
              color: "var(--ink-mid)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {PREFERRED_PARTNERS.length} partners across {alliances.length}{" "}
            alliances &amp; {brands.length} brands
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
              gap: "8px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "8px",
            }}
          >
            {(
              [
                { key: "all", label: "All Partners" },
                { key: "alliance", label: "Alliances & Programs" },
                { key: "brand", label: "Brands & Groups" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="type-label"
                style={{
                  padding: "10px 24px",
                  borderRadius: "6px",
                  border:
                    filter === key
                      ? "1px solid var(--ink)"
                      : "1px solid var(--cream-border)",
                  background: filter === key ? "var(--ink)" : "var(--white)",
                  color: filter === key ? "var(--cream)" : "var(--ink)",
                  cursor: "pointer",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {selected.size > 0 && (
            <p
              className="type-body"
              style={{
                textAlign: "center",
                color: "var(--gold)",
                marginTop: "12px",
                fontWeight: 600,
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
    </>
  );
}
