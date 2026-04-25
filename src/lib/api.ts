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

// In-memory cache for the client-side featured aggregator.
// Backend has no /api/hotels/featured endpoint, so we build the response
// from /api/curations/cities + per-city /api/curations/{slug} fan-out.
// Cache for 5 minutes to avoid hammering the curations API on remounts.
const FEATURED_CACHE_TTL_MS = 5 * 60 * 1000;
let _featuredCache: { at: number; data: FeaturedResponse } | null = null;

const FEATURED_TOP_CITY_COUNT = 5;

function isRenderable(h: CuratedHotel): boolean {
  return Boolean(h.hotel_name && h.rating_average);
}

/**
 * Build the home-page featured response client-side from existing curation
 * endpoints. Returns `null` on any failure so the caller can quietly skip
 * the carousels (the existing UI already handles null).
 */
export async function fetchFeaturedAll(): Promise<FeaturedResponse | null> {
  try {
    const now = Date.now();
    if (_featuredCache && now - _featuredCache.at < FEATURED_CACHE_TTL_MS) {
      return _featuredCache.data;
    }

    // 1) Fetch top cities
    const citiesRes = await fetch(`${API_BASE}/api/curations/cities?limit=20`);
    if (!citiesRes.ok) throw new Error(`cities ${citiesRes.status}`);
    const citiesJson = await citiesRes.json();
    const cities: CuratedCity[] = citiesJson.results ?? [];
    const topCities = cities.slice(0, FEATURED_TOP_CITY_COUNT);
    if (topCities.length === 0) return null;

    // 2) Fan out to per-city curations in parallel
    const slug = (c: CuratedCity) => c.city_slug;
    const couplesResults = await Promise.allSettled(
      topCities.map((c) => fetchCityCurations(slug(c), 'couples'))
    );
    const familiesResults = await Promise.allSettled(
      topCities.map((c) => fetchCityCurations(slug(c), 'families'))
    );

    const collect = (
      arr: PromiseSettledResult<{ curations: { singles: CuratedHotel[]; couples: CuratedHotel[]; families: CuratedHotel[] } }>[],
      key: 'singles' | 'couples' | 'families'
    ): CuratedHotel[] => {
      const out: CuratedHotel[] = [];
      for (const r of arr) {
        if (r.status === 'fulfilled') {
          out.push(...((r.value.curations?.[key] ?? []) as CuratedHotel[]));
        }
      }
      return out;
    };

    const couplesPool = collect(couplesResults, 'couples').filter(isRenderable);
    const familiesPool = collect(familiesResults, 'families').filter(isRenderable);

    // 3) Sort heuristics — same shape as the deprecated /api/hotels/featured
    const byRating = (a: CuratedHotel, b: CuratedHotel) =>
      (b.rating_average ?? 0) - (a.rating_average ?? 0);
    const byPriceAsc = (a: CuratedHotel, b: CuratedHotel) =>
      (a.rates_from ?? Number.POSITIVE_INFINITY) - (b.rates_from ?? Number.POSITIVE_INFINITY);

    const topRated = [...couplesPool].sort(byRating).slice(0, 8);
    const bestValue = [...couplesPool]
      .filter((h) => (h.rates_from ?? 0) > 0)
      .sort(byPriceAsc)
      .slice(0, 8);
    // Solo proxy: highest-rated couples-curated hotels (no `singles` curation
    // tier exists in the dataset for these cities — couples is the closest)
    const soloTravel = [...couplesPool].sort(byRating).slice(0, 8);
    const familyFriendly = [...familiesPool].sort(byRating).slice(0, 8);

    const data: FeaturedResponse = { topRated, bestValue, soloTravel, familyFriendly };
    _featuredCache = { at: now, data };
    return data;
  } catch (err) {
    console.error('[fetchFeaturedAll] client-side aggregation failed:', err);
    return null;
  }
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
  cabinBaggage?: string;
  checkinBaggage?: string;
  mealIncluded?: boolean;
  refundable?: boolean;
  cabinClass?: string;
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

      const fares: FlightFare[] = (option.totalPriceList ?? []).map((f: any) => {
        const adult = f.fd?.ADULT ?? {};
        return {
          id: f.id ?? '',
          fareIdentifier: f.fareIdentifier ?? '',
          totalFare: adult.fC?.TF ?? 0,
          baseFare: adult.fC?.BF ?? 0,
          taxes: adult.fC?.TAF ?? 0,
          cabinBaggage: adult.bI?.cB ?? '',
          checkinBaggage: adult.bI?.iB ?? '',
          mealIncluded: !!adult.mI,
          refundable: (adult.rT ?? 0) > 0,
          cabinClass: adult.cc ?? 'ECONOMY',
        };
      }).filter((f: FlightFare) => f.totalFare > 0);

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

export interface ReviewFareOption {
  id: string;
  fareIdentifier: string;
  cabinClass: string;
  totalFare: number;
  baseFare: number;
  taxes: number;
  cabinBaggage: string;
  checkinBaggage: string;
  mealIncluded: boolean;
  refundable: boolean;
  seatChargeable: boolean;
}

export interface FlightReviewResult {
  bookingId: string;
  flight: ParsedFlight;
  fareOptions: ReviewFareOption[];
  totalAdultFare: number;
}

function parseTripJackReview(data: any): FlightReviewResult {
  const tripInfos: any[] = data?.tripInfos ?? [];
  const segs: FlightSegment[] = [];
  const fareOptions: ReviewFareOption[] = [];

  for (const leg of tripInfos) {
    for (const seg of leg.sI ?? []) {
      segs.push({
        id: String(seg.id ?? segs.length),
        airline: { code: seg.fD?.aI?.code ?? '', name: seg.fD?.aI?.name ?? seg.fD?.aI?.code ?? 'Unknown' },
        flightNumber: `${seg.fD?.aI?.code ?? ''}${seg.fD?.fN ?? ''}`,
        from: { code: seg.da?.code ?? '', city: seg.da?.city ?? seg.da?.code ?? '', terminal: seg.da?.terminal },
        to: { code: seg.aa?.code ?? '', city: seg.aa?.city ?? seg.aa?.code ?? '', terminal: seg.aa?.terminal },
        departureTime: seg.dt ?? '',
        arrivalTime: seg.at ?? '',
        durationMins: seg.duration ?? 0,
        stops: seg.so ?? 0,
      });
    }
    for (const f of leg.totalPriceList ?? []) {
      const adult = f.fd?.ADULT ?? {};
      fareOptions.push({
        id: f.id ?? '',
        fareIdentifier: f.fareIdentifier ?? '',
        cabinClass: adult.cc ?? 'ECONOMY',
        totalFare: adult.fC?.TF ?? 0,
        baseFare: adult.fC?.BF ?? 0,
        taxes: adult.fC?.TAF ?? 0,
        cabinBaggage: adult.bI?.cB ?? '',
        checkinBaggage: adult.bI?.iB ?? '',
        mealIncluded: !!adult.mI,
        refundable: (adult.rT ?? 0) > 0,
        seatChargeable: (adult.sR ?? 0) > 0,
      });
    }
  }

  const cheapest = fareOptions.length
    ? fareOptions.reduce((a, b) => (a.totalFare <= b.totalFare ? a : b))
    : null;

  const flight: ParsedFlight = {
    key: segs[0] ? `${segs[0].airline.code}-${segs[0].departureTime}` : 'review',
    segments: segs,
    fares: fareOptions.map((f) => ({ id: f.id, fareIdentifier: f.fareIdentifier, totalFare: f.totalFare, baseFare: f.baseFare, taxes: f.taxes })),
    cheapestFare: cheapest ? { id: cheapest.id, fareIdentifier: cheapest.fareIdentifier, totalFare: cheapest.totalFare, baseFare: cheapest.baseFare, taxes: cheapest.taxes } : null,
  };

  return {
    bookingId: data?.bookingId ?? '',
    flight,
    fareOptions,
    totalAdultFare: data?.totalPriceInfo?.totalFareDetail?.fC?.TF ?? cheapest?.totalFare ?? 0,
  };
}

export async function reviewFlight(params: {
  priceIds: string[];
  token?: string | null;
}): Promise<FlightReviewResult> {
  const { priceIds, token } = params;

  const res = await fetch(`${API_BASE}/api/flights/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ priceIds }),
  });

  const data = await res.json();
  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : data.error?.message ?? 'Review failed';
    throw new Error(msg);
  }

  return parseTripJackReview(data);
}

export interface FlightPassenger {
  ti: string;        // "Mr" / "Mrs" / "Ms" / "Mstr" / "Miss"
  fN: string;        // first name
  lN: string;        // last name
  dob: string;       // YYYY-MM-DD
  pt: "ADULT" | "CHILD" | "INFANT";
  fF?: string;       // frequent flyer
  bf?: number;       // bonus field (TripJack — default 0)
}

export interface FlightDeliveryInfo {
  emails: string[];
  contacts: string[];
}

export async function validatePrebookFlight(params: {
  bookingId: string;
  passengers: FlightPassenger[];
  token?: string | null;
}): Promise<unknown> {
  const { bookingId, passengers, token } = params;
  const res = await fetch(`${API_BASE}/api/flights/fare-validate-prebook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ bookingId, passengers }),
  });
  const data = await res.json();
  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : data.error?.message ?? 'Prebook validation failed';
    throw new Error(msg);
  }
  return data;
}

