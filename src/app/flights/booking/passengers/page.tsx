"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFlightBooking, FlightPassenger } from "@/context/FlightBookingContext";
import { validatePrebookFlight, createFlightBookingRecord } from "@/lib/api";

const GOLD = "#C9A84C";

const TITLES_ADULT = ["Mr", "Mrs", "Ms"];
const TITLES_CHILD = ["Mstr", "Miss"];

function ageFromDob(dob: string): number {
  if (!dob) return 0;
  const today = new Date();
  const bd = new Date(dob);
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
  return age;
}

interface PaxForm {
  ti: string;
  fN: string;
  lN: string;
  dob: string;
  pt: "ADULT" | "CHILD" | "INFANT";
}

function PaxFormCard({
  index,
  pax,
  onChange,
  label,
}: {
  index: number;
  pax: PaxForm;
  onChange: (updated: PaxForm) => void;
  label: string;
}) {
  const titles = pax.pt === "ADULT" ? TITLES_ADULT : TITLES_CHILD;
  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ece6dc",
    borderRadius: 8,
    fontFamily: "var(--font-body, sans-serif)",
    fontSize: 14,
    color: "#1a1710",
    background: "#fdfaf5",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div style={{
      background: "#fdfaf5",
      borderRadius: 12,
      border: "1.5px solid #ece6dc",
      padding: "18px 16px",
      marginBottom: 16,
    }}>
      <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, fontWeight: 700, color: "#5a5448", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
        {label} {index + 1}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", display: "block", marginBottom: 4 }}>Title</label>
          <select
            value={pax.ti}
            onChange={e => onChange({ ...pax, ti: e.target.value })}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="">—</option>
            {titles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", display: "block", marginBottom: 4 }}>First Name</label>
          <input
            type="text"
            placeholder="First"
            value={pax.fN}
            onChange={e => onChange({ ...pax, fN: e.target.value.toUpperCase() })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", display: "block", marginBottom: 4 }}>Last Name</label>
          <input
            type="text"
            placeholder="Last"
            value={pax.lN}
            onChange={e => onChange({ ...pax, lN: e.target.value.toUpperCase() })}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", display: "block", marginBottom: 4 }}>
          Date of Birth{" "}
          {pax.pt === "ADULT" && <span style={{ color: "#a09585" }}>(18+ years)</span>}
          {pax.pt === "CHILD" && <span style={{ color: "#a09585" }}>(2–12 years)</span>}
          {pax.pt === "INFANT" && <span style={{ color: "#a09585" }}>(under 2 years)</span>}
        </label>
        <input
          type="date"
          value={pax.dob}
          onChange={e => onChange({ ...pax, dob: e.target.value })}
          style={{ ...inputStyle, width: "auto", minWidth: 160 }}
          max={
            pax.pt === "ADULT"
              ? new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
              : pax.pt === "CHILD"
              ? new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10)
          }
          min={
            pax.pt === "CHILD"
              ? new Date(Date.now() - 12 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
              : pax.pt === "INFANT"
              ? new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
              : undefined
          }
        />
      </div>
    </div>
  );
}

function PassengersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getIdToken, user } = useAuth();
  const flow = useFlightBooking();

  const bookingId = searchParams.get("bookingId") ?? "";
  const adults = Number(searchParams.get("adults") ?? "1");
  const totalFare = Number(searchParams.get("totalFare") ?? "0");
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const fromCity = searchParams.get("fromCity") ?? from;
  const toCity = searchParams.get("toCity") ?? to;
  const date = searchParams.get("date") ?? "";

  const initAdult = (): PaxForm => ({ ti: "", fN: "", lN: "", dob: "", pt: "ADULT" });
  const [paxForms, setPaxForms] = useState<PaxForm[]>(() => Array.from({ length: adults }, initAdult));

  const [contactName, setContactName] = useState(user?.displayName ?? "");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [contactPhone, setContactPhone] = useState("");

  const [proceeding, setProceeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updatePax(i: number, updated: PaxForm) {
    setPaxForms(prev => prev.map((p, idx) => idx === i ? updated : p));
  }

  function validate(): string | null {
    for (let i = 0; i < paxForms.length; i++) {
      const p = paxForms[i];
      if (!p.ti) return `Select a title for Passenger ${i + 1}`;
      if (!p.fN.trim()) return `Enter first name for Passenger ${i + 1}`;
      if (!p.lN.trim()) return `Enter last name for Passenger ${i + 1}`;
      if (!p.dob) return `Enter date of birth for Passenger ${i + 1}`;
      const age = ageFromDob(p.dob);
      if (p.pt === "ADULT" && age < 18) return `Passenger ${i + 1} must be 18 or older`;
    }
    if (!contactName.trim()) return "Enter contact name";
    if (!contactEmail.trim() || !contactEmail.includes("@")) return "Enter a valid contact email";
    if (!contactPhone.trim() || contactPhone.replace(/\D/g, "").length !== 10) return "Enter a valid 10-digit mobile number";
    return null;
  }

  async function handleContinue() {
    const validErr = validate();
    if (validErr) { setError(validErr); return; }
    if (!bookingId || proceeding) return;

    setError(null);
    setProceeding(true);

    try {
      const token = await getIdToken();
      const passengers: FlightPassenger[] = paxForms.map(p => ({
        ti: p.ti,
        fN: p.fN.trim(),
        lN: p.lN.trim(),
        dob: p.dob,
        pt: p.pt,
      }));

      // Validate with TripJack
      await validatePrebookFlight({ bookingId, passengers, token });

      // Create DB record
      const phone = contactPhone.replace(/\D/g, "").slice(-10);
      const record = await createFlightBookingRecord({
        bookingId,
        passengers,
        tripType: flow.tripType,
        origin: from,
        destination: to,
        travelDate: date,
        totalFare,
        currency: "INR",
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: phone,
        priceIds: flow.priceIds,
        fareDetails: null,
        token,
      });

      flow.setPassengers(passengers);
      flow.setContact(contactName.trim(), contactEmail.trim(), phone);
      flow.setFlightMeta({
        origin: from,
        originCity: fromCity,
        destination: to,
        destinationCity: toCity,
        travelDate: date,
        totalFare,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: phone,
      });
      flow.setFlightBookingId(record.flight_booking_id);

      router.push(`/flights/booking/payment`);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      setProceeding(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    border: "1.5px solid #ece6dc",
    borderRadius: 8,
    fontFamily: "var(--font-body, sans-serif)",
    fontSize: 14,
    color: "#1a1710",
    background: "#fdfaf5",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <div>
      {/* Route summary */}
      <div style={{
        background: "#fdfaf5", borderRadius: 12, border: "1.5px solid #ece6dc",
        padding: "12px 16px", marginBottom: 20, fontFamily: "var(--font-body, sans-serif)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1710" }}>
          {fromCity} → {toCity}
        </div>
        <div style={{ fontSize: 12, color: "#7a7465", marginTop: 2 }}>
          {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          {" · "}{adults === 1 ? "1 Adult" : `${adults} Adults`}
        </div>
      </div>

      {/* Passenger forms */}
      <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, fontWeight: 700, color: "#5a5448", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
        Passenger Details
      </div>
      {paxForms.map((pax, i) => (
        <PaxFormCard
          key={i}
          index={i}
          pax={pax}
          onChange={updated => updatePax(i, updated)}
          label="Adult"
        />
      ))}

      {/* Contact */}
      <div style={{
        background: "#fdfaf5", borderRadius: 12, border: "1.5px solid #ece6dc",
        padding: "18px 16px", marginBottom: 16,
      }}>
        <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, fontWeight: 700, color: "#5a5448", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
          Contact Information
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", display: "block", marginBottom: 4 }}>Full Name</label>
            <input type="text" placeholder="Your name" value={contactName} onChange={e => setContactName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", display: "block", marginBottom: 4 }}>Email</label>
            <input type="email" placeholder="Email for ticket delivery" value={contactEmail} onChange={e => setContactEmail(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", display: "block", marginBottom: 4 }}>Mobile Number</label>
            <input type="tel" placeholder="10-digit mobile" value={contactPhone} onChange={e => setContactPhone(e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8,
          padding: "12px 14px", marginBottom: 16,
          fontFamily: "var(--font-body, sans-serif)", fontSize: 13, color: "#b91c1c",
        }}>
          {error}
        </div>
      )}

      <div style={{ height: 90 }} />

      {/* Sticky CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(253,250,245,0.97)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid #ece6dc",
        padding: "12px 16px",
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#7a7465", textAlign: "center", marginBottom: 8 }}>
            Total · <span style={{ fontWeight: 700, color: "#1a1710" }}>₹{Math.round(totalFare).toLocaleString("en-IN")}</span>
          </div>
          <button
            onClick={handleContinue}
            disabled={proceeding}
            style={{
              width: "100%",
              padding: "15px 24px",
              background: proceeding ? "#e0d8c8" : GOLD,
              border: "none",
              borderRadius: 10,
              fontFamily: "var(--font-body, sans-serif)",
              fontSize: 14,
              fontWeight: 700,
              color: proceeding ? "#aaa" : "#0B1B2B",
              cursor: proceeding ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {proceeding ? "Validating…" : "Continue to Payment →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PassengersPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-body, sans-serif)", color: "#7a7465", fontSize: 14 }}>
        Loading…
      </div>
    }>
      <PassengersContent />
    </Suspense>
  );
}
