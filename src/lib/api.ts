const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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

export async function searchHotels(query: string, limit: number = 10): Promise<any[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/hotels/search?${params}`);
  if (!res.ok) throw new Error('Failed to search hotels');
  const data = await res.json();
  return data.results;
}
