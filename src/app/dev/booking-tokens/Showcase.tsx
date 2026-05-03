"use client";

import React, { useState } from "react";
import {
  Pill,
  Button,
  Tag,
  FactCard,
  Rating,
  PriceBlock,
} from "@/components/primitives/booking";
import {
  colorDark,
  colorLight,
  type,
  space,
  radius,
} from "@/lib/design-tokens/booking-flow";

type Theme = "dark" | "light";

const sectionStyle: React.CSSProperties = {
  padding: "var(--bf-space-10) var(--bf-space-7)",
  borderTop: "1px solid var(--bf-color-border-soft)",
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--bf-font-sans)",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--bf-color-accent)",
  marginBottom: "var(--bf-space-5)",
};

const sectionTitleStyle: React.CSSProperties = {
  fontFamily: "var(--bf-font-serif)",
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: 26,
  lineHeight: "30px",
  color: "var(--bf-color-text-primary)",
  marginBottom: "var(--bf-space-7)",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--bf-space-4)",
  alignItems: "center",
};

const swatchGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "var(--bf-space-4)",
};

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--bf-space-2)",
        padding: "var(--bf-space-4)",
        background: "var(--bf-color-bg-surface-soft)",
        border: "1px solid var(--bf-color-border-soft)",
        borderRadius: "var(--bf-radius-md)",
      }}
    >
      <span
        style={{
          width: "100%",
          height: 56,
          borderRadius: "var(--bf-radius-sm)",
          background: value,
          border: "1px solid var(--bf-color-border-default)",
        }}
      />
      <span
        style={{
          fontFamily: "var(--bf-font-sans)",
          fontSize: 11,
          color: "var(--bf-color-text-muted)",
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontFamily: "var(--bf-font-sans)",
          fontSize: 10,
          color: "var(--bf-color-text-soft)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export default function BookingTokensShowcase() {
  const [theme, setTheme] = useState<Theme>("dark");
  const palette = theme === "dark" ? colorDark : colorLight;

  return (
    <div
      data-bf-theme={theme}
      style={{
        minHeight: "100vh",
        background: "var(--bf-color-bg-primary)",
        color: "var(--bf-color-text-primary)",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "var(--bf-space-5) var(--bf-space-7)",
          background: "var(--bf-color-bg-overlay)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--bf-color-border-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--bf-space-5)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span
            style={{
              fontFamily: "var(--bf-font-sans)",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--bf-color-accent)",
              fontWeight: 500,
            }}
          >
            Ticket 01 · Booking Flow
          </span>
          <h1
            style={{
              fontFamily: "var(--bf-font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 26,
              margin: 0,
              color: "var(--bf-color-text-primary)",
            }}
          >
            Tokens &amp; Primitives
          </h1>
        </div>
        <div style={rowStyle}>
          <Pill
            variant={theme === "dark" ? "active" : "default"}
            onClick={() => setTheme("dark")}
          >
            Dark
          </Pill>
          <Pill
            variant={theme === "light" ? "active" : "default"}
            onClick={() => setTheme("light")}
          >
            Light (v2)
          </Pill>
        </div>
      </header>

      {/* ── Color tokens ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>01 · Color</div>
        <h2 style={sectionTitleStyle}>Palette</h2>
        <div style={swatchGridStyle}>
          {Object.entries(palette).map(([name, value]) => (
            <Swatch key={name} name={name} value={value} />
          ))}
        </div>
      </section>

      {/* ── Type scale ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>02 · Typography</div>
        <h2 style={sectionTitleStyle}>Type scale</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--bf-space-5)" }}>
          {Object.entries(type).map(([name, t]) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "var(--bf-space-7)",
                paddingBottom: "var(--bf-space-3)",
                borderBottom: "1px solid var(--bf-color-border-soft)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--bf-font-sans)",
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--bf-color-text-soft)",
                  width: 96,
                  flexShrink: 0,
                }}
              >
                {name}
              </span>
              <span
                style={{
                  fontFamily:
                    t.family === "serif" ? "var(--bf-font-serif)" : "var(--bf-font-sans)",
                  fontStyle: t.italic ? "italic" : "normal",
                  fontWeight: t.weight,
                  fontSize: t.size,
                  lineHeight: `${t.line}px`,
                  letterSpacing: t.letterSpacing,
                  textTransform: t.uppercase ? "uppercase" : "none",
                  color: "var(--bf-color-text-primary)",
                }}
              >
                The quiet luxury of arrival
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Spacing + radius ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>03 · Spacing &amp; Radius</div>
        <h2 style={sectionTitleStyle}>Geometry</h2>
        <div style={{ ...rowStyle, marginBottom: "var(--bf-space-7)" }}>
          {Object.entries(space).map(([name, px]) => (
            <div
              key={name}
              style={{ display: "flex", alignItems: "center", gap: "var(--bf-space-2)" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: px,
                  height: px,
                  background: "var(--bf-color-accent-soft)",
                  border: "1px solid var(--bf-color-accent-line)",
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--bf-font-sans)",
                  fontSize: 11,
                  color: "var(--bf-color-text-muted)",
                }}
              >
                {name} · {px}
              </span>
            </div>
          ))}
        </div>
        <div style={rowStyle}>
          {Object.entries(radius).map(([name, r]) => (
            <div
              key={name}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 56,
                  height: 56,
                  background: "var(--bf-color-bg-surface-soft)",
                  border: "1px solid var(--bf-color-border-default)",
                  borderRadius: r === 999 ? 999 : r,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--bf-font-sans)",
                  fontSize: 10,
                  color: "var(--bf-color-text-soft)",
                }}
              >
                {name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pill ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>04 · Pill</div>
        <h2 style={sectionTitleStyle}>Filters &amp; tags</h2>
        <div style={rowStyle}>
          <Pill variant="default">Default</Pill>
          <Pill variant="active">Active</Pill>
          <Pill variant="accent">Accent</Pill>
          <Pill variant="micro">Micro</Pill>
        </div>
      </section>

      {/* ── Button ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>05 · Button</div>
        <h2 style={sectionTitleStyle}>Actions</h2>
        <div style={{ ...rowStyle, marginBottom: "var(--bf-space-5)" }}>
          <Button variant="primary">Reserve</Button>
          <Button variant="secondary">View rooms</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="icon" aria-label="favourite">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Button>
        </div>
        <div style={rowStyle}>
          <Button variant="primary" size="sm">Small primary</Button>
          <Button variant="secondary" size="sm">Small secondary</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" loading>Loading</Button>
        </div>
      </section>

      {/* ── Tag ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>06 · Tag</div>
        <h2 style={sectionTitleStyle}>Status labels</h2>
        <div style={rowStyle}>
          <Tag tone="amber">Member rate</Tag>
          <Tag tone="success" withDot>Free cancellation</Tag>
          <Tag tone="warning" withDot>Limited time</Tag>
          <Tag tone="danger" withDot>Non-refundable</Tag>
        </div>
      </section>

      {/* ── FactCard ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>07 · FactCard</div>
        <h2 style={sectionTitleStyle}>Hotel fact grid</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--bf-space-4)",
          }}
        >
          <FactCard
            label="Location"
            lines={["South Bank", "12 min from LHR", "Tate Modern · 3 min walk"]}
          />
          <FactCard
            label="Rooms"
            lines={["156 rooms", "Memory foam", "Egyptian cotton"]}
          />
          <FactCard
            label="Dining"
            lines={["3 restaurants", "24-hour room service", "Hide Above"]}
          />
        </div>
      </section>

      {/* ── Rating ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>08 · Rating</div>
        <h2 style={sectionTitleStyle}>Reviews</h2>
        <div style={rowStyle}>
          <Rating value={9.4} size="sm" />
          <Rating value={9.4} size="md" />
          <Rating value={9.4} size="lg" />
          <Rating value={4.8} outOf={5} size="md" />
          <Rating value={9.4} size="md" showOutOf={false} />
        </div>
      </section>

      {/* ── PriceBlock ── */}
      <section style={sectionStyle}>
        <div style={sectionLabelStyle}>09 · PriceBlock</div>
        <h2 style={sectionTitleStyle}>Pricing</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--bf-space-7)" }}>
          <PriceBlock
            variant="stacked"
            memberLabel="Member rate"
            amount="$420"
            subline="per night · taxes included"
          />
          <PriceBlock
            variant="stacked"
            emphasis
            memberLabel="Member rate"
            amount="$420"
            subline="per night · taxes included"
          />
          <PriceBlock
            variant="inline"
            memberLabel="Member"
            amount="$420"
            subline="/ night"
          />
        </div>
      </section>

      <footer
        style={{
          padding: "var(--bf-space-10) var(--bf-space-7)",
          borderTop: "1px solid var(--bf-color-border-soft)",
          color: "var(--bf-color-text-faint)",
          fontFamily: "var(--bf-font-sans)",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        VOY · Booking flow design system
      </footer>
    </div>
  );
}
