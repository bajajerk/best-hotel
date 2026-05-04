"use client";

import { useEffect, useRef, useState } from "react";

const GOLD = "#c9a96e";

type Destination = { city: string; country: string; img: string };
type Season = {
  name: string;
  icon: string;
  range: string;
  accent: string;
  destinations: Destination[];
};

const SEASONS: Season[] = [
  {
    name: "Summer",
    icon: "☀",
    range: "Jun – Aug",
    accent: "#c9a96e",
    destinations: [
      {
        city: "Santorini",
        country: "Greece",
        img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80&auto=format&fit=crop",
      },
      {
        city: "Bali",
        country: "Indonesia",
        img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&q=80&auto=format&fit=crop",
      },
      {
        city: "Cape Town",
        country: "South Africa",
        img: "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&q=80&auto=format&fit=crop",
      },
    ],
  },
  {
    name: "Autumn",
    icon: "🍂",
    range: "Sep – Nov",
    accent: "#b8860b",
    destinations: [
      {
        city: "Kyoto",
        country: "Japan",
        img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80&auto=format&fit=crop",
      },
      {
        city: "Prague",
        country: "Czech Republic",
        img: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=1200&q=80&auto=format&fit=crop",
      },
      {
        city: "Budapest",
        country: "Hungary",
        img: "https://images.unsplash.com/photo-1541849546-216549ae216d?w=1200&q=80&auto=format&fit=crop",
      },
    ],
  },
  {
    name: "Winter",
    icon: "❄",
    range: "Dec – Feb",
    accent: "#8ab4d4",
    destinations: [
      {
        city: "Dubai",
        country: "UAE",
        img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&q=80&auto=format&fit=crop",
      },
      {
        city: "Maldives",
        country: "Maldives",
        img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80&auto=format&fit=crop",
      },
      {
        city: "Rajasthan",
        country: "India",
        img: "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&q=80&auto=format&fit=crop",
      },
    ],
  },
  {
    name: "Spring",
    icon: "🌸",
    range: "Mar – May",
    accent: "#c8a0b4",
    destinations: [
      {
        city: "Tokyo",
        country: "Japan",
        img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&q=80&auto=format&fit=crop",
      },
      {
        city: "Amsterdam",
        country: "Netherlands",
        img: "https://images.unsplash.com/photo-1534351590666-13e3e96c5017?w=1200&q=80&auto=format&fit=crop",
      },
      {
        city: "Istanbul",
        country: "Turkey",
        img: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&q=80&auto=format&fit=crop",
      },
    ],
  },
];

const MONTSERRAT =
  "'Montserrat', var(--font-body), system-ui, -apple-system, sans-serif";
const CORMORANT =
  "'Cormorant Garamond', var(--font-display), Georgia, serif";

