import { NextRequest, NextResponse } from "next/server";

// Mock voyagr-club hotel search endpoint. Mirrors the contract documented for
// the production search service so the client is provider-agnostic — when the
// real endpoint ships, swap the body of GET() to forward to the backend.

type Perk =
  | "Free cancellation"
  | "Breakfast"
  | "Spa credit"
  | "Early check-in"
  | "Late checkout"
  | "Room upgrade";

type HotelRow = {
  id: string;
  name: string;
  location: string;
  stars: 3 | 4 | 5;
  rating: number;
  reviews: number;
  memberRate: number;
  originalRate: number;
  perks: Perk[];
  image: string;
};

const PERK_VALUES: Perk[] = [
  "Free cancellation",
  "Breakfast",
  "Spa credit",
  "Early check-in",
  "Late checkout",
  "Room upgrade",
];

const IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1559599238-308793637427?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80",
];

const NEIGHBOURHOODS = [
  "Colaba",
  "Juhu",
  "Lower Parel",
  "Bandra West",
  "Andheri East",
  "BKC",
  "Marine Drive",
  "Powai",
  "Worli",
  "Madh Island",
];

const NAME_PREFIXES = [
  "The Taj",
  "Soho House",
  "The St. Regis",
  "JW Marriott",
  "Trident",
  "Novotel",
  "Hyatt Regency",
  "The Resort",
  "ITC Maratha",
  "The Oberoi",
  "Four Seasons",
  "The Leela",
  "Sofitel",
  "Conrad",
  "Westin",
  "Sahara Star",
  "Grand Hyatt",
  "The Lalit",
  "The Park",
  "Ramada",
];

const NAME_SUFFIXES = [
  "Palace",
  "Residency",
  "Suites",
  "Tower",
  "Beach",
  "Heights",
  "Club",
  "Manor",
  "Plaza",
  "Sands",
];

// Deterministic PRNG so the dataset is stable across requests.
function rand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function pickPerks(rnd: () => number, stars: 3 | 4 | 5): Perk[] {
  // 5★ tend to have all perks; 3★ have fewer
  const baseProb = stars === 5 ? 0.7 : stars === 4 ? 0.55 : 0.35;
  const perks: Perk[] = [];
  for (const p of PERK_VALUES) {
    if (rnd() < baseProb) perks.push(p);
  }
  // Free cancellation is more common across the board
  if (!perks.includes("Free cancellation") && rnd() < 0.35) {
    perks.push("Free cancellation");
  }
  // Breakfast bias for 4★/5★
  if (stars >= 4 && !perks.includes("Breakfast") && rnd() < 0.4) {
    perks.push("Breakfast");
  }
  return perks;
}

function buildDataset(city: string): HotelRow[] {
  // Star distribution: 80 × 3★ + 120 × 4★ + 173 × 5★ = 373 total
  const buckets: Array<{ stars: 3 | 4 | 5; count: number; basePrice: number }> = [
    { stars: 3, count: 80, basePrice: 5000 },
    { stars: 4, count: 120, basePrice: 11000 },
    { stars: 5, count: 173, basePrice: 22000 },
  ];

  const rnd = rand(
    Array.from(city).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7) || 1
  );

  const out: HotelRow[] = [];
  let n = 1;
  for (const b of buckets) {
    for (let i = 0; i < b.count; i++) {
      const id = `vh${n}`;
      const stars = b.stars;
      // Prices skew up by star, with a long tail
      const priceMultiplier = 0.6 + rnd() * 5; // 0.6× → 5.6×
      const memberRate = Math.round((b.basePrice * priceMultiplier) / 100) * 100;
      // 15–30% MRP markup
      const markupPct = 0.15 + rnd() * 0.15;
      const originalRate = Math.round(memberRate / (1 - markupPct) / 100) * 100;
      const rating =
        stars === 5
          ? 4.4 + rnd() * 0.6
          : stars === 4
          ? 4.0 + rnd() * 0.7
          : 3.5 + rnd() * 0.8;
      const reviews = Math.round(80 + rnd() * 1800);
      const namePrefix = NAME_PREFIXES[n % NAME_PREFIXES.length];
      const nameSuffix = NAME_SUFFIXES[(n * 7) % NAME_SUFFIXES.length];
      const neighbourhood = NEIGHBOURHOODS[(n * 3) % NEIGHBOURHOODS.length];
      const name = `${namePrefix} ${nameSuffix} ${city}`;
      out.push({
        id,
        name,
        location: `${city}, ${neighbourhood}`,
        stars,
        rating: Math.round(rating * 10) / 10,
        reviews,
        memberRate,
        originalRate,
        perks: pickPerks(rnd, stars),
        image: IMAGES[n % IMAGES.length],
      });
      n++;
    }
  }
  return out;
}

