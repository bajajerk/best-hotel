import {
  fetchCuratedCities,
  fetchFeaturedAll,
  fetchHomeFeaturedCities,
  fetchHomeFeaturedHotels,
  CuratedCity,
} from "@/lib/api";
import type {
  FeaturedResponse,
  HomeFeaturedCity,
  HomeFeaturedHotel,
} from "@/lib/api";
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
  homeCities: HomeFeaturedCity[];
  editorsPicks: HomeFeaturedHotel[];
}> {
  const timeout = (ms: number) =>
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    );

  const [cities, featured, homeCities, editorsPicks] = await Promise.all([
    Promise.race([fetchCuratedCities(), timeout(8000)]).catch(() =>
      SAMPLE_CITIES.map((c, i) => ({
        ...c,
        city_id: null as number | null,
        hotel_count: 0,
        display_order: i + 1,
      }))
    ),
    Promise.race([fetchFeaturedAll(), timeout(8000)]).catch(() => null),
    Promise.race([fetchHomeFeaturedCities(), timeout(8000)]).catch(
      () => [] as HomeFeaturedCity[]
    ),
    Promise.race([fetchHomeFeaturedHotels(), timeout(8000)]).catch(
      () => [] as HomeFeaturedHotel[]
    ),
  ]);

  return { cities, featured, homeCities, editorsPicks };
}

// ---------------------------------------------------------------------------
// Server Component — renders SSR HTML for SEO + hydrates client component
// ---------------------------------------------------------------------------

export default async function HomePage() {
  const { cities, featured, homeCities, editorsPicks } = await getHomeData();

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
      <Home
        initialCities={cities}
        initialFeatured={featured}
        initialHomeCities={homeCities}
        initialEditorsPicks={editorsPicks}
      />

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
        <h1>{SITE_NAME} — Preferred Access to Luxury Hotels | Exclusive Perks on 1,500+ Hotels Worldwide</h1>
        <p>{DEFAULT_DESCRIPTION}</p>

        <h2>How It Works</h2>
        <p>
          Join Voyagr Club for free and unlock preferred access to a curated collection
          of luxury hotels worldwide. Share your travel plans via WhatsApp, receive
          curated options with exclusive perks — room upgrades, spa credits, late
          checkout — and enjoy your extraordinary stay with full concierge support.
        </p>

        <h2>The Voyagr Club Difference</h2>
        <ul>
          <li>Preferred Access to Top Hotels — elevated access to a curated collection of the world's finest hotels with exclusive member privileges.</li>
          <li>A Real Human Concierge — every booking handled by a real concierge on WhatsApp, available 24/7.</li>
          <li>Handpicked Perks on Every Stay — room upgrades, spa credits, welcome drinks, early check-in, breakfast, lounge access, and more.</li>
          <li>Verified Luxury Properties — only properties we've vetted ourselves for service, cleanliness, and guest satisfaction.</li>
          <li>Flexible Support, Always — 24/7 concierge team for modifications, special requests, and anything that comes up.</li>
          <li>Free Membership, No Lock-In — no annual fees, no points programs that expire. Same privileged access from day one.</li>
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

        <h2>Handpicked Experiences</h2>
        <p>
          The Ritz-Carlton Bali — Oceanfront luxury with room upgrade, late checkout, and welcome drinks for members.
          The Oberoi Mumbai — Heritage elegance with spa credit, breakfast included, and early check-in for members.
          Park Hyatt Tokyo — Sky-high serenity with club lounge access, late checkout, and welcome amenity for members.
        </p>

        <h2>Testimonials</h2>
        <blockquote>
          "The perks and personal touch made our anniversary trip truly unforgettable. From the room upgrade to the late checkout, every detail was taken care of." — Priya Mehta, Mumbai
        </blockquote>
        <blockquote>
          "We planned our honeymoon across three cities. The exclusive perks through Voyagr Club — spa credits, welcome drinks, early check-in — turned every stay into a celebration." — Arjun & Kavya, Bangalore
        </blockquote>
        <blockquote>
          "What sets Voyagr apart is the human concierge. One WhatsApp message and everything was arranged — upgrades, restaurant reservations, even a surprise for my wife's birthday." — Rahul Sharma, Delhi
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
          Voyagr Club was built on a simple idea — luxury travel should come with
          extraordinary experiences. We partner directly with the world's finest
          hotels to offer our members preferred access, exclusive perks, and a
          personal concierge who makes every trip unforgettable. Our curated
          selection spans 50+ cities worldwide — from the beaches of Bali to the streets
          of Paris — handpicked to ensure quality and unforgettable experiences
          for every type of traveller.
        </p>
        <p>50+ Cities Worldwide | 10,000+ Hotels Listed | Free Membership | 24/7 WhatsApp Concierge</p>

        <h2>Contact</h2>
        <p>
          WhatsApp: +91 98765 43210 | Email: hello@voyagr.com |
          Website: <a href={SITE_URL}>{SITE_URL}</a>
        </p>
      </div>
    </>
  );
}
