// In production (Vercel), use the Next.js API proxy route to avoid mixed-content issues.
// The proxy at /api/[...path] forwards to the backend server.
// In local dev, you can hit the backend directly.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export interface CuratedCity {
  city_slug: string;
  city_name: string;
  country: string;
  country_code: string;
  city_id: number | null;
  continent: string;
  tagline: string;
  image_url: string;
  hotel_count: number;
  display_order: number;
}

export interface CuratedHotel {
  id: number;
  city_slug: string;
  city_name: string;
  country: string;
  country_code: string;
  category: 'singles' | 'couples' | 'families';
  hotel_id: number;
  hotel_name: string;
  star_rating: number | null;
  rating_average: number | null;
  number_of_reviews: number | null;
  rates_from: number | null;
  rates_currency: string | null;
  photo1: string | null;
  photo2: string | null;
  overview: string | null;
  latitude: number | null;
  longitude: number | null;
  addressline1: string | null;
  display_order: number;
  tagline: string | null;
}

export interface HotelWithPricing extends CuratedHotel {
  pricing: {
    dailyRate: number;
    currency: string;
    landingURL: string;
    roomtypeName: string;
    includeBreakfast: boolean;
    freeWifi: boolean;
    discountPercentage: number | null;
    crossedOutRate: number | null;
  } | null;
}

export async function fetchCuratedCities(continent?: string): Promise<CuratedCity[]> {
  const params = new URLSearchParams();
  if (continent) params.set('continent', continent);
  params.set('limit', '50');

  const res = await fetch(`${API_BASE}/api/curations/cities?${params}`);
  if (!res.ok) throw new Error('Failed to fetch cities');
  const data = await res.json();
  return data.results;
}

export async function fetchCityCurations(citySlug: string, category?: string): Promise<{
  city: CuratedCity;
  curations: {
    singles: CuratedHotel[];
    couples: CuratedHotel[];
    families: CuratedHotel[];
  };
}> {
  const params = new URLSearchParams();
  if (category) params.set('category', category);

  const res = await fetch(`${API_BASE}/api/curations/${citySlug}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch curations');
  return res.json();
}

export async function fetchCityPrices(
  citySlug: string,
  category: string,
  checkin: string,
  checkout: string,
  adults: number = 2,
  currency: string = 'USD'
): Promise<{ city: any; category: string; hotels: HotelWithPricing[] }> {
  const params = new URLSearchParams({
    category,
    checkin,
    checkout,
    adults: String(adults),
    currency,
  });

  const res = await fetch(`${API_BASE}/api/curations/${citySlug}/prices?${params}`);
  if (!res.ok) throw new Error('Failed to fetch prices');
  return res.json();
}

export interface HotelDetail {
  hotel_id: number;
  hotel_name: string;
  hotel_formerly_name: string | null;
  hotel_translated_name: string | null;
  city: string;
  city_id: number;
  country: string;
  countryisocode: string;
  country_id: number;
  continent_id: number;
  continent_name: string;
  star_rating: number;
  rating_average: number;
  number_of_reviews: number;
  rates_from: number | null;
  rates_currency: string;
  photo1: string | null;
  photo2: string | null;
  photo3: string | null;
  photo4: string | null;
  photo5: string | null;
  overview: string | null;
  addressline1: string | null;
  addressline2: string | null;
  latitude: number | null;
  longitude: number | null;
  chain_id: number | null;
  chain_name: string | null;
  brand_id: number | null;
  brand_name: string | null;
  accommodation_type: string | null;
  numberrooms: number | null;
  numberfloors: number | null;
  yearopened: number | null;
  yearrenovated: number | null;
  checkin: string | null;
  checkout: string | null;
}

/** Fetch full hotel detail by ID */
export async function fetchHotelDetail(id: number | string): Promise<HotelDetail> {
  const res = await fetch(`${API_BASE}/api/hotels/${id}`);
  if (!res.ok) throw new Error('Failed to fetch hotel detail');
  return res.json();
}

export async function searchHotels(query: string, limit: number = 10): Promise<any[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/hotels/search?${params}`);
  if (!res.ok) throw new Error('Failed to search hotels');
  const data = await res.json();
  return data.results;
}

/**
 * Fetch top-rated curated hotels across multiple cities for home page sections.
 * Fetches from a diverse set of cities and returns hotels sorted by rating.
 */
export async function fetchFeaturedHotels(
  citySlugs: string[],
  category: 'singles' | 'couples' | 'families' = 'couples'
): Promise<CuratedHotel[]> {
  const results = await Promise.allSettled(
    citySlugs.map((slug) => fetchCityCurations(slug))
  );

  const hotels: CuratedHotel[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const curations = result.value.curations;
      // Take the top hotel from the requested category for each city
      const categoryHotels = curations[category] || [];
      hotels.push(...categoryHotels.slice(0, 3));
    }
  }

  return hotels;
}

export interface FeaturedResponse {
  topRated: CuratedHotel[];
  bestValue: CuratedHotel[];
  soloTravel: CuratedHotel[];
  familyFriendly: CuratedHotel[];
}

/** Fetch all featured hotel categories from the aggregated endpoint */
export async function fetchFeaturedAll(): Promise<FeaturedResponse> {
  const res = await fetch(`${API_BASE}/api/hotels/featured`);
  if (!res.ok) throw new Error('Failed to fetch featured hotels');
  return res.json();
}
