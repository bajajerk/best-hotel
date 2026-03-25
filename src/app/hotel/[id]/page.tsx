import type { Metadata } from "next";
import {
  SITE_URL,
  SITE_NAME,
  breadcrumbJsonLd,
  hotelJsonLd,
} from "@/lib/seo";
import HotelPageClient from "./HotelPageClient";

type Props = {
  params: Promise<{ id: string }>;
};

// Fetch hotel data server-side for metadata
async function getHotelData(id: string) {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://134.122.41.91:5000";
    const res = await fetch(`${backendUrl}/api/hotels/${id}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) return res.json();
  } catch {
    // Fallback if backend unavailable
  }
  return null;
}

function sanitizePhoto(url: string | null): string {
  if (!url) return "";
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const hotel = await getHotelData(id);

  if (!hotel) {
    return {
      title: "Hotel Details",
      description: "View hotel details, photos, reviews and rates on Voyagr Club.",
    };
  }

  const name = hotel.hotel_name || "Hotel";
  const city = hotel.city || "";
  const country = hotel.country || "";
  const stars = hotel.star_rating ? `${hotel.star_rating}-Star ` : "";
  const overview = hotel.overview ? stripHtml(hotel.overview).slice(0, 155) : "";
  const image = sanitizePhoto(hotel.photo1);

  const title = `${name} — ${stars}Hotel in ${city}${country ? `, ${country}` : ""}`;
  const description = overview
    || `Book ${name} in ${city} with preferred member access through Voyagr Club.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/hotel/${id}`,
      siteName: SITE_NAME,
      ...(image && {
        images: [{ url: image, width: 800, height: 600, alt: name }],
      }),
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image] }),
    },
    alternates: {
      canonical: `${SITE_URL}/hotel/${id}`,
    },
  };
}

export default async function HotelPageWrapper({ params }: Props) {
  const { id } = await params;
  const hotel = await getHotelData(id);

  const hotelName = hotel?.hotel_name || "Hotel";
  const city = hotel?.city || "";
  const image = hotel?.photo1 ? sanitizePhoto(hotel.photo1) : undefined;

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    ...(city
      ? [
          {
            name: city,
            url: `${SITE_URL}/city/${city.toLowerCase().replace(/\s+/g, "-")}`,
          },
        ]
      : []),
    { name: hotelName, url: `${SITE_URL}/hotel/${id}` },
  ]);

  const hotelSchema = hotel
    ? hotelJsonLd({
        name: hotelName,
        url: `${SITE_URL}/hotel/${id}`,
        description: hotel.overview ? stripHtml(hotel.overview).slice(0, 300) : undefined,
        image,
        starRating: hotel.star_rating,
        ratingValue: hotel.rating_average,
        reviewCount: hotel.number_of_reviews,
        address: {
          streetAddress: hotel.addressline1 || undefined,
          city: hotel.city || undefined,
          country: hotel.country || undefined,
        },
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        checkinTime: hotel.checkin || undefined,
        checkoutTime: hotel.checkout || undefined,
      })
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {hotelSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelSchema) }}
        />
      )}
      <HotelPageClient />
    </>
  );
}
