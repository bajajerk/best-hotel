import { fetchCuratedCities, fetchFeaturedAll, CuratedCity } from "@/lib/api";
import type { FeaturedResponse } from "@/lib/api";
import { SAMPLE_CITIES } from "@/lib/constants";
import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION } from "@/lib/seo";
import Home from "./HomePageClient";

// Force dynamic rendering — fetch data at request time, not build time
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Server-side data fetching — ensures crawlers get real content in the HTML
// ---------------------------------------------------------------------------

async function getHomeData(): Promise<{
  cities: CuratedCity[];
  featured: FeaturedResponse | null;
}> {
  const timeout = (ms: number) =>
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    );

  const [cities, featured] = await Promise.all([
    Promise.race([fetchCuratedCities(), timeout(8000)]).catch(() =>
      SAMPLE_CITIES.map((c, i) => ({
        ...c,
        city_id: null as number | null,
        hotel_count: 0,
        display_order: i + 1,
      }))
    ),
    Promise.race([fetchFeaturedAll(), timeout(8000)]).catch(() => null),
  ]);

  return { cities, featured };
}

// ---------------------------------------------------------------------------
// Server Component — renders SSR HTML for SEO + hydrates client component
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const { cities, featured } = await getHomeData();

  // Flatten featured hotels for SEO content
  const allFeaturedHotels = featured
    ? [
        ...featured.topRated,
        ...featured.bestValue,
        ...featured.soloTravel,
        ...featured.familyFriendly,
      ]
    : [];

  // Deduplicate by hotel_name
  const uniqueHotels = Array.from(
    new Map(allFeaturedHotels.map((h) => [h.hotel_name, h])).values()
  );

  return (
    <>
      {/* Interactive client-side homepage with pre-fetched data */}
      <Home initialCities={cities} initialFeatured={featured} />

      {/*
        SEO Content Block — visually hidden but fully crawlable.
        This ensures search engines and AI scrapers (Claude, ChatGPT, etc.)
        can read the site's core value proposition even without JS execution.
      */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: 0,
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          borderWidth: 0,
        }}
      >
        <h1>{SITE_NAME} — Preferred Hotel Rates | Wholesale Access to 1,500+ Hotels Worldwide</h1>
        <p>{DEFAULT_DESCRIPTION}</p>

        <h2>How It Works</h2>
        <p>
          Voyagr Club negotiates B2B rates directly with hotels, cutting out middlemen
          and their markups. See the market price alongside our rate instantly — no
          guesswork, no hidden fees. One WhatsApp message, and our concierge team
          confirms your stay within minutes. Preferred wholesale rates on every booking.
        </p>

        <h2>Why Book With Voyagr Club</h2>
        <ul>
          <li>Rates You Won't Find Online — direct B2B contracts with hotels, the same wholesale rates that travel agencies use internally.</li>
          <li>No Hidden Fees, Ever — the price we quote is the price you pay.</li>
          <li>A Human, Not a Chatbot — every booking handled by a real concierge on WhatsApp.</li>
          <li>Verified Five-Star Partners — only properties we've vetted ourselves.</li>
          <li>Flexible Cancellations — free cancellation up to 48 hours before check-in at most partner hotels.</li>
          <li>Loyalty Without Lock-In — no points programs, no membership tiers. Same wholesale rate from day one.</li>
        </ul>

        <h2>Featured Destinations</h2>
        <ul>
          {cities.slice(0, 20).map((city) => (
            <li key={city.city_slug}>
              <a href={`${SITE_URL}/city/${city.city_slug}`}>
                {city.city_name}, {city.country}
                {city.tagline ? ` — ${city.tagline}` : ""}
              </a>
            </li>
          ))}
        </ul>

        <h2>Featured Hotels</h2>
        <ul>
          {uniqueHotels.slice(0, 30).map((hotel) => (
            <li key={hotel.hotel_id}>
              {hotel.hotel_name} — {hotel.city_name}, {hotel.country}
              {hotel.star_rating ? ` | ${hotel.star_rating}-star` : ""}
              {hotel.rating_average ? ` | Rating: ${hotel.rating_average}/10` : ""}
              {hotel.rates_from ? ` | From $${hotel.rates_from}/night` : ""}
            </li>
          ))}
        </ul>

        <h2>Price Comparison Examples</h2>
        <p>
          Siam Kempinski Bangkok — Market rate INR 14,500, Voyagr rate INR 10,500 (save 28%).
          The Oberoi Mumbai — Market rate INR 18,200, Voyagr rate INR 12,800 (save 30%).
          Park Hyatt Tokyo — Market rate INR 28,000, Voyagr rate INR 19,500 (save 30%).
        </p>

        <h2>Testimonials</h2>
        <blockquote>
          "I booked the same suite I found on Booking.com — the Voyagr rate was noticeably better. I genuinely did not believe it until I checked in." — Priya Mehta, Mumbai
        </blockquote>
        <blockquote>
          "We planned our honeymoon across three cities. The rates through Voyagr meant we could add an extra night in Santorini." — Arjun & Kavya, Bangalore
        </blockquote>
        <blockquote>
          "As a travel agent myself, I was skeptical. These are genuine B2B rates. I now use Voyagr for all my personal trips." — Rahul Sharma, Delhi
        </blockquote>

        <h2>Travel by Season</h2>
        <p>
          Summer (Jun–Aug): Santorini, Bali, Cape Town.
          Autumn (Sep–Nov): Kyoto, Prague, Budapest.
          Winter (Dec–Feb): Dubai, Maldives, Vienna.
          Spring (Mar–May): Tokyo, Amsterdam, Lisbon.
        </p>

        <h2>About Voyagr Club</h2>
        <p>
          Voyagr Club was built on a simple idea — luxury travel should be accessible.
          We leverage B2B wholesale hotel networks to bring you the same rooms, same dates,
          at rates well below what you'd find on retail booking platforms. Our curated
          selection spans 50+ cities worldwide — from the beaches of Bali to the streets
          of Paris — handpicked to ensure quality, value, and unforgettable experiences
          for every type of traveller.
        </p>
        <p>50+ Cities Worldwide | 10,000+ Hotels Listed | B2B Wholesale Rates | 24/7 WhatsApp Support</p>

        <h2>Contact</h2>
        <p>
          WhatsApp: +91 98765 43210 | Email: hello@voyagr.com |
          Website: <a href={SITE_URL}>{SITE_URL}</a>
        </p>
      </div>
    </>
  );
}
