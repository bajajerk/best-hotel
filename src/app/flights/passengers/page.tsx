"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import {
  validatePrebookFlight,
  bookFlight,
  type FlightPassenger,
} from "@/lib/api";

const TITLES = ["Mr", "Mrs", "Ms", "Mstr", "Miss"] as const;

type Title = (typeof TITLES)[number];

interface PaxForm {
  ti: Title;
  fN: string;
  lN: string;
  dob: string;
  pt: "ADULT";
}

function emptyAdult(): PaxForm {
  return { ti: "Mr", fN: "", lN: "", dob: "", pt: "ADULT" };
}

function fmtDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function PassengersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getIdToken } = useAuth();

  const bookingId = searchParams.get("bookingId") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const fromCity = searchParams.get("fromCity") ?? from;
  const toCity = searchParams.get("toCity") ?? to;
  const date = searchParams.get("date") ?? "";
  const adults = Math.max(1, Number(searchParams.get("adults") ?? "1"));
  const totalFare = Number(searchParams.get("totalFare") ?? "0");

  const [pax, setPax] = useState<PaxForm[]>(() => Array.from({ length: adults }, emptyAdult));
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ bookingId: string; status: string } | null>(null);

  function updatePax(i: number, patch: Partial<PaxForm>) {
    setPax((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function validate(): string | null {
    if (!bookingId) return "Missing bookingId. Go back and re-select a fare.";
    for (let i = 0; i < pax.length; i++) {
      const p = pax[i];
      if (!p.fN.trim()) return `Passenger ${i + 1}: first name required`;
      if (!p.lN.trim()) return `Passenger ${i + 1}: last name required`;
      if (!p.dob) return `Passenger ${i + 1}: date of birth required`;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Valid email is required";
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) return "Valid 10-digit phone is required";
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const passengers: FlightPassenger[] = pax.map((p) => ({
        ti: p.ti,
        fN: p.fN.trim(),
        lN: p.lN.trim(),
        dob: p.dob,
        pt: p.pt,
        fF: "",
        bf: 0,
      }));

      await validatePrebookFlight({ bookingId, passengers, token });
      const result = await bookFlight({
        bookingId,
        passengers,
        deliveryInfo: { emails: [email.trim()], contacts: [phone.replace(/\D/g, "")] },
        paymentInfos: totalFare > 0
          ? [{ amount: totalFare, paymentType: "BALANCE" }]
          : undefined,
        token,
      });
      setSuccess({ bookingId: result.bookingId, status: result.status });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Booking failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <>
        <Header />
        <div className="pp-page">
          <div className="success-card">
            <div className="success-ico">✓</div>
            <div className="success-title">{success.status === "BOOKED" ? "Booking Confirmed" : "PNR Held"}</div>
            <div className="success-sub">
              {success.status === "BOOKED"
                ? "Your tickets have been issued. A confirmation has been sent to your email."
                : "Your seats are reserved. Complete payment to issue tickets."}
            </div>

            <div className="success-meta">
              <div className="meta-row">
                <span className="meta-k">Booking ID</span>
                <span className="meta-v mono">{success.bookingId}</span>
              </div>
              <div className="meta-row">
                <span className="meta-k">Status</span>
                <span className="meta-v">{success.status}</span>
              </div>
              <div className="meta-row">
                <span className="meta-k">Route</span>
                <span className="meta-v">{fromCity} → {toCity}</span>
              </div>
              <div className="meta-row">
                <span className="meta-k">Date</span>
                <span className="meta-v">{fmtDate(date)}</span>
              </div>
            </div>

            <div className="success-actions">
              <Link href="/flights" className="success-link">Back to flight search</Link>
            </div>
          </div>
        </div>
        <style>{styleBlock}</style>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pp-page">

        <div className="pp-bar">
          <div className="bar-dest">
            <button onClick={() => router.back()} className="bar-back" aria-label="Back">←</button>
            {fromCity} ({from}) → {toCity} ({to})
          </div>
          <div className="bar-meta">
            {fmtDate(date)} · {adults === 1 ? "1 Adult" : `${adults} Adults`} · Economy
          </div>
        </div>

        <div className="section-title">Passenger details</div>

        {pax.map((p, i) => (
          <div className="pax-card" key={i}>
            <div className="pax-head">Adult {i + 1}</div>

            <div className="row">
              <label className="field title-field">
                <span className="lbl">Title</span>
                <select
                  value={p.ti}
                  onChange={(e) => updatePax(i, { ti: e.target.value as Title })}
                >
                  {TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              <label className="field grow">
                <span className="lbl">First name</span>
                <input
                  type="text"
                  autoComplete="given-name"
                  value={p.fN}
                  onChange={(e) => updatePax(i, { fN: e.target.value })}
                  placeholder="As per passport"
                />
              </label>
            </div>

            <label className="field">
              <span className="lbl">Last name</span>
              <input
                type="text"
                autoComplete="family-name"
                value={p.lN}
                onChange={(e) => updatePax(i, { lN: e.target.value })}
                placeholder="As per passport"
              />
            </label>

            <label className="field">
              <span className="lbl">Date of birth</span>
              <input
                type="date"
                value={p.dob}
                onChange={(e) => updatePax(i, { dob: e.target.value })}
                max={new Date().toISOString().slice(0, 10)}
              />
            </label>
          </div>
        ))}

        <div className="section-title">Contact info</div>

        <div className="pax-card">
          <label className="field">
            <span className="lbl">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="field">
            <span className="lbl">Phone (10 digits)</span>
            <input
              type="tel"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
            />
          </label>

          <p className="hint">Booking confirmation will be sent here.</p>
        </div>

        {error && <div className="form-error">{error}</div>}

        <div style={{ height: 100 }} />
      </div>

      <div className="sticky-pp">
        <div className="sticky-l">
          <div className="sticky-lbl">{adults === 1 ? "1 traveller" : `${adults} travellers`} · {fromCity} → {toCity}</div>
          <div className="sticky-total">
            {totalFare > 0 ? `₹${Math.round(totalFare).toLocaleString("en-IN")}` : "Confirm booking"}
          </div>
        </div>
        <button
          className={`sticky-btn${submitting ? " dim" : ""}`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Booking…" : "Confirm & Pay →"}
        </button>
      </div>

      <style>{styleBlock}</style>
    </>
  );
}

const styleBlock = `
  .pp-page { min-height: 100vh; background: #f5f0e8; padding-top: 72px; padding-bottom: 24px; }

  .pp-bar { background: #0B1B2B; padding: 14px 16px; border-bottom: 1px solid rgba(201,168,76,0.1); }
  .bar-back { background: none; border: none; color: rgba(253,250,245,0.45); font-size: 18px; margin-right: 10px; cursor: pointer; padding: 0; transition: color 0.2s; font-family: inherit; }
  .bar-back:hover { color: #C9A84C; }
  .bar-dest { font-size: 15px; font-weight: 600; color: #fdfaf5; margin-bottom: 4px; font-family: var(--font-body); display: flex; align-items: center; }
  .bar-meta { font-size: 11px; color: rgba(253,250,245,0.42); font-family: var(--font-body); }

  .section-title { font-size: 11px; font-weight: 700; color: #1a1710; padding: 16px 16px 6px; font-family: var(--font-body); letter-spacing: 0.08em; text-transform: uppercase; }

  .pax-card { background: #fdfaf5; border: 1.5px solid #ece6dc; border-radius: 10px; padding: 16px; margin: 0 12px 10px; }
  .pax-head { font-size: 13px; font-weight: 700; color: #1a1710; font-family: var(--font-body); margin-bottom: 12px; }

  .row { display: flex; gap: 10px; }
  .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
  .field.grow { flex: 1; }
  .field.title-field { flex: 0 0 90px; }
  .field:last-child { margin-bottom: 0; }
  .lbl { font-size: 11px; color: #7a7465; font-family: var(--font-body); letter-spacing: 0.04em; text-transform: uppercase; font-weight: 600; }
  .field input, .field select { background: #fff; border: 1.5px solid #ece6dc; border-radius: 6px; padding: 10px 12px; font-size: 14px; color: #1a1710; font-family: var(--font-body); transition: border-color 0.2s; outline: none; width: 100%; box-sizing: border-box; }
  .field input:focus, .field select:focus { border-color: #C9A84C; }
  .field input::placeholder { color: #b8b0a0; }
  .hint { font-size: 11px; color: #7a7465; font-family: var(--font-body); margin: 4px 0 0; }

  .form-error { background: rgba(181,74,58,0.08); border: 1px solid rgba(181,74,58,0.3); color: #b54a3a; font-size: 13px; padding: 10px 14px; border-radius: 6px; margin: 8px 12px; font-family: var(--font-body); }

  /* Sticky CTA */
  .sticky-pp { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(253,250,245,0.97); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid #ece6dc; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 13px 16px; padding-bottom: max(13px, env(safe-area-inset-bottom)); z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
  .sticky-l { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
  .sticky-lbl { font-size: 12px; color: #7a7465; font-family: var(--font-body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sticky-total { font-size: 15px; font-weight: 700; color: #1a1710; font-family: var(--font-body); }
  .sticky-btn { background: #C9A84C; color: #0B1B2B; padding: 12px 28px; border-radius: 6px; font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: none; cursor: pointer; transition: opacity 0.2s; white-space: nowrap; flex-shrink: 0; }
  .sticky-btn.dim { opacity: 0.6; cursor: not-allowed; }
  @media (max-width: 380px) {
    .sticky-btn { padding: 12px 18px; }
  }

  /* Success state */
  .success-card { background: #fdfaf5; border: 1.5px solid #ece6dc; border-radius: 12px; padding: 28px 20px; margin: 24px 12px; text-align: center; }
  .success-ico { width: 56px; height: 56px; border-radius: 50%; background: #10B981; color: #fff; font-size: 28px; line-height: 56px; margin: 0 auto 14px; font-weight: 700; }
  .success-title { font-size: 20px; font-weight: 700; color: #1a1710; font-family: var(--font-display, var(--font-body)); margin-bottom: 6px; }
  .success-sub { font-size: 13px; color: #7a7465; font-family: var(--font-body); margin-bottom: 20px; }
  .success-meta { background: #f7f1e6; border-radius: 8px; padding: 14px 16px; text-align: left; margin-bottom: 20px; }
  .meta-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; font-family: var(--font-body); }
  .meta-row + .meta-row { border-top: 1px solid #ece6dc; }
  .meta-k { color: #7a7465; }
  .meta-v { color: #1a1710; font-weight: 600; }
  .meta-v.mono { font-family: var(--font-mono); font-size: 12px; word-break: break-all; text-align: right; max-width: 60%; }
  .success-actions { display: flex; justify-content: center; }
  .success-link { color: #C9A84C; text-decoration: none; font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
`;

export default function PassengersPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-body)", color: "#7a7465", fontSize: "14px" }}>Loading…</div>
      </div>
    }>
      <PassengersContent />
    </Suspense>
  );
}
