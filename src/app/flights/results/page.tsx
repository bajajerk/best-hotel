"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { searchFlights, type ParsedFlight } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  return "₹" + n.toLocaleString("en-IN");
}

function totalDuration(f: ParsedFlight) {
  return f.segments.reduce((s, seg) => s + seg.durationMins, 0);
}

function stopCount(f: ParsedFlight) {
  return f.segments.length - 1;
}

function paxSummary(adults: number, children: number, infants: number) {
  const parts: string[] = [];
  parts.push(adults === 1 ? "1 Adult" : `${adults} Adults`);
  if (children > 0) parts.push(children === 1 ? "1 Child" : `${children} Children`);
  if (infants > 0) parts.push(infants === 1 ? "1 Infant" : `${infants} Infants`);
  return parts.join(", ");
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flight-card" style={{ opacity: 0.5, animation: "pulse 1.3s ease-in-out infinite" }}>
      <div className="fc-top">
        <div style={{ width: 80, height: 13, background: "#e8e2d8", borderRadius: 4 }} />
        <div style={{ width: 60, height: 18, background: "#e8e2d8", borderRadius: 4 }} />
      </div>
      <div className="fc-route">
        <div style={{ width: 52, height: 26, background: "#e8e2d8", borderRadius: 4 }} />
        <div className="fc-mid">
          <div style={{ width: "60%", height: 10, background: "#e8e2d8", borderRadius: 4 }} />
          <div className="fc-line"><div className="fc-dot" /><div className="fc-dash" /><div className="fc-dot" /></div>
        </div>
        <div style={{ width: 52, height: 26, background: "#e8e2d8", borderRadius: 4 }} />
      </div>
    </div>
  );
}

function totalForPax(flight: ParsedFlight, adults: number, children: number, infants: number) {
  const f = flight.cheapestFare;
  if (!f) return 0;
  const adult = f.totalFare * adults;
  // Backend often returns 0 for child/infant when search had none — fall back
  // to ~75%/10% of adult fare so the line item still reads sensibly. These
  // are display estimates; the booking flow re-prices via /flights/review.
  const child = (f.childFare && f.childFare > 0 ? f.childFare : f.totalFare * 0.75) * children;
  const infant = (f.infantFare && f.infantFare > 0 ? f.infantFare : f.totalFare * 0.1) * infants;
  return Math.round(adult + child + infant);
}

// ── Flight card ───────────────────────────────────────────────────────────────

interface CardProps {
  flight: ParsedFlight;
  badge: "cheap" | "best" | null;
  selected: boolean;
  onSelect: () => void;
  adults: number;
  children: number;
  infants: number;
}

