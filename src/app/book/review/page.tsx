"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useBookingFlow } from "@/context/BookingFlowContext";
import { fetchHotelDetail } from "@/lib/api";

const GOLD = "#c8aa76";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";
const TEXT_PRIMARY = "#f7f5f2";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const TEXT_SOFT = "rgba(247, 245, 242, 0.45)";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const formatInr = (n: number) => inrFormatter.format(Math.round(n || 0));

function formatLongDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatShortMonthDay(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function diffNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;
  return Math.max(
    1,
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    )
  );
}

export default function ReviewBookingPage() {
  const router = useRouter();
  const search = useSearchParams();
  const flow = useBookingFlow();

  const [hydrated, setHydrated] = useState(false);

  // ── Read query params first; fall back to context ──
  // Phase D: the canonical URL param is `hotelMasterId` — a hotel master UUID.
  // The booking flow threads this all the way through to POST /api/bookings.
  const qHotelMasterId = search.get("hotelMasterId");
  const qOptionId = search.get("optionId") || "";
  const qRoomName = search.get("roomName") || "";
  const qMealBasis = search.get("mealBasis") || "";
  const qRefundable = search.get("refundable");
  const qFreeCancelUntil = search.get("freeCancelUntil") || "";
  const qTotalPrice = search.get("totalPrice");
  const qCurrency = search.get("currency") || "INR";
  const qCheckIn = search.get("checkIn") || "";
  const qCheckOut = search.get("checkOut") || "";
  const qAdults = search.get("adults");
  const qChildren = search.get("children");
  const qRooms = search.get("rooms");

  const hotelMasterId = qHotelMasterId || flow.hotelMasterId;
  const optionId = qOptionId || flow.optionId;
  const roomName = qRoomName || flow.roomName;
  const mealBasis = qMealBasis || flow.mealBasis;
  const refundable = qRefundable !== null ? qRefundable === "true" : flow.refundable;
  const freeCancelUntil = qFreeCancelUntil || flow.freeCancelUntil;
  const totalPrice = qTotalPrice ? Number(qTotalPrice) : flow.totalPrice;
  const currency = qCurrency || flow.currency;
  const checkIn = qCheckIn || flow.checkIn;
  const checkOut = qCheckOut || flow.checkOut;
  const adults = qAdults ? Number(qAdults) : flow.adults || 2;
  const children = qChildren ? Number(qChildren) : flow.children || 0;
  const rooms = qRooms ? Number(qRooms) : flow.rooms || 1;

  const nights = useMemo(() => diffNights(checkIn, checkOut), [checkIn, checkOut]);

  // Hotel meta — pull from query/context, or fetch from API if missing
  const [hotelName, setHotelName] = useState(flow.hotelName);
  const [hotelPhoto, setHotelPhoto] = useState(flow.hotelPhoto || flow.hotelImage);
  const [hotelCity, setHotelCity] = useState(flow.hotelCity);
  const [hotelStars, setHotelStars] = useState(flow.hotelStars);

  // ── Bounce back to home if essential params missing ──
  useEffect(() => {
    if (!hotelMasterId || !optionId || !checkIn || !checkOut) {
      router.replace("/");
      return;
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Lazy-fetch hotel meta if missing ──
  // GET /api/hotels/{master_id} returns the canonical meta record. If the
  // backend is unreachable we fall back to whatever the booking flow already
  // carries (set on /hotel/[id] from the rates response).
  useEffect(() => {
    if (!hotelMasterId) return;
    if (hotelName && hotelPhoto && hotelCity) return;
    let cancelled = false;
    fetchHotelDetail(hotelMasterId)
      .then((h) => {
        if (cancelled || !h) return;
        const name = h.hotel_name || "";
        const photo = h.photo1 || "";
        const city = [h.city, h.country].filter(Boolean).join(", ");
        setHotelName(name);
        setHotelPhoto(photo);
        setHotelCity(city);
        setHotelStars(h.star_rating || 5);
      })
      .catch(() => {
        // Booking flow already has hotel meta from the rates response. Silent.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelMasterId]);

  // ── Persist into context whenever inputs change so downstream pages have it ──
  useEffect(() => {
    if (!hydrated || !hotelMasterId) return;
    flow.setRatePlan({
      hotelMasterId,
      hotelName,
      hotelPhoto,
      hotelCity,
      hotelStars,
      optionId,
      roomName,
      mealBasis,
      refundable,
      freeCancelUntil,
      totalPrice,
      currency,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, hotelMasterId, optionId, roomName, mealBasis, refundable, freeCancelUntil, totalPrice, currency, checkIn, checkOut, adults, children, rooms, hotelName, hotelPhoto, hotelCity, hotelStars]);

  if (!hydrated) return null;

  const handleContinue = () => {
    flow.setRatePlan({
      hotelMasterId: hotelMasterId as string,
      hotelName,
      hotelPhoto,
      hotelCity,
      hotelStars,
      optionId,
      roomName,
      mealBasis,
      refundable,
      freeCancelUntil,
      totalPrice,
      currency,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
    });
    router.push("/book/guest-details");
  };

  const [city, country] = (hotelCity || "").split(",").map((s) => s.trim());
  const datesPill = `${formatShortMonthDay(checkIn)} → ${formatShortMonthDay(checkOut)}, ${nights} night${nights !== 1 ? "s" : ""}`;

  return (
    <div>
      {/* Hotel hero */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              position: "relative",
              width: 72,
              height: 72,
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {hotelPhoto ? (
              <Image
                src={hotelPhoto}
                alt={hotelName}
                fill
                style={{ objectFit: "cover" }}
                sizes="72px"
                unoptimized
              />
            ) : null}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-heading-3)",
                fontWeight: 500,
                color: TEXT_PRIMARY,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
              }}
            >
              {hotelName || "Loading…"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-sm)",
                color: TEXT_MUTED,
                marginTop: 4,
              }}
            >
              {city}
              {country ? ` · ${country}` : ""}
            </div>
            {hotelStars > 0 && (
              <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
                {Array.from({ length: hotelStars }).map((_, i) => (
                  <span key={i} style={{ color: GOLD, fontSize: 14 }}>
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Room + meal basis */}
      <Card>
        <h3
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            fontWeight: 700,
            color: GOLD,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            margin: "0 0 10px",
          }}
        >
          Room
        </h3>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-heading-3)",
            fontWeight: 500,
            color: TEXT_PRIMARY,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          {roomName}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <Pill>{mealBasis || "Room Only"}</Pill>
          <Pill>{datesPill}</Pill>
          <Pill>
            {adults} adult{adults !== 1 ? "s" : ""}
            {children > 0 ? ` · ${children} child${children !== 1 ? "ren" : ""}` : ""}
          </Pill>
        </div>

        {refundable && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px dashed rgba(255,255,255,0.10)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-sm)",
              color: "#86c79b",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span aria-hidden>✓</span>
            Free cancellation
            {freeCancelUntil ? ` until ${formatLongDate(freeCancelUntil.slice(0, 10))}` : ""}
          </div>
        )}
        {!refundable && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: "1px dashed rgba(255,255,255,0.10)",
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-sm)",
              color: TEXT_SOFT,
              fontWeight: 500,
            }}
          >
            Non-refundable rate
          </div>
        )}
      </Card>

      {/* Price breakdown */}
      <Card>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: TEXT_MUTED,
            marginBottom: 10,
          }}
        >
          <span>
            Subtotal · {nights} night{nights !== 1 ? "s" : ""}
          </span>
          <span style={{ color: TEXT_PRIMARY, fontWeight: 500 }}>{formatInr(totalPrice)}</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-body)",
            color: TEXT_MUTED,
            paddingBottom: 14,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <span>Taxes &amp; fees</span>
          <span style={{ color: TEXT_MUTED }}>Included</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 14,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body)",
              fontWeight: 600,
              color: TEXT_PRIMARY,
              letterSpacing: "0.02em",
            }}
          >
            Total
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-heading-2)",
              fontWeight: 500,
              color: GOLD,
              letterSpacing: "-0.01em",
            }}
          >
            {formatInr(totalPrice)}
          </span>
        </div>
      </Card>

      {/* Trust line */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: TEXT_SOFT,
          margin: "12px 0 24px",
          lineHeight: 1.6,
        }}
      >
        No payment now · Concierge confirms within 15 min · Free cancellation if applicable
      </div>

      {/* Sticky bottom bar */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(12, 11, 10, 0.92)",
          backdropFilter: "blur(18px) saturate(120%)",
          WebkitBackdropFilter: "blur(18px) saturate(120%)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "14px 16px",
          zIndex: 110,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button
            onClick={handleContinue}
            className="luxe-btn-gold"
            style={{ width: "100%", padding: "16px 24px" }}
          >
            Continue to guest details
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: SURFACE,
        borderRadius: 16,
        border: `1px solid ${SURFACE_BORDER}`,
        padding: "20px 22px",
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-caption)",
        fontWeight: 500,
        color: TEXT_PRIMARY,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}
