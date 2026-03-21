"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface HotelDetail {
  hotel_id: number;
  hotel_name: string;
  city: string;
  country: string;
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
  chain_name: string | null;
  brand_name: string | null;
  accommodation_type: string | null;
  numberrooms: number | null;
  yearopened: number | null;
  yearrenovated: number | null;
  checkin: string | null;
  checkout: string | null;
}

interface Review {
  id: number;
  reviewer_name: string;
  reviewer_country: string | null;
  reviewer_avatar_url: string | null;
  rating: number;
  title: string | null;
  positive: string | null;
  negative: string | null;
  trip_type: string | null;
  stay_date: string | null;
}

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: Math.round(count) }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 8.5 ? "var(--green)" : rating >= 7 ? "var(--gold)" : "var(--white-50)";
  const label =
    rating >= 9 ? "Exceptional" : rating >= 8.5 ? "Excellent" : rating >= 8 ? "Very Good" : rating >= 7 ? "Good" : "Fair";

  return (
    <div className="flex items-center gap-2">
      <span
        className="px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ background: color, color: "#0A0A0A", fontFamily: "var(--font-mono)" }}
      >
        {rating.toFixed(1)}
      </span>
      <span className="text-sm" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const tripTypeEmoji: Record<string, string> = {
    solo: "🎒",
    couple: "💑",
    family: "👨‍👩‍👧‍👦",
    business: "💼",
    friends: "👥",
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={review.reviewer_avatar_url || `https://i.pravatar.cc/40?u=${review.id}`}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
          <div>
            <p className="text-sm" style={{ color: "var(--white)" }}>
              {review.reviewer_name}
            </p>
            <p className="text-xs" style={{ color: "var(--white-30)" }}>
              {review.reviewer_country}
              {review.trip_type && ` · ${tripTypeEmoji[review.trip_type] || ""} ${review.trip_type}`}
            </p>
          </div>
        </div>
        <span
          className="px-2 py-1 rounded text-xs font-medium"
          style={{
            background: review.rating >= 8.5 ? "var(--green-soft)" : "var(--gold-soft)",
            color: review.rating >= 8.5 ? "var(--green)" : "var(--gold)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {review.rating.toFixed(1)}
        </span>
      </div>

      {review.title && (
        <p className="text-sm font-medium mb-2" style={{ color: "var(--white)" }}>
          {review.title}
        </p>
      )}

      {review.positive && (
        <div className="flex gap-2 mb-2">
          <span style={{ color: "var(--green)" }}>+</span>
          <p className="text-xs leading-relaxed" style={{ color: "var(--white-50)" }}>
            {review.positive}
          </p>
        </div>
      )}

      {review.negative && (
        <div className="flex gap-2">
          <span style={{ color: "var(--red)" }}>−</span>
          <p className="text-xs leading-relaxed" style={{ color: "var(--white-30)" }}>
            {review.negative}
          </p>
        </div>
      )}

      {review.stay_date && (
        <p className="text-xs mt-3" style={{ color: "var(--white-15)", fontFamily: "var(--font-mono)" }}>
          Stayed {review.stay_date}
        </p>
      )}
    </div>
  );
}

export default function HotelPage() {
  const params = useParams();
  const hotelId = params.id as string;
  const [hotel, setHotel] = useState<HotelDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/hotels/${hotelId}`).then((r) => r.ok ? r.json() : null),
      fetch(`${API_BASE}/api/hotels/${hotelId}/reviews?limit=10`).then((r) => r.ok ? r.json() : { reviews: [] }).catch(() => ({ reviews: [] })),
    ])
      .then(([hotelData, reviewData]) => {
        setHotel(hotelData);
        setReviews(reviewData.reviews || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [hotelId]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-black)" }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }}
          />
          <p style={{ color: "var(--white-30)" }}>Loading hotel...</p>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-black)" }}
      >
        <div className="text-center">
          <p className="text-xl mb-4" style={{ color: "var(--white)" }}>Hotel not found</p>
          <Link href="/" className="text-sm" style={{ color: "var(--gold)" }}>
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  const photos = [hotel.photo1, hotel.photo2, hotel.photo3, hotel.photo4, hotel.photo5].filter(
    Boolean
  ) as string[];

  const getPhotoUrl = (p: string) =>
    p.startsWith("http") ? p : `https://photos.hotelbeds.com/giata/${p}`;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-black)", color: "var(--white)" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-50 px-6 md:px-12 lg:px-20 py-4 flex items-center justify-between"
        style={{
          background: "rgba(10,10,10,0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-4">
          <Link href="/">
            <span
              className="text-xl"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--gold)" }}
            >
              beatmyrate
            </span>
          </Link>
          <span style={{ color: "var(--white-15)" }}>/</span>
          <span className="text-sm" style={{ color: "var(--white-50)" }}>
            {hotel.hotel_name}
          </span>
        </div>
        <a
          href="tel:+919876543210"
          className="px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: "var(--gold)", color: "#0A0A0A" }}
        >
          Book Now
        </a>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <section className="px-6 md:px-12 lg:px-20 pt-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-2xl overflow-hidden" style={{ maxHeight: 480 }}>
              {/* Main photo */}
              <div className="relative h-[300px] md:h-full">
                <img
                  src={getPhotoUrl(photos[activePhoto] || photos[0])}
                  alt={hotel.hotel_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=70";
                  }}
                />
              </div>
              {/* Secondary photos */}
              {photos.length > 1 && (
                <div className="hidden md:grid grid-cols-2 gap-2">
                  {photos.slice(1, 5).map((p, i) => (
                    <div
                      key={i}
                      className="relative cursor-pointer overflow-hidden"
                      onClick={() => setActivePhoto(i + 1)}
                    >
                      <img
                        src={getPhotoUrl(p)}
                        alt=""
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=70";
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Hotel Info */}
      <section className="px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left - Details */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              {hotel.star_rating && <StarDisplay count={hotel.star_rating} />}
              {hotel.accommodation_type && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-elevated)", color: "var(--white-30)" }}
                >
                  {hotel.accommodation_type}
                </span>
              )}
            </div>

            <h1
              className="text-3xl md:text-4xl mb-2"
              style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
            >
              {hotel.hotel_name}
            </h1>

            <p className="text-sm mb-4" style={{ color: "var(--white-50)" }}>
              {[hotel.addressline1, hotel.city, hotel.country].filter(Boolean).join(", ")}
            </p>

            {hotel.rating_average && <RatingBadge rating={hotel.rating_average} />}

            {hotel.number_of_reviews && (
              <p className="text-xs mt-1" style={{ color: "var(--white-30)", fontFamily: "var(--font-mono)" }}>
                Based on {hotel.number_of_reviews.toLocaleString()} reviews
              </p>
            )}

            {/* Overview */}
            {hotel.overview && (
              <div className="mt-8">
                <h3 className="text-sm font-medium mb-3" style={{ color: "var(--white-80)" }}>
                  About this hotel
                </h3>
                <div
                  className="text-sm leading-relaxed prose-invert"
                  style={{ color: "var(--white-50)" }}
                  dangerouslySetInnerHTML={{
                    __html: hotel.overview,
                  }}
                />
              </div>
            )}

            {/* Quick Facts */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
              {hotel.checkin && (
                <div className="p-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--white-30)" }}>Check-in</p>
                  <p className="text-sm mt-1" style={{ color: "var(--white)" }}>{hotel.checkin}</p>
                </div>
              )}
              {hotel.checkout && (
                <div className="p-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--white-30)" }}>Check-out</p>
                  <p className="text-sm mt-1" style={{ color: "var(--white)" }}>{hotel.checkout}</p>
                </div>
              )}
              {hotel.numberrooms && (
                <div className="p-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--white-30)" }}>Rooms</p>
                  <p className="text-sm mt-1" style={{ color: "var(--white)" }}>{hotel.numberrooms}</p>
                </div>
              )}
              {hotel.yearrenovated && (
                <div className="p-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <p className="text-xs" style={{ color: "var(--white-30)" }}>Renovated</p>
                  <p className="text-sm mt-1" style={{ color: "var(--white)" }}>{hotel.yearrenovated}</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="mt-12">
                <h3
                  className="text-2xl mb-6"
                  style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                  Guest reviews
                </h3>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Booking Card */}
          <div className="lg:col-span-1">
            <div
              className="sticky top-24 rounded-2xl p-6"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--gold-border)",
              }}
            >
              <p
                className="text-xs tracking-[0.2em] uppercase mb-4"
                style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}
              >
                B2B Rate
              </p>

              {hotel.rates_from ? (
                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontStyle: "italic",
                        color: "var(--green)",
                      }}
                    >
                      ${Math.round(hotel.rates_from)}
                    </span>
                    <span className="text-sm" style={{ color: "var(--white-30)" }}>
                      /night
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--white-30)" }}>
                    Prices may vary by date. Call for exact quote.
                  </p>
                </div>
              ) : (
                <p className="text-sm mb-4" style={{ color: "var(--white-50)" }}>
                  Call us for the best available rate
                </p>
              )}

              <a
                href="tel:+919876543210"
                className="block w-full py-3 rounded-full text-center text-sm font-medium mb-3"
                style={{ background: "var(--gold)", color: "#0A0A0A" }}
              >
                📞 Call to Book
              </a>

              <a
                href="https://wa.me/919876543210"
                className="block w-full py-3 rounded-full text-center text-sm"
                style={{ border: "1px solid var(--gold-border)", color: "var(--gold)" }}
              >
                WhatsApp Us
              </a>

              <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs leading-relaxed" style={{ color: "var(--white-30)" }}>
                  Our team confirms availability and processes payment on call.
                  No markup, no hidden fees. Same hotel, better rate.
                </p>
              </div>

              {/* Chain/Brand info */}
              {(hotel.chain_name || hotel.brand_name) && (
                <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  {hotel.chain_name && (
                    <p className="text-xs" style={{ color: "var(--white-30)" }}>
                      Chain: <span style={{ color: "var(--white-50)" }}>{hotel.chain_name}</span>
                    </p>
                  )}
                  {hotel.brand_name && (
                    <p className="text-xs mt-1" style={{ color: "var(--white-30)" }}>
                      Brand: <span style={{ color: "var(--white-50)" }}>{hotel.brand_name}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
