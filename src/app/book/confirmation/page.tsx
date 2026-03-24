"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useBookingFlow } from "@/context/BookingFlowContext";

export default function ConfirmationPage() {
  const router = useRouter();
  const flow = useBookingFlow();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!flow.bookingId) {
      router.replace("/book/rooms");
      return;
    }
    setMounted(true);
  }, [flow.bookingId, router]);

  if (!mounted || !flow.bookingId) return null;

  const formatDate = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const taxesAndFees = Math.round(flow.totalPrice * 0.14);
  const grandTotal = flow.totalPrice + taxesAndFees;

  return (
    <div style={{ textAlign: "center" }}>
      {/* Success icon */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: "var(--success)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 40, color: "white" }}>check</span>
      </div>

      <h2 style={{
        fontFamily: "var(--serif)",
        fontSize: "var(--text-heading-1)",
        fontWeight: 500,
        color: "var(--ink)",
        margin: "0 0 8px",
      }}>
        Booking Confirmed
      </h2>
      <p style={{
        fontFamily: "var(--sans)",
        fontSize: "var(--text-body)",
        color: "var(--ink-light)",
        margin: "0 0 8px",
      }}>
        Your reservation has been successfully placed.
      </p>
      <div style={{
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "var(--text-body-lg)",
        fontWeight: 600,
        color: "var(--gold)",
        background: "var(--gold-pale)",
        display: "inline-block",
        padding: "6px 16px",
        borderRadius: 8,
        marginBottom: 28,
        letterSpacing: "0.05em",
      }}>
        {flow.bookingId}
      </div>

      {/* Confirmation details card */}
      <div style={{
        background: "var(--white)",
        borderRadius: 16,
        border: "1px solid var(--cream-border)",
        padding: "24px 20px",
        textAlign: "left",
        marginBottom: 20,
      }}>
        {/* Hotel */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-caption)",
            color: "var(--ink-light)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}>
            Hotel
          </div>
          <div style={{
            fontFamily: "var(--serif)",
            fontSize: "var(--text-display-4)",
            fontWeight: 500,
            color: "var(--ink)",
          }}>
            {flow.hotelName}
          </div>
          <div style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            color: "var(--ink-light)",
            marginTop: 2,
          }}>
            {flow.hotelCity}
          </div>
        </div>

        {/* Dates */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 20,
          paddingBottom: 20,
          borderBottom: "1px solid var(--cream-border)",
        }}>
          <div>
            <div style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-caption)",
              color: "var(--ink-light)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}>
              Check-in
            </div>
            <div style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body)",
              fontWeight: 500,
              color: "var(--ink)",
            }}>
              {formatDate(flow.checkIn)}
            </div>
          </div>
          <div>
            <div style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-caption)",
              color: "var(--ink-light)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 4,
            }}>
              Check-out
            </div>
            <div style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body)",
              fontWeight: 500,
              color: "var(--ink)",
            }}>
              {formatDate(flow.checkOut)}
            </div>
          </div>
        </div>

        {/* Rooms */}
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--cream-border)" }}>
          <div style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-caption)",
            color: "var(--ink-light)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}>
            Rooms
          </div>
          {flow.selectedRooms.map((r) => (
            <div key={r.roomType.id} style={{
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              marginBottom: 4,
            }}>
              <span style={{ color: "var(--ink-mid)" }}>
                {r.quantity}x {r.roomType.name}
              </span>
              <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                ${(r.roomType.pricePerNight * r.quantity * flow.nights).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* Guest */}
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--cream-border)" }}>
          <div style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-caption)",
            color: "var(--ink-light)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}>
            Guest
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: "var(--text-body)", color: "var(--ink)" }}>
            {flow.guestInfo?.firstName} {flow.guestInfo?.lastName}
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: "var(--text-body-sm)", color: "var(--ink-light)", marginTop: 2 }}>
            {flow.guestInfo?.email}
          </div>
          <div style={{ fontFamily: "var(--sans)", fontSize: "var(--text-body-sm)", color: "var(--ink-light)" }}>
            {flow.guestInfo?.phone}
          </div>
          {flow.guestInfo?.specialRequests && (
            <div style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              color: "var(--ink-light)",
              fontStyle: "italic",
              marginTop: 6,
            }}>
              &ldquo;{flow.guestInfo.specialRequests}&rdquo;
            </div>
          )}
        </div>

        {/* Total */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 600,
            color: "var(--ink)",
          }}>
            Total Paid
          </span>
          <span style={{
            fontFamily: "var(--serif)",
            fontSize: "var(--text-heading-1)",
            fontWeight: 600,
            color: "var(--gold)",
          }}>
            ${grandTotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Confirmation sent note */}
      <div style={{
        background: "var(--gold-pale)",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: "center",
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--gold)" }}>mail</span>
        <span style={{
          fontFamily: "var(--sans)",
          fontSize: "var(--text-body-sm)",
          color: "var(--ink-mid)",
        }}>
          A confirmation email has been sent to <strong>{flow.guestInfo?.email}</strong>
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link
          href="/"
          onClick={() => flow.resetFlow()}
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 500,
            padding: "14px 32px",
            borderRadius: 10,
            border: "1px solid var(--cream-border)",
            background: "var(--white)",
            color: "var(--ink)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
          Back to Home
        </Link>
        <Link
          href="/book/rooms"
          onClick={() => flow.resetFlow()}
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 500,
            padding: "14px 32px",
            borderRadius: 10,
            border: "none",
            background: "var(--ink)",
            color: "var(--white)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Book Another
        </Link>
      </div>
    </div>
  );
}
