"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import LuxeDatePicker from "@/components/LuxeDatePicker";
import { AIRPORTS } from "@/lib/airports";

const POPULAR_INDIA = [
  { code: "DEL", city: "Delhi" },
  { code: "BLR", city: "Bengaluru" },
  { code: "GOI", city: "Goa" },
  { code: "MAA", city: "Chennai" },
];

const POPULAR_INTL = [
  { code: "DXB", city: "Dubai" },
  { code: "SIN", city: "Singapore" },
  { code: "MLE", city: "Maldives" },
  { code: "LHR", city: "London" },
];

// ── Pax stepper ───────────────────────────────────────────────────────────────

function PaxStepper({
  label, hint, value, min, max, onChange, disabledHint,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  disabledHint?: string;
}) {
  const dec = () => value > min && onChange(value - 1);
  const inc = () => value < max && onChange(value + 1);
  return (
    <div className="pax-stepper-row">
      <div>
        <div className="pax-stepper-label">{label}</div>
        <div className="pax-stepper-hint">{disabledHint ?? hint}</div>
      </div>
      <div className="pax-stepper-ctrl" onClick={(e) => e.stopPropagation()}>
        <button
          className="pax-btn"
          onClick={dec}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >−</button>
        <span className="pax-num">{value}</span>
        <button
          className="pax-btn"
          onClick={inc}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >+</button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FlightsPage() {
  const router = useRouter();

  const [tripType, setTripType]   = useState<"O" | "R">("O");
  const [from, setFrom]           = useState({ code: "BOM", city: "Mumbai" });
  const [to, setTo]               = useState({ code: "", city: "" });
  const [date, setDate]           = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults]       = useState(1);
  const [children, setChildren]   = useState(0);
  const [infants, setInfants]     = useState(0);
  const [paxOpen, setPaxOpen]     = useState(false);
  const [cabin, setCabin]         = useState("ECONOMY");
  const [dateOpen, setDateOpen]   = useState(false);
  const [activeField, setActiveField] = useState<"from" | "to" | null>(null);
  const [query, setQuery]         = useState("");

  const today    = new Date().toISOString().split("T")[0];
  const canSearch = !!(from.code && to.code && date && (tripType === "O" || returnDate));

  const filtered = query.trim()
    ? AIRPORTS.filter(a =>
        a.code.toLowerCase().includes(query.toLowerCase()) ||
        a.city.toLowerCase().includes(query.toLowerCase()) ||
        a.country.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : AIRPORTS.slice(0, 8);

  function openField(f: "from" | "to") {
    setActiveField(f);
    setQuery("");
  }

  function selectAirport(a: typeof AIRPORTS[0]) {
    if (activeField === "from") setFrom({ code: a.code, city: a.city });
    else setTo({ code: a.code, city: a.city });
    setActiveField(null);
    setQuery("");
  }

  function swapAirports() {
    const tmp = { ...from };
    setFrom(to);
    setTo(tmp);
  }

  function handleSearch() {
    if (!canSearch) return;
    const p = new URLSearchParams({
      from: from.code, to: to.code,
      fromCity: from.city, toCity: to.city,
      date, adults: String(adults), cabin, tripType,
      ...(children > 0 ? { children: String(children) } : {}),
      ...(infants > 0 ? { infants: String(infants) } : {}),
      ...(tripType === "R" && returnDate ? { returnDate } : {}),
    });
    router.push(`/flights/results?${p}`);
  }

  // Infants ≤ adults (lap-held). Children + adults ≤ 9 total seats.
  const maxInfants = adults;
  const totalSeated = adults + children;
  const paxLabel = (() => {
    const parts: string[] = [];
    parts.push(adults === 1 ? "1 Adult" : `${adults} Adults`);
    if (children > 0) parts.push(children === 1 ? "1 Child" : `${children} Children`);
    if (infants > 0) parts.push(infants === 1 ? "1 Infant" : `${infants} Infants`);
    return parts.join(", ");
  })();

  function fmtDate(d: string) {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }

  const cabinLabel: Record<string, string> = {
    ECONOMY: "Economy", PREMIUM_ECONOMY: "Premium Economy",
    BUSINESS: "Business", FIRST: "First Class",
  };

  return (
    <>
      <Header />
      <div className="flights-page">

        {/* HOTELS / FLIGHTS tabs */}
        <div className="tabs-wrap">
          <div className="tabs">
            <Link href="/search" className="tab">Hotels</Link>
            <span className="tab act">Flights</span>
          </div>
        </div>

        {/* Trip type */}
        <div className="trip-type-row">
          {(["O", "R"] as const).map(t => (
            <button
              key={t}
              className={`trip-btn${tripType === t ? " act" : ""}`}
              onClick={() => setTripType(t)}
            >
              {t === "O" ? "One Way" : "Return"}
            </button>
          ))}
        </div>

        {/* Form card */}
        <div className="form-area">

          {/* From / Swap / To */}
          <div className="field-row">
            <div
              className={`field${activeField === "from" ? " focus" : ""}`}
              onClick={() => openField("from")}
            >
              <div className="fl">From</div>
              <div className={`fv${!from.code ? " ph" : ""}`}>
                {from.code ? `${from.city} (${from.code})` : "City or airport"}
              </div>
            </div>
            <button className="swap-btn" onClick={swapAirports} title="Swap">⇅</button>
            <div
              className={`field${activeField === "to" ? " focus" : ""}`}
              onClick={() => openField("to")}
            >
              <div className="fl">To</div>
              <div className={`fv${!to.code ? " ph" : ""}`}>
                {to.code ? `${to.city} (${to.code})` : "City or airport"}
              </div>
            </div>
          </div>

          {/* Airport search dropdown */}
          {activeField && (
            <div className="airport-drop">
              <input
                autoFocus
                className="airport-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={activeField === "from" ? "Departure city or airport" : "Destination city or airport"}
                onBlur={() => setTimeout(() => { setActiveField(null); setQuery(""); }, 160)}
              />
              {filtered.map(a => (
                <div key={a.code} className="airport-row" onMouseDown={() => selectAirport(a)}>
                  <span className="airport-code">{a.code}</span>
                  <div>
                    <div className="airport-city">{a.city}</div>
                    <div className="airport-name">{a.name} · {a.country}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dates */}
          <div className={`dates-row${tripType === "R" ? " two-col" : ""}`} style={{ position: "relative" }}>
            <div
              className="field border-top"
              role="button"
              tabIndex={0}
              onClick={() => setDateOpen(true)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setDateOpen(true); }}
              style={{ cursor: "pointer" }}
            >
              <div className="fl">Departure</div>
              <div className={`fv${!date ? " fv-ph" : ""}`} style={{ color: date ? undefined : "rgba(247,245,242,0.5)" }}>
                {date ? fmtDate(date) : "Add date"}
              </div>
            </div>
            {tripType === "R" && (
              <div
                className="field border-top border-left"
                role="button"
                tabIndex={0}
                onClick={() => setDateOpen(true)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setDateOpen(true); }}
                style={{ cursor: "pointer" }}
              >
                <div className="fl">Return</div>
                <div className={`fv${!returnDate ? " fv-ph" : ""}`} style={{ color: returnDate ? undefined : "rgba(247,245,242,0.5)" }}>
                  {returnDate ? fmtDate(returnDate) : "Add date"}
                </div>
              </div>
            )}
            <LuxeDatePicker
              mode={tripType === "R" ? "range" : "single"}
              variant="dark"
              minDate={today}
              checkIn={date || null}
              checkOut={tripType === "R" ? (returnDate || null) : null}
              onChange={({ checkIn: ci, checkOut: co }) => {
                setDate(ci ?? "");
                if (tripType === "R") setReturnDate(co ?? "");
              }}
              open={dateOpen}
              onClose={() => setDateOpen(false)}
              showTrigger={false}
              hidePresets={tripType === "O"}
            />
          </div>

          {/* Travellers */}
          <div
            className={`field border-top travellers-field${paxOpen ? " focus" : ""}`}
            onClick={() => setPaxOpen((v) => !v)}
            style={{ cursor: "pointer", position: "relative" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="fl">Travellers & Cabin</div>
              <div className="fv">
                {paxLabel} · {cabinLabel[cabin] ?? cabin}
              </div>
            </div>
            <div style={{ color: "rgba(201,168,76,0.7)", fontSize: 14, paddingLeft: 8 }}>
              {paxOpen ? "▴" : "▾"}
            </div>
          </div>

          {paxOpen && (
            <div className="pax-pop" onClick={(e) => e.stopPropagation()}>
              <PaxStepper
                label="Adults"
                hint="12+ years"
                value={adults}
                min={1}
                max={9 - children}
                onChange={(v) => {
                  setAdults(v);
                  if (infants > v) setInfants(v);
                }}
              />
              <PaxStepper
                label="Children"
                hint="2 – 12 years"
                value={children}
                min={0}
                max={Math.max(0, 9 - adults)}
                onChange={setChildren}
              />
              <PaxStepper
                label="Infants"
                hint="Under 2 yrs · on lap"
                value={infants}
                min={0}
                max={maxInfants}
                onChange={setInfants}
                disabledHint={infants >= maxInfants ? "Max 1 infant per adult" : undefined}
              />

              <div className="pax-cabin-row">
                <div className="pax-cabin-label">Cabin class</div>
                <select
                  value={cabin}
                  onChange={(e) => setCabin(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="cabin-select-full"
                >
                  <option value="ECONOMY">Economy</option>
                  <option value="PREMIUM_ECONOMY">Premium Economy</option>
                  <option value="BUSINESS">Business</option>
                  <option value="FIRST">First Class</option>
                </select>
              </div>

              <div className="pax-pop-foot">
                <span className="pax-foot-meta">{totalSeated} seated · {infants} on lap</span>
                <button className="pax-done" onClick={(e) => { e.stopPropagation(); setPaxOpen(false); }}>
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Popular destinations */}
        <div className="pop-section">
          <div className="pop-label">Popular in India</div>
          <div className="pop-pills">
            {POPULAR_INDIA.map(a => (
              <div key={a.code} className="pop-pill" onClick={() => setTo(a)}>
                {a.city} ({a.code})
              </div>
            ))}
          </div>
          <div className="pop-label">International</div>
          <div className="pop-pills">
            {POPULAR_INTL.map(a => (
              <div key={a.code} className="pop-pill" onClick={() => setTo(a)}>
                {a.city} ({a.code})
              </div>
            ))}
          </div>
        </div>

        {/* Search CTA */}
        <div style={{ padding: "4px 14px 96px" }}>
          <div
            className={`search-btn${!canSearch ? " disabled" : ""}`}
            onClick={handleSearch}
          >
            Search Flights →
          </div>
        </div>

        {/* Sticky bottom */}
        <div className="sticky">
          <div className="sticky-l">
            <div className="sticky-lbl">Voyagr Club</div>
            <div className="sticky-sub">Hotels · Flights · Stays</div>
          </div>
          <Link href="/login" className="sticky-btn">Join Free</Link>
        </div>
      </div>

      <style>{`
        .flights-page {
          min-height: 100vh;
          background: #0B1B2B;
          padding-top: 72px;
        }

        /* ── Tabs ── */
        .tabs-wrap { padding: 20px 16px 0; }
        .tabs { display: inline-flex; background: rgba(255,255,255,0.07); border-radius: 7px; padding: 3px; gap: 2px; }
        .tab { padding: 9px 26px; font-family: var(--font-body); font-size: 13px; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(253,250,245,0.5); text-decoration: none; border-radius: 5px; cursor: pointer; transition: all 0.2s; }
        .tab.act { background: #C9A84C; color: #0B1B2B; }

        /* ── Trip type ── */
        .trip-type-row { display: flex; gap: 8px; padding: 14px 16px 0; }
        .trip-btn { padding: 7px 20px; border-radius: 100px; border: 1.5px solid rgba(255,255,255,0.15); background: transparent; color: rgba(253,250,245,0.55); font-family: var(--font-body); font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .trip-btn.act { background: #C9A84C; border-color: #C9A84C; color: #0B1B2B; font-weight: 700; }

        /* ── Form card ── */
        .form-area { background: rgba(255,255,255,0.055); border: 1px solid rgba(201,168,76,0.14); border-radius: 12px; margin: 14px 16px 0; overflow: hidden; }

        /* ── Field row (From / Swap / To) ── */
        .field-row { display: flex; align-items: stretch; }
        .field { padding: 14px 14px; flex: 1; cursor: pointer; transition: background 0.15s; min-width: 0; }
        .field:hover { background: rgba(255,255,255,0.03); }
        .field.focus { background: rgba(201,168,76,0.06); border-left: 2px solid #C9A84C; }
        .field.border-top { border-top: 1px solid rgba(255,255,255,0.06); }
        .field.border-left { border-left: 1px solid rgba(255,255,255,0.06); }
        .fl { font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(253,250,245,0.38); margin-bottom: 5px; font-family: var(--font-body); }
        .fv { font-size: 15px; font-weight: 500; color: #fdfaf5; font-family: var(--font-body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .fv.ph { color: rgba(253,250,245,0.28); }
        .fv-hint { font-size: 11px; color: rgba(253,250,245,0.4); margin-top: 2px; font-family: var(--font-body); }

        /* ── Swap ── */
        .swap-btn { width: 38px; min-width: 38px; background: transparent; border: none; border-left: 1px solid rgba(255,255,255,0.06); border-right: 1px solid rgba(255,255,255,0.06); color: rgba(201,168,76,0.6); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color 0.2s, background 0.2s; }
        .swap-btn:hover { color: #C9A84C; background: rgba(201,168,76,0.07); }

        /* ── Airport search dropdown ── */
        .airport-drop { background: #0d1e2e; border-top: 1px solid rgba(201,168,76,0.14); max-height: 252px; overflow-y: auto; }
        .airport-input { width: 100%; padding: 12px 14px; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.07); color: #fdfaf5; font-family: var(--font-body); font-size: 14px; outline: none; caret-color: #C9A84C; }
        .airport-input::placeholder { color: rgba(253,250,245,0.3); }
        .airport-row { display: flex; align-items: center; gap: 12px; padding: 11px 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s; }
        .airport-row:hover { background: rgba(255,255,255,0.04); }
        .airport-code { font-family: var(--font-mono); font-size: 13px; font-weight: 700; color: #C9A84C; min-width: 34px; }
        .airport-city { font-size: 14px; color: #fdfaf5; font-weight: 500; font-family: var(--font-body); }
        .airport-name { font-size: 11px; color: rgba(253,250,245,0.38); font-family: var(--font-body); margin-top: 1px; }

        /* ── Dates ── */
        .dates-row { display: grid; grid-template-columns: 1fr; }
        .dates-row.two-col { grid-template-columns: 1fr 1fr; }
        .date-input { background: transparent; border: none; outline: none; color: #fdfaf5; font-family: var(--font-body); font-size: 15px; font-weight: 500; width: 100%; color-scheme: dark; cursor: pointer; }
        .date-input.ph { color: rgba(253,250,245,0.28); }

        /* ── Travellers ── */
        .travellers-field { display: flex; justify-content: space-between; align-items: center; gap: 8px; }

        /* Travellers popover */
        .pax-pop { background: #0d1e2e; border-top: 1px solid rgba(201,168,76,0.14); padding: 14px 16px 12px; }
        .pax-stepper-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pax-stepper-row:last-of-type { border-bottom: none; }
        .pax-stepper-label { font-size: 14px; font-weight: 600; color: #fdfaf5; font-family: var(--font-body); }
        .pax-stepper-hint { font-size: 11px; color: rgba(253,250,245,0.42); font-family: var(--font-body); margin-top: 2px; }
        .pax-stepper-ctrl { display: flex; align-items: center; gap: 12px; }
        .pax-btn { width: 30px; height: 30px; border-radius: 50%; border: 1px solid #C9A84C; background: transparent; color: #C9A84C; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; transition: background 0.2s, opacity 0.2s; }
        .pax-btn:hover:not(:disabled) { background: rgba(201,168,76,0.12); }
        .pax-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pax-num { color: #fdfaf5; font-size: 15px; font-weight: 600; min-width: 18px; text-align: center; font-family: var(--font-mono); }

        .pax-cabin-row { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 14px; margin-top: 4px; border-top: 1px solid rgba(255,255,255,0.05); }
        .pax-cabin-label { font-size: 12px; font-weight: 600; color: rgba(253,250,245,0.65); font-family: var(--font-body); letter-spacing: 0.04em; text-transform: uppercase; }
        .cabin-select-full { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; color: #fdfaf5; font-family: var(--font-body); font-size: 13px; padding: 8px 10px; outline: none; cursor: pointer; color-scheme: dark; min-width: 140px; }

        .pax-pop-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); }
        .pax-foot-meta { font-size: 11px; color: rgba(253,250,245,0.4); font-family: var(--font-body); }
        .pax-done { background: #C9A84C; color: #0B1B2B; padding: 7px 18px; border-radius: 6px; border: none; font-family: var(--font-body); font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; cursor: pointer; transition: opacity 0.2s; }
        .pax-done:hover { opacity: 0.88; }

        /* ── Popular ── */
        .pop-section { padding: 20px 16px 8px; }
        .pop-label { font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(253,250,245,0.35); margin-bottom: 10px; font-family: var(--font-body); }
        .pop-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
        .pop-pill { padding: 6px 14px; border-radius: 100px; border: 1px solid rgba(255,255,255,0.11); color: rgba(253,250,245,0.62); font-family: var(--font-body); font-size: 12px; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
        .pop-pill:hover { border-color: #C9A84C; color: #fdfaf5; background: rgba(201,168,76,0.08); }

        /* ── Search CTA ── */
        .search-btn { background: #C9A84C; color: #0B1B2B; padding: 16px; border-radius: 8px; font-family: var(--font-body); font-size: 15px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; text-align: center; cursor: pointer; transition: opacity 0.2s; }
        .search-btn.disabled { opacity: 0.32; cursor: not-allowed; }
        .search-btn:not(.disabled):active { opacity: 0.85; }

        /* ── Sticky bottom ── */
        .sticky { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(10,24,40,0.97); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-top: 1px solid rgba(201,168,76,0.14); display: flex; justify-content: space-between; align-items: center; padding: 13px 16px; padding-bottom: max(13px, env(safe-area-inset-bottom)); z-index: 50; }
        .sticky-l { display: flex; flex-direction: column; gap: 2px; }
        .sticky-lbl { font-size: 13px; font-weight: 600; color: #fdfaf5; font-family: var(--font-body); letter-spacing: 0.02em; }
        .sticky-sub { font-size: 11px; color: rgba(255,255,255,0.45); font-family: var(--font-body); }
        .sticky-total { font-size: 18px; font-weight: 700; color: #C9A84C; font-family: var(--font-mono); }
        .sticky-btn { background: #C9A84C; color: #0B1B2B; padding: 10px 22px; border-radius: 6px; font-family: var(--font-body); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; text-decoration: none; cursor: pointer; border: none; transition: opacity 0.2s; white-space: nowrap; }
        .sticky-btn:hover { opacity: 0.88; }
      `}</style>
    </>
  );
}
