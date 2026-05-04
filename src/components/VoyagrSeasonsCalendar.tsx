"use client";

import { useEffect, useState } from "react";

const BG = "#0a0a0a";
const GOLD = "#c9a96e";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Montserrat", system-ui, -apple-system, sans-serif';

type Destination = { city: string; country: string; img: string };

type Season = {
  name: string;
  icon: string;
  range: string;
  accent: string;
  border: string;
  bg: string;
  destinations: Destination[];
};

const SEASONS: Season[] = [
  {
    name: "Summer",
    icon: "☀",
    range: "JUN – AUG",
    accent: "#c9a96e",
    border: "rgba(201,169,110,0.3)",
    bg: "rgba(201,169,110,0.06)",
    destinations: [
      {
        city: "Santorini",
        country: "Greece",
        img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&q=85&auto=format&fit=crop",
      },
      {
        city: "Bali",
        country: "Indonesia",
        img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=85&auto=format&fit=crop",
      },
      {
        city: "Cape Town",
        country: "South Africa",
        img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&q=85&auto=format&fit=crop",
      },
    ],
  },
  {
    name: "Autumn",
    icon: "🍂",
    range: "SEP – NOV",
    accent: "#c8960c",
    border: "rgba(200,150,12,0.3)",
    bg: "rgba(200,150,12,0.06)",
    destinations: [
      {
        city: "Kyoto",
        country: "Japan",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=85&auto=format&fit=crop",
      },
      {
        city: "Prague",
        country: "Czech Republic",
        img: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&q=85&auto=format&fit=crop",
      },
      {
        city: "Budapest",
        country: "Hungary",
        img: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=800&q=85&auto=format&fit=crop",
      },
    ],
  },
  {
    name: "Winter",
    icon: "❄",
    range: "DEC – FEB",
    accent: "#8ab4d4",
    border: "rgba(138,180,212,0.3)",
    bg: "rgba(138,180,212,0.06)",
    destinations: [
      {
        city: "Dubai",
        country: "UAE",
        img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=85&auto=format&fit=crop",
      },
      {
        city: "Maldives",
        country: "Maldives",
        img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800&q=85&auto=format&fit=crop",
      },
      {
        city: "Rajasthan",
        country: "India",
        img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=85&auto=format&fit=crop",
      },
    ],
  },
  {
    name: "Spring",
    icon: "🌸",
    range: "MAR – MAY",
    accent: "#d4a0b8",
    border: "rgba(212,160,184,0.3)",
    bg: "rgba(212,160,184,0.06)",
    destinations: [
      {
        city: "Tokyo",
        country: "Japan",
        img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=85&auto=format&fit=crop",
      },
      {
        city: "Amsterdam",
        country: "Netherlands",
        img: "https://images.unsplash.com/photo-1534351590666-13e3e96c5017?w=800&q=85&auto=format&fit=crop",
      },
      {
        city: "Istanbul",
        country: "Turkey",
        img: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800&q=85&auto=format&fit=crop",
      },
    ],
  },
];

export default function VoyagrSeasonsCalendar() {
  return (
    <div
      style={{
        background: BG,
        color: "#fff",
        minHeight: "100vh",
        fontFamily: SANS,
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');`,
        }}
      />
      <NavBar />
      <SectionHeader />
      <SeasonGrid />
    </div>
  );
}

function NavBar() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        padding: "20px 64px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: BG,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Logo />

      <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
        {["Hotels", "Cities", "Occasions", "Concierge"].map((label) => (
          <a
            key={label}
            href="#"
            style={{
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
            }}
          >
            {label}
          </a>
        ))}
      </div>

      <a
        href="#"
        style={{
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          background: GOLD,
          color: "#000",
          borderRadius: 100,
          padding: "10px 22px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Search Hotels
      </a>
    </nav>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          color: "#fff",
          fontSize: 16,
          letterSpacing: "0.02em",
        }}
      >
        VOYAGR
      </span>
      <span
        style={{
          fontFamily: SERIF,
          fontStyle: "italic",
          fontWeight: 400,
          color: GOLD,
          fontSize: 18,
        }}
      >
        Club
      </span>
    </div>
  );
}

