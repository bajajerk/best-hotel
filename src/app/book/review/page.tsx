"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useBookingFlow } from "@/context/BookingFlowContext";
import { fetchHotelDetail } from "@/lib/api";

const GOLD = "#C9A84C";

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
  const qHotelId = search.get("hotelId");
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

  const hotelId = qHotelId ? Number(qHotelId) : flow.hotelId;
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
    if (!hotelId || !optionId || !checkIn || !checkOut) {
      router.replace("/");
      return;
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Lazy-fetch hotel meta if missing ──
  useEffect(() => {
    if (!hotelId) return;
    if (hotelName && hotelPhoto && hotelCity) return;
    let cancelled = false;
    fetchHotelDetail(hotelId)
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
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId]);

  // ── Persist into context whenever inputs change so downstream pages have it ──
  useEffect(() => {
    if (!hydrated || !hotelId) return;
    flow.setRatePlan({
      hotelId,
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
  }, [hydrated, hotelId, optionId, roomName, mealBasis, refundable, freeCancelUntil, totalPrice, currency, checkIn, checkOut, adults, children, rooms, hotelName, hotelPhoto, hotelCity, hotelStars]);

  if (!hydrated) return null;

  const handleContinue = () => {
    flow.setRatePlan({
      hotelId: hotelId as number,
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
              background: "var(--cream-deep)",
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
                fontFamily: "var(--serif)",
                fontSize: "var(--text-heading-3)",
                fontWeight: 600,
                color: "var(--ink)",
                lineHeight: 1.2,
              }}
            >
              {hotelName || "Loading…"}
            </div>
            <div
              style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink-light)",
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
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            fontWeight: 600,
            color: "var(--ink-light)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            margin: "0 0 8px",
          }}
        >
          Room
        </h3>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: "var(--text-heading-3)",
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: 1.2,
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
              borderTop: "1px dashed var(--cream-border)",
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              color: "var(--success)",
              fontWeight: 600,
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
              borderTop: "1px dashed var(--cream-border)",
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              color: "var(--ink-light)",
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
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            color: "var(--ink-mid)",
            marginBottom: 10,
          }}
        >
          <span>
            Subtotal · {nights} night{nights !== 1 ? "s" : ""}
          </span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{formatInr(totalPrice)}</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            color: "var(--ink-mid)",
            paddingBottom: 14,
            borderBottom: "1px solid var(--cream-border)",
          }}
        >
          <span>Taxes &amp; fees</span>
          <span style={{ color: "var(--ink-mid)" }}>Included</span>
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
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body)",
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            Total
          </span>
          <span
            style={{
              fontFamily: "var(--serif)",
              fontSize: "var(--text-heading-2)",
              fontWeight: 600,
              color: "var(--ink)",
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
          fontFamily: "var(--sans)",
          fontSize: "var(--text-body-sm)",
          color: "var(--ink-light)",
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
          background: "var(--white)",
          borderTop: "1px solid var(--cream-border)",
          padding: "14px 16px",
          zIndex: 110,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <button
            onClick={handleContinue}
            style={{
              width: "100%",
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body)",
              fontWeight: 600,
              padding: "16px 24px",
              borderRadius: 12,
              border: "none",
              background: GOLD,
              color: "var(--ink)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            Continue to guest details →
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
        background: "var(--white)",
        borderRadius: 16,
        border: "1px solid var(--cream-border)",
        padding: "18px 20px",
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
        background: "var(--cream-deep)",
        border: "1px solid var(--cream-border)",
        fontFamily: "var(--sans)",
        fontSize: "var(--text-caption)",
        fontWeight: 500,
        color: "var(--ink)",
      }}
    >
      {children}
    </span>
  );
}