function FlightCard({ flight, badge, selected, onSelect, adults, children, infants }: CardProps) {
  const seg   = flight.segments[0];
  const last  = flight.segments[flight.segments.length - 1];
  const price = flight.cheapestFare?.totalFare ?? 0;
  const total = totalForPax(flight, adults, children, infants);
  const totalPax = adults + children + infants;
  const stops = stopCount(flight);
  const dur   = fmtDuration(totalDuration(flight));

  return (
    <div
      className={`flight-card${badge ? ` ${badge}` : ""}${selected ? " sel" : ""}`}
      onClick={onSelect}
    >
      <div className="fc-top">
        <div className="fc-airline">{seg.airline.name}</div>
        {badge && <div className={`fc-badge ${badge}`}>{badge === "cheap" ? "Cheapest" : "Best Value"}</div>}
      </div>

      <div className="fc-route">
        <div>
          <div className="fc-time">{fmtTime(seg.departureTime)}</div>
          <div className="fc-code">{seg.from.code}</div>
        </div>
        <div className="fc-mid">
          <div className="fc-dur">{dur}</div>
          <div className="fc-line">
            <div className="fc-dot" />
            <div className="fc-dash" />
            {stops > 0 && <div className="fc-dot" style={{ margin: "0 -2px" }} />}
            {stops > 0 && <div className="fc-dash" />}
            <div className="fc-dot" />
          </div>
          <div className="fc-stops">
            {stops === 0
              ? <span className="non-stop">Non-stop</span>
              : `${stops} stop${stops > 1 ? "s" : ""}`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="fc-time">{fmtTime(last.arrivalTime)}</div>
          <div className="fc-code">{last.to.code}</div>
        </div>
      </div>

      <div className="fc-bottom">
        <div className="fc-class">Economy · {seg.airline.name}</div>
        <div className="fc-price-wrap">
          <div className="fc-price-col">
            <div className="fc-price">{fmtPrice(price)}<small>/adult</small></div>
            {totalPax > 1 && (
              <div className="fc-total">
                Total {fmtPrice(total)} <span className="fc-total-pax">· {totalPax} travellers</span>
              </div>
            )}
          </div>
          <div className={`fc-select${selected ? " sel-state" : ""}`}
            onClick={e => { e.stopPropagation(); onSelect(); }}>
            {selected ? "Selected ✓" : "Select →"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = "price" | "stops" | "depart" | "duration";
type SortDir = "asc" | "desc";

function sorted(flights: ParsedFlight[], key: SortKey, dir: SortDir) {
  const arr = [...flights];
  const sign = dir === "asc" ? 1 : -1;
  switch (key) {
    case "price":    return arr.sort((a, b) => sign * ((a.cheapestFare?.totalFare ?? 0) - (b.cheapestFare?.totalFare ?? 0)));
    case "stops":    return arr.sort((a, b) => sign * (stopCount(a) - stopCount(b)));
    case "depart":   return arr.sort((a, b) => sign * (a.segments[0]?.departureTime ?? "").localeCompare(b.segments[0]?.departureTime ?? ""));
    case "duration": return arr.sort((a, b) => sign * (totalDuration(a) - totalDuration(b)));
    default:         return arr;
  }
}

// ── Main content ──────────────────────────────────────────────────────────────

function ResultsContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const { getIdToken } = useAuth();

  const from     = searchParams.get("from") ?? "";
  const to       = searchParams.get("to") ?? "";
  const fromCity = searchParams.get("fromCity") ?? from;
  const toCity   = searchParams.get("toCity") ?? to;
  const date     = searchParams.get("date") ?? "";
  const adults   = Number(searchParams.get("adults") ?? "1");
  const children = Number(searchParams.get("children") ?? "0");
  const infants  = Number(searchParams.get("infants") ?? "0");
  const cabin    = searchParams.get("cabin") ?? "ECONOMY";
  const tripType = searchParams.get("tripType") ?? "O";

  const [flights,     setFlights]     = useState<ParsedFlight[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [sortKey,     setSortKey]     = useState<SortKey>("price");
  const [sortDir,     setSortDir]     = useState<SortDir>("asc");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => { load(); }, [from, to, date, adults, children, infants]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token  = await getIdToken();
      const result = await searchFlights({ from, to, date, adults, children, infants, cabinClass: cabin, tripType, token });
      setFlights(result.flights);
    } catch (e: unknown) {
      setFlights([]);
      setError(e instanceof Error ? e.message : "Failed to load flights. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function pickSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const display = sorted(flights, sortKey, sortDir);
  const cheapestPrice = display[0]?.cheapestFare?.totalFare ?? 0;
  const selectedFlight = flights.find(f => f.key === selectedKey) ?? null;

  function badge(f: ParsedFlight, i: number): "cheap" | "best" | null {
    if (i === 0 && f.cheapestFare?.totalFare === cheapestPrice) return "cheap";
    if (i === 1) return "best";
    return null;
  }

  function handleContinue() {
    if (!selectedFlight) return;
    // Stash full flight (with rich fare details) so fare-select can render
    // without calling /api/flights/review with multiple priceIds (TripJack
    // rejects with errCode 1091 when N priceIds != N trip legs).
    try {
      sessionStorage.setItem(`flight:${selectedFlight.key}`, JSON.stringify(selectedFlight));
    } catch {
      // sessionStorage unavailable — fare-select will fall back to single-priceId review
    }
    const p = new URLSearchParams({
      flightKey: selectedFlight.key,
      priceIds: selectedFlight.fares.map(f => f.id).join(","),
      from, to, fromCity, toCity, date, adults: String(adults), cabin,
      ...(children > 0 ? { children: String(children) } : {}),
      ...(infants > 0 ? { infants: String(infants) } : {}),
    });
    router.push(`/flights/fare-select?${p}`);
  }

  return (
    <div className="luxe">
      <Header />
      <div className="results-page">

        {/* Route bar */}
        <div className="results-bar">
          <div className="rb-dest">
            <Link href="/flights" className="rb-back">←</Link>
            {fromCity} ({from}) → {toCity} ({to})
          </div>
          <div className="rb-meta">
            {fmtDate(date)} · {paxSummary(adults, children, infants)} · Economy
            <Link href="/flights" className="rb-edit"> ✎ Edit</Link>
          </div>
        </div>

        {/* Filter row */}
        <div className="filter-row">
          {([
            { key: "price",    label: "Price" },
            { key: "stops",    label: "Stops" },
            { key: "depart",   label: "Depart" },
            { key: "duration", label: "Duration" },
          ] as { key: SortKey; label: string }[]).map(opt => {
            const active = sortKey === opt.key;
            return (
              <div
                key={opt.key}
                className={`fp${active ? " a" : ""}`}
                onClick={() => pickSort(opt.key)}
                title={active ? "Click to reverse direction" : undefined}
              >
                {opt.label}
                <span className="fp-arrow">{active ? (sortDir === "asc" ? "↓" : "↑") : "↕"}</span>
              </div>
            );
          })}
        </div>

        {/* Count */}
        {!loading && !error && display.length > 0 && (
          <div className="res-count">
            {display.length} flight{display.length !== 1 ? "s" : ""} found · {fromCity} → {toCity}
          </div>
        )}

        {/* Empty / error states */}
        {!loading && error && (
          <div className="res-empty">
            <div className="empty-title">Couldn&apos;t load flights</div>
            <div className="empty-sub">{error}</div>
            <Link href="/flights" className="empty-link">← Edit search</Link>
          </div>
        )}
        {!loading && !error && display.length === 0 && (
          <div className="res-empty">
            <div className="empty-title">No flights found</div>
            <div className="empty-sub">No availability for {fromCity} → {toCity} on {fmtDate(date)}. Try a different date or route.</div>
            <Link href="/flights" className="empty-link">← Edit search</Link>
          </div>
        )}

        {/* Cards */}
        <div className="cards-wrap">
          {loading
            ? [1, 2, 3].map(i => <Skeleton key={i} />)
            : display.map((f, i) => (
              <FlightCard
                key={f.key + i}
                flight={f}
                badge={badge(f, i)}
                selected={selectedKey === f.key}
                onSelect={() => setSelectedKey(selectedKey === f.key ? null : f.key)}
                adults={adults}
                children={children}
                infants={infants}
              />
            ))
          }
        </div>

        <div style={{ height: 80 }} />
      </div>

      {/* Sticky CTA */}
      <div className="sticky">
        <div className="sticky-l">
          {selectedFlight ? (
            <>
              <div className="sticky-lbl">{selectedFlight.segments[0].airline.name} · {fmtTime(selectedFlight.segments[0].departureTime)} → {fmtTime(selectedFlight.segments[selectedFlight.segments.length - 1].arrivalTime)}</div>
              <div className="sticky-total">
                {fmtPrice(totalForPax(selectedFlight, adults, children, infants))}
                <span className="sticky-total-meta"> total · {adults + children + infants} pax</span>
              </div>
            </>
          ) : (
            <div className="sticky-lbl">Select a flight above</div>
          )}
        </div>
        <button
          className={`sticky-btn${!selectedFlight ? " dim" : ""}`}
          onClick={handleContinue}
          disabled={!selectedFlight}
        >
          Continue →
        </button>
      </div>

      <style>{`
        .results-page { min-height: 100vh; background: var(--cream); padding-top: 72px; }

        /* ── Route bar ── */
        .results-bar { background: var(--navy); padding: 14px 16px; border-bottom: 1px solid rgba(201,168,76,0.1); }
        .rb-back { color: rgba(253,250,245,0.45); text-decoration: none; font-size: 18px; margin-right: 10px; transition: color 0.2s; }
        .rb-back:hover { color: var(--gold); }
        .rb-dest { font-size: 15px; font-weight: 600; color: var(--white); margin-bottom: 4px; font-family: var(--font-body); }
        .rb-meta { font-size: 11px; color: rgba(253,250,245,0.42); font-family: var(--font-body); }
        .rb-edit { color: var(--gold); text-decoration: none; margin-left: 6px; font-weight: 500; }

        /* ── Filter ── */
        .filter-row { display: flex; background: #fff; padding: 0 8px; border-bottom: 1px solid #ece6dc; overflow-x: auto; scrollbar-width: none; position: sticky; top: 72px; z-index: 40; }
        .filter-row::-webkit-scrollbar { display: none; }
        .fp { padding: 13px 14px; font-size: 12px; font-weight: 400; color: var(--ink-light); cursor: pointer; white-space: nowrap; border-bottom: 2.5px solid transparent; transition: all 0.2s; font-family: var(--font-body); letter-spacing: 0.02em; user-select: none; display: inline-flex; align-items: center; gap: 5px; }
        .fp.a { color: var(--ink); font-weight: 700; border-bottom-color: var(--gold); }
        .fp-arrow { font-size: 10px; color: var(--ink-light); }
        .fp.a .fp-arrow { color: var(--gold); font-weight: 700; }

        /* ── Count ── */
        .res-count { font-size: 11px; color: var(--ink-light); padding: 10px 16px 4px; font-family: var(--font-body); letter-spacing: 0.04em; }

        /* ── Empty / error ── */
        .res-empty { text-align: center; padding: 48px 24px; }
        .empty-title { font-size: 16px; font-weight: 700; color: var(--ink); font-family: var(--font-body); margin-bottom: 6px; }
        .empty-sub { font-size: 13px; color: var(--ink-light); font-family: var(--font-body); margin-bottom: 16px; line-height: 1.5; }
        .empty-link { color: var(--gold); text-decoration: none; font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }

        /* ── Cards ── */
        .cards-wrap { padding: 8px 0; }
        .flight-card { background: var(--white); border: 1.5px solid #ece6dc; border-radius: 10px; padding: 14px 16px; margin: 0 12px 10px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
        .flight-card.cheap { border-color: rgba(201,168,76,0.5); }
        .flight-card.best  { border-color: rgba(16,185,129,0.38); }
        .flight-card.sel   { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.13); }
        .flight-card:hover { border-color: var(--gold); }

        /* ── Card inner ── */
        .fc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .fc-airline { font-size: 13px; font-weight: 600; color: var(--ink); font-family: var(--font-body); }
        .fc-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-body); }
        .fc-badge.cheap { background: var(--gold); color: var(--navy); }
        .fc-badge.best  { background: var(--emerald); color: #fff; }

        .fc-route { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .fc-time { font-family: var(--font-mono); font-size: 22px; font-weight: 700; color: var(--ink); line-height: 1.1; }
        .fc-code { font-size: 11px; color: var(--ink-light); font-family: var(--font-body); margin-top: 2px; text-align: center; }

        .fc-mid { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 12px; gap: 4px; }
        .fc-dur { font-size: 11px; color: var(--ink-light); font-family: var(--font-body); }
        .fc-line { display: flex; align-items: center; width: 100%; }
        .fc-dot { width: 7px; height: 7px; border-radius: 50%; background: #c8c2b8; border: 1.5px solid var(--white); box-shadow: 0 0 0 1px #c8c2b8; flex-shrink: 0; }
        .fc-dash { flex: 1; height: 1px; background: #d5cfc7; }
        .fc-stops { font-size: 10px; color: var(--ink-light); font-family: var(--font-body); }
        .non-stop { color: var(--emerald); font-weight: 600; }

        .fc-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
        .fc-class { font-size: 11px; color: var(--ink-light); font-family: var(--font-body); }
        .fc-price-wrap { display: flex; align-items: flex-end; gap: 12px; }
        .fc-price-col { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
        .fc-price { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--ink); }
        .fc-price small { font-size: 11px; font-weight: 400; color: var(--ink-light); font-family: var(--font-body); }
        .fc-total { font-size: 11px; color: #4a4538; font-family: var(--font-body); font-weight: 600; }
        .fc-total-pax { color: var(--ink-light); font-weight: 400; }
        .fc-select { font-size: 12px; font-weight: 700; color: var(--gold); font-family: var(--font-body); letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s; padding: 4px 0; }
        .fc-select.sel-state { background: var(--gold); color: var(--navy); padding: 5px 12px; border-radius: 4px; }

        /* ── Sticky CTA ── */
        .sticky { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(253,250,245,0.97); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid #ece6dc; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 13px 16px; padding-bottom: max(13px, env(safe-area-inset-bottom)); z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
        .sticky-l { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
        .sticky-lbl { font-size: 12px; color: var(--ink-light); font-family: var(--font-body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sticky-total { font-size: 19px; font-weight: 700; color: var(--ink); font-family: var(--font-mono); }
        .sticky-total-meta { font-size: 10px; font-weight: 400; color: var(--ink-light); font-family: var(--font-body); margin-left: 4px; letter-spacing: 0.04em; }
        .sticky-btn { background: var(--gold); color: var(--navy); padding: 12px 28px; border-radius: 6px; font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: none; cursor: pointer; transition: opacity 0.2s; white-space: nowrap; flex-shrink: 0; }
        .sticky-btn.dim { background: #e0d8c8; color: #aaa; cursor: not-allowed; }
        @media (max-width: 380px) {
          .sticky-btn { padding: 12px 18px; }
        }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </div>
  );
}

export default function FlightResultsPage() {
  return (
    <Suspense fallback={
      <div className="luxe" style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-body)", color: "var(--ink-light)", fontSize: "14px" }}>Loading…</div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