function SectionHeader() {
  return (
    <header
      style={{
        maxWidth: 1380,
        margin: "0 auto",
        padding: "72px 56px 48px",
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "3.5px",
          textTransform: "uppercase",
          color: GOLD,
          marginBottom: 18,
        }}
      >
        Travel Calendar
      </div>
      <h1
        style={{
          fontFamily: SERIF,
          fontSize: 52,
          fontWeight: 300,
          color: "#fff",
          lineHeight: 1.1,
          letterSpacing: "-0.01em",
          margin: 0,
        }}
      >
        When to go,{" "}
        <em
          style={{
            fontStyle: "italic",
            fontWeight: 300,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          where to go
        </em>
      </h1>
      <p
        style={{
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 300,
          color: "rgba(255,255,255,0.35)",
          marginTop: 12,
          marginBottom: 0,
        }}
      >
        Four seasons. Twelve destinations. One concierge to book them all.
      </p>
    </header>
  );
}

function SeasonGrid() {
  return (
    <section
      style={{
        maxWidth: 1380,
        margin: "0 auto",
        padding: "0 56px 96px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 16,
      }}
    >
      {SEASONS.map((season) => (
        <SeasonCard key={season.name} season={season} />
      ))}
    </section>
  );
}

function SeasonCard({ season }: { season: Season }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [hover, setHover] = useState(false);
  const [ctaHover, setCtaHover] = useState(false);

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setFading(true);
      fadeTimer = setTimeout(() => {
        setImgIdx((i) => (i + 1) % season.destinations.length);
        setFading(false);
      }, 380);
    }, 2800);
    return () => {
      clearInterval(interval);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [season.destinations.length]);

  const active = season.destinations[imgIdx];

  const jumpTo = (i: number) => {
    setFading(false);
    setImgIdx(i);
  };

  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 20,
        border: `1px solid ${hover ? season.accent : season.border}`,
        background: season.bg,
        overflow: "hidden",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hover ? "0 24px 64px rgba(0,0,0,0.5)" : "none",
        transition:
          "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
      }}
    >
      {/* Image block */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <img
          src={active.img}
          alt={`${active.city}, ${active.country}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: fading ? 0 : 1,
            transform: fading ? "scale(1.05)" : "scale(1)",
            transition: "opacity 400ms ease, transform 400ms ease",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* Top-left: season identity */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            aria-hidden="true"
            style={{ fontSize: 22, lineHeight: 1, color: season.accent }}
          >
            {season.icon}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontFamily: SANS,
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: season.accent,
                lineHeight: 1.2,
              }}
            >
              {season.range}
            </span>
            <span
              style={{
                fontFamily: SERIF,
                fontSize: 22,
                fontWeight: 300,
                color: "#fff",
                lineHeight: 1.1,
                letterSpacing: "-0.005em",
              }}
            >
              {season.name}
            </span>
          </div>
        </div>

        {/* Bottom: current destination */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 16,
            right: 80,
          }}
        >
          <div
            style={{
              fontFamily: SANS,
              fontSize: 8,
              fontWeight: 500,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              marginBottom: 4,
            }}
          >
            {active.country}
          </div>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 20,
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.005em",
            }}
          >
            {active.city}
          </div>
        </div>

        {/* Bottom-right: dot indicators */}
        <div
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {season.destinations.map((d, i) => {
            const isActive = i === imgIdx;
            return (
              <button
                key={d.city}
                type="button"
                aria-label={`Show ${d.city}`}
                onClick={() => jumpTo(i)}
                style={{
                  background: isActive
                    ? season.accent
                    : "rgba(255,255,255,0.3)",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  width: isActive ? 14 : 4,
                  height: 3,
                  borderRadius: 999,
                  transition: "all 0.3s ease",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: 20 }}>
        {season.destinations.map((d, i) => {
          const isActive = i === imgIdx;
          const isLast = i === season.destinations.length - 1;
          return (
            <button
              key={d.city}
              type="button"
              onClick={() => jumpTo(i)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 0",
                borderBottom: isLast
                  ? "none"
                  : "1px solid rgba(255,255,255,0.06)",
                background: "transparent",
                border: 0,
                borderTop: 0,
                borderLeft: 0,
                borderRight: 0,
                cursor: "pointer",
                color: "inherit",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "opacity 0.2s, color 0.2s",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: isActive
                    ? season.accent
                    : "rgba(255,255,255,0.15)",
                  flexShrink: 0,
                  transition: "background 0.2s ease",
                }}
              />
              <span
                style={{
                  flex: 1,
                  fontFamily: SERIF,
                  fontSize: 19,
                  fontWeight: 300,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.45)",
                  lineHeight: 1.2,
                  letterSpacing: "-0.005em",
                  transition: "color 0.2s ease",
                }}
              >
                {d.city}
              </span>
              <span
                style={{
                  fontFamily: SANS,
                  fontSize: 8,
                  fontWeight: 500,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                  flexShrink: 0,
                }}
              >
                {d.country}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onMouseEnter={() => setCtaHover(true)}
          onMouseLeave={() => setCtaHover(false)}
          style={{
            marginTop: 18,
            width: "100%",
            padding: "12px 0",
            borderRadius: 100,
            border: `1px solid ${season.accent}`,
            background: ctaHover ? season.accent : "transparent",
            color: ctaHover ? "#0a0a0a" : season.accent,
            fontFamily: SANS,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Explore {season.name} →
        </button>
      </div>
    </article>
  );
}
