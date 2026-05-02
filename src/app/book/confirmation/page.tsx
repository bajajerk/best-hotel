"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useBookingFlow } from "@/context/BookingFlowContext";

const GOLD = "var(--luxe-champagne)";
const SURFACE = "rgba(255,255,255,0.04)";
const SURFACE_BORDER = "rgba(255,255,255,0.08)";
const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const TEXT_SOFT = "rgba(247, 245, 242, 0.45)";
const SUCCESS = "#86c79b";

const CONCIERGE_WHATSAPP =
  process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP || "919833534627";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const formatInr = (n: number) => inrFormatter.format(Math.round(n || 0));

function formatDateShort(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatShortMonthDay(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatYear(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").getFullYear();
}

export default function ConfirmationPage() {
  const router = useRouter();
  const flow = useBookingFlow();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!flow.bookingId) {
      router.replace("/");
      return;
    }
    setMounted(true);
  }, [flow.bookingId, router]);

  if (!mounted || !flow.bookingId) return null;

  const reference = `VG-${String(flow.bookingId).padStart(5, "0")}`;
  const nights = flow.nights || 1;

  const datesLine = `${formatShortMonthDay(flow.checkIn)} → ${formatShortMonthDay(flow.checkOut)}, ${formatYear(flow.checkOut)} (${nights} night${nights !== 1 ? "s" : ""})`;
  const guestsLine = `${flow.adults} adult${flow.adults !== 1 ? "s" : ""}${flow.children > 0 ? ` · ${flow.children} child${flow.children !== 1 ? "ren" : ""}` : ""}`;
  const cancelClause = flow.refundable && flow.freeCancelUntil
    ? ` (free cancellation until ${formatShortMonthDay(flow.freeCancelUntil.slice(0, 10))})`
    : "";
  const totalLine = `${formatInr(flow.totalPrice)}${cancelClause}`;
  const roomLine = `${flow.roomName}${flow.mealBasis ? ` (${flow.mealBasis})` : ""}`;
  const cityLine = flow.hotelCity ? `, ${flow.hotelCity}` : "";

  const messageText =
    `Hi Voyagr Concierge!\n\n` +
    `Booking request: ${reference}\n\n` +
    `🏨 ${flow.hotelName}${cityLine}\n` +
    `🛏️ ${roomLine}\n` +
    `📅 ${datesLine}\n` +
    `👥 ${guestsLine}\n` +
    `💰 ${totalLine}\n\n` +
    `Please confirm and send payment details. Thanks!`;

  const whatsappUrl = `https://wa.me/${CONCIERGE_WHATSAPP}?text=${encodeURIComponent(messageText)}`;

  const [city, country] = (flow.hotelCity || "").split(",").map((s) => s.trim());

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Big checkmark */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <svg width="80" height="80" viewBox="0 0 52 52" aria-hidden>
          <circle cx="26" cy="26" r="24" fill="none" stroke={GOLD} strokeWidth="2" />
          <path
            d="M15 27l7 7 15-15"
            fill="none"
            stroke={GOLD}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-display-3)",
          fontWeight: 500,
          color: TEXT_PRIMARY,
          textAlign: "center",
          margin: "20px 0 6px",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        Booking request submitted
      </h1>
      <p
        style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
          fontSize: 11,
          color: GOLD,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          textAlign: "center",
          margin: "0 0 10px",
          fontWeight: 700,
        }}
      >
        Reference {reference}
      </p>
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-body-sm)",
          color: TEXT_MUTED,
          textAlign: "center",
          margin: "0 auto 28px",
          maxWidth: 460,
          lineHeight: 1.6,
        }}
      >
        Our concierge will WhatsApp you within 15 minutes to confirm rate and
        collect payment.
      </p>

      {/* Summary card */}
      <div
        style={{
          background: SURFACE,
          borderRadius: 16,
          border: `1px solid ${SURFACE_BORDER}`,
          padding: "20px 22px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
          <div
            style={{
              position: "relative",
              width: 64,
              height: 64,
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              background: "rgba(255,255,255,0.06)",
            }}
          >
            {flow.hotelPhoto && (
              <Image
                src={flow.hotelPhoto}
                alt={flow.hotelName}
                fill
                style={{ objectFit: "cover" }}
                sizes="64px"
                unoptimized
              />
            )}
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
              {flow.hotelName}
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
          </div>
        </div>

        <SummaryRow label="Room" value={roomLine} />
        <SummaryRow label="Check-in" value={formatDateShort(flow.checkIn)} />
        <SummaryRow label="Check-out" value={formatDateShort(flow.checkOut)} />
        <SummaryRow label="Guests" value={guestsLine} />
        <SummaryRow label="Reference" value={reference} mono />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${SURFACE_BORDER}`,
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
            {formatInr(flow.totalPrice)}
          </span>
        </div>
        {flow.refundable && flow.freeCancelUntil && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-caption)",
              color: SUCCESS,
              fontWeight: 500,
              textAlign: "right",
              marginTop: 4,
            }}
          >
            Free cancellation until {formatDateShort(flow.freeCancelUntil.slice(0, 10))}
          </div>
        )}
      </div>

      {/* Primary CTA — WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          fontFamily: "var(--font-body)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          padding: "16px 24px",
          borderRadius: 9999,
          background: "#25D366",
          color: "#0a0a0a",
          textDecoration: "none",
          marginBottom: 12,
          boxShadow: "0 4px 16px rgba(37,211,102,0.22)",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Confirm on WhatsApp
      </a>

      {/* Secondary CTAs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        <Link
          href="/profile"
          className="luxe-btn-secondary"
          style={{
            padding: "12px 16px",
            fontSize: 10,
            letterSpacing: "0.18em",
          }}
        >
          View My Bookings
        </Link>
        <Link
          href="/"
          className="luxe-btn-secondary"
          style={{
            padding: "12px 16px",
            fontSize: 10,
            letterSpacing: "0.18em",
          }}
        >
          Browse more hotels
        </Link>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-caption)",
          color: TEXT_SOFT,
          marginTop: 28,
          lineHeight: 1.6,
        }}
      >
        {flow.guestEmail
          ? <>Confirmation will be emailed to {flow.guestEmail} · Reference {reference}</>
          : <>Reference {reference}</>}
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 16,
        padding: "6px 0",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-body-sm)",
      }}
    >
      <span style={{ color: TEXT_SOFT, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          color: TEXT_PRIMARY,
          fontWeight: 500,
          textAlign: "right",
          fontFamily: mono ? "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace" : undefined,
          minWidth: 0,
        }}
      >
        {value}
      </span>
    </div>
  );
}
