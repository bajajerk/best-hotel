// ---------------------------------------------------------------------------
// SEO Utilities — Shared across all pages
// ---------------------------------------------------------------------------

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://voyagr.club";
export const SITE_NAME = "Voyagr Club";
export const DEFAULT_DESCRIPTION =
  "Access preferred hotel rates across 50+ cities worldwide. We negotiate directly with hotels and pass insider pricing to our members. No markup, no hidden fees.";

/**
 * Organization JSON-LD — appears on every page via root layout
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description: DEFAULT_DESCRIPTION,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "hello@voyagr.com",
      availableLanguage: "English",
    },
    sameAs: [],
  };
}

/**
 * WebSite JSON-LD with SearchAction — helps Google show a sitelinks search box
 */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * BreadcrumbList JSON-LD generator
 */
export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Hotel JSON-LD for individual hotel pages
 */
export function hotelJsonLd(hotel: {
  name: string;
  url: string;
  description?: string;
  image?: string;
  starRating?: number;
  ratingValue?: number;
  reviewCount?: number;
  priceRange?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    country?: string;
  };
  latitude?: number;
  longitude?: number;
  checkinTime?: string;
  checkoutTime?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    url: hotel.url,
    ...(hotel.description && { description: hotel.description }),
    ...(hotel.image && { image: hotel.image }),
    ...(hotel.starRating && {
      starRating: {
        "@type": "Rating",
        ratingValue: hotel.starRating,
      },
    }),
    ...(hotel.ratingValue &&
      hotel.reviewCount && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: hotel.ratingValue,
          bestRating: 10,
          reviewCount: hotel.reviewCount,
        },
      }),
    ...(hotel.priceRange && { priceRange: hotel.priceRange }),
    ...(hotel.address && {
      address: {
        "@type": "PostalAddress",
        ...(hotel.address.streetAddress && {
          streetAddress: hotel.address.streetAddress,
        }),
        ...(hotel.address.city && {
          addressLocality: hotel.address.city,
        }),
        ...(hotel.address.country && {
          addressCountry: hotel.address.country,
        }),
      },
    }),
    ...(hotel.latitude &&
      hotel.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: hotel.latitude,
          longitude: hotel.longitude,
        },
      }),
    ...(hotel.checkinTime && { checkinTime: hotel.checkinTime }),
    ...(hotel.checkoutTime && { checkoutTime: hotel.checkoutTime }),
  };
}

/**
 * TravelAction JSON-LD for city destination pages
 */
export function cityDestinationJsonLd(city: {
  name: string;
  country: string;
  url: string;
  description?: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: `${city.name}, ${city.country}`,
    url: city.url,
    ...(city.description && { description: city.description }),
    ...(city.image && { image: city.image }),
    touristType: ["Luxury Traveler", "Business Traveler", "Leisure Traveler"],
  };
}

/**
 * Helper to convert slug to display name
 */
export function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
