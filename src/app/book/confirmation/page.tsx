"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingFlow } from "@/context/BookingFlowContext";

const WHATSAPP_LINK =
  "https://wa.me/919876543210?text=Hi%20Voyagr%2C%20I%20just%20booked%20and%20would%20love%20to%20connect%20with%20my%20concierge";

const MEMBER_PERKS = [
  "Complimentary room upgrade (subject to availability)",
  "Early check-in & late check-out",
  "Welcome amenity on arrival",
];

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

  /* Calendar link (Google Calendar) */
  const calStart = flow.checkIn.replace(/-/g, "");
  const calEnd = flow.checkOut.replace(/-/g, "");
  const calTitle = encodeURIComponent(`Stay at ${flow.hotelName}`);
  const calDetails = encodeURIComponent(`Booking ref: ${flow.bookingId}\n${flow.hotelCity}`);
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&dates=${calStart}/${calEnd}&details=${calDetails}`;

  const TIMELINE_STEPS = [
    {
      icon: "support_agent",
      title: "Concierge introduction",
      desc: "Your dedicated concierge will reach out within the hour",
    },
    {
      icon: "verified",
      title: "Hotel confirmation",
      desc: "We confirm every detail directly with the property",
    },
    {
      icon: "checklist",
      title: "Pre-arrival check-in",
      desc: "Preferences, transfers, and requests — sorted before you land",
    },
  ];

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

      {/* 1. Confirmation headline — warm, max 8 words */}
      <h2 style={{
        fontFamily: "var(--serif)",
        fontSize: "var(--text-heading-1)",
        fontWeight: 500,
        color: "var(--ink)",
        margin: "0 0 8px",
      }}>
        Your stay is officially in motion
      </h2>
      <p style={{
        fontFamily: "var(--sans)",
        fontSize: "var(--text-body)",
        color: "var(--ink-light)",
        margin: "0 0 8px",
      }}>
        We&rsquo;re already preparing everything for your arrival.
      </p>

      {/* 2. Booking reference */}
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

      {/* 3. Three confirmed details: hotel name, dates, member perks */}
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

        {/* Member perks locked in */}
        <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--cream-border)" }}>
          <div style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-caption)",
            color: "var(--ink-light)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}>
            Member perks locked in
          </div>
          {MEMBER_PERKS.map((perk) => (
            <div key={perk} style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--gold)" }}>
                check_circle
              </span>
              <span style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink-mid)",
              }}>
                {perk}
              </span>
            </div>
          ))}
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

      {/* 4. "What happens next" timeline — 3 micro-steps, max 12 words each */}
      <div style={{
        background: "var(--white)",
        borderRadius: 16,
        border: "1px solid var(--cream-border)",
        padding: "24px 20px",
        textAlign: "left",
        marginBottom: 28,
      }}>
        <h3 style={{
          fontFamily: "var(--serif)",
          fontSize: "var(--text-display-4)",
          fontWeight: 500,
          color: "var(--ink)",
          margin: "0 0 20px",
        }}>
          What happens next
        </h3>
        {TIMELINE_STEPS.map((step, i) => (
          <div key={step.title} style={{
            display: "flex",
            gap: 14,
            marginBottom: i < TIMELINE_STEPS.length - 1 ? 20 : 0,
            position: "relative",
          }}>
            {/* Timeline connector */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "var(--gold-pale)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--gold)" }}>
                  {step.icon}
                </span>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div style={{
                  width: 2,
                  flex: 1,
                  background: "var(--cream-border)",
                  marginTop: 4,
                }} />
              )}
            </div>
            <div style={{ paddingTop: 2 }}>
              <div style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body)",
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: 2,
              }}>
                {step.title}
              </div>
              <div style={{
                fontFamily: "var(--sans)",
                fontSize: "var(--text-body-sm)",
                color: "var(--ink-light)",
                lineHeight: 1.5,
              }}>
                {step.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Primary CTA: WhatsApp concierge + 6. Secondary: Add to calendar */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <a
          href={calendarUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 500,
            padding: "14px 28px",
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
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_add_on</span>
          Add to calendar
        </a>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 500,
            padding: "14px 28px",
            borderRadius: 10,
            border: "none",
            background: "#25D366",
            color: "var(--white)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Message your concierge on WhatsApp
        </a>
      </div>
    </div>
  );
}
