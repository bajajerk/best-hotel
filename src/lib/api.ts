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

// ── Flight types ──────────────────────────────────────────────────────────

export interface FlightSegment {
  id: string;
  airline: { code: string; name: string };
  flightNumber: string;
  from: { code: string; city: string; terminal?: string };
  to: { code: string; city: string; terminal?: string };
  departureTime: string;
  arrivalTime: string;
  durationMins: number;
  stops: number;
}

export interface FlightFare {
  id: string;
  fareIdentifier: string;
  totalFare: number;
  baseFare: number;
  taxes: number;
}

export interface ParsedFlight {
  key: string;
  segments: FlightSegment[];
  fares: FlightFare[];
  cheapestFare: FlightFare | null;
}

export interface FlightSearchResult {
  flights: ParsedFlight[];
  totalCount: number;
}

function parseTripJackFlights(data: any): FlightSearchResult {
  const tripInfos: Record<string, any[]> = data?.searchResult?.tripInfos ?? {};
  const flights: ParsedFlight[] = [];

  for (const [, options] of Object.entries(tripInfos)) {
    for (const option of options ?? []) {
      const segments: FlightSegment[] = (option.sI ?? []).map((seg: any, i: number) => ({
        id: seg.id ?? String(i),
        airline: {
          code: seg.fD?.aI?.code ?? '',
          name: seg.fD?.aI?.name ?? seg.fD?.aI?.code ?? 'Unknown',
        },
        flightNumber: `${seg.fD?.aI?.code ?? ''}${seg.fD?.fN ?? ''}`,
        from: {
          code: seg.da?.code ?? '',
          city: seg.da?.city ?? seg.da?.code ?? '',
          terminal: seg.da?.terminal,
        },
        to: {
          code: seg.aa?.code ?? '',
          city: seg.aa?.city ?? seg.aa?.code ?? '',
          terminal: seg.aa?.terminal,
        },
        departureTime: seg.dt ?? '',
        arrivalTime: seg.at ?? '',
        durationMins: seg.duration ?? 0,
        stops: seg.so ?? 0,
      }));

      const fares: FlightFare[] = (option.totalPriceList ?? []).map((f: any) => ({
        id: f.id ?? '',
        fareIdentifier: f.fareIdentifier ?? '',
        totalFare: f.fd?.ADULT?.fC?.TF ?? 0,
        baseFare: f.fd?.ADULT?.fC?.BF ?? 0,
        taxes: f.fd?.ADULT?.fC?.TAF ?? 0,
      })).filter((f: FlightFare) => f.totalFare > 0);

      const cheapestFare = fares.length
        ? fares.reduce((a, b) => (a.totalFare <= b.totalFare ? a : b))
        : null;

      if (segments.length > 0 && cheapestFare) {
        flights.push({
          key: `${segments[0].airline.code}-${segments[0].departureTime}`,
          segments,
          fares,
          cheapestFare,
        });
      }
    }
  }

  // Sort cheapest first
  flights.sort((a, b) => (a.cheapestFare?.totalFare ?? 0) - (b.cheapestFare?.totalFare ?? 0));

  return { flights, totalCount: flights.length };
}

export async function searchFlights(params: {
  from: string;
  to: string;
  date: string;
  adults?: number;
  cabinClass?: string;
  tripType?: string;
  token?: string | null;
}): Promise<FlightSearchResult> {
  const { from, to, date, adults = 1, cabinClass = 'ECONOMY', tripType = 'O', token } = params;

  const res = await fetch(`${API_BASE}/api/flights/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      searchQuery: {
        tripType,
        cabinClass,
        paxInfo: { ADULT: String(adults), CHILD: '0', INFANT: '0' },
        routeInfos: [{ fromCityOrAirport: { code: from }, toCityOrAirport: { code: to }, travelDate: date }],
      },
    }),
  });

  const data = await res.json();
  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : data.error?.message ?? 'Search failed';
    throw new Error(msg);
  }

  return parseTripJackFlights(data);
}
