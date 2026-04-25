// ---------------------------------------------------------------------------
// Hotel Ranking Algorithms
// ---------------------------------------------------------------------------
// Shared ranking utilities used across search, city pages, and top sellers.
// Each algorithm normalizes inputs to 0–1 and produces a composite score.
// ---------------------------------------------------------------------------

import type { CuratedHotel } from "./api";

// Optional rate metadata used to compute real (not-fabricated) deal scores.
// `savings_pct` comes from the batch-rates endpoint (real Agoda MRP comparison).
export interface RateMeta {
  savings_pct: number | null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface RankedHotel<T = CuratedHotel> {
  hotel: T;
  valueScore: number;       // 0–100 composite quality/value score
  popularityScore: number;  // 0–100 based on review volume
  dealScore: number;        // 0–100 based on real savings_pct (or 0 when unavailable)
}

export type SortStrategy =
  | "recommended"     // composite value score (default)
  | "price_asc"       // cheapest first
  | "price_desc"      // most expensive first
  | "rating_desc"     // highest guest rating
  | "popularity_desc" // most reviews/bookings
  | "deal_desc"       // best deals first
  | "stars_desc"      // star rating high to low
  | "name_asc"        // alphabetical
  | "name_desc";      // reverse alphabetical

// ---------------------------------------------------------------------------
// Weights for the composite "Value Score"
// ---------------------------------------------------------------------------
const VALUE_WEIGHTS = {
  rating: 0.35,       // Guest rating (rating_average)
  popularity: 0.25,   // Review count as proxy for bookings
  price: 0.20,        // Lower price = better value
  stars: 0.20,        // Star classification
};

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function invertNormalize(value: number, min: number, max: number): number {
  // Lower is better (e.g., price) — inverts the scale
  return 1 - normalize(value, min, max);
}

// ---------------------------------------------------------------------------
// Compute ranking scores for a set of CuratedHotels
// ---------------------------------------------------------------------------
// `rateMeta` is an optional map keyed by hotel_id with the live batch-rate
// payload. When provided, dealScore reflects real savings_pct from Agoda MRP.
// When absent, dealScore is 0 (so deal_desc sorts those hotels last).
export function rankHotels(
  hotels: CuratedHotel[],
  rateMeta?: Record<string, RateMeta | undefined>
): RankedHotel[] {
  if (hotels.length === 0) return [];

  // Collect ranges for normalization
  const ratings = hotels.map((h) => h.rating_average || 0);
  const reviews = hotels.map((h) => h.number_of_reviews || 0);
  const prices = hotels.map((h) => h.rates_from || 0).filter((p) => p > 0);
  const stars = hotels.map((h) => h.star_rating || 0);

  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const minReviews = Math.min(...reviews);
  const maxReviews = Math.max(...reviews);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1;
  const minStars = Math.min(...stars);
  const maxStars = Math.max(...stars);

  return hotels.map((hotel) => {
    const rating = hotel.rating_average || 0;
    const reviewCount = hotel.number_of_reviews || 0;
    const price = hotel.rates_from || 0;
    const starRating = hotel.star_rating || 0;

    // Popularity score: purely based on review volume
    const popularityNorm = normalize(reviewCount, minReviews, maxReviews);
    const popularityScore = Math.round(popularityNorm * 100);

    // Deal score: real savings_pct from batch-rate response. When the rate
    // is unavailable (no Agoda MRP comparison), score is 0 — these hotels
    // sort last under "deal_desc".
    const realSavings = rateMeta?.[String(hotel.hotel_id)]?.savings_pct ?? null;
    const dealScore =
      realSavings != null && realSavings > 0
        ? Math.round(Math.min(realSavings * 2.5, 100)) // scale 0-40% → 0-100
        : 0;

    // Value score: weighted composite (rating + popularity + price + stars).
    // No fake savings here — we drop it entirely.
    const ratingNorm = normalize(rating, minRating, maxRating);
    const priceNorm = price > 0 ? invertNormalize(price, minPrice, maxPrice) : 0.5;
    const starsNorm = normalize(starRating, minStars, maxStars);

    const valueRaw =
      VALUE_WEIGHTS.rating * ratingNorm +
      VALUE_WEIGHTS.popularity * popularityNorm +
      VALUE_WEIGHTS.price * priceNorm +
      VALUE_WEIGHTS.stars * starsNorm;

    const valueScore = Math.round(valueRaw * 100);

    return { hotel, valueScore, popularityScore, dealScore };
  });
}

// ---------------------------------------------------------------------------
// Sort ranked hotels by a given strategy
// ---------------------------------------------------------------------------
export function sortRankedHotels(
  ranked: RankedHotel[],
  strategy: SortStrategy
): RankedHotel[] {
  const copy = [...ranked];

  switch (strategy) {
    case "recommended":
      return copy.sort((a, b) => b.valueScore - a.valueScore);

    case "price_asc":
      return copy.sort(
        (a, b) => (a.hotel.rates_from || Infinity) - (b.hotel.rates_from || Infinity)
      );

    case "price_desc":
      return copy.sort(
        (a, b) => (b.hotel.rates_from || 0) - (a.hotel.rates_from || 0)
      );

    case "rating_desc":
      return copy.sort(
        (a, b) => (b.hotel.rating_average || 0) - (a.hotel.rating_average || 0)
      );

    case "popularity_desc":
      return copy.sort((a, b) => b.popularityScore - a.popularityScore);

    case "deal_desc":
      return copy.sort((a, b) => b.dealScore - a.dealScore);

    case "stars_desc":
      return copy.sort(
        (a, b) => (b.hotel.star_rating || 0) - (a.hotel.star_rating || 0)
      );

    case "name_asc":
      return copy.sort((a, b) =>
        a.hotel.hotel_name.localeCompare(b.hotel.hotel_name)
      );

    case "name_desc":
      return copy.sort((a, b) =>
        b.hotel.hotel_name.localeCompare(a.hotel.hotel_name)
      );

    default:
      return copy;
  }
}

// ---------------------------------------------------------------------------
// Convenience: rank + sort in one call
// ---------------------------------------------------------------------------
export function rankAndSort(
  hotels: CuratedHotel[],
  strategy: SortStrategy = "recommended"
): RankedHotel[] {
  return sortRankedHotels(rankHotels(hotels), strategy);
}

// ---------------------------------------------------------------------------
// Top sellers algorithm (extracted from TopSellers component)
// ---------------------------------------------------------------------------
// Pure rating + review-volume score. No fabricated savings — when real Agoda
// MRP isn't available the marketRate / savePercent fields are null.
const TOP_SELLER_REVIEWS_WEIGHT = 0.6;
const TOP_SELLER_RATING_WEIGHT = 0.4;

export interface TopSellerScore {
  hotel: CuratedHotel;
  score: number;
  reviews: number;
  savePercent: number | null;
  marketRate: number | null;
}

export function computeTopSellerScores(
  hotels: CuratedHotel[],
  limit = 8,
  rateMeta?: Record<string, { savings_pct: number | null; mrp_rate: number | null } | undefined>
): TopSellerScore[] {
  const eligible = hotels.filter(
    (h) => h.rates_from && h.rates_from > 0 && h.number_of_reviews && h.number_of_reviews > 0
  );

  if (eligible.length === 0) return [];

  const maxReviews = Math.max(...eligible.map((h) => h.number_of_reviews || 0));
  const maxRating = Math.max(...eligible.map((h) => h.rating_average || 0), 1);

  const scored = eligible.map((h) => {
    const reviews = h.number_of_reviews || 0;
    const meta = rateMeta?.[String(h.hotel_id)];
    const savePercent = meta?.savings_pct ?? null;
    const marketRate = meta?.mrp_rate ?? null;

    const normalizedBookings = reviews / maxReviews;
    const normalizedRating = (h.rating_average || 0) / maxRating;
    const score =
      TOP_SELLER_REVIEWS_WEIGHT * normalizedBookings +
      TOP_SELLER_RATING_WEIGHT * normalizedRating;

    return { hotel: h, score, reviews, savePercent, marketRate };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Display labels for sort strategies
// ---------------------------------------------------------------------------
export const SORT_STRATEGY_LABELS: { label: string; value: SortStrategy }[] = [
  { label: "Recommended", value: "recommended" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Guest Rating", value: "rating_desc" },
  { label: "Most Popular", value: "popularity_desc" },
  { label: "Best Value", value: "deal_desc" },
  { label: "Stars: High to Low", value: "stars_desc" },
  { label: "Name A–Z", value: "name_asc" },
  { label: "Name Z–A", value: "name_desc" },
];
