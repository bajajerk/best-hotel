"use client";

/* ============================================================================
   UnlockRateModal — Concierge Desk
   ----------------------------------------------------------------------------
   Two-column dark-luxe modal that opens when a guest selects a room. The user
   shares four details and the concierge confirms their preferred rate on
   WhatsApp within 15 minutes.

   Design system:
     • Backdrop  — charcoal-tinted, 20px blur
     • Panel     — rgba(20,18,15,0.92) glass, 1px champagne hairline border
     • Header    — mono eyebrow + Playfair italic "Almost there."
     • Left      — editorial summary card (hotel, dates, guests, total, ribbon)
                   + member benefit chips
     • Right     — sleek dark form, gold focus ring, mono uppercase labels
     • Submit    — full-width gold pill, italic Playfair "Unlock my rate"
     • Trust     — three-icon strip (no payment / 15-min / WhatsApp)
     • Success   — calm confirmation card, reference, WhatsApp CTA
     • Mobile    — full-screen takeover, summary stacks above form

   Logic preserved from the previous component:
     • Props (selectedPlan-derived fields), reset on open, body scroll lock,
       Escape-to-close, validation rules, POST /api/lead, success state with
       leadId + whatsappLink, analytics events.
   ========================================================================== */

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", INR: "₹",
  JPY: "¥", AUD: "A$", SGD: "S$", THB: "฿",
  AED: "AED ", MYR: "RM ", IDR: "Rp ", KRW: "₩",
};