export interface BookFlightResult {
  bookingId: string;
  status: "BOOKED" | "HOLD" | string;
  raw: unknown;
}

export async function bookFlight(params: {
  bookingId: string;
  passengers: FlightPassenger[];
  deliveryInfo: FlightDeliveryInfo;
  paymentInfos?: { amount: number; paymentType: string }[];
  token?: string | null;
}): Promise<BookFlightResult> {
  const { bookingId, passengers, deliveryInfo, paymentInfos, token } = params;
  const body: Record<string, unknown> = {
    bookingId,
    passengers,
    deliveryInfo,
  };
  if (paymentInfos && paymentInfos.length) body.paymentInfos = paymentInfos;

  const res = await fetch(`${API_BASE}/api/flights/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) {
    const msg = typeof data.error === 'string' ? data.error : data.error?.message ?? 'Booking failed';
    throw new Error(msg);
  }

  const returnedId = data?.bookingId ?? data?.data?.bookingId ?? bookingId;
  const status = paymentInfos && paymentInfos.length ? 'BOOKED' : 'HOLD';
  return { bookingId: returnedId, status, raw: data };
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

// ── Live hotel rates ──────────────────────────────────────────────────────

export type RatePlan = {
  option_id: string;
  room_name: string;
  room_id?: string;
  meal_basis: string;
  refundable: boolean;
  free_cancel_until?: string;
  base_price: number;
  total_price: number;
  taxes?: number;
  commission?: number;
  currency: string;
};

export type RatesResponse = {
  hotel: { hotel_id: number; hotel_name: string; city: string; country: string; star_rating: number; photo1?: string; photo2?: string; photo3?: string; photo4?: string; photo5?: string; overview?: string; latitude?: number; longitude?: number; addressline1?: string };
  mrp: { agoda_rate: number; currency: string } | null;
  rates: RatePlan[];
  savings_pct: number | null;
  tripjack_hotel_id: string;
  checkin: string;
  checkout: string;
  nights: number;
  warning?: string;
};

export type NoMatchError = { error: "no_tripjack_match"; hotel_id: number };

export async function fetchHotelRates(
  hotelId: number | string,
  checkin: string,
  checkout: string,
  adults: number = 2,
  children: number = 0,
  currency: string = "INR"
): Promise<RatesResponse | NoMatchError> {
  const params = new URLSearchParams({ checkin, checkout, adults: String(adults), children: String(children), currency });
  const res = await fetch(`${API_BASE}/api/hotels/${hotelId}/rates?${params}`, { cache: "no-store" });
  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    return { error: "no_tripjack_match", hotel_id: Number(hotelId), ...body };
  }
  if (!res.ok) throw new Error(`Failed to load rates: ${res.status}`);
  return res.json();
}

// ── Batch live rates ──────────────────────────────────────────────────────
// Calls POST /api/hotels/rates/batch to resolve live TripJack rates + MRP +
// savings for a set of hotels. Hotels without a TripJack match are returned
// in `unmatched_ids` so the UI can filter them out.

export type BatchRate = {
  from_price: number;
  mrp: { agoda_rate: number; currency: string } | null;
  savings_pct: number | null;
  tripjack_hotel_id: string;
};

export type BatchRatesResponse = {
  checkin: string;
  checkout: string;
  results: Record<string, BatchRate>;
  unmatched_ids: number[];
};

export async function fetchBatchRates(
  hotelIds: number[],
  checkin: string,
  checkout: string,
  adults: number = 2,
  children: number = 0
): Promise<BatchRatesResponse> {
  const res = await fetch(`${API_BASE}/api/hotels/rates/batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hotel_ids: hotelIds, checkin, checkout, adults, children }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Batch rates failed: ${res.status}`);
  return res.json();
}

/** Convenience: default dates = tonight + 1 night. Used when user hasn't chosen. */
export function defaultBookingDates(): { checkin: string; checkout: string } {
  const d = new Date();
  const day = 24 * 60 * 60 * 1000;
  const tonight = new Date(d.getTime() + day);
  const tomorrow = new Date(d.getTime() + 2 * day);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  return { checkin: iso(tonight), checkout: iso(tomorrow) };
}
