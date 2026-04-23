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

// ── Demo flights (shown when API is unavailable) ──────────────────────────────

const DEMO: ParsedFlight[] = [
  {
    key: "6E-demo1",
    segments: [{
      id: "s1", airline: { code: "6E", name: "IndiGo" }, flightNumber: "6E-204",
      from: { code: "BOM", city: "Mumbai" }, to: { code: "DXB", city: "Dubai" },
      departureTime: "2026-05-25T06:00:00", arrivalTime: "2026-05-25T08:45:00",
      durationMins: 165, stops: 0,
    }],
    fares: [{ id: "f1", fareIdentifier: "LITE", totalFare: 8400, baseFare: 7500, taxes: 900 }],
    cheapestFare: { id: "f1", fareIdentifier: "LITE", totalFare: 8400, baseFare: 7500, taxes: 900 },
  },
  {
    key: "AI-demo2",
    segments: [{
      id: "s2", airline: { code: "AI", name: "Air India" }, flightNumber: "AI-992",
      from: { code: "BOM", city: "Mumbai" }, to: { code: "DXB", city: "Dubai" },
      departureTime: "2026-05-25T09:15:00", arrivalTime: "2026-05-25T12:10:00",
      durationMins: 175, stops: 0,
    }],
    fares: [{ id: "f2", fareIdentifier: "VALUE", totalFare: 9200, baseFare: 8200, taxes: 1000 }],
    cheapestFare: { id: "f2", fareIdentifier: "VALUE", totalFare: 9200, baseFare: 8200, taxes: 1000 },
  },
  {
    key: "EK-demo3",
    segments: [{
      id: "s3", airline: { code: "EK", name: "Emirates" }, flightNumber: "EK-500",
      from: { code: "BOM", city: "Mumbai" }, to: { code: "DXB", city: "Dubai" },
      departureTime: "2026-05-25T11:30:00", arrivalTime: "2026-05-25T14:00:00",
      durationMins: 150, stops: 0,
    }],
    fares: [{ id: "f3", fareIdentifier: "FLEX", totalFare: 14100, baseFare: 12000, taxes: 2100 }],
    cheapestFare: { id: "f3", fareIdentifier: "FLEX", totalFare: 14100, baseFare: 12000, taxes: 2100 },
  },
  {
    key: "SG-demo4",
    segments: [{
      id: "s4", airline: { code: "SG", name: "SpiceJet" }, flightNumber: "SG-74",
      from: { code: "BOM", city: "Mumbai" }, to: { code: "DXB", city: "Dubai" },
      departureTime: "2026-05-25T14:20:00", arrivalTime: "2026-05-25T17:05:00",
      durationMins: 165, stops: 0,
    }],
    fares: [{ id: "f4", fareIdentifier: "SAVER", totalFare: 8850, baseFare: 7800, taxes: 1050 }],
    cheapestFare: { id: "f4", fareIdentifier: "SAVER", totalFare: 8850, baseFare: 7800, taxes: 1050 },
  },
];

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

// ── Flight card ───────────────────────────────────────────────────────────────

interface CardProps {
  flight: ParsedFlight;
  badge: "cheap" | "best" | null;
  selected: boolean;
  onSelect: () => void;
}

