"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackCtaClicked, trackWhatsAppClicked } from "@/lib/analytics";

/* ── Types ── */

interface UnlockRateModalProps {
  open: boolean;
  onClose: () => void;
  hotelId: string | number;
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

/* ── Toast ── */

function Toast({ message, visible, type = "error" }: { message: string; visible: boolean; type?: "error" | "success" }) {
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
            background: type === "error" ? "var(--error, #8b3a3a)" : "var(--success, #4a7c59)",
            color: "#fff",
            padding: "12px 24px",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-body)",
            zIndex: 10003,
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

/* ── Main UnlockRateModal ── */

export default function UnlockRateModal({
  open,
  onClose,
  hotelId,
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
}: UnlockRateModalProps) {
  const [form, setForm] = useState<GuestForm>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"error" | "success">("error");
  const [submitting, setSubmitting] = useState(false);
  const [leadState, setLeadState] = useState<"form" | "success">("form");
  const [leadId, setLeadId] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");

  const totalPrice = nightlyRate * nights;
  const totalMarket = marketRate * nights;
  const totalSaving = totalMarket - totalPrice;
  const hasSaving = totalSaving > 0;
  const isPreferred = rateType === "preferred";
  const savePercent = hasSaving ? Math.round((totalSaving / totalMarket) * 100) : 0;

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setForm({ firstName: "", lastName: "", email: "", mobile: "" });
      setErrors({});
      setToastVisible(false);
      setSubmitting(false);
      setLeadState("form");
      setLeadId("");
      setWhatsappLink("");
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

  const updateField = useCallback((field: keyof GuestForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: false }));
  }, []);

  const showToast = useCallback((message: string, type: "error" | "success" = "error") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  }, []);

  const handleUnlock = useCallback(async () => {
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
      showToast("Please fill in all required fields correctly");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          hotelId,
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
          source: "unlock_rate",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setLeadId(data.leadId);
        setWhatsappLink(data.whatsappLink);
        setLeadState("success");
        trackCtaClicked({
          cta_name: "unlock_preferred_rate",
          cta_location: "hotel_detail_modal",
          destination_url: "lead_captured",
        });
      } else {
        showToast(data.errors?.[0] || "Something went wrong. Please try again.");
      }
    } catch {
      showToast("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }, [form, hotelId, hotelName, roomName, rateType, checkIn, checkOut, nights, guests, nightlyRate, marketRate, currency, showToast]);

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
      <Toast message={toastMessage} visible={toastVisible} type={toastType} />
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
              {leadState === "form" ? (
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

                    {/* Lock icon + Title */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--gold, #C9A84C)",
                        }}
                      >
                        Unlock Your Preferred Rate
                      </p>
                    </div>

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
                      <span style={{ color: "var(--gold, #C9A84C)", fontWeight: 600 }}>
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
                    {/* Savings highlight */}
                    {hasSaving && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "14px 20px",
                          background: "rgba(74, 124, 89, 0.08)",
                          border: "1px solid rgba(74, 124, 89, 0.15)",
                          marginBottom: 20,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "12px", color: "var(--success)", fontWeight: 600 }}>
                            You save {savePercent}% vs public rates
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--ink-light)", marginTop: 2 }}>
                            {formatCurrency(totalSaving, currency)} total savings on this stay
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "22px",
                            fontWeight: 500,
                            fontFamily: "var(--font-display)",
                            color: "var(--success)",
                          }}
                        >
                          {formatCurrency(totalPrice, currency)}
                        </div>
                      </div>
                    )}

                    {/* Private rate callout */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        padding: "12px 16px",
                        background: "var(--gold-pale)",
                        border: "1px solid var(--gold-light)",
                        marginBottom: 20,
                        fontSize: "12px",
                        lineHeight: 1.5,
                        color: "var(--ink-mid)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        <strong style={{ color: "var(--ink)" }}>Preferred rates</strong> are negotiated directly with hotels by our concierge. Share your details and we&apos;ll confirm your rate on WhatsApp within 15 minutes.
                      </span>
                    </div>

                    {/* Preferred Perks */}
                    {isPreferred && perks.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h3
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "var(--ink-light)",
                            marginBottom: 10,
                            fontFamily: "var(--font-body)",
                          }}
                        >
                          Included With Your Rate
                        </h3>

                        <div className="flex flex-wrap gap-2">
                          {perks.map((perk) => (
                            <div
                              key={perk}
                              className="flex items-center gap-1.5"
                              style={{
                                padding: "5px 10px",
                                background: "rgba(74, 124, 89, 0.08)",
                                border: "1px solid rgba(74, 124, 89, 0.12)",
                                fontSize: "12px",
                                fontWeight: 500,
                                color: "var(--success)",
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {perk}
                            </div>
                          ))}
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
                        Your Details
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
                            <label style={labelStyle}>WhatsApp Number *</label>
                            <input
                              type="tel"
                              value={form.mobile}
                              onChange={(e) => updateField("mobile", e.target.value)}
                              placeholder="+91 98765 43210"
                              style={inputStyle("mobile")}
                            />
                            {errors.mobile && (
                              <p style={{ fontSize: "11px", color: "var(--error, #8b3a3a)", marginTop: 4 }}>
                                Valid WhatsApp number is required
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom spacing for the fixed button */}
                    <div style={{ height: 80 }} />
                  </div>

                  {/* ═══ Fixed CTA Button ═══ */}
                  <div
                    style={{
                      flexShrink: 0,
                      padding: "16px 24px",
                      background: "var(--cream, #f5f0e8)",
                      borderTop: "1px solid var(--cream-border, #e0d8c8)",
                    }}
                  >
                    <button
                      onClick={handleUnlock}
                      disabled={submitting}
                      style={{
                        width: "100%",
                        padding: "16px 0",
                        fontSize: "13px",
                        fontWeight: 600,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: "var(--gold, #C9A84C)",
                        color: "var(--ink, #1a1710)",
                        border: "none",
                        cursor: submitting ? "wait" : "pointer",
                        transition: "opacity 0.2s",
                        fontFamily: "var(--font-body)",
                        opacity: submitting ? 0.7 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {submitting ? (
                        "Unlocking..."
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Unlock Preferred Rate
                        </>
                      )}
                    </button>
                    <p
                      className="text-center"
                      style={{
                        fontSize: "11px",
                        color: "var(--ink-light)",
                        marginTop: 10,
                      }}
                    >
                      No payment required &middot; Concierge confirms on WhatsApp
                    </p>
                  </div>
                </>
              ) : (
                /* ═══════ Success State — Lead Captured ═══════ */
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
                    {/* Animated green checkmark */}
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
                      Rate Unlocked
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
                      You&apos;re almost there
                    </h2>

                    {/* Subtext */}
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--ink-light)",
                        marginBottom: 28,
                        lineHeight: 1.6,
                        maxWidth: 380,
                      }}
                    >
                      Our concierge will reach out on WhatsApp within <strong style={{ color: "var(--ink)" }}>15 minutes</strong> to confirm your preferred rate and complete the booking.
                    </p>

                    {/* Reference card */}
                    <div
                      style={{
                        background: "var(--white, #fdfaf5)",
                        border: "1px solid var(--cream-border, #e0d8c8)",
                        padding: "16px 32px",
                        marginBottom: 20,
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
                        Your Reference
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
                        {leadId}
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

                      {hasSaving && (
                        <div className="flex justify-between" style={{ fontSize: "13px", marginBottom: 4 }}>
                          <span style={{ color: "var(--success, #4a7c59)", fontWeight: 600 }}>You save</span>
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
                        <span style={{ color: "var(--ink)" }}>Preferred Rate</span>
                        <span style={{ color: "var(--ink)", fontFamily: "var(--font-display)", fontSize: "18px" }}>
                          {formatCurrency(totalPrice, currency)}
                        </span>
                      </div>
                    </div>

                    {/* CTA buttons */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        width: "100%",
                        maxWidth: 400,
                      }}
                    >
                      {/* WhatsApp CTA — primary */}
                      <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackWhatsAppClicked({ page: "unlock_rate_success" })}
                        style={{
                          width: "100%",
                          padding: "14px 0",
                          fontSize: "13px",
                          fontWeight: 600,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          background: "#25D366",
                          color: "#ffffff",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "var(--font-body)",
                          transition: "opacity 0.2s",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Chat on WhatsApp Now
                      </a>

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
                      >
                        I&apos;ll wait for the call
                      </button>
                    </div>

                    {/* Trust footer */}
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--ink-light)",
                        marginTop: 20,
                        lineHeight: 1.5,
                        maxWidth: 360,
                      }}
                    >
                      Your data is secure. We only use it to confirm your rate and will never share it with third parties.
                    </p>
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
