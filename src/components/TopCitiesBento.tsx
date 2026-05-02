"use client";

import Link from "next/link";
import Image from "next/image";
import type { HomeFeaturedCity } from "@/lib/api";

const AREA_LABELS = "abcdefghij";

type LayoutConfig = { cols: string; rows: string; areas: string };

const LAYOUTS: Record<number, LayoutConfig> = {
  4:  { cols: "1fr 1fr",         rows: "1fr 1fr",        areas: '"a b" "c d"' },
  5:  { cols: "2fr 1fr",         rows: "1fr 1fr 1fr",    areas: '"a b" "a c" "d e"' },
  6:  { cols: "2fr 1fr 1fr",     rows: "1fr 1fr",        areas: '"a b c" "a d e"' },
  7:  { cols: "2fr 1fr 1fr",     rows: "1fr 1fr 1fr",    areas: '"a b c" "a d e" "f f g"' },
  8:  { cols: "2fr 1fr 1fr",     rows: "1fr 1fr 1fr",    areas: '"a b c" "a d e" "f g h"' },
  9:  { cols: "1fr 1fr 1fr",     rows: "repeat(3, 1fr)", areas: '"a b c" "d e f" "g h i"' },
  10: { cols: "2fr 1fr 1fr 1fr", rows: "1fr 1fr 1fr",    areas: '"a b c d" "a e f g" "h h i j"' },
};

// Layouts where tile 'a' spans multiple rows — gets hero treatment
const HERO_COUNTS = new Set([5, 6, 7, 8, 10]);

function safeImg(u: string | null | undefined): string {
  if (!u?.trim()) return "";
  return u.startsWith("http://") ? u.replace("http://", "https://") : u;
}

const FALLBACK_GRADIENT =
  "linear-gradient(135deg, rgba(200,170,118,0.32) 0%, rgba(20,18,15,0.92) 100%)";

export default function TopCitiesBento({ items }: { items: HomeFeaturedCity[] }) {
  if (items.length === 0) {
    return (
      <div
        style={{
          color: "var(--luxe-soft-white-50)",
          fontSize: 13,
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        Curating featured cities&hellip;
      </div>
    );
  }

  const count = Math.min(Math.max(items.length, 4), 10);
  const tiles = items.slice(0, count);
  const layout = LAYOUTS[count] ?? LAYOUTS[9];
  const hasHero = HERO_COUNTS.has(count);

  return (
    <div
      className="top-cities-bento-root"
      style={{
        gridTemplateColumns: layout.cols,
        gridTemplateRows: layout.rows,
        gridTemplateAreas: layout.areas,
      }}
    >
      {tiles.map((c, i) => {
        const area = AREA_LABELS[i];
        const isHero = i === 0 && hasHero;
        const imgSrc = safeImg(c.image_url);

        return (
          <Link
            key={`${c.city_slug}-${i}`}
            href={`/city/${c.city_slug}`}
            className={`top-city-bento-tile${isHero ? " top-city-bento-tile--hero" : ""}`}
            style={{ gridArea: area }}
          >
            {/* Always-visible fallback color so tiles never appear black */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "#1a1a1a",
                background: FALLBACK_GRADIENT,
              }}
            />

            {imgSrc && (
              <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
                <Image
                  src={imgSrc}
                  alt={`${c.city_name}, ${c.country}`}
                  fill
                  sizes={
                    isHero
                      ? "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 36vw"
                      : "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 22vw"
                  }
                  className="top-city-bento-img"
                  style={{ objectFit: "cover" }}
                  loading={i < 4 ? "eager" : "lazy"}
                  decoding="async"
                  priority={i < 2}
                />
              </div>
            )}

            {/* Gradient scrim */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.78) 100%)",
                pointerEvents: "none",
              }}
            />

            {/* City label */}
            <div className="top-city-bento-label">
              <div className="top-city-bento-country">{c.country}</div>
              <div
                className={`top-city-bento-name${isHero ? " top-city-bento-name--hero" : ""}`}
              >
                {c.city_name}
              </div>
              <div className="top-city-bento-badge">{c.hotel_count} stays</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
