"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFlightBooking } from "@/context/FlightBookingContext";
import { reviewFlight, type ReviewFareOption } from "@/lib/api";

const GOLD = "#C9A84C";

function fmtTime(iso: string) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtDuration(mins: number) {
  if (!mins) return "";
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtPrice(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="7" fill="#10B981" />
      <path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="7" fill="#ece6dc" />
      <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#a09585" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}


function FareCard({
  fare,
  selected,
  cheapest,
  onSelect,
  loading,
}: {
  fare: ReviewFareOption;
  selected: boolean;
  cheapest: boolean;
  onSelect: () => void;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={loading}
      style={{
        display: "block",
        width: "100%",
        background: selected ? "rgba(201,168,76,0.06)" : "#fdfaf5",
        border: `2px solid ${selected ? GOLD : "#ece6dc"}`,
        borderRadius: 12,
        padding: "18px 18px 16px",
        cursor: loading ? "default" : "pointer",
        textAlign: "left",
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: selected ? "0 0 0 3px rgba(201,168,76,0.13)" : "none",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontFamily: "var(--font-body, sans-serif)",
              fontSize: 15,
              fontWeight: 700,
              color: "#1a1710",
            }}>
              {fare.fareIdentifier}
            </span>
            {cheapest && (
              <span style={{
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: 10,
                fontWeight: 700,
                background: GOLD,
                color: "#0B1B2B",
                padding: "2px 8px",
                borderRadius: 4,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}>
                Cheapest
              </span>
            )}
          </div>
          <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#7a7465" }}>
            Base ₹{Math.round(fare.baseFare).toLocaleString("en-IN")} + Taxes ₹{Math.round(fare.taxes).toLocaleString("en-IN")}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 22, fontWeight: 700, color: "#1a1710", lineHeight: 1.1 }}>
            {fmtPrice(fare.totalFare)}
          </div>
          <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 11, color: "#7a7465", marginTop: 2 }}>per person</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
        {[
          { label: fare.checkinBaggage || "No check-in bag", ok: !!fare.checkinBaggage },
          { label: fare.cabinBaggage || "No cabin bag", ok: !!fare.cabinBaggage },
          { label: fare.mealIncluded ? "Meal included" : "No meal", ok: fare.mealIncluded },
          { label: fare.refundable ? "Refundable" : "Non-refundable", ok: fare.refundable },
        ].map(({ label, ok }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#5a5448" }}>
            {ok ? <CheckIcon /> : <CrossIcon />}
            {label}
          </div>
        ))}
      </div>
    </button>
  );
}

function FareSelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getIdToken } = useAuth();
  const flow = useFlightBooking();

  const priceIdsParam = searchParams.get("priceIds") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const fromCity = searchParams.get("fromCity") ?? from;
  const toCity = searchParams.get("toCity") ?? to;
  const date = searchParams.get("date") ?? "";
  const adults = Number(searchParams.get("adults") ?? "1");
  const cabin = searchParams.get("cabin") ?? "ECONOMY";

  const [fares, setFares] = useState<ReviewFareOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tjBookingId, setTjBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [proceeding, setProceeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!priceIdsParam) { setLoading(false); return; }
    load();
  }, [priceIdsParam]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const priceIds = priceIdsParam.split(",").filter(Boolean);
      const result = await reviewFlight({ priceIds, token });
      setTjBookingId(result.bookingId ?? null);
      setFares(result.fareOptions ?? []);
      if (result.fareOptions?.length) {
        const cheapest = result.fareOptions.reduce((a: ReviewFareOption, b: ReviewFareOption) =>
          a.totalFare <= b.totalFare ? a : b
        );
        setSelectedId(cheapest.id);
      }
    } catch (e: any) {
      setError(e?.message ?? "Could not load fares. Please go back and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    if (!selectedId || !tjBookingId || proceeding) return;
    const fare = fares.find(f => f.id === selectedId);
    if (!fare) return;

    setProceeding(true);

    flow.setFlightMeta({
      origin: from,
      originCity: fromCity,
      destination: to,
      destinationCity: toCity,
      travelDate: date,
      cabinClass: cabin,
      totalFare: fare.totalFare * adults,
      baseFare: fare.baseFare * adults,
      taxes: fare.taxes * adults,
      fareIdentifier: fare.fareIdentifier,
      selectedFareId: fare.id,
      priceIds: priceIdsParam.split(",").filter(Boolean),
    });
    flow.setTjBookingId(tjBookingId);

    const p = new URLSearchParams({
      bookingId: tjBookingId,
      fareId: fare.id,
      from, to, fromCity, toCity, date, adults: String(adults),
      totalFare: String(fare.totalFare * adults),
    });
    router.push(`/flights/booking/passengers?${p}`);
  }

  const selectedFare = fares.find(f => f.id === selectedId) ?? null;

  return (
    <div>
      {/* Route summary */}
      <div style={{
        background: "#fdfaf5",
        borderRadius: 12,
        border: "1.5px solid #ece6dc",
        padding: "14px 16px",
        marginBottom: 20,
      }}>
        <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 13, fontWeight: 600, color: "#1a1710" }}>
          {fromCity} ({from}) → {toCity} ({to})
        </div>
        <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#7a7465", marginTop: 3 }}>
          {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          {" · "}{adults === 1 ? "1 Adult" : `${adults} Adults`}{" · "}{cabin.charAt(0) + cabin.slice(1).toLowerCase()}
        </div>
      </div>

      <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 13, fontWeight: 700, color: "#5a5448", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>
        Available Fares
      </div>

      {loading ? (
        [1, 2, 3].map(i => (
          <div key={i} style={{ height: 120, background: "#ece6dc", borderRadius: 12, marginBottom: 12, opacity: 0.5, animation: "pulse 1.3s ease-in-out infinite" }} />
        ))
      ) : error ? (
        <div style={{ padding: "20px 0", textAlign: "center", fontFamily: "var(--font-body, sans-serif)", fontSize: 14, color: "#e05555" }}>
          {error}
          <br />
          <button
            onClick={() => router.back()}
            style={{ marginTop: 12, padding: "8px 20px", background: GOLD, border: "none", borderRadius: 8, fontFamily: "var(--font-body, sans-serif)", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#0B1B2B" }}
          >
            Go Back
          </button>
        </div>
      ) : fares.length === 0 ? (
        <div style={{ padding: "20px 0", textAlign: "center", fontFamily: "var(--font-body, sans-serif)", fontSize: 14, color: "#7a7465" }}>
          No fares available. Please go back and select a different flight.
        </div>
      ) : (
        fares.map((fare, i) => (
          <FareCard
            key={fare.id}
            fare={fare}
            selected={selectedId === fare.id}
            cheapest={i === 0}
            onSelect={() => setSelectedId(fare.id)}
            loading={proceeding}
          />
        ))
      )}

      <div style={{ height: 90 }} />

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>

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
          {selectedFare && (
            <div style={{ fontFamily: "var(--font-body, sans-serif)", fontSize: 12, color: "#7a7465", textAlign: "center", marginBottom: 8 }}>
              {selectedFare.fareIdentifier} · {fmtPrice(selectedFare.totalFare * adults)} total for {adults} {adults === 1 ? "adult" : "adults"}
            </div>
          )}
          <button
            onClick={handleContinue}
            disabled={!selectedId || !tjBookingId || proceeding || loading}
            style={{
              width: "100%",
              padding: "15px 24px",
              background: (!selectedId || !tjBookingId || proceeding) ? "#e0d8c8" : GOLD,
              border: "none",
              borderRadius: 10,
              fontFamily: "var(--font-body, sans-serif)",
              fontSize: 14,
              fontWeight: 700,
              color: (!selectedId || !tjBookingId || proceeding) ? "#aaa" : "#0B1B2B",
              cursor: (!selectedId || !tjBookingId || proceeding) ? "not-allowed" : "pointer",
              letterSpacing: "0.04em",
            }}
          >
            {proceeding ? "Continuing…" : "Continue to Passengers →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FareSelectPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: 40, textAlign: "center", fontFamily: "var(--font-body, sans-serif)", color: "#7a7465", fontSize: 14 }}>
        Loading fares…
      </div>
    }>
      <FareSelectContent />
    </Suspense>
  );
}
