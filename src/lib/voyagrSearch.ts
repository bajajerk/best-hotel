// Client for the voyagr-club hotel search endpoint. The mock at
// /api/voyagr/hotels/search returns the same shape as the production endpoint
// will, so a one-line swap (point `ENDPOINT` at the real URL) is enough.

const ENDPOINT = "/api/voyagr/hotels/search";

export const PERK_OPTIONS = [
  "Free cancellation",
  "Breakfast",
  "Spa credit",
  "Early check-in",
  "Late checkout",
  "Room upgrade",
] as const;

export type PerkLabel = (typeof PERK_OPTIONS)[number];

export type SortKey = "recommended" | "price_asc" | "price_desc" | "rating";

export const SORT_LABELS: Record<SortKey, string> = {
  recommended: "Recommended",
  price_asc: "Price: Low",
  price_desc: "Price: High",
  rating: "Rating",
};

export type SearchHotel = {
  id: string;
  name: string;
  location: string;
  stars: 3 | 4 | 5;
  rating: number;
  reviews: number;
  memberRate: number;
  originalRate: number;
  perks: PerkLabel[];
  image: string;
};

export type SearchFacets = {
  stars: Record<string, number>;
  perks: Record<string, number>;
  priceRange: { min: number; max: number };
};

export type SearchResponse = {
  hotels: SearchHotel[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  facets: SearchFacets;
};

export type SearchFilters = {
  city: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  minStars: number; // 0 = any
  perks: PerkLabel[];
  minPrice: number;
  maxPrice: number;
  sort: SortKey;
  page: number;
  limit: number;
};

export const PRICE_DEFAULT_MIN = 5000;
export const PRICE_DEFAULT_MAX = 200000;
export const PRICE_STEP = 1000;

export function perkLabelToSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function slugToPerkLabel(slug: string): PerkLabel | null {
  const m = (PERK_OPTIONS as readonly string[]).find(
    (p) => perkLabelToSlug(p) === slug.toLowerCase()
  );
  return (m as PerkLabel) ?? null;
}

function buildQuery(filters: SearchFilters): string {
  const sp = new URLSearchParams();
  sp.set("city", filters.city);
  if (filters.checkIn) sp.set("checkIn", filters.checkIn);
  if (filters.checkOut) sp.set("checkOut", filters.checkOut);
  sp.set("guests", String(filters.guests || 2));
  if (filters.minStars > 0) sp.set("minStars", String(filters.minStars));
  if (filters.perks.length > 0) {
    sp.set("perks", filters.perks.map(perkLabelToSlug).join(","));
  }
  if (filters.minPrice !== PRICE_DEFAULT_MIN) {
    sp.set("minPrice", String(filters.minPrice));
  }
  if (filters.maxPrice !== PRICE_DEFAULT_MAX) {
    sp.set("maxPrice", String(filters.maxPrice));
  }
  if (filters.sort !== "recommended") sp.set("sort", filters.sort);
  sp.set("page", String(filters.page));
  sp.set("limit", String(filters.limit));
  return sp.toString();
}

export async function fetchVoyagrSearch(
  filters: SearchFilters,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const url = `${ENDPOINT}?${buildQuery(filters)}`;
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// URL-state encoding for the filter bar — used so deep links / browser back /
// returning from a hotel detail page keep the user's filter selections.
// ---------------------------------------------------------------------------

const URL_KEYS = {
  stars: "stars",
  perks: "perks",
  minPrice: "minPrice",
  maxPrice: "maxPrice",
  sort: "sort",
} as const;

type AppliedFilterUrlState = {
  stars: number;
  perks: PerkLabel[];
  minPrice: number;
  maxPrice: number;
  sort: SortKey;
};

export function readFiltersFromURL(sp: URLSearchParams): AppliedFilterUrlState {
  const stars = Number(sp.get(URL_KEYS.stars) || 0) || 0;
  const perksRaw = (sp.get(URL_KEYS.perks) || "").split(",").filter(Boolean);
  const perks = perksRaw
    .map(slugToPerkLabel)
    .filter((p): p is PerkLabel => p !== null);
  const minPrice = Number(sp.get(URL_KEYS.minPrice) || PRICE_DEFAULT_MIN);
  const maxPrice = Number(sp.get(URL_KEYS.maxPrice) || PRICE_DEFAULT_MAX);
  const sortRaw = (sp.get(URL_KEYS.sort) || "recommended") as SortKey;
  const sort: SortKey =
    sortRaw === "price_asc" ||
    sortRaw === "price_desc" ||
    sortRaw === "rating" ||
    sortRaw === "recommended"
      ? sortRaw
      : "recommended";
  return {
    stars: [0, 3, 4, 5].includes(stars) ? stars : 0,
    perks,
    minPrice: Number.isFinite(minPrice) ? minPrice : PRICE_DEFAULT_MIN,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : PRICE_DEFAULT_MAX,
    sort,
  };
}

export function writeFiltersToURL(
  state: AppliedFilterUrlState,
  base: URLSearchParams
): URLSearchParams {
  const sp = new URLSearchParams(base);
  if (state.stars > 0) sp.set(URL_KEYS.stars, String(state.stars));
  else sp.delete(URL_KEYS.stars);

  if (state.perks.length > 0) {
    sp.set(URL_KEYS.perks, state.perks.map(perkLabelToSlug).join(","));
  } else {
    sp.delete(URL_KEYS.perks);
  }

  if (state.minPrice !== PRICE_DEFAULT_MIN) {
    sp.set(URL_KEYS.minPrice, String(state.minPrice));
  } else {
    sp.delete(URL_KEYS.minPrice);
  }

  if (state.maxPrice !== PRICE_DEFAULT_MAX) {
    sp.set(URL_KEYS.maxPrice, String(state.maxPrice));
  } else {
    sp.delete(URL_KEYS.maxPrice);
  }

  if (state.sort !== "recommended") sp.set(URL_KEYS.sort, state.sort);
  else sp.delete(URL_KEYS.sort);

  return sp;
}