// Cache per-city dataset so generation cost is paid once per server lifetime.
const CITY_CACHE: Record<string, HotelRow[]> = {};
function getDataset(city: string): HotelRow[] {
  const k = city.trim().toLowerCase() || "mumbai";
  if (!CITY_CACHE[k]) {
    CITY_CACHE[k] = buildDataset(city.trim() || "Mumbai");
  }
  return CITY_CACHE[k];
}

function num(value: string | null, fallback: number): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// Map URL perk slugs (lowercase, dash-separated) ↔ canonical labels.
function perkLabelToSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function slugToPerkLabel(slug: string): Perk | null {
  const found = PERK_VALUES.find((p) => perkLabelToSlug(p) === slug.toLowerCase());
  return found ?? null;
}

type SortKey = "recommended" | "price_asc" | "price_desc" | "rating";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const city = sp.get("city") || "Mumbai";
  const minStars = num(sp.get("minStars"), 0);
  const perksParam = sp.get("perks") || "";
  const requestedPerks = perksParam
    .split(",")
    .map((s) => slugToPerkLabel(s.trim()))
    .filter((p): p is Perk => p !== null);
  const minPrice = num(sp.get("minPrice"), 0);
  const maxPrice = num(sp.get("maxPrice"), Number.POSITIVE_INFINITY);
  const sort = (sp.get("sort") || "recommended") as SortKey;
  const page = Math.max(1, num(sp.get("page"), 1));
  const limit = Math.max(1, Math.min(60, num(sp.get("limit"), 20)));

  const all = getDataset(city);

  let filtered = all;
  if (minStars > 0) filtered = filtered.filter((h) => h.stars >= minStars);
  if (requestedPerks.length > 0) {
    filtered = filtered.filter((h) => requestedPerks.every((p) => h.perks.includes(p)));
  }
  filtered = filtered.filter(
    (h) => h.memberRate >= minPrice && h.memberRate <= maxPrice
  );

  switch (sort) {
    case "price_asc":
      filtered = [...filtered].sort((a, b) => a.memberRate - b.memberRate);
      break;
    case "price_desc":
      filtered = [...filtered].sort((a, b) => b.memberRate - a.memberRate);
      break;
    case "rating":
      filtered = [...filtered].sort(
        (a, b) => b.rating - a.rating || b.reviews - a.reviews
      );
      break;
    case "recommended":
    default:
      // Stable mock "recommendation": rating × log(reviews) × stars
      filtered = [...filtered].sort((a, b) => {
        const score = (h: HotelRow) =>
          h.rating * Math.log(h.reviews + 1) * (1 + h.stars * 0.1);
        return score(b) - score(a);
      });
      break;
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const pageHotels = filtered.slice(start, start + limit);

  // Facets are computed against the WHOLE city dataset filtered by every active
  // filter EXCEPT the one whose facet we're emitting — so the count next to a
  // pill tells the user how many results they would see if they switched to it.
  const baseStarsFilter = (h: HotelRow) =>
    (requestedPerks.length === 0 || requestedPerks.every((p) => h.perks.includes(p))) &&
    h.memberRate >= minPrice &&
    h.memberRate <= maxPrice;
  const basePerksFilter = (h: HotelRow) =>
    (minStars === 0 || h.stars >= minStars) &&
    h.memberRate >= minPrice &&
    h.memberRate <= maxPrice;

  const starsFacet: Record<string, number> = { "3": 0, "4": 0, "5": 0 };
  for (const h of all) {
    if (!baseStarsFilter(h)) continue;
    starsFacet[String(h.stars)] = (starsFacet[String(h.stars)] || 0) + 1;
  }

  const perksFacet: Record<string, number> = {};
  for (const p of PERK_VALUES) perksFacet[p] = 0;
  for (const h of all) {
    if (!basePerksFilter(h)) continue;
    for (const p of h.perks) perksFacet[p] = (perksFacet[p] || 0) + 1;
  }

  const priceRange = all.reduce(
    (acc, h) => ({
      min: Math.min(acc.min, h.memberRate),
      max: Math.max(acc.max, h.memberRate),
    }),
    { min: Number.POSITIVE_INFINITY, max: 0 }
  );

  return NextResponse.json(
    {
      hotels: pageHotels,
      total,
      page,
      totalPages,
      limit,
      facets: {
        stars: starsFacet,
        perks: perksFacet,
        priceRange: {
          min: priceRange.min === Number.POSITIVE_INFINITY ? 0 : priceRange.min,
          max: priceRange.max,
        },
      },
    },
    {
      status: 200,
      headers: {
        // Ensure each request re-runs the filter logic; no edge caching.
        "Cache-Control": "no-store",
      },
    }
  );
}
