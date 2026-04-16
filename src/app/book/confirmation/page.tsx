"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useBookingFlow } from "@/context/BookingFlowContext";

const WHATSAPP_LINK =
  "https://wa.me/919876543210?text=Hi%20Priya%2C%20I%20just%20booked%20and%20would%20love%20to%20connect";

export default function ConfirmationPage() {
  const router = useRouter();
  const flow = useBookingFlow();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const referralRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!flow.bookingId) {
      router.replace("/book/rooms");
      return;
    }
    setMounted(true);
  }, [flow.bookingId, router]);

  if (!mounted || !flow.bookingId) return null;

  const formatDateShort = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const roomName = flow.selectedRooms[0]?.roomType.name || "Deluxe Room";

  /* Calendar link (Google Calendar) */
  const calStart = flow.checkIn.replace(/-/g, "");
  const calEnd = flow.checkOut.replace(/-/g, "");
  const calTitle = encodeURIComponent(`Stay at ${flow.hotelName}`);
  const calDetails = encodeURIComponent(`Booking ref: ${flow.bookingId}\n${flow.hotelCity}`);
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calStart}/${calEnd}&details=${calDetails}`;

  const referralCode = `https://voyagr.club/r/${flow.bookingId?.split("-")[1]?.toLowerCase() || "invite"}`;

  const handleCopy = () => {
    if (referralRef.current) {
      navigator.clipboard.writeText(referralRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /* Extract city name from hotelCity (e.g. "Jaipur, India" → "Jaipur") */
  const destination = flow.hotelCity?.split(",")[0]?.trim() || flow.hotelCity;

  return (
    <div className="confirmation-overlay">
      <div className="confirmation-scroll">
        {/* ── Animated checkmark ── */}
        <div className="confirm-check-wrap">
          <svg className="confirm-check-svg" viewBox="0 0 52 52">
            <circle
              className="confirm-check-circle"
              cx="26" cy="26" r="24"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="1"
            />
            <path
              className="confirm-check-path"
              fill="none"
              stroke="#C9A84C"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 27l7 7 15-15"
            />
          </svg>
        </div>

        {/* ── Headline ── */}
        <h1 className="confirm-headline">
          You&rsquo;re going to <em>{destination}.</em>
        </h1>
        <p className="confirm-subhead">
          Your booking is confirmed.<br />
          Priya will be in touch within the hour.
        </p>

        {/* ── Booking card ── */}
        <div className="confirm-card">
          <div className="confirm-card-hotel">{flow.hotelName}</div>

          <div className="confirm-card-details">
            <div className="confirm-detail-item">
              <span className="confirm-detail-label">CHECK-IN</span>
              <span className="confirm-detail-value">{formatDateShort(flow.checkIn)}</span>
            </div>
            <div className="confirm-detail-item">
              <span className="confirm-detail-label">CHECK-OUT</span>
              <span className="confirm-detail-value">{formatDateShort(flow.checkOut)}</span>
            </div>
            <div className="confirm-detail-item">
              <span className="confirm-detail-label">ROOM</span>
              <span className="confirm-detail-value">{roomName}</span>
            </div>
            <div className="confirm-detail-item">
              <span className="confirm-detail-label">REFERENCE</span>
              <span className="confirm-detail-value">{flow.bookingId}</span>
            </div>
          </div>

          <div className="confirm-savings-pill">
            You saved ₹14,800 on this booking
          </div>
        </div>

        {/* ── Next step cards ── */}
        <div className="confirm-actions">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="confirm-action-card"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_add_on</span>
            <span>Add to Calendar</span>
          </a>

          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="confirm-action-card confirm-action-sage"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>Message Priya</span>
          </a>

          <div className="confirm-action-card confirm-action-gold">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
            <span>Share with a friend</span>
            <span className="confirm-action-sub">Give ₹2,000 off their first booking</span>
          </div>
        </div>

        {/* ── Referral section ── */}
        <div className="confirm-referral">
          <p className="confirm-referral-title">Know someone who&rsquo;d love this?</p>

          <div className="confirm-referral-box">
            <input
              ref={referralRef}
              type="text"
              readOnly
              value={referralCode}
              className="confirm-referral-input"
            />
            <button onClick={handleCopy} className="confirm-referral-copy">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <p className="confirm-referral-desc">
            Your friend gets ₹2,000 off.<br />
            You get credit on your next booking.
          </p>
        </div>

        {/* ── Footer ── */}
        <div className="confirm-footer">
          Confirmation sent to {flow.guestInfo?.email} &middot; Reference: {flow.bookingId}
        </div>
      </div>
    </div>
  );
}
