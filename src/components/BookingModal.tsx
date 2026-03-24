"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import FlowProgressBar from "@/components/FlowProgressBar";

/* ── Types ── */

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  hotelName: string;
  roomName: string;
  rateType: "preferred" | "standard";
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  nightlyRate: number;
  marketRate: number;
  currency: string;
  perks: string[];
}

interface GuestForm {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
}

type FormErrors = Partial<Record<keyof GuestForm, boolean>>;

/* ── Helpers ── */

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

function formatDateShort(iso: string): string {
  if (!iso) return "TBD";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function generateBookingId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "VYG-";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/* ── Booking persistence ── */

export interface StoredBooking {
  bookingId: string;
  hotelName: string;
  roomName: string;
  rateType: "preferred" | "standard";
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  guestName: string;
  email: string;
  nightlyRate: number;
  marketRate: number;
  currency: string;
  totalPrice: number;
  totalSaving: number;
  bookedAt: string;
}

const BOOKINGS_KEY = "voyagr_bookings";

function saveBooking(booking: StoredBooking) {
  try {
    const existing = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
    existing.unshift(booking);
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(existing));
  } catch {
    // silently fail if localStorage is unavailable
  }
}

export function getStoredBookings(): StoredBooking[] {
  try {
    return JSON.parse(localStorage.getItem(BOOKINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

/* ── Toast component ── */

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--error, #8b3a3a)",
            color: "#fff",
            padding: "12px 24px",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-body)",
            zIndex: 10002,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Main BookingModal ── */

export default function BookingModal({
  open,
  onClose,
  hotelName,
  roomName,
  rateType,
  checkIn,
  checkOut,
  nights,
  guests,
  nightlyRate,
  marketRate,
  currency,
  perks,
}: BookingModalProps) {
  const router = useRouter();
  const [form, setForm] = useState<GuestForm>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [bookingState, setBookingState] = useState<"form" | "success">("form");
  const [bookingId, setBookingId] = useState("");

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setForm({ firstName: "", lastName: "", email: "", mobile: "" });
      setErrors({});
      setToastVisible(false);
      setBookingState("form");
      setBookingId("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const totalPrice = nightlyRate * nights;
  const totalMarket = marketRate * nights;
  const totalSaving = totalMarket - totalPrice;
  const hasSaving = totalSaving > 0;
  const isPreferred = rateType === "preferred";

  const updateField = useCallback((field: keyof GuestForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    const newErrors: FormErrors = {};
    let hasError = false;

    if (!form.firstName.trim()) { newErrors.firstName = true; hasError = true; }
    if (!form.lastName.trim()) { newErrors.lastName = true; hasError = true; }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = true; hasError = true;
    }
    if (!form.mobile.trim() || form.mobile.trim().replace(/\D/g, "").length < 7) {
      newErrors.mobile = true; hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3000);
      return;
    }

    // Success
    const id = generateBookingId();
    setBookingId(id);
    setBookingState("success");

    // Persist booking to localStorage
    saveBooking({
      bookingId: id,
      hotelName,
      roomName,
      rateType,
      checkIn,
      checkOut,
      nights,
      guests,
      guestName: `${form.firstName.trim()} ${form.lastName.trim()}`,
      email: form.email.trim(),
      nightlyRate,
      marketRate,
      currency,
      totalPrice: nightlyRate * nights,
      totalSaving: (marketRate - nightlyRate) * nights > 0 ? (marketRate - nightlyRate) * nights : 0,
      bookedAt: new Date().toISOString(),
    });
  }, [form, hotelName, roomName, rateType, checkIn, checkOut, nights, guests, nightlyRate, marketRate, currency]);

  const inputStyle = (field: keyof GuestForm): React.CSSProperties => ({
    width: "100%",
    padding: "12px 16px",
    fontSize: "14px",
    fontFamily: "var(--font-body)",
    color: "var(--ink)",
    background: "var(--white, #fdfaf5)",
    border: errors[field] ? "1.5px solid var(--error, #8b3a3a)" : "1px solid var(--cream-border, #e0d8c8)",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink-light)",
    marginBottom: 6,
    fontFamily: "var(--font-body)",
  };

  return (
    <>
      <Toast
        message="Please fill in all required fields correctly"
        visible={toastVisible}
      />
      <AnimatePresence>
        {open && (
          <>
            {/* Blurred backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(26, 23, 16, 0.6)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                zIndex: 10000,
              }}
            />

            {/* Modal */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: "92vh",
                zIndex: 10001,
                display: "flex",
                flexDirection: "column",
                background: "var(--cream, #f5f0e8)",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* ═══ Flow Progress Bar ═══ */}
              <div
                style={{
                  flexShrink: 0,
                  borderBottom: "1px solid var(--cream-border, #e0d8c8)",
                  background: "var(--white, #fdfaf5)",
                }}
              >
                <FlowProgressBar
                  currentStep={bookingState === "form" ? "guest-details" : "confirmation"}
                  onNavigateAway={onClose}
                />
              </div>

              {bookingState === "form" ? (
                <>
                  {/* ═══ Header ═══ */}
                  <div
                    style={{
                      background: "#3d3a2e",
                      padding: "20px 24px",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    {/* Close button */}
                    <button
                      onClick={onClose}
                      aria-label="Close"
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.1)",
                        border: "none",
                        borderRadius: "50%",
                        color: "var(--cream)",
                        fontSize: "18px",
                        cursor: "pointer",
                        lineHeight: 1,
                      }}
                    >
                      &times;
                    </button>

                    <h2
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "22px",
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: "var(--cream, #f5f0e8)",
                        lineHeight: 1.2,
                        marginBottom: 8,
                        paddingRight: 40,
                      }}
                    >
                      {hotelName}
                    </h2>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px 16px",
                        fontSize: "12px",
                        color: "rgba(245, 240, 232, 0.7)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <span style={{ color: "var(--gold, #b8955a)", fontWeight: 600 }}>
                        {roomName}
                      </span>
                      <span>
                        {isPreferred ? "Preferred Rate" : "Standard Rate"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px 16px",
                        fontSize: "12px",
                        color: "rgba(245, 240, 232, 0.7)",
                        fontFamily: "var(--font-body)",
                        marginTop: 8,
                      }}
                    >
                      <span>{formatDateShort(checkIn)} &ndash; {formatDateShort(checkOut)}</span>
                      <span>{nights} night{nights > 1 ? "s" : ""}</span>
                      <span>{guests}</span>
                    </div>
                  </div>

                  {/* ═══ Scrollable Body ═══ */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "24px",
                    }}
                  >
                    {/* Price Breakdown */}
                    <div style={{ marginBottom: 24 }}>
                      <h3
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--ink-light)",
                          marginBottom: 12,
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        Price Breakdown
                      </h3>

                      <div
                        style={{
                          background: "var(--white, #fdfaf5)",
                          border: "1px solid var(--cream-border, #e0d8c8)",
                          padding: "16px 20px",
                        }}
                      >
                        {/* Nightly rate */}
                        <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: "13px", color: "var(--ink-mid)" }}>
                            {formatCurrency(nightlyRate, currency)} &times; {nights} night{nights > 1 ? "s" : ""}
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              color: "var(--ink)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {formatCurrency(totalPrice, currency)}
                          </span>
                        </div>

                        {/* Saving row */}
                        {hasSaving && (
                          <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: "12px", color: "var(--success, #4a7c59)", fontWeight: 600 }}>
                              You save
                            </span>
                            <span
                              style={{
                                fontSize: "12px",
                                color: "var(--success, #4a7c59)",
                                fontWeight: 600,
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              &minus;{formatCurrency(totalSaving, currency)}
                            </span>
                          </div>
                        )}

                        {/* Total */}
                        <div
                          className="flex items-baseline justify-between"
                          style={{
                            paddingTop: 12,
                            borderTop: "1px solid var(--cream-border, #e0d8c8)",
                            marginTop: 4,
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>
                            Total
                          </span>
                          <span
                            style={{
                              fontSize: "22px",
                              fontWeight: 500,
                              fontFamily: "var(--font-display)",
                              color: "var(--ink)",
                            }}
                          >
                            {formatCurrency(totalPrice, currency)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preferred Perks */}
                    {isPreferred && perks.length > 0 && (
                      <div style={{ marginBottom: 24 }}>
                        <h3
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--ink-light)",
                            marginBottom: 12,
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          Preferred Perks Included
                        </h3>

                        <div
                          style={{
                            background: "var(--gold-pale, rgba(184,149,90,0.08))",
                            border: "1px solid var(--gold, #b8955a)",
                            padding: "16px 20px",
                          }}
                        >
                          <div className="flex flex-col gap-2">
                            {perks.map((perk) => (
                              <div key={perk} className="flex items-center gap-2.5">
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="var(--success, #4a7c59)"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span style={{ fontSize: "13px", color: "var(--ink)", fontWeight: 500 }}>
                                  {perk}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Guest Details Form */}
                    <div>
                      <h3
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--ink-light)",
                          marginBottom: 12,
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        Guest Details
                      </h3>

                      <div
                        style={{
                          background: "var(--white, #fdfaf5)",
                          border: "1px solid var(--cream-border, #e0d8c8)",
                          padding: "20px",
                        }}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label style={labelStyle}>First Name *</label>
                            <input
                              type="text"
                              value={form.firstName}
                              onChange={(e) => updateField("firstName", e.target.value)}
                              placeholder="John"
                              style={inputStyle("firstName")}
                            />
                            {errors.firstName && (
                              <p style={{ fontSize: "11px", color: "var(--error, #8b3a3a)", marginTop: 4 }}>
                                First name is required
                              </p>
                            )}
                          </div>

                          <div>
                            <label style={labelStyle}>Last Name *</label>
                            <input
                              type="text"
                              value={form.lastName}
                              onChange={(e) => updateField("lastName", e.target.value)}
                              placeholder="Doe"
                              style={inputStyle("lastName")}
                            />
                            {errors.lastName && (
                              <p style={{ fontSize: "11px", color: "var(--error, #8b3a3a)", marginTop: 4 }}>
                                Last name is required
                              </p>
                            )}
                          </div>

                          <div>
                            <label style={labelStyle}>Email *</label>
                            <input
                              type="email"
                              value={form.email}
                              onChange={(e) => updateField("email", e.target.value)}
                              placeholder="john@example.com"
                              style={inputStyle("email")}
                            />
                            {errors.email && (
                              <p style={{ fontSize: "11px", color: "var(--error, #8b3a3a)", marginTop: 4 }}>
                                Valid email is required
                              </p>
                            )}
                          </div>

                          <div>
                            <label style={labelStyle}>Mobile *</label>
                            <input
                              type="tel"
                              value={form.mobile}
                              onChange={(e) => updateField("mobile", e.target.value)}
                              placeholder="+1 234 567 8900"
                              style={inputStyle("mobile")}
                            />
                            {errors.mobile && (
                              <p style={{ fontSize: "11px", color: "var(--error, #8b3a3a)", marginTop: 4 }}>
                                Valid mobile number is required
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom spacing for the fixed button */}
                    <div style={{ height: 80 }} />
                  </div>

                  {/* ═══ Fixed Confirm Button ═══ */}
                  <div
                    style={{
                      flexShrink: 0,
                      padding: "16px 24px",
                      background: "var(--cream, #f5f0e8)",
                      borderTop: "1px solid var(--cream-border, #e0d8c8)",
                    }}
                  >
                    <button
                      onClick={handleConfirm}
                      style={{
                        width: "100%",
                        padding: "16px 0",
                        fontSize: "13px",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: "var(--gold, #b8955a)",
                        color: "var(--ink, #1a1710)",
                        border: "none",
                        cursor: "pointer",
                        transition: "opacity 0.2s",
                        fontFamily: "var(--font-body)",
                      }}
                      onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.opacity = "0.9"; }}
                      onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.opacity = "1"; }}
                    >
                      Confirm Booking
                    </button>
                  </div>
                </>
              ) : (
                /* ═══════ Screen 5 — Success State ═══════ */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflowY: "auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "40px 24px 32px",
                      textAlign: "center",
                    }}
                  >
                    {/* Animated green checkmark — bounce in */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.25, 0.9, 1.05, 1] }}
                      transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "var(--success, #4a7c59)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                      }}
                    >
                      <motion.svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.4 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </motion.svg>
                    </motion.div>

                    {/* Eyebrow */}
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--success, #4a7c59)",
                        marginBottom: 6,
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      Booking confirmed
                    </p>

                    {/* Headline */}
                    <h2
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "28px",
                        fontWeight: 400,
                        fontStyle: "italic",
                        color: "var(--ink)",
                        marginBottom: 10,
                      }}
                    >
                      You&apos;re all set
                    </h2>

                    {/* Subtext — email + WhatsApp */}
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-light)",
                        marginBottom: 28,
                        lineHeight: 1.6,
                        maxWidth: 360,
                      }}
                    >
                      A confirmation has been sent to{" "}
                      <strong style={{ color: "var(--ink)" }}>{form.email}</strong>.
                      You&apos;ll also receive a WhatsApp notification with your booking details.
                    </p>

                    {/* Booking Reference — monospace */}
                    <div
                      style={{
                        background: "var(--white, #fdfaf5)",
                        border: "1px solid var(--cream-border, #e0d8c8)",
                        padding: "16px 32px",
                        marginBottom: 24,
                      }}
                    >
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--ink-light)",
                          marginBottom: 6,
                        }}
                      >
                        Booking Reference
                      </p>
                      <p
                        style={{
                          fontSize: "24px",
                          fontWeight: 500,
                          fontFamily: "var(--font-mono)",
                          color: "var(--ink)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {bookingId}
                      </p>
                    </div>

                    {/* Summary card */}
                    <div
                      style={{
                        background: "var(--white, #fdfaf5)",
                        border: "1px solid var(--cream-border, #e0d8c8)",
                        padding: "20px 24px",
                        width: "100%",
                        maxWidth: 400,
                        textAlign: "left",
                        marginBottom: 28,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "18px",
                          fontWeight: 500,
                          fontStyle: "italic",
                          color: "var(--ink)",
                          marginBottom: 4,
                        }}
                      >
                        {hotelName}
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--ink-mid)", marginBottom: 12 }}>
                        {roomName} &middot; {isPreferred ? "Preferred Rate" : "Standard Rate"}
                      </p>

                      <div className="flex justify-between" style={{ fontSize: "13px", marginBottom: 4 }}>
                        <span style={{ color: "var(--ink-light)" }}>Check-in</span>
                        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{formatDateShort(checkIn)}</span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: "13px", marginBottom: 4 }}>
                        <span style={{ color: "var(--ink-light)" }}>Check-out</span>
                        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{formatDateShort(checkOut)}</span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: "13px", marginBottom: 4 }}>
                        <span style={{ color: "var(--ink-light)" }}>Duration</span>
                        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{nights} night{nights > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex justify-between" style={{ fontSize: "13px", marginBottom: 4 }}>
                        <span style={{ color: "var(--ink-light)" }}>Guest</span>
                        <span style={{ color: "var(--ink)", fontWeight: 500 }}>{form.firstName} {form.lastName}</span>
                      </div>

                      {/* Saving row (if applicable) */}
                      {hasSaving && (
                        <div className="flex justify-between" style={{ fontSize: "13px", marginBottom: 4 }}>
                          <span style={{ color: "var(--success, #4a7c59)", fontWeight: 600 }}>You saved</span>
                          <span
                            style={{
                              color: "var(--success, #4a7c59)",
                              fontWeight: 600,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {formatCurrency(totalSaving, currency)}
                          </span>
                        </div>
                      )}

                      {/* Total */}
                      <div
                        className="flex justify-between"
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          paddingTop: 12,
                          borderTop: "1px solid var(--cream-border, #e0d8c8)",
                          marginTop: 8,
                        }}
                      >
                        <span style={{ color: "var(--ink)" }}>Total</span>
                        <span style={{ color: "var(--ink)", fontFamily: "var(--font-display)", fontSize: "18px" }}>
                          {formatCurrency(totalPrice, currency)}
                        </span>
                      </div>
                    </div>

                    {/* Two buttons */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        width: "100%",
                        maxWidth: 400,
                      }}
                    >
                      <button
                        onClick={() => {
                          onClose();
                          router.push("/booking-history");
                        }}
                        style={{
                          width: "100%",
                          padding: "14px 0",
                          fontSize: "13px",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          background: "var(--gold, #b8955a)",
                          color: "var(--ink, #1a1710)",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          transition: "opacity 0.2s",
                        }}
                        onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.opacity = "0.9"; }}
                        onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.opacity = "1"; }}
                      >
                        View in My Trips
                      </button>
                      <button
                        onClick={onClose}
                        style={{
                          width: "100%",
                          padding: "14px 0",
                          fontSize: "13px",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          background: "transparent",
                          color: "var(--ink-light, #7a7465)",
                          border: "1px solid var(--cream-border, #e0d8c8)",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLButtonElement).style.borderColor = "var(--ink-light)";
                          (e.target as HTMLButtonElement).style.color = "var(--ink)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLButtonElement).style.borderColor = "var(--cream-border)";
                          (e.target as HTMLButtonElement).style.color = "var(--ink-light)";
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
