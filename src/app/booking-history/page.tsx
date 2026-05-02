"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getStoredBookings, StoredBooking } from "@/components/BookingModal";

function formatDateShort(iso: string): string {
  if (!iso) return "TBD";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(amount: number, currency?: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "\u20AC", GBP: "\u00A3", INR: "\u20B9",
    JPY: "\u00A5", AUD: "A$", SGD: "S$", THB: "\u0E3F",
    AED: "AED ", MYR: "RM ", IDR: "Rp ", KRW: "\u20A9",
  };
  const sym = currency
    ? symbols[currency.toUpperCase()] || `${currency} `
    : "$";
  const rounded = Math.round(amount);
  const formatted =
    currency?.toUpperCase() === "INR"
      ? rounded.toLocaleString("en-IN")
      : rounded.toLocaleString("en-US");
  return `${sym}${formatted}`;
}

function BookingCard({ booking }: { booking: StoredBooking }) {
  const isPreferred = booking.rateType === "preferred";

  return (
    <div
      style={{
        background: "var(--white, var(--white))",
        border: "1px solid var(--cream-border, #e0d8c8)",
        borderRadius: 0,
        overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        style={{
          background: "#3d3a2e",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--cream, var(--cream))",
              lineHeight: 1.3,
            }}
          >
            {booking.hotelName}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--gold, var(--gold))", fontWeight: 500, marginTop: 2 }}>
            {booking.roomName}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--success, var(--success))",
            }}
          />
          <span style={{ fontSize: "11px", color: "rgba(245,240,232,0.7)", fontWeight: 500 }}>
            Confirmed
          </span>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "20px 24px" }}>
        {/* Booking reference */}
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-light)",
              marginBottom: 4,
            }}
          >
            Booking Reference
          </p>
          <p
            style={{
              fontSize: "16px",
              fontWeight: 500,
              fontFamily: "var(--font-mono)",
              color: "var(--ink)",
              letterSpacing: "0.06em",
            }}
          >
            {booking.bookingId}
          </p>
        </div>

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 24px",
            marginBottom: 16,
          }}
        >
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 2 }}>
              Check-in
            </p>
            <p style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>
              {formatDateShort(booking.checkIn)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 2 }}>
              Check-out
            </p>
            <p style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>
              {formatDateShort(booking.checkOut)}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 2 }}>
              Duration
            </p>
            <p style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>
              {booking.nights} night{booking.nights > 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-light)", marginBottom: 2 }}>
              Guest
            </p>
            <p style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>
              {booking.guestName}
            </p>
          </div>
        </div>

        {/* Rate badge */}
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 10px",
              background: isPreferred ? "var(--gold-pale, rgba(201,168,76,0.12))" : "var(--cream-deep, var(--cream-deep))",
              color: isPreferred ? "var(--gold, var(--gold))" : "var(--ink-light)",
              border: isPreferred ? "1px solid var(--gold, var(--gold))" : "1px solid var(--cream-border)",
            }}
          >
            {isPreferred ? "Preferred Rate" : "Standard Rate"}
          </span>
        </div>

        {/* Price footer */}
        <div
          style={{
            borderTop: "1px solid var(--cream-border, #e0d8c8)",
            paddingTop: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            {booking.totalSaving > 0 && (
              <p style={{ fontSize: "12px", color: "var(--success, var(--success))", fontWeight: 600, marginBottom: 2 }}>
                Saved {formatCurrency(booking.totalSaving, booking.currency)}
              </p>
            )}
            <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-light)", fontWeight: 600 }}>
              Total
            </p>
          </div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            {formatCurrency(booking.totalPrice, booking.currency)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<StoredBooking[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBookings(getStoredBookings());
    setHydrated(true);
  }, []);

  return (
    <div className="luxe">
      <Header />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
          background: "var(--cream)",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "var(--ink)",
              marginBottom: 8,
            }}
          >
            My Trips
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "var(--ink-light)",
              marginBottom: 40,
              maxWidth: 600,
              lineHeight: 1.6,
            }}
          >
            Your confirmed reservations, all in one place.
          </p>

          {hydrated && bookings.length === 0 && (
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--cream-border)",
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "var(--gold-pale)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "var(--ink)",
                  marginBottom: 8,
                }}
              >
                No trips yet
              </h2>
              <p style={{ fontSize: "13px", color: "var(--ink-light)", lineHeight: 1.6 }}>
                When you book a hotel, your reservations will appear here.
              </p>
            </div>
          )}

          {hydrated && bookings.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {bookings.map((b) => (
                <BookingCard key={b.bookingId} booking={b} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