function SeasonTile({
  season,
  isOpen,
  onToggle,
}: {
  season: Season;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState(0);
  const [imgIndex, setImgIndex] = useState(0);
  const [fading, setFading] = useState(false);

  // Image rotation: only run while tile is open. Reset to 0 on close.
  useEffect(() => {
    if (!isOpen) {
      setImgIndex(0);
      setFading(false);
      return;
    }
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setFading(true);
      fadeTimer = setTimeout(() => {
        setImgIndex((i) => (i + 1) % season.destinations.length);
        setFading(false);
      }, 400);
    }, 2500);
    return () => {
      clearInterval(interval);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [isOpen, season.destinations.length]);

  // Sync max-height with the actual rendered body so the panel can grow with
  // any content (e.g. responsive font sizes pushing rows).
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (isOpen) {
      // Read scrollHeight after layout
      const next = el.scrollHeight;
      setMaxH(next);
    } else {
      setMaxH(0);
    }
  }, [isOpen, imgIndex]);

  const active = season.destinations[imgIndex];
  const headerId = `season-h-${season.name}`;
  const panelId = `season-p-${season.name}`;

  return (
    <div
      style={{
        background: "#111",
        border: `1px solid ${isOpen ? season.accent : "rgba(255,255,255,0.08)"}`,
        borderRadius: 14,
        overflow: "hidden",
        transition:
          "border-color 0.4s ease, background 0.4s ease",
      }}
    >
      <button
        type="button"
        id={headerId}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: 20,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "inherit",
          textAlign: "left",
          fontFamily: "inherit",
          gap: 12,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: 22,
              lineHeight: 1,
              color: season.accent,
              flexShrink: 0,
            }}
          >
            {season.icon}
          </span>
          <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
              style={{
                fontFamily: MONTSERRAT,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color: season.accent,
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              {season.range}
            </span>
            <span
              style={{
                fontFamily: CORMORANT,
                fontSize: 28,
                fontWeight: 300,
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
              }}
            >
              {season.name}
            </span>
          </span>
        </span>
        <span
          aria-hidden="true"
          style={{
            fontFamily: MONTSERRAT,
            fontSize: 22,
            fontWeight: 300,
            color: season.accent,
            lineHeight: 1,
            flexShrink: 0,
            transition: "transform 0.4s ease",
            display: "inline-block",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            width: 18,
            textAlign: "center",
          }}
        >
          {isOpen ? "−" : "+"}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        style={{
          maxHeight: maxH,
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transition:
            "max-height 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease",
        }}
      >
        <div ref={bodyRef}>
          {/* Rotating image block */}
          <div
            style={{
              margin: "0 20px",
              position: "relative",
              height: 200,
              borderRadius: 12,
              overflow: "hidden",
              background: "#0a0a0a",
            }}
          >
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
                transform: fading ? "scale(1.06)" : "scale(1.03)",
                transition:
                  "opacity 0.4s ease, transform 0.4s ease",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.75) 100%)",
              }}
            />
            {/* Bottom-left labels */}
            <div
              style={{
                position: "absolute",
                left: 16,
                bottom: 14,
                right: 100,
              }}
            >
              <div
                style={{
                  fontFamily: MONTSERRAT,
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  marginBottom: 4,
                }}
              >
                {active.country}
              </div>
              <div
                style={{
                  fontFamily: CORMORANT,
                  fontSize: 22,
                  fontWeight: 300,
                  color: "#ffffff",
                  lineHeight: 1.1,
                  letterSpacing: "-0.005em",
                }}
              >
                {active.city}
              </div>
            </div>
            {/* Bottom-right dot indicators */}
            <div
              style={{
                position: "absolute",
                right: 16,
                bottom: 18,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {season.destinations.map((d, i) => {
                const isActive = i === imgIndex;
                return (
                  <button
                    key={d.city}
                    type="button"
                    aria-label={`Show ${d.city}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFading(false);
                      setImgIndex(i);
                    }}
                    style={{
                      background: isActive
                        ? season.accent
                        : "rgba(255,255,255,0.35)",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      width: isActive ? 14 : 5,
                      height: 5,
                      borderRadius: 999,
                      transition:
                        "width 0.3s ease, background 0.3s ease",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Destination list */}
          <div style={{ padding: "16px 20px 0" }}>
            {season.destinations.map((d, i) => {
              const isActive = i === imgIndex;
              return (
                <button
                  key={d.city}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFading(false);
                    setImgIndex(i);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 0",
                    background: "transparent",
                    border: "none",
                    borderTop:
                      i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
                    cursor: "pointer",
                    color: "inherit",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 0,
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
                          : "rgba(255,255,255,0.25)",
                        flexShrink: 0,
                        transition: "background 0.3s ease",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: CORMORANT,
                        fontSize: 20,
                        fontWeight: 300,
                        color: isActive
                          ? "#ffffff"
                          : "rgba(255,255,255,0.4)",
                        lineHeight: 1.2,
                        letterSpacing: "-0.005em",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {d.city}
                    </span>
                  </span>
                  <span
                    style={{
                      fontFamily: MONTSERRAT,
                      fontSize: 9,
                      fontWeight: 500,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.3)",
                      flexShrink: 0,
                    }}
                  >
                    {d.country}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "block",
              width: "calc(100% - 40px)",
              margin: "4px 20px 22px",
              padding: "14px 16px",
              background: "transparent",
              border: `1px solid ${season.accent}`,
              borderRadius: 100,
              color: season.accent,
              fontFamily: MONTSERRAT,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
          >
            Explore {season.name} stays &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SeasonalAccordion() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section
      aria-labelledby="seasonal-accordion-heading"
      style={{
        background: "#0a0a0a",
        padding: "56px 20px 48px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontFamily: MONTSERRAT,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 14,
            }}
          >
            Travel Calendar
          </div>
          <h2
            id="seasonal-accordion-heading"
            style={{
              fontFamily: CORMORANT,
              fontSize: 36,
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: "#ffffff",
              margin: 0,
            }}
          >
            When to go,{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: "rgba(255,255,255,0.5)",
              }}
            >
              where to go
            </em>
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SEASONS.map((season, i) => (
            <SeasonTile
              key={season.name}
              season={season}
              isOpen={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