function FlightCard({ flight, badge, selected, onSelect }: CardProps) {
  const seg   = flight.segments[0];
  const last  = flight.segments[flight.segments.length - 1];
  const price = flight.cheapestFare?.totalFare ?? 0;
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
          <div className="fc-price">{fmtPrice(price)}<small>/person</small></div>
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

type SortKey = "cheapest" | "stops" | "depart" | "price_desc";

function sorted(flights: ParsedFlight[], key: SortKey) {
  const arr = [...flights];
  switch (key) {
    case "cheapest":   return arr.sort((a, b) => (a.cheapestFare?.totalFare ?? 0) - (b.cheapestFare?.totalFare ?? 0));
    case "stops":      return arr.sort((a, b) => stopCount(a) - stopCount(b));
    case "depart":     return arr.sort((a, b) => (a.segments[0]?.departureTime ?? "").localeCompare(b.segments[0]?.departureTime ?? ""));
    case "price_desc": return arr.sort((a, b) => (b.cheapestFare?.totalFare ?? 0) - (a.cheapestFare?.totalFare ?? 0));
    default:           return arr;
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
  const cabin    = searchParams.get("cabin") ?? "ECONOMY";
  const tripType = searchParams.get("tripType") ?? "O";

  const [flights,     setFlights]     = useState<ParsedFlight[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [sortKey,     setSortKey]     = useState<SortKey>("cheapest");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => { load(); }, [from, to, date]);

  async function load() {
    setLoading(true);
    try {
      const token  = await getIdToken();
      const result = await searchFlights({ from, to, date, adults, cabinClass: cabin, tripType, token });
      setFlights(result.flights.length ? result.flights : DEMO);
    } catch {
      setFlights(DEMO);
    } finally {
      setLoading(false);
    }
  }

  const display = sorted(flights, sortKey);
  const cheapestPrice = display[0]?.cheapestFare?.totalFare ?? 0;
  const selectedFlight = flights.find(f => f.key === selectedKey) ?? null;

  function badge(f: ParsedFlight, i: number): "cheap" | "best" | null {
    if (i === 0 && f.cheapestFare?.totalFare === cheapestPrice) return "cheap";
    if (i === 1) return "best";
    return null;
  }

  function handleContinue() {
    if (!selectedFlight) return;
    const p = new URLSearchParams({
      priceIds: selectedFlight.fares.map(f => f.id).join(","),
      from, to, fromCity, toCity, date, adults: String(adults), cabin,
    });
    router.push(`/flights/fare-select?${p}`);
  }

  return (
    <>
      <Header />
      <div className="results-page">

        {/* Route bar */}
        <div className="results-bar">
          <div className="rb-dest">
            <Link href="/flights" className="rb-back">←</Link>
            {fromCity} ({from}) → {toCity} ({to})
          </div>
          <div className="rb-meta">
            {fmtDate(date)} · {adults === 1 ? "1 Adult" : `${adults} Adults`} · Economy
            <Link href="/flights" className="rb-edit"> ✎ Edit</Link>
          </div>
        </div>

        {/* Filter row */}
        <div className="filter-row">
          {([
            { key: "cheapest",   label: "Cheapest ↓" },
            { key: "stops",      label: "Stops ↕" },
            { key: "depart",     label: "Depart ↕" },
            { key: "price_desc", label: "Price ↕" },
          ] as { key: SortKey; label: string }[]).map(opt => (
            <div
              key={opt.key}
              className={`fp${sortKey === opt.key ? " a" : ""}`}
              onClick={() => setSortKey(opt.key)}
            >
              {opt.label}
            </div>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <div className="res-count">
            {display.length} flight{display.length !== 1 ? "s" : ""} found · {fromCity} → {toCity}
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
              <div className="sticky-total">{fmtPrice(selectedFlight.cheapestFare?.totalFare ?? 0)}</div>
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
        .results-page { min-height: 100vh; background: #f5f0e8; padding-top: 72px; }

        /* ── Route bar ── */
        .results-bar { background: #0B1B2B; padding: 14px 16px; border-bottom: 1px solid rgba(201,168,76,0.1); }
        .rb-back { color: rgba(253,250,245,0.45); text-decoration: none; font-size: 18px; margin-right: 10px; transition: color 0.2s; }
        .rb-back:hover { color: #C9A84C; }
        .rb-dest { font-size: 15px; font-weight: 600; color: #fdfaf5; margin-bottom: 4px; font-family: var(--font-body); }
        .rb-meta { font-size: 11px; color: rgba(253,250,245,0.42); font-family: var(--font-body); }
        .rb-edit { color: #C9A84C; text-decoration: none; margin-left: 6px; font-weight: 500; }

        /* ── Filter ── */
        .filter-row { display: flex; background: #fff; padding: 0 8px; border-bottom: 1px solid #ece6dc; overflow-x: auto; scrollbar-width: none; position: sticky; top: 72px; z-index: 40; }
        .filter-row::-webkit-scrollbar { display: none; }
        .fp { padding: 13px 14px; font-size: 12px; font-weight: 400; color: #7a7465; cursor: pointer; white-space: nowrap; border-bottom: 2.5px solid transparent; transition: all 0.2s; font-family: var(--font-body); letter-spacing: 0.02em; }
        .fp.a { color: #1a1710; font-weight: 700; border-bottom-color: #C9A84C; }

        /* ── Count ── */
        .res-count { font-size: 11px; color: #7a7465; padding: 10px 16px 4px; font-family: var(--font-body); letter-spacing: 0.04em; }

        /* ── Cards ── */
        .cards-wrap { padding: 8px 0; }
        .flight-card { background: #fdfaf5; border: 1.5px solid #ece6dc; border-radius: 10px; padding: 14px 16px; margin: 0 12px 10px; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s; }
        .flight-card.cheap { border-color: rgba(201,168,76,0.5); }
        .flight-card.best  { border-color: rgba(16,185,129,0.38); }
        .flight-card.sel   { border-color: #C9A84C; box-shadow: 0 0 0 3px rgba(201,168,76,0.13); }
        .flight-card:hover { border-color: #C9A84C; }

        /* ── Card inner ── */
        .fc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .fc-airline { font-size: 13px; font-weight: 600; color: #1a1710; font-family: var(--font-body); }
        .fc-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.06em; font-family: var(--font-body); }
        .fc-badge.cheap { background: #C9A84C; color: #0B1B2B; }
        .fc-badge.best  { background: #10B981; color: #fff; }

        .fc-route { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .fc-time { font-family: var(--font-mono); font-size: 22px; font-weight: 700; color: #1a1710; line-height: 1.1; }
        .fc-code { font-size: 11px; color: #7a7465; font-family: var(--font-body); margin-top: 2px; text-align: center; }

        .fc-mid { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 12px; gap: 4px; }
        .fc-dur { font-size: 11px; color: #7a7465; font-family: var(--font-body); }
        .fc-line { display: flex; align-items: center; width: 100%; }
        .fc-dot { width: 7px; height: 7px; border-radius: 50%; background: #c8c2b8; border: 1.5px solid #fdfaf5; box-shadow: 0 0 0 1px #c8c2b8; flex-shrink: 0; }
        .fc-dash { flex: 1; height: 1px; background: #d5cfc7; }
        .fc-stops { font-size: 10px; color: #7a7465; font-family: var(--font-body); }
        .non-stop { color: #10B981; font-weight: 600; }

        .fc-bottom { display: flex; justify-content: space-between; align-items: flex-end; }
        .fc-class { font-size: 11px; color: #7a7465; font-family: var(--font-body); }
        .fc-price-wrap { display: flex; align-items: center; gap: 12px; }
        .fc-price { font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: #1a1710; }
        .fc-price small { font-size: 11px; font-weight: 400; color: #7a7465; font-family: var(--font-body); }
        .fc-select { font-size: 12px; font-weight: 700; color: #C9A84C; font-family: var(--font-body); letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s; padding: 4px 0; }
        .fc-select.sel-state { background: #C9A84C; color: #0B1B2B; padding: 5px 12px; border-radius: 4px; }

        /* ── Sticky CTA ── */
        .sticky { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(253,250,245,0.97); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid #ece6dc; display: flex; justify-content: space-between; align-items: center; padding: 13px 16px; padding-bottom: max(13px, env(safe-area-inset-bottom)); z-index: 50; box-shadow: 0 -4px 20px rgba(0,0,0,0.07); }
        .sticky-l { display: flex; flex-direction: column; gap: 3px; }
        .sticky-lbl { font-size: 12px; color: #7a7465; font-family: var(--font-body); }
        .sticky-total { font-size: 19px; font-weight: 700; color: #1a1710; font-family: var(--font-mono); }
        .sticky-btn { background: #C9A84C; color: #0B1B2B; padding: 12px 28px; border-radius: 6px; font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; border: none; cursor: pointer; transition: opacity 0.2s; white-space: nowrap; }
        .sticky-btn.dim { background: #e0d8c8; color: #aaa; cursor: not-allowed; }

        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </>
  );
}

export default function FlightResultsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "var(--font-body)", color: "#7a7465", fontSize: "14px" }}>Loading…</div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
