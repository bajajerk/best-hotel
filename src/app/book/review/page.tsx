"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useBookingFlow } from "@/context/BookingFlowContext";

const GOLD = "#C9A84C";
const HOLD_SECONDS = 300;
const USD_TO_INR = 83;

const toInr = (usd: number) => Math.round(usd * USD_TO_INR);
const formatInr = (usd: number) =>
  `\u20B9${toInr(usd).toLocaleString("en-IN")}`;
const formatInrAmount = (inr: number) =>
  `\u20B9${Math.round(inr).toLocaleString("en-IN")}`;

function formatTimer(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatLongDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDayLabel(iso: string, time: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const day = d.toLocaleDateString("en-IN", { weekday: "long" });
  return `${day}, ${time}`;
}

function freeCancellationDate(checkInIso: string) {
  if (!checkInIso) return "";
  const d = new Date(checkInIso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReviewBookingPage() {
  const router = useRouter();
  const flow = useBookingFlow();

  const [seconds, setSeconds] = useState(HOLD_SECONDS);
  const [expired, setExpired] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Redirect if no rooms selected
  useEffect(() => {
    if (flow.selectedRooms.length === 0) {
      router.replace("/book/rooms");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start the rate hold the first time Review is reached, then drive the
  // countdown off the shared timestamp so later pages stay in sync.
  useEffect(() => {
    flow.startHold();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!flow.holdStartedAt) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - (flow.holdStartedAt ?? Date.now())) / 1000);
      const remaining = HOLD_SECONDS - elapsed;
      if (remaining <= 0) {
        setSeconds(0);
        setExpired(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setSeconds(remaining);
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [flow.holdStartedAt]);

  const firstRoom = flow.selectedRooms[0];
  const roomType = firstRoom?.roomType;
  const inclusions = roomType?.amenities.slice(0, 3) ?? [];
  const packageName = "Stay + Breakfast";

  // Pricing — taxes shown as "Included" per spec
  const subtotalInr = toInr(flow.totalPrice);
  const grandTotalInr = subtotalInr; // taxes inclusive

  const handleContinue = () => {
    if (expired) return;
    router.push("/book/guest-details");
  };

  const handleSearchAgain = () => {
    router.push("/search");
  };

  const [city, country] = (flow.hotelCity || "").split(",").map((s) => s.trim());

  return (
    <div>
      {/* Urgency timer */}
      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            background: "rgba(201,168,76,0.10)",
            border: `1px solid ${GOLD}`,
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            fontWeight: 600,
            color: GOLD,
          }}
        >
          <span aria-hidden>⏱</span>
          <span>Rate held for {formatTimer(seconds)}</span>
        </div>
      </div>

      {/* Hotel card */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              position: "relative",
              width: 60,
              height: 60,
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              background: "var(--cream-deep)",
            }}
          >
            {flow.hotelImage && (
              <Image
                src={flow.hotelImage}
                alt={flow.hotelName}
                fill
                style={{ objectFit: "cover" }}
                sizes="60px"
              />
            )}
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
              {flow.hotelName}
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
            <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
              {Array.from({ length: flow.hotelStars || 5 }).map((_, i) => (
                <span key={i} style={{ color: GOLD, fontSize: 14 }}>
                  ★
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Dates card */}
      <Card>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 12,
          }}
        >
          <DateColumn
            label="Check-in"
            date={formatLongDate(flow.checkIn)}
            day={formatDayLabel(flow.checkIn, "3:00 PM")}
            align="left"
          />
          <div
            style={{
              background: GOLD,
              color: "var(--ink)",
              fontFamily: "var(--sans)",
              fontSize: "var(--text-caption)",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {flow.nights} Night{flow.nights !== 1 ? "s" : ""}
          </div>
          <DateColumn
            label="Check-out"
            date={formatLongDate(flow.checkOut)}
            day={formatDayLabel(flow.checkOut, "12:00 PM")}
            align="right"
          />
        </div>
      </Card>

      {/* Room summary card */}
      <Card>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              color: "var(--ink-light)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            Room
          </h3>
          <button
            onClick={() => router.push("/book/rooms")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              fontWeight: 600,
              color: GOLD,
              cursor: "pointer",
            }}
          >
            Room Details →
          </button>
        </div>

        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: "var(--text-heading-3)",
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: 1.2,
          }}
        >
          {roomType?.name}
        </div>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            color: "var(--ink-mid)",
            marginTop: 4,
          }}
        >
          {packageName}
        </div>

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "14px 0 0",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {inclusions.map((item) => (
            <li
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink)",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "rgba(74,124,89,0.15)",
                  color: "var(--success)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div
          style={{
            marginTop: 16,
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
          Free cancellation until {freeCancellationDate(flow.checkIn)}
        </div>
      </Card>

      {/* Price card */}
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
            {formatInr(roomType ? roomType.pricePerNight * (firstRoom?.quantity ?? 1) : 0)}
            {" × "}
            {flow.nights} night{flow.nights !== 1 ? "s" : ""}
          </span>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>
            {formatInrAmount(subtotalInr)}
          </span>
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
            {formatInrAmount(grandTotalInr)}
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-caption)",
            color: "var(--success)",
            fontWeight: 500,
            marginTop: 4,
            textAlign: "right",
          }}
        >
          Taxes included
        </div>
      </Card>

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
            disabled={expired}
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
              cursor: expired ? "not-allowed" : "pointer",
              opacity: expired ? 0.5 : 1,
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

      {/* Rate expired modal */}
      {expired && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="rate-expired-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(26,23,16,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--white)",
              borderRadius: 16,
              padding: "28px 24px",
              maxWidth: 360,
              width: "100%",
              textAlign: "center",
            }}
          >
            <h2
              id="rate-expired-title"
              style={{
                fontFamily: "var(--serif)",
                fontSize: "var(--text-heading-2)",
                fontWeight: 600,
                color: "var(--ink)",
                margin: "0 0 8px",
              }}
            >
              Your rate has been released.
            </h2>
            <p
              style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink-light)",
                margin: "0 0 20px",
                lineHeight: 1.5,
              }}
            >
              The 5-minute hold has expired. Search again to see live availability.
            </p>
            <button
              onClick={handleSearchAgain}
              style={{
                width: "100%",
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body)",
                fontWeight: 600,
                padding: "14px 24px",
                borderRadius: 12,
                border: "none",
                background: GOLD,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              Search Again →
            </button>
          </div>
        </div>
      )}
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

function DateColumn({
  label,
  date,
  day,
  align,
}: {
  label: string;
  date: string;
  day: string;
  align: "left" | "right";
}) {
  return (
    <div style={{ textAlign: align, minWidth: 0 }}>
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: "var(--text-caption)",
          color: "var(--ink-light)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: "var(--text-heading-3)",
          fontWeight: 600,
          color: "var(--ink)",
          lineHeight: 1.15,
        }}
      >
        {date}
      </div>
      <div
        style={{
          fontFamily: "var(--sans)",
          fontSize: "var(--text-caption)",
          color: "var(--ink-light)",
          marginTop: 4,
        }}
      >
        {day}
      </div>
    </div>
  );
}
