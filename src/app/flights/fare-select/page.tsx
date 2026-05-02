"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { reviewFlight, type FlightReviewResult, type ReviewFareOption, type ParsedFlight, type FlightFare } from "@/lib/api";

function fmtTime(iso: string) {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function fmtDuration(mins: number) {
  if (!mins) return "";
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtDate(iso: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

function fmtPrice(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function paxSummary(adults: number, children: number, infants: number) {
  const parts: string[] = [];
  parts.push(adults === 1 ? "1 Adult" : `${adults} Adults`);
  if (children > 0) parts.push(children === 1 ? "1 Child" : `${children} Children`);
  if (infants > 0) parts.push(infants === 1 ? "1 Infant" : `${infants} Infants`);
  return parts.join(", ");
}

function FareCard({
  fare,
  selected,
  onSelect,
  badge,
}: {
  fare: FlightFare;
  selected: boolean;
  onSelect: () => void;
  badge: "cheap" | null;
}) {
  return (
    <div
      className={`fare-card${selected ? " sel" : ""}${badge ? ` ${badge}` : ""}`}
      onClick={onSelect}
    >
      <div className="fare-top">
        <div className="fare-name">{fare.fareIdentifier || "STANDARD"}</div>
        {badge === "cheap" && <div className="fare-badge cheap">Cheapest</div>}
      </div>

      <div className="fare-feats">
        <div className="feat">
          <span className="feat-ico">🧳</span>
          <span>{fare.checkinBaggage || "—"} check-in</span>
        </div>
        <div className="feat">
          <span className="feat-ico">🎒</span>
          <span>{fare.cabinBaggage || "—"} cabin</span>
        </div>
        <div className="feat">
          <span className="feat-ico">{fare.mealIncluded ? "🍽" : "✕"}</span>
          <span>{fare.mealIncluded ? "Meal included" : "No meal"}</span>
        </div>
        <div className="feat">
          <span className="feat-ico">{fare.refundable ? "↩" : "✕"}</span>
          <span>{fare.refundable ? "Refundable" : "Non-refundable"}</span>
        </div>
      </div>

      <div className="fare-bottom">
        <div className="fare-price-wrap">
          <div className="fare-price">{fmtPrice(fare.totalFare)}<small>/adult</small></div>
          <div className="fare-tax">incl. {fmtPrice(fare.taxes)} taxes</div>
        </div>
        <div className={`fare-select${selected ? " sel-state" : ""}`}>
          {selected ? "Selected ✓" : "Select →"}
        </div>
      </div>
    </div>
  );
}

function FareSelectContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { getIdToken } = useAuth();

  const flightKey = searchParams.get("flightKey") ?? "";
  const priceIdsRaw = searchParams.get("priceIds") ?? "";
  const priceIds = priceIdsRaw.split(",").filter(Boolean);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  const fromCity = searchParams.get("fromCity") ?? from;
  const toCity = searchParams.get("toCity") ?? to;
  const date = searchParams.get("date") ?? "";
  const adults = Number(searchParams.get("adults") ?? "1");
  const children = Number(searchParams.get("children") ?? "0");
  const infants = Number(searchParams.get("infants") ?? "0");

  const [flight, setFlight] = useState<ParsedFlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);

      // Primary path: use the flight stashed in sessionStorage by results page.
      // This avoids calling /api/flights/review with multiple priceIds, which
      // TripJack rejects (errCode 1091: priceIds count must equal trip count).
      if (flightKey && typeof window !== "undefined") {
        try {
          const raw = sessionStorage.getItem(`flight:${flightKey}`);
          if (raw) {
            const cached: ParsedFlight = JSON.parse(raw);
            if (!cancelled) {
              setFlight(cached);
              const cheapest = cached.fares.length
                ? cached.fares.reduce((a, b) => (a.totalFare <= b.totalFare ? a : b))
                : null;
              setSelectedId(cheapest?.id ?? null);
              setLoading(false);
              return;
            }
          }
        } catch {
          // fall through to fallback
        }
      }

      // Fallback (direct URL or stale tab): review with first priceId only.
      // Single fare option is shown — user can't switch fare class without
      // going back to results.
      if (!priceIds.length) {
        if (!cancelled) {
          setError("No fare selected. Please go back and pick a flight.");
          setLoading(false);
        }
        return;
      }
      try {
        const token = await getIdToken();
        const result: FlightReviewResult = await reviewFlight({ priceIds: [priceIds[0]], token });
        if (cancelled) return;
        const fares: FlightFare[] = result.fareOptions.map((f: ReviewFareOption) => ({
          id: f.id,
          fareIdentifier: f.fareIdentifier,
          totalFare: f.totalFare,
          baseFare: f.baseFare,
          taxes: f.taxes,
          cabinBaggage: f.cabinBaggage,
          checkinBaggage: f.checkinBaggage,
          mealIncluded: f.mealIncluded,
          refundable: f.refundable,
          cabinClass: f.cabinClass,
        }));
        const fallback: ParsedFlight = {
          key: result.flight.key || "fallback",
          segments: result.flight.segments,
          fares,
          cheapestFare: result.flight.cheapestFare,
        };
        setFlight(fallback);
        setSelectedId(fares[0]?.id ?? null);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load fare details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [flightKey, priceIdsRaw]);

  const cheapestPrice = flight?.fares.length
    ? Math.min(...flight.fares.map((f) => f.totalFare))
    : 0;

  const selectedFare = flight?.fares.find((f) => f.id === selectedId) ?? null;
  const seg = flight?.segments[0];
  const lastSeg = flight?.segments[flight.segments.length - 1];
  const totalDur = flight?.segments.reduce((s, x) => s + x.durationMins, 0) ?? 0;
  const stops = (flight?.segments.length ?? 1) - 1;

  async function handleContinue() {
    if (!selectedFare || !flight || continuing) return;
    setContinuing(true);
    setError(null);
    try {
      const token = await getIdToken();
      // Review with the single selected priceId so the bookingId is scoped to
      // exactly this fare. Payment amount must equal this review's total.
      const fresh = await reviewFlight({ priceIds: [selectedFare.id], token });
      const p = new URLSearchParams({
        bookingId: fresh.bookingId,
        priceId: selectedFare.id,
        totalFare: String(fresh.totalAdultFare || selectedFare.totalFare),
        from, to, fromCity, toCity, date,
        adults: String(adults),
        ...(children > 0 ? { children: String(children) } : {}),
        ...(infants > 0 ? { infants: String(infants) } : {}),
      });
      router.push(`/flights/passengers?${p}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not lock in fare. Try again.");
      setContinuing(false);
    }
  }

  return (
    <>
      <Header />
      <div className="fs-page">

        <div className="fs-bar">
          <div className="bar-dest">
            <Link
              href={`/flights/results?from=${from}&to=${to}&fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}&date=${date}&adults=${adults}${children > 0 ? `&children=${children}` : ""}${infants > 0 ? `&infants=${infants}` : ""}`}
              className="bar-back"
            >←</Link>
            {fromCity} ({from}) → {toCity} ({to})
          </div>
          <div className="bar-meta">
            {fmtDate(date)} · {paxSummary(adults, children, infants)} · Economy
          </div>
        </div>

        {loading && (
          <div className="fs-loading">Loading fare options…</div>
        )}

        {error && !loading && (
          <div className="fs-error">
            <div className="err-msg">{error}</div>
            <Link href="/flights" className="err-link">← Back to search</Link>
          </div>
        )}

        {!loading && !error && flight && (
          <>
            {/* Flight summary */}
            <div className="flight-sum">
              <div className="sum-airline">{seg?.airline.name} · {seg?.flightNumber}</div>
              <div className="sum-route">
                <div>
                  <div className="sum-time">{fmtTime(seg?.departureTime ?? "")}</div>
                  <div className="sum-code">{seg?.from.code}</div>
                </div>
                <div className="sum-mid">
                  <div className="sum-dur">{fmtDuration(totalDur)}</div>
                  <div className="sum-line"><div className="sum-dot" /><div className="sum-dash" /><div className="sum-dot" /></div>
                  <div className="sum-stops">{stops === 0 ? "Non-stop" : `${stops} stop${stops > 1 ? "s" : ""}`}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="sum-time">{fmtTime(lastSeg?.arrivalTime ?? "")}</div>
                  <div className="sum-code">{lastSeg?.to.code}</div>
                </div>
              </div>
            </div>

            <div className="section-title">Choose your fare</div>

            <div className="fare-list">
              {flight.fares.map((f) => (
                <FareCard
                  key={f.id}
                  fare={f}
                  selected={selectedId === f.id}
                  onSelect={() => setSelectedId(f.id)}
                  badge={f.totalFare === cheapestPrice ? "cheap" : null}
                />
              ))}
              {flight.fares.length === 0 && (
                <div className="fs-empty">No fare options available for this flight.</div>
              )}
            </div>

            <div style={{ height: 100 }} />
          </>
        )}
      </div>

      {/* Sticky CTA */}
      {!loading && !error && flight && (
        <div className="sticky-fs">
          <div className="sticky-l">
            {selectedFare ? (
              <>
                <div className="sticky-lbl">{selectedFare.fareIdentifier || "Selected"} · {seg?.airline.name}</div>
                <div className="sticky-total">{fmtPrice(selectedFare.totalFare)}</div>
              </>
            ) : (
              <div className="sticky-lbl">Select a fare above</div>
            )}
          </div>
          <button
            className={`sticky-btn${!selectedFare || continuing ? " dim" : ""}`}
            onClick={handleContinue}
            disabled={!selectedFare || continuing}
          >
            {continuing ? "Locking…" : "Continue →"}
          </button>
        </div>
      )}

      <style>{`
        .fs-page { min-height: 100vh; background: var(--cream); padding-top: 72px; padding-bottom: 24px; }

        .fs-bar { background: var(--navy); padding: 14px 16px; border-bottom: 1px solid rgba(201,168,76,0.1); }
        .bar-back { color: rgba(253,250,245,0.45); text-decoration: none; font-size: 18px; margin-right: 10px; transition: color 0.2s; }
        .bar-back:hover { color: var(--gold); }
        .bar-dest { font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 4px; font-family: var(--font-body); }
        .bar-meta { font-size: 11px; color: rgba(253,250,245,0.42); font-family: var(--font-body); }

        .fs-loading, .fs-empty { text-align: center; padding: 60px 16px; color: var(--ink-light); font-family: var(--font-body); font-size: 14px; }
        .fs-error { padding: 40px 16px; text-align: center; }
        .err-msg { color: #b54a3a; font-family: var(--font-body); font-size: 14px; margin-bottom: 12px; }
        .err-link { color: var(--gold); text-decoration: none; font-family: var(--font-body); font-size: 13px; font-weight: 600; }

        .flight-sum { background: var(--white); border: 1.5px solid #ece6dc; border-radius: 10px; padding: 16px; margin: 16px 12px 12px; }
        .sum-airline { font-size: 13px; font-weight: 600; color: var(--ink); font-family: var(--font-body); margin-bottom: 12px; }
        .sum-route { display: flex; justify-content: space-between; align-items: center; }
        .sum-time { font-family: var(--font-mono); font-size: 22px; font-weight: 700; color: var(--ink); line-height: 1.1; }
        .sum-code { font-size: 11px; color: var(--ink-light); font-family: var(--font-body); margin-top: 2px; text-align: center; }
        .sum-mid { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 12px; gap: 4px; }
        .sum-dur { font-size: 11px; color: var(--ink-light); font-family: var(--font-body); }
        .sum-line { display: flex; align-items: center; width: 100%; }
        .sum-dot { width: 7px; height: 7px; border-radius: 50%; background: #c8c2b8; border: 1.5px solid var(--white); box-shadow: 0 0 0 1px #c8c2b8; flex-shrink: 0; }
        .sum-dash { flex: 1; height: 1px; background: #d5cfc7; }
        .sum-stops { font-size: 10px; color: var(--emerald); font-weight: 600; font-family: var(--font-body); }

        .section-title { font-size: 13px; font-weight: 700; color: var(--ink); padding: 12px 16px 4px; font-family: var(--font-body); letter-spacing: 0.06em; text-transform: uppercase; }

        .fare-list { padding: 4px 0; }
        .fare-card { background: var(--white); border: 1.5px solid #ece6dc; border-radius: 10px; padding: 16px; margin: 0 12px 10px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
        .fare-card.cheap { border-color: rgba(201,168,76,0.5); }
        .fare-card.sel   { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.13); }
        .fare-card:hover { border-color: var(--gold); }

        .fare-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .fare-name { font-size: 13px; font-weight: 700; color: var(--ink); font-family: var(--font-body); letter-spacing: 0.04em; text-transform: uppercase; }
        .fare-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-body); }
        .fare-badge.cheap { background: var(--gold); color: var(--navy); }

        .fare-feats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 14px; }
        .feat { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #4a4538; font-family: var(--font-body); }
        .feat-ico { font-size: 13px; opacity: 0.7; flex-shrink: 0; }

        .fare-bottom { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #ece6dc; padding-top: 12px; }
        .fare-price-wrap { display: flex; flex-direction: column; gap: 2px; }
        .fare-price { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--ink); }
        .fare-price small { font-size: 11px; font-weight: 400; color: var(--ink-light); font-family: var(--font-body); }
        .fare-tax { font-size: 10px; color: var(--ink-light); font-family: var(--font-body); }
        .fare-select { font-size: 12px; font-weight: 700; color: var(--gold); font-family: var(--font-body); letter-spacing: 0.04em; padding: 4px 0; }
        .fare-select.sel-state { background: var(--gold); color: var(--navy); padding: 5px 12px; border-radius: 4px; }

        /* Sticky CTA */
        .sticky-fs { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(253,250,245,0.97); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid #ece6dc; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 13px 16px; padding-bottom: max(13px, env(safe-area-inset-bottom)); z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
        .sticky-l { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
        .sticky-lbl { font-size: 12px; color: var(--ink-light); font-family: var(--font-body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sticky-total { font-size: 19px; font-weight: 700; color: var(--ink); font-family: var(--font-mono); }
        .sticky-btn { background: var(--gold); color: var(--navy); padding: 12px 28px; border-radius: 6px; font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: none; cursor: pointer; transition: opacity 0.2s; white-space: nowrap; flex-shrink: 0; }
        .sticky-btn.dim { background: #e0d8c8; color: #aaa; cursor: not-allowed; }
        @media (max-width: 380px) {
          .sticky-btn { padding: 12px 18px; }
        }
      `}</style>
    </>
  );
}

export default function FareSelectPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-body)", color: "var(--ink-light)", fontSize: "14px" }}>Loading…</div>
      </div>
    }>
      <FareSelectContent />
    </Suspense>
  );
}
