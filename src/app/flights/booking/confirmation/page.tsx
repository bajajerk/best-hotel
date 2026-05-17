"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFlightBooking } from "@/context/FlightBookingContext";

const GOLD = "#C9A84C";

const WHATSAPP_LINK =
  "https://wa.me/919876543210?text=Hi%20Priya%2C%20my%20flight%20is%20booked%20via%20Voyagr%20and%20I%E2%80%99d%20love%20to%20connect";

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function fmtPrice(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function FlightConfirmationPage() {
  const router = useRouter();
  const flow = useFlightBooking();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!flow.flightBookingId && !flow.paymentTxnid) {
      router.replace("/flights");
      return;
    }
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isConfirmed = flow.bookingStatus === "CONFIRMED" || flow.paymentStatus === "SUCCESS";
  const destination = flow.destinationCity || flow.destination;

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* Check animation */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ animation: "scale-in 0.4s ease" }}>
          <circle
            cx="36" cy="36" r="33"
            fill="none" stroke={GOLD} strokeWidth="1.5"
            style={{ animation: "draw-circle 0.6s ease-out forwards", strokeDasharray: 207, strokeDashoffset: 207 }}
          />
          <path
            d="M22 37l9 9 19-19"
            fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: "draw-check 0.3s 0.5s ease-out forwards", strokeDasharray: 38, strokeDashoffset: 38 }}
          />
        </svg>
      </div>

      <h1 style={{
        fontFamily: "var(--font-display, serif)",
        fontSize: 28,
        fontWeight: 700,
        color: "#1a1710",
        textAlign: "center",
        margin: "0 0 8px",
        lineHeight: 1.2,
      }}>
        {isConfirmed ? (
          <>You&rsquo;re flying to <em style={{ fontStyle: "italic", color: GOLD }}>{destination}.</em></>
        ) : (
          "Booking received."
        )}
      </h1>
      <p style={{
        fontFamily: "var(--font-body, sans-serif)",
        fontSize: 14,
        color: "#7a7465",
        textAlign: "center",
        margin: "0 0 28px",
        lineHeight: 1.6,
      }}>
        {isConfirmed
          ? "Your ticket has been issued. Check your email for the itinerary."
          : "Your payment is being processed. We'll email your ticket once confirmed."}
      </p>

      {/* Booking card */}
      <div style={{
        background: "#fdfaf5",
        border: "1.5px solid #ece6dc",
        borderRadius: 16,
        padding: "20px 20px",
        marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "var(--font-display, serif)",
          fontSize: 18,
          fontWeight: 600,
          color: "#1a1710",
          marginBottom: 16,
        }}>
          {flow.originCity || flow.origin} → {flow.destinationCity || flow.destination}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
          {[
            { label: "DEPARTURE", value: formatDate(flow.travelDate) },
            { label: "PASSENGERS", value: `${flow.passengers.length} ${flow.passengers.length === 1 ? "person" : "people"}` },
            { label: "AMOUNT PAID", value: fmtPrice(flow.totalFare) },
            { label: "BOOKING REF", value: flow.flightBookingId?.slice(0, 8).toUpperCase() ?? "—" },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 10, fontWeight: 700, color: "#a09585", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 14, fontWeight: 600, color: "#1a1710" }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {flow.contactEmail && (
          <div style={{
            marginTop: 16, paddingTop: 14,
            borderTop: "1px solid #ece6dc",
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: 12, color: "#7a7465",
          }}>
            Confirmation sent to {flow.contactEmail}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "14px 20px", borderRadius: 10,
            background: "#25D366", border: "none",
            fontFamily: "var(--font-body, sans-serif)", fontSize: 14, fontWeight: 700,
            color: "#fff", textDecoration: "none",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Chat with Priya
        </a>

        <Link
          href="/flights"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "14px 20px", borderRadius: 10,
            border: "1.5px solid #ece6dc", background: "#fdfaf5",
            fontFamily: "var(--font-body, sans-serif)", fontSize: 14, fontWeight: 600,
            color: "#1a1710", textDecoration: "none",
          }}
        >
          Search more flights
        </Link>
      </div>

      <style>{`
        @keyframes scale-in { from{transform:scale(0.8);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes draw-circle { to{stroke-dashoffset:0} }
        @keyframes draw-check  { to{stroke-dashoffset:0} }
      `}</style>
    </div>
  );
}
