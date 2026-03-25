import type { Metadata } from "next";
import { SAMPLE_CITIES, CITY_IMAGES, FALLBACK_CITY_IMAGE } from "@/lib/constants";
import {
  SITE_URL,
  SITE_NAME,
  slugToDisplayName,
  breadcrumbJsonLd,
  cityDestinationJsonLd,
} from "@/lib/seo";
import CityPageClient from "./CityPageClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const city = SAMPLE_CITIES.find((c) => c.city_slug === slug);
  const cityName = city?.city_name || slugToDisplayName(slug);
  const country = city?.country || "";
  const tagline = city?.tagline || "";
  const image = CITY_IMAGES[slug] || FALLBACK_CITY_IMAGE;

  const title = `Hotels in ${cityName}${country ? `, ${country}` : ""}`;
  const description = tagline
    ? `${tagline}. Discover curated hotels in ${cityName}. Voyagr Club offers preferred rates through direct relationships with the finest properties.`
    : `Discover curated hotels in ${cityName}${country ? `, ${country}` : ""}. Voyagr Club offers preferred rates through direct relationships with the finest properties.`;

  return {
    title,
    description,
    keywords: [
      `${cityName} hotels`,
      `${cityName} preferred rates`,
      `${cityName} accommodation`,
      `best hotels in ${cityName}`,
      `${cityName} travel`,
      `${cityName} hotel booking`,
    ],
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/city/${slug}`,
      siteName: SITE_NAME,
      images: [{ url: image, width: 800, height: 600, alt: `Hotels in ${cityName}` }],
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `${SITE_URL}/city/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return SAMPLE_CITIES.map((city) => ({
    slug: city.city_slug,
  }));
}

export default async function CityPageWrapper({ params }: Props) {
  const { slug } = await params;
  const city = SAMPLE_CITIES.find((c) => c.city_slug === slug);
  const cityName = city?.city_name || slugToDisplayName(slug);
  const country = city?.country || "";
  const image = CITY_IMAGES[slug] || FALLBACK_CITY_IMAGE;

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", url: SITE_URL },
    { name: "Destinations", url: `${SITE_URL}/search` },
    { name: cityName, url: `${SITE_URL}/city/${slug}` },
  ]);

  const destination = cityDestinationJsonLd({
    name: cityName,
    country,
    url: `${SITE_URL}/city/${slug}`,
    description: city?.tagline,
    image,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(destination) }}
      />
      <CityPageClient />
    </>
  );
}
