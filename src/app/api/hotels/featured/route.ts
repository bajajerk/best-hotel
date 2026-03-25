import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://134.122.41.91:5000";

const FEATURED_CITY_SLUGS = [
  "bangkok", "tokyo", "paris", "london", "dubai", "singapore",
  "bali", "rome", "barcelona", "hong-kong", "mumbai", "delhi",
  "maldives", "sydney", "marrakech", "cape-town", "jaipur", "phuket",
];

interface CuratedHotel {
  id: number;
  city_slug: string;
  city_name: string;
  country: string;
  category: string;
  hotel_id: number;
  hotel_name: string;
  star_rating: number | null;
  rating_average: number | null;
  number_of_reviews: number | null;
  rates_from: number | null;
  photo1: string | null;
  photo2: string | null;
  overview: string | null;
  latitude: number | null;
  longitude: number | null;
  display_order: number;
}

async function fetchCityCategory(
  slug: string,
  category: string
): Promise<CuratedHotel[]> {
  const res = await fetch(
    `${BACKEND_URL}/api/curations/${slug}?category=${category}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const curations = data.curations || {};
  return (curations[category] || []).slice(0, 3);
}

async function fetchCategory(
  slugs: string[],
  category: string
): Promise<CuratedHotel[]> {
  const results = await Promise.allSettled(
    slugs.map((slug) => fetchCityCategory(slug, category))
  );
  const hotels: CuratedHotel[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      hotels.push(...result.value);
    }
  }
  return hotels;
}

function isRenderable(hotel: CuratedHotel): boolean {
  return Boolean(hotel.hotel_name && hotel.rates_from && hotel.rates_from > 0);
}

export async function GET() {
  try {
    const [couples, singles, families] = await Promise.all([
      fetchCategory(FEATURED_CITY_SLUGS, "couples"),
      fetchCategory(FEATURED_CITY_SLUGS.slice(0, 12), "singles"),
      fetchCategory(FEATURED_CITY_SLUGS.slice(0, 12), "families"),
    ]);

    const renderableCouples = couples.filter(
      (h) => isRenderable(h) && h.rating_average
    );

    const byRating = [...renderableCouples].sort(
      (a, b) => (b.rating_average || 0) - (a.rating_average || 0)
    );

    const byValue = [...renderableCouples].sort(
      (a, b) => (a.rates_from || Infinity) - (b.rates_from || Infinity)
    );

    const filterAndSort = (hotels: CuratedHotel[]) =>
      hotels
        .filter((h) => isRenderable(h) && h.rating_average)
        .sort((a, b) => (b.rating_average || 0) - (a.rating_average || 0));

    return NextResponse.json({
      topRated: byRating.slice(0, 8),
      bestValue: byValue.slice(0, 8),
      soloTravel: filterAndSort(singles).slice(0, 8),
      familyFriendly: filterAndSort(families).slice(0, 8),
    });
  } catch (err) {
    console.error("[featured] Failed to fetch:", err);
    return NextResponse.json(
      { error: "Failed to fetch featured hotels" },
      { status: 500 }
    );
  }
}
