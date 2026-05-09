"use client";

const LABEL_GOLD = "#b8956a";
const ITALIC_GOLD = "#c9a66b";
const CARD_BG = "#0c0c0c";

const INTER =
  "'Inter', var(--font-body), system-ui, -apple-system, sans-serif";
const CORMORANT =
  "'Cormorant Garamond', var(--font-display), Georgia, serif";

type Destination = { city: string; cc: string };

type Season = {
  name: string;
  range: string;
  href: string;
  img: string;
  imgAlt: string;
  destinations: Destination[];
};

const SEASONS: Season[] = [
  {
    name: "Summer",
    range: "JUN – AUG",
    href: "/hotels?season=summer",
    img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&q=80&auto=format&fit=crop",
    imgAlt: "Santorini, Greece — whitewashed cliffside village above the Aegean Sea",
    destinations: [
      { city: "Santorini", cc: "GR" },
      { city: "Bali", cc: "ID" },
      { city: "Cape Town", cc: "ZA" },
    ],
  },
  {
    name: "Autumn",
    range: "SEP – NOV",
    href: "/hotels?season=autumn",
    img: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80&auto=format&fit=crop",
    imgAlt: "Kyoto, Japan — temple roofline framed by autumn maple foliage",
    destinations: [
      { city: "Kyoto", cc: "JP" },
      { city: "Tuscany", cc: "IT" },
      { city: "Rajasthan", cc: "IN" },
    ],
  },
  {
    name: "Winter",
    range: "DEC – FEB",
    href: "/hotels?season=winter",
    img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1200&q=80&auto=format&fit=crop",
    imgAlt: "Maldives — overwater villa above turquoise water",
    destinations: [
      { city: "Maldives", cc: "MV" },
      { city: "Swiss Alps", cc: "CH" },
      { city: "Goa", cc: "IN" },
    ],
  },
  {
    name: "Spring",
    range: "MAR – MAY",
    href: "/hotels?season=spring",
    img: "https://images.unsplash.com/photo-1534351590666-13e3e96c5017?w=1200&q=80&auto=format&fit=crop",
    imgAlt: "Amsterdam, Netherlands — canal lined with spring blossoms",
    destinations: [
      { city: "Amsterdam", cc: "NL" },
      { city: "Sri Lanka", cc: "LK" },
      { city: "Provence", cc: "FR" },
    ],
  },
];

function SeasonCard({ season }: { season: Season }) {
  return (
    <article
      style={{
        background: CARD_BG,
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Hero image */}
      <div
        className="seasons-grid__hero"
        style={{
          position: "relative",
          width: "100%",
          height: 120,
          overflow: "hidden",
        }}
      >
        <img
          src={season.img}
          alt={season.imgAlt}
          loading="lazy"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(0deg, ${CARD_BG} 0%, transparent 60%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
            right: 12,
          }}
        >
          <div
            style={{
              fontFamily: INTER,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: LABEL_GOLD,
              marginBottom: 2,
              lineHeight: 1.2,
            }}
          >
            {season.range}
          </div>
          <div
            style={{
              fontFamily: CORMORANT,
              fontSize: 20,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.1,
              letterSpacing: "-0.005em",
              textShadow: "0 1px 8px rgba(0,0,0,0.55)",
            }}
          >
            {season.name}
          </div>
        </div>
      </div>

      {/* Destination list */}
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: "0 12px",
        }}
      >
        {season.destinations.map((d, i) => (
          <li
            key={d.city}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              padding: "7px 0",
              borderBottom:
                i === season.destinations.length - 1
                  ? "none"
                  : "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              style={{
                fontFamily: INTER,
                fontSize: 13,
                fontWeight: 400,
                color: "#d4cfc7",
                lineHeight: 1.3,
              }}
            >
              {d.city}
            </span>
            <span
              style={{
                fontFamily: INTER,
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: "#6b665e",
                flexShrink: 0,
              }}
            >
              {d.cc}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div style={{ padding: "10px 12px 12px" }}>
        <a
          href={season.href}
          style={{
            display: "block",
            textAlign: "center",
            padding: "8px",
            borderRadius: 6,
            border: "1px solid rgba(184,149,106,0.3)",
            color: LABEL_GOLD,
            fontFamily: INTER,
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.4px",
            textDecoration: "none",
            background: "transparent",
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}
        >
          Explore →
        </a>
      </div>
    </article>
  );
}

export default function SeasonalAccordion() {
  return (
    <section
      aria-labelledby="seasonal-grid-heading"
      style={{
        background: "#0a0a0a",
        padding: "60px 20px",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .seasons-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              max-width: 1200px;
              margin: 0 auto;
            }
            @media (max-width: 768px) {
              .seasons-grid { grid-template-columns: repeat(2, 1fr); }
              .seasons-grid__hero { height: 100px !important; }
            }
            @media (max-width: 480px) {
              .seasons-grid { grid-template-columns: 1fr; }
            }
          `,
        }}
      />
      <header
        style={{
          maxWidth: 1200,
          margin: "0 auto 1.5rem",
        }}
      >
        <div
          style={{
            fontFamily: INTER,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: LABEL_GOLD,
            marginBottom: 10,
          }}
        >
          Travel Calendar
        </div>
        <h2
          id="seasonal-grid-heading"
          style={{
            fontFamily: CORMORANT,
            fontSize: 28,
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
            color: "#ffffff",
            margin: 0,
          }}
        >
          When to go,{" "}
          <em
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              color: ITALIC_GOLD,
            }}
          >
            where to go
          </em>
        </h2>
      </header>

      <div className="seasons-grid">
        {SEASONS.map((s) => (
          <SeasonCard key={s.name} season={s} />
        ))}
      </div>
    </section>
  );
}