function formatCurrency(amount: number, currency?: string): string {
  const sym = currency
    ? CURRENCY_SYMBOLS[currency.toUpperCase()] || `${currency} `
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
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* Default member benefits — admin-curated; shown on every preferred-rate
   stay. Kept in-component because they describe the brand promise rather
   than per-rate data. */
const DEFAULT_BENEFITS = [
  "Daily breakfast for two",
  "$100 hotel credit",
  "Room upgrade subject to availability",
  "4 PM late checkout",
  "Early check-in when available",
];

/* ── Toast — small, restrained, champagne-leaning ── */

function Toast({
  message,
  visible,
  type = "error",
}: {
  message: string;
  visible: boolean;
  type?: "error" | "success";
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            background: type === "error" ? "rgba(40, 18, 18, 0.96)" : "rgba(20, 36, 26, 0.96)",
            border: type === "error"
              ? "1px solid rgba(200, 100, 100, 0.4)"
              : "1px solid rgba(200, 170, 118, 0.4)",
            color: "#f7f5f2",
            padding: "13px 22px",
            fontSize: 12.5,
            fontWeight: 500,
            fontFamily: "var(--font-body)",
            zIndex: 10005,
            backdropFilter: "blur(24px) saturate(120%)",
            WebkitBackdropFilter: "blur(24px) saturate(120%)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
            letterSpacing: "0.02em",
            borderRadius: 999,
            maxWidth: "calc(100vw - 32px)",
            textAlign: "center",
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Small icon set (inline so we don't pull lucide just for four glyphs) ── */

const Icons = {
  lock: (size = 14) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  clock: (size = 14) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  whatsapp: (size = 14) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  close: (size = 16) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="6" y1="18" x2="18" y2="6" />
    </svg>
  ),
  star: (size = 10) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />
    </svg>
  ),
  check: (size = 12) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

/* ── Sleek champagne spinner ── */

function ChampagneSpinner({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        border: "1.5px solid rgba(12, 11, 10, 0.2)",
        borderTopColor: "rgba(12, 11, 10, 0.85)",
        animation: "uvSpin 0.7s linear infinite",
      }}
    />
  );
}

/* ── Field — dark glass input with gold focus ring ── */

function Field({
  label,
  hint,
  type = "text",
  value,
  onChange,
  placeholder,
  inputMode,
  autoComplete,
  invalid,
  prefix,
  required,
}: {
  label: string;
  hint?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  invalid?: boolean;
  prefix?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  const wrapStyle: React.CSSProperties = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: focused
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(255, 255, 255, 0.035)",
    border: invalid
      ? "1px solid rgba(220, 120, 110, 0.7)"
      : focused
        ? "1px solid var(--luxe-champagne, #c8aa76)"
        : "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 10,
    transition: "background 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
    boxShadow: focused && !invalid
      ? "0 0 0 3px rgba(200, 170, 118, 0.12)"
      : "none",
    overflow: "hidden",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 14px",
    paddingLeft: prefix ? 0 : 14,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--luxe-soft-white, #f7f5f2)",
    fontSize: 14,
    fontFamily: "var(--font-body)",
    letterSpacing: "0.01em",
    lineHeight: 1.4,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: invalid
      ? "rgba(220, 140, 130, 0.95)"
      : focused
        ? "var(--luxe-champagne, #c8aa76)"
        : "rgba(247, 245, 242, 0.55)",
    marginBottom: 8,
    transition: "color 0.3s ease",
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={wrapStyle}>
        {prefix && (
          <span
            style={{
              padding: "14px 6px 14px 14px",
              fontSize: 14,
              fontFamily: "var(--font-mono), monospace",
              color: focused
                ? "var(--luxe-champagne, #c8aa76)"
                : "rgba(247, 245, 242, 0.55)",
              borderRight: "1px solid rgba(255, 255, 255, 0.08)",
              marginRight: 10,
              transition: "color 0.3s ease",
              userSelect: "none",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          inputMode={inputMode}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-required={required || undefined}
          style={inputStyle}
        />
      </div>
      {invalid && hint && (
        <p
          style={{
            fontSize: 11,
            color: "rgba(220, 140, 130, 0.95)",
            marginTop: 6,
            fontFamily: "var(--font-body)",
            letterSpacing: "0.02em",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

/* ── Trust strip — three icons, restrained ── */

function TrustStrip() {
  const items: Array<{ icon: React.ReactNode; label: string }> = [
    { icon: Icons.lock(13), label: "No payment now" },
    { icon: Icons.clock(13), label: "15-min concierge response" },
    { icon: Icons.whatsapp(13), label: "Confirmation on WhatsApp" },
  ];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px 20px",
        paddingTop: 18,
        marginTop: 18,
        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      {items.map((it, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11.5,
            fontFamily: "var(--font-body)",
            color: "rgba(247, 245, 242, 0.6)",
            letterSpacing: "0.02em",
          }}
        >
          <span style={{ color: "var(--luxe-champagne, #c8aa76)", display: "inline-flex", lineHeight: 0 }}>
            {it.icon}
          </span>
          {it.label}
        </span>
      ))}
    </div>
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

  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLDivElement | null>(null);

  const totalPrice = nightlyRate * nights;
  const totalMarket = marketRate * nights;
  const totalSaving = Math.max(totalMarket - totalPrice, 0);
  const hasSaving = totalSaving > 0 && totalMarket > 0;
  const isPreferred = rateType === "preferred";
  const savePercent = hasSaving ? Math.round((totalSaving / totalMarket) * 100) : 0;
  const ratesOnRequest = nightlyRate <= 0;

  // Split "Room name • Meal basis" so we can show them as separate chips.
  const { roomLabel, mealLabel } = useMemo(() => {
    if (!roomName) return { roomLabel: "Room", mealLabel: "" };
    const parts = roomName.split("•").map((s) => s.trim());
    return {
      roomLabel: parts[0] || "Room",
      mealLabel: parts[1] || "",
    };
  }, [roomName]);

  const benefits = useMemo(() => {
    if (perks && perks.length > 0) return perks;
    return DEFAULT_BENEFITS;
  }, [perks]);

  // Reset on open + lock body scroll
  useEffect(() => {
    if (open) {
      setForm({ firstName: "", lastName: "", email: "", mobile: "" });
      setErrors({});
      setToastVisible(false);
      setSubmitting(false);
      setLeadState("form");
      setLeadId("");
      setWhatsappLink("");
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Auto-close success state after 8s (gives user time to tap WhatsApp)
  useEffect(() => {
    if (leadState !== "success") return;
    const t = setTimeout(() => onClose(), 8000);
    return () => clearTimeout(t);
  }, [leadState, onClose]);

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
      showToast("Please fill in all four details to continue");
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
        showToast(data.errors?.[0] || "Couldn't reach concierge — try again or DM us directly");
      }
    } catch {
      showToast("Couldn't reach concierge — try again or DM us directly");
    } finally {
      setSubmitting(false);
    }
  }, [form, hotelId, hotelName, roomName, rateType, checkIn, checkOut, nights, guests, nightlyRate, marketRate, currency, showToast]);

  return (
    <>
      <Toast message={toastMessage} visible={toastVisible} type={toastType} />
      <AnimatePresence>
        {open && (
          <>
            {/* spinner keyframes — scoped, inserted once per open */}
            <style>{`
              @keyframes uvSpin { to { transform: rotate(360deg); } }
              @keyframes uvCheckPop {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.15); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>

            {/* ─── Backdrop ─── */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                background:
                  "radial-gradient(120% 80% at 50% 0%, rgba(28, 26, 22, 0.55) 0%, rgba(8, 7, 6, 0.78) 70%)",
                backdropFilter: "blur(20px) saturate(110%)",
                WebkitBackdropFilter: "blur(20px) saturate(110%)",
                zIndex: 10000,
              }}
            />

            {/* ─── Modal panel wrapper ─── */}
            <motion.div
              initial={{ y: "8%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "6%", opacity: 0 }}
              transition={{ type: "tween", duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Unlock preferred rate"
              ref={panelRef}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 10001,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                pointerEvents: "none",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="luxe"
                style={{
                  pointerEvents: "auto",
                  position: "relative",
                  width: "100%",
                  maxWidth: 980,
                  maxHeight: "calc(100dvh - 32px)",
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(20, 18, 15, 0.92)",
                  border: "1px solid rgba(200, 170, 118, 0.22)",
                  borderRadius: 18,
                  boxShadow:
                    "0 40px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
                  backdropFilter: "blur(28px) saturate(120%)",
                  WebkitBackdropFilter: "blur(28px) saturate(120%)",
                  overflow: "hidden",
                  color: "var(--luxe-soft-white, #f7f5f2)",
                  fontFamily: "var(--font-body)",
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
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "50%",
                    color: "rgba(247, 245, 242, 0.7)",
                    cursor: "pointer",
                    zIndex: 5,
                    transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--luxe-champagne, #c8aa76)";
                    e.currentTarget.style.borderColor = "var(--luxe-champagne-line, rgba(200,170,118,0.4))";
                    e.currentTarget.style.background = "rgba(200, 170, 118, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(247, 245, 242, 0.7)";
                    e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                  }}
                >
                  {Icons.close()}
                </button>

                {leadState === "form" ? (
                  <ModalBodyForm
                    hotelName={hotelName}
                    roomLabel={roomLabel}
                    mealLabel={mealLabel}
                    isPreferred={isPreferred}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    nights={nights}
                    guests={guests}
                    totalPrice={totalPrice}
                    totalMarket={totalMarket}
                    totalSaving={totalSaving}
                    hasSaving={hasSaving}
                    savePercent={savePercent}
                    ratesOnRequest={ratesOnRequest}
                    currency={currency}
                    benefits={benefits}
                    form={form}
                    errors={errors}
                    submitting={submitting}
                    onChange={updateField}
                    onSubmit={handleUnlock}
                    firstFieldRef={firstFieldRef}
                  />
                ) : (
                  <ModalBodySuccess
                    hotelName={hotelName}
                    roomLabel={roomLabel}
                    mealLabel={mealLabel}
                    isPreferred={isPreferred}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    nights={nights}
                    totalPrice={totalPrice}
                    totalSaving={totalSaving}
                    hasSaving={hasSaving}
                    ratesOnRequest={ratesOnRequest}
                    currency={currency}
                    leadId={leadId}
                    whatsappLink={whatsappLink}
                    firstName={form.firstName}
                    lastName={form.lastName}
                    onClose={onClose}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   FORM BODY — two-column on desktop, stacked on mobile
   ════════════════════════════════════════════════════════════════════════ */

function ModalBodyForm({
  hotelName,
  roomLabel,
  mealLabel,
  isPreferred,
  checkIn,
  checkOut,
  nights,
  guests,
  totalPrice,
  totalMarket,
  totalSaving,
  hasSaving,
  savePercent,
  ratesOnRequest,
  currency,
  benefits,
  form,
  errors,
  submitting,
  onChange,
  onSubmit,
  firstFieldRef,
}: {
  hotelName: string;
  roomLabel: string;
  mealLabel: string;
  isPreferred: boolean;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  totalPrice: number;
  totalMarket: number;
  totalSaving: number;
  hasSaving: boolean;
  savePercent: number;
  ratesOnRequest: boolean;
  currency: string;
  benefits: string[];
  form: GuestForm;
  errors: FormErrors;
  submitting: boolean;
  onChange: (field: keyof GuestForm, value: string) => void;
  onSubmit: () => void;
  firstFieldRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
      }}
    >
      {/* ── Editorial header (full-width, both columns) ── */}
      <header
        style={{
          padding: "32px 36px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "var(--luxe-champagne, #c8aa76)",
            margin: 0,
            marginBottom: 14,
          }}
        >
          Preferred Rate · Concierge
        </p>
        <h2
          style={{
            fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(28px, 4.5vw, 42px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--luxe-soft-white, #f7f5f2)",
            margin: 0,
            marginBottom: 10,
            paddingRight: 48,
          }}
        >
          Almost there.
        </h2>
        <p
          style={{
            fontSize: 14,
            color: "rgba(247, 245, 242, 0.6)",
            lineHeight: 1.55,
            margin: 0,
            maxWidth: 560,
            letterSpacing: "0.005em",
          }}
        >
          Share four details. We&apos;ll have your preferred rate on WhatsApp in 15 minutes.
        </p>
      </header>

      {/* ── Two columns ── */}
      <div className="uv-grid">
        {/* ─── LEFT — editorial summary ─── */}
        <aside
          style={{
            padding: "28px 28px 28px 36px",
            borderRight: "1px solid rgba(255, 255, 255, 0.05)",
          }}
          className="uv-summary"
        >
          {/* Hotel summary card */}
          <div
            style={{
              position: "relative",
              padding: "22px 22px 24px",
              borderRadius: 14,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              overflow: "hidden",
            }}
          >
            {/* Member rate ribbon */}
            {hasSaving && (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  background: "var(--luxe-champagne-soft, rgba(200,170,118,0.15))",
                  border: "1px solid var(--luxe-champagne-line, rgba(200,170,118,0.28))",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--luxe-champagne, #c8aa76)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ display: "inline-flex" }}>{Icons.star(9)}</span>
                Member · {savePercent}% off
              </div>
            )}

            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "var(--luxe-champagne, #c8aa76)",
                margin: 0,
                marginBottom: 10,
              }}
            >
              Your Stay
            </p>
            <h3
              style={{
                fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                fontStyle: "italic",
                fontWeight: 500,
                fontSize: 22,
                lineHeight: 1.15,
                letterSpacing: "-0.015em",
                color: "var(--luxe-soft-white, #f7f5f2)",
                margin: 0,
                marginBottom: 14,
                paddingRight: hasSaving ? 110 : 0,
              }}
            >
              {hotelName}
            </h3>

            {/* Room + meal chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              <span style={chipStyle()}>{roomLabel}</span>
              {mealLabel && <span style={chipStyle()}>{mealLabel}</span>}
              <span style={chipStyle()}>
                {isPreferred ? "Preferred Rate" : "Standard Rate"}
              </span>
            </div>

            {/* Date + guest pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              <span style={pillStyle()}>
                {formatDateShort(checkIn)} – {formatDateShort(checkOut)} · {nights} night{nights > 1 ? "s" : ""}
              </span>
              <span style={pillStyle()}>{guests}</span>
            </div>

            {/* Total */}
            <div
              style={{
                paddingTop: 16,
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.4em",
                    textTransform: "uppercase",
                    color: "rgba(247, 245, 242, 0.45)",
                    margin: 0,
                    marginBottom: 6,
                  }}
                >
                  {ratesOnRequest ? "Concierge Quote" : "Estimated Total"}
                </p>
                {ratesOnRequest ? (
                  <p
                    style={{
                      fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                      fontStyle: "italic",
                      fontSize: 24,
                      lineHeight: 1.1,
                      color: "var(--luxe-champagne, #c8aa76)",
                      margin: 0,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    On request
                  </p>
                ) : (
                  <>
                    {hasSaving && (
                      <p
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-mono), monospace",
                          color: "rgba(247, 245, 242, 0.4)",
                          textDecoration: "line-through",
                          margin: 0,
                          marginBottom: 2,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {formatCurrency(totalMarket, currency)}
                      </p>
                    )}
                    <p
                      style={{
                        fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                        fontWeight: 500,
                        fontSize: 30,
                        lineHeight: 1.05,
                        color: "var(--luxe-champagne, #c8aa76)",
                        margin: 0,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {formatCurrency(totalPrice, currency)}
                    </p>
                  </>
                )}
              </div>
              {hasSaving && (
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 11,
                    color: "rgba(247, 245, 242, 0.6)",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.4,
                  }}
                >
                  <div>You save</div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono), monospace",
                      color: "var(--luxe-champagne, #c8aa76)",
                      fontWeight: 600,
                      fontSize: 13,
                      letterSpacing: "0.02em",
                      marginTop: 2,
                    }}
                  >
                    {formatCurrency(totalSaving, currency)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Member benefits */}
          {isPreferred && benefits.length > 0 && (
            <div style={{ marginTop: 22 }}>
              <p
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: "var(--luxe-champagne, #c8aa76)",
                  margin: 0,
                  marginBottom: 12,
                }}
              >
                Included Benefits
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {benefits.map((perk) => (
                  <li
                    key={perk}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 11px",
                      background: "var(--luxe-champagne-soft, rgba(200,170,118,0.12))",
                      border: "1px solid var(--luxe-champagne-line, rgba(200,170,118,0.22))",
                      borderRadius: 999,
                      fontSize: 11.5,
                      color: "var(--luxe-soft-white, #f7f5f2)",
                      fontFamily: "var(--font-body)",
                      letterSpacing: "0.005em",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--luxe-champagne, #c8aa76)",
                        display: "inline-flex",
                      }}
                    >
                      {Icons.star(9)}
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
              <p
                style={{
                  fontSize: 10.5,
                  color: "rgba(247, 245, 242, 0.4)",
                  fontFamily: "var(--font-body)",
                  margin: 0,
                  marginTop: 10,
                  fontStyle: "italic",
                  letterSpacing: "0.005em",
                }}
              >
                Subject to availability · curated by our concierge
              </p>
            </div>
          )}
        </aside>

        {/* ─── RIGHT — form ─── */}
        <section
          style={{
            padding: "28px 36px 28px 28px",
            display: "flex",
            flexDirection: "column",
          }}
          className="uv-form"
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: "var(--luxe-champagne, #c8aa76)",
                margin: 0,
              }}
            >
              Concierge Desk
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(247, 245, 242, 0.35)",
                margin: 0,
              }}
            >
              All fields required
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            }}
            className="uv-name-row"
          >
            <div ref={firstFieldRef}>
              <Field
                label="First name"
                value={form.firstName}
                onChange={(v) => onChange("firstName", v)}
                placeholder="Your first name"
                autoComplete="given-name"
                invalid={!!errors.firstName}
                hint="First name is required"
                required
              />
            </div>
            <Field
              label="Last name"
              value={form.lastName}
              onChange={(v) => onChange("lastName", v)}
              placeholder="Your last name"
              autoComplete="family-name"
              invalid={!!errors.lastName}
              hint="Last name is required"
              required
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <Field
              label="Email"
              type="email"
              inputMode="email"
              value={form.email}
              onChange={(v) => onChange("email", v)}
              placeholder="you@domain.com"
              autoComplete="email"
              invalid={!!errors.email}
              hint="A valid email is required"
              required
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <Field
              label="WhatsApp number"
              type="tel"
              inputMode="tel"
              value={form.mobile}
              onChange={(v) => onChange("mobile", v)}
              placeholder="98765 43210"
              autoComplete="tel"
              prefix="+91"
              invalid={!!errors.mobile}
              hint="A valid WhatsApp number is required"
              required
            />
          </div>

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: 999,
              border: "none",
              cursor: submitting ? "wait" : "pointer",
              background: "var(--luxe-champagne, #c8aa76)",
              color: "#0c0b0a",
              fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 500,
              fontSize: 17,
              letterSpacing: "-0.005em",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              boxShadow: "0 6px 22px rgba(200, 170, 118, 0.18)",
              opacity: submitting ? 0.85 : 1,
            }}
            onMouseEnter={(e) => {
              if (submitting) return;
              e.currentTarget.style.background = "#d4b988";
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(200, 170, 118, 0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--luxe-champagne, #c8aa76)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 22px rgba(200, 170, 118, 0.18)";
            }}
          >
            {submitting ? (
              <>
                <ChampagneSpinner size={14} />
                <span style={{ fontStyle: "italic" }}>Sending to concierge…</span>
              </>
            ) : (
              <>
                <span>Unlock my rate</span>
                <span aria-hidden style={{ fontStyle: "normal", fontFamily: "var(--font-body)", fontSize: 14 }}>→</span>
              </>
            )}
          </button>

          <TrustStrip />
        </section>
      </div>

      {/* responsive grid + mobile stacking */}
      <style>{`
        .uv-grid {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
        }
        @media (max-width: 860px) {
          .uv-grid { grid-template-columns: 1fr; }
          .uv-summary { border-right: 0 !important; padding: 24px 24px 8px !important; }
          .uv-form { padding: 8px 24px 28px !important; }
          .uv-name-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   SUCCESS BODY
   ════════════════════════════════════════════════════════════════════════ */

function ModalBodySuccess({
  hotelName,
  roomLabel,
  mealLabel,
  isPreferred,
  checkIn,
  checkOut,
  nights,
  totalPrice,
  totalSaving,
  hasSaving,
  ratesOnRequest,
  currency,
  leadId,
  whatsappLink,
  firstName,
  lastName,
  onClose,
}: {
  hotelName: string;
  roomLabel: string;
  mealLabel: string;
  isPreferred: boolean;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: number;
  totalSaving: number;
  hasSaving: boolean;
  ratesOnRequest: boolean;
  currency: string;
  leadId: string;
  whatsappLink: string;
  firstName: string;
  lastName: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        padding: "44px 36px 36px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Champagne ring + check */}
      <div
        style={{
          position: "relative",
          width: 88,
          height: 88,
          marginBottom: 22,
        }}
      >
        <motion.div
          aria-hidden
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(200, 170, 118, 0.18) 0%, rgba(200, 170, 118, 0) 70%)",
          }}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            inset: 8,
            borderRadius: "50%",
            border: "1px solid var(--luxe-champagne-line, rgba(200,170,118,0.4))",
            background:
              "linear-gradient(180deg, rgba(200,170,118,0.18) 0%, rgba(200,170,118,0.04) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            style={{ color: "var(--luxe-champagne, #c8aa76)", display: "flex" }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        </motion.div>
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: "var(--luxe-champagne, #c8aa76)",
          margin: 0,
          marginBottom: 12,
        }}
      >
        Concierge Notified
      </p>

      <h2
        style={{
          fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(30px, 5vw, 44px)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: "var(--luxe-soft-white, #f7f5f2)",
          margin: 0,
          marginBottom: 12,
        }}
      >
        Got it,{firstName ? ` ${firstName}` : ""}.
      </h2>

      <p
        style={{
          fontSize: 14.5,
          color: "rgba(247, 245, 242, 0.7)",
          lineHeight: 1.55,
          margin: 0,
          marginBottom: 26,
          maxWidth: 460,
          letterSpacing: "0.005em",
        }}
      >
        Our concierge will WhatsApp you within{" "}
        <strong style={{ color: "var(--luxe-soft-white, #f7f5f2)", fontWeight: 600 }}>
          15 minutes
        </strong>{" "}
        with your confirmed preferred rate.
      </p>

      {leadId && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 18px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: 999,
            marginBottom: 24,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              color: "rgba(247, 245, 242, 0.45)",
            }}
          >
            Reference
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--luxe-champagne, #c8aa76)",
            }}
          >
            {leadId}
          </span>
        </div>
      )}

      {/* Stay summary card */}
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          padding: "20px 22px",
          borderRadius: 14,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          textAlign: "left",
          marginBottom: 22,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 18,
            lineHeight: 1.2,
            letterSpacing: "-0.015em",
            color: "var(--luxe-soft-white, #f7f5f2)",
            margin: 0,
            marginBottom: 4,
          }}
        >
          {hotelName}
        </p>
        <p
          style={{
            fontSize: 12.5,
            color: "rgba(247, 245, 242, 0.6)",
            margin: 0,
            marginBottom: 14,
            letterSpacing: "0.005em",
          }}
        >
          {roomLabel}
          {mealLabel ? ` · ${mealLabel}` : ""}
          {" · "}
          {isPreferred ? "Preferred" : "Standard"}
        </p>

        <SummaryRow label="Check-in" value={formatDateShort(checkIn)} />
        <SummaryRow label="Check-out" value={formatDateShort(checkOut)} />
        <SummaryRow label="Nights" value={`${nights}`} />
        {firstName || lastName ? (
          <SummaryRow label="Guest" value={`${firstName} ${lastName}`.trim()} />
        ) : null}

        {!ratesOnRequest && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginTop: 12,
              paddingTop: 12,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.36em",
                textTransform: "uppercase",
                color: "rgba(247, 245, 242, 0.45)",
              }}
            >
              {hasSaving ? "Member Rate" : "Estimated Total"}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display), 'Playfair Display', Georgia, serif",
                fontWeight: 500,
                fontSize: 22,
                letterSpacing: "-0.01em",
                color: "var(--luxe-champagne, #c8aa76)",
              }}
            >
              {formatCurrency(totalPrice, currency)}
            </span>
          </div>
        )}
        {hasSaving && (
          <p
            style={{
              fontSize: 11.5,
              color: "rgba(247, 245, 242, 0.55)",
              margin: 0,
              marginTop: 6,
              textAlign: "right",
              fontFamily: "var(--font-body)",
              letterSpacing: "0.01em",
            }}
          >
            Saving {formatCurrency(totalSaving, currency)} vs. public rate
          </p>
        )}
      </div>

      {/* CTAs */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          width: "100%",
          maxWidth: 440,
        }}
      >
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWhatsAppClicked({ page: "unlock_rate_success" })}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 999,
              background: "#25D366",
              color: "#0a1a10",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
              boxShadow: "0 6px 22px rgba(37, 211, 102, 0.22)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 10px 28px rgba(37, 211, 102, 0.32)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 22px rgba(37, 211, 102, 0.22)";
            }}
          >
            {Icons.whatsapp(16)}
            Open WhatsApp now
          </a>
        )}

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "13px 24px",
            borderRadius: 999,
            background: "transparent",
            color: "rgba(247, 245, 242, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--luxe-soft-white, #f7f5f2)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(247, 245, 242, 0.7)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
          }}
        >
          I&apos;ll wait for the WhatsApp
        </button>
      </div>

      <p
        style={{
          fontSize: 11,
          color: "rgba(247, 245, 242, 0.4)",
          marginTop: 22,
          maxWidth: 360,
          lineHeight: 1.55,
          letterSpacing: "0.01em",
        }}
      >
        Your details are used only to confirm this rate. Never shared.
      </p>
    </motion.div>
  );
}

/* ── small bits ── */

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        fontSize: 13,
        marginBottom: 6,
      }}
    >
      <span
        style={{
          color: "rgba(247, 245, 242, 0.5)",
          fontFamily: "var(--font-body)",
          letterSpacing: "0.005em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "var(--luxe-soft-white, #f7f5f2)",
          fontWeight: 500,
          fontFamily: "var(--font-body)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function chipStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    fontSize: 11,
    color: "rgba(247, 245, 242, 0.75)",
    fontFamily: "var(--font-body)",
    letterSpacing: "0.01em",
  };
}

function pillStyle(): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 12px",
    background: "rgba(255, 255, 255, 0.045)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 999,
    fontSize: 12,
    color: "var(--luxe-soft-white, #f7f5f2)",
    fontFamily: "var(--font-body)",
    letterSpacing: "0.01em",
  };
}
