"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LuxeDatePicker from "@/components/LuxeDatePicker";
import { AIRPORTS } from "@/lib/airports";

const FLIGHTS_HERO_BG =
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=2400&q=85&auto=format&fit=crop";

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

const TRENDING_ROUTES = [
  {
    from: "Mumbai", fromCode: "BOM",
    to: "Tokyo", toCode: "NRT",
    price: "₹42,500",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80&auto=format&fit=crop",
    discount: "18% off",
  },
  {
    from: "Delhi", fromCode: "DEL",
    to: "London", toCode: "LHR",
    price: "₹38,900",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80&auto=format&fit=crop",
    discount: "12% off",
  },
  {
    from: "Bengaluru", fromCode: "BLR",
    to: "Singapore", toCode: "SIN",
    price: "₹14,200",
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80&auto=format&fit=crop",
    discount: "22% off",
  },
  {
    from: "Mumbai", fromCode: "BOM",
    to: "Dubai", toCode: "DXB",
    price: "₹9,800",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80&auto=format&fit=crop",
    discount: "15% off",
  },
];

const WHY_ITEMS = [
  {
    num: "01",
    title: "Concierge-Managed Bookings",
    desc: "Our travel specialists handle complex itineraries, seat selections, and last-minute changes — so you don't have to.",
  },
  {
    num: "02",
    title: "Lounge Access on Eligible Fares",
    desc: "Premium lounge access included on select business and first class fares across major international hubs.",
  },
  {
    num: "03",
    title: "Free 24-Hour Changes",
    desc: "Change or cancel within 24 hours of booking at no penalty. Every flight, every carrier.",
  },
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
    <div className="fpx-row">
      <div>
        <div className="fpx-label">{label}</div>
        <div className="fpx-hint">{disabledHint ?? hint}</div>
      </div>
      <div className="fpx-ctrl" onClick={(e) => e.stopPropagation()}>
        <button className="fpx-btn" onClick={dec} disabled={value <= min} aria-label={`Decrease ${label}`}>−</button>
        <span className="fpx-num">{value}</span>
        <button className="fpx-btn" onClick={inc} disabled={value >= max} aria-label={`Increase ${label}`}>+</button>
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

  const maxInfants  = adults;
  const totalSeated = adults + children;
  const paxLabel = (() => {
    const parts: string[] = [];
    parts.push(adults === 1 ? "1 Adult" : `${adults} Adults`);
    if (children > 0) parts.push(children === 1 ? "1 Child" : `${children} Children`);
    if (infants > 0)  parts.push(infants === 1 ? "1 Infant" : `${infants} Infants`);
    return parts.join(", ");
  })();

  function fmtDate(d: string) {
    if (!d) return "";
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      weekday: "short", day: "numeric", month: "short",
    });
  }

  const cabinLabel: Record<string, string> = {
    ECONOMY: "Economy",
    PREMIUM_ECONOMY: "Premium Economy",
    BUSINESS: "Business",
    FIRST: "First Class",
  };

  return (
    <div className="luxe">
      <Header />
      <div className="fp-root">

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="fp-hero">
          <div
            className="fp-hero-bg"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(10,10,10,0.62) 0%, rgba(10,10,10,0.75) 55%, rgba(10,10,10,0.93) 100%), url(${FLIGHTS_HERO_BG})`,
            }}
          />

          <div className="fp-hero-inner">
            {/* Editorial copy */}
            <div className="fp-eyebrow">Voyagr Club</div>
            <h1 className="fp-headline">
              Flights your travel agent <em>won&rsquo;t surface</em>.
            </h1>
            <p className="fp-subhead">
              Members-only fares across 200+ carriers, bundled with concierge support.
            </p>

            {/* Search block */}
            <div className="fp-search-block">

              {/* Trip type toggles */}
              <div className="fp-toggles">
                {(["O", "R"] as const).map(t => (
                  <button
                    key={t}
                    className={`fp-toggle${tripType === t ? " act" : ""}`}
                    onClick={() => setTripType(t)}
                  >
                    {t === "O" ? "One Way" : "Return"}
                  </button>
                ))}
              </div>

              {/* Pill form */}
              <div className="fp-pill-wrap">
                <div className="fp-pill">

                  {/* FROM */}
                  <div
                    className={`fp-field${activeField === "from" ? " act" : ""}`}
                    onClick={() => openField("from")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") openField("from"); }}
                  >
                    <div className="fp-field-label">From</div>
                    <div className={`fp-field-value${!from.code ? " ph" : ""}`}>
                      {from.code ? `${from.city} (${from.code})` : "City or airport"}
                    </div>
                  </div>

                  <div className="fp-divider" />

                  {/* TO */}
                  <div
                    className={`fp-field${activeField === "to" ? " act" : ""}`}
                    onClick={() => openField("to")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") openField("to"); }}
                  >
                    <div className="fp-field-label">To</div>
                    <div className={`fp-field-value${!to.code ? " ph" : ""}`}>
                      {to.code ? `${to.city} (${to.code})` : "City or airport"}
                    </div>
                  </div>

                  <div className="fp-divider" />

                  {/* DEPARTURE */}
                  <div
                    className="fp-field"
                    onClick={() => setDateOpen(true)}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                    onKeyDown={e => { if (e.key === "Enter" || e.key === " ") setDateOpen(true); }}
                  >
                    <div className="fp-field-label">Departure</div>
                    <div className={`fp-field-value${!date ? " ph" : ""}`}>
                      {date ? fmtDate(date) : "Add date"}
                    </div>
                  </div>

                  <div className="fp-divider" />

                  {/* RETURN — hidden on mobile when one-way */}
                  <div
                    className={`fp-field${tripType !== "R" ? " disabled fp-return-ow" : ""}`}
                    onClick={() => { if (tripType === "R") setDateOpen(true); }}
                    role="button"
                    tabIndex={tripType === "R" ? 0 : -1}
                    style={{ cursor: tripType === "R" ? "pointer" : "default" }}
                  >
                    <div className="fp-field-label">Return</div>
                    <div className={`fp-field-value${!returnDate || tripType !== "R" ? " ph" : ""}`}>
                      {tripType === "R" && returnDate ? fmtDate(returnDate) : "—"}
                    </div>
                  </div>

                  <div className="fp-divider" />

                  {/* TRAVELLERS */}
                  <div
                    className={`fp-field fp-field--travellers${paxOpen ? " act" : ""}`}
                    onClick={() => setPaxOpen(v => !v)}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="fp-field-label">Travellers</div>
                    <div className="fp-field-value">{paxLabel}</div>
                  </div>

                  {/* SEARCH */}
                  <div className="fp-search-wrap">
                    <button
                      className={`fp-search-btn${!canSearch ? " disabled" : ""}`}
                      onClick={handleSearch}
                      disabled={!canSearch}
                    >
                      Search
                    </button>
                  </div>
                </div>

                {/* Airport search dropdown */}
                {activeField && (
                  <div className="fp-airport-drop">
                    <input
                      autoFocus
                      className="fp-airport-input"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder={
                        activeField === "from"
                          ? "Departure city or airport"
                          : "Destination city or airport"
                      }
                      onBlur={() =>
                        setTimeout(() => { setActiveField(null); setQuery(""); }, 160)
                      }
                    />
                    {filtered.map(a => (
                      <div
                        key={a.code}
                        className="fp-airport-row"
                        onMouseDown={() => selectAirport(a)}
                      >
                        <span className="fp-airport-code">{a.code}</span>
                        <div>
                          <div className="fp-airport-city">{a.city}</div>
                          <div className="fp-airport-name">{a.name} · {a.country}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Date picker — position: fixed internally, safe anywhere */}
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

                {/* Pax popover */}
                {paxOpen && (
                  <div className="fp-pax-pop" onClick={e => e.stopPropagation()}>
                    <PaxStepper
                      label="Adults" hint="12+ years"
                      value={adults} min={1} max={9 - children}
                      onChange={v => { setAdults(v); if (infants > v) setInfants(v); }}
                    />
                    <PaxStepper
                      label="Children" hint="2 – 12 years"
                      value={children} min={0} max={Math.max(0, 9 - adults)}
                      onChange={setChildren}
                    />
                    <PaxStepper
                      label="Infants" hint="Under 2 yrs · on lap"
                      value={infants} min={0} max={maxInfants}
                      onChange={setInfants}
                      disabledHint={infants >= maxInfants ? "Max 1 infant per adult" : undefined}
                    />
                    <div className="fpx-cabin-row">
                      <div className="fpx-cabin-label">Cabin class</div>
                      <select
                        value={cabin}
                        onChange={e => setCabin(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="fpx-cabin-select"
                      >
                        <option value="ECONOMY">Economy</option>
                        <option value="PREMIUM_ECONOMY">Premium Economy</option>
                        <option value="BUSINESS">Business</option>
                        <option value="FIRST">First Class</option>
                      </select>
                    </div>
                    <div className="fpx-footer">
                      <span className="fpx-meta">{totalSeated} seated · {infants} on lap</span>
                      <button
                        className="fpx-done"
                        onClick={e => { e.stopPropagation(); setPaxOpen(false); }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Popular destination chips */}
              <div className="fp-chips-area">
                <div className="fp-chips-group">
                  <div className="fp-chips-label">Popular in India</div>
                  <div className="fp-chips-row">
                    {POPULAR_INDIA.map(a => (
                      <button key={a.code} className="fp-chip" onClick={() => setTo(a)}>
                        {a.city} ({a.code})
                      </button>
                    ))}
                  </div>
                </div>
                <div className="fp-chips-group">
                  <div className="fp-chips-label">International</div>
                  <div className="fp-chips-row">
                    {POPULAR_INTL.map(a => (
                      <button key={a.code} className="fp-chip" onClick={() => setTo(a)}>
                        {a.city} ({a.code})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TRENDING ROUTES ──────────────────────────────────────────────── */}
        <section className="fp-section">
          <div className="fp-section-inner">
            <div className="fp-section-eyebrow">Trending Routes</div>
            <h2 className="fp-section-title">
              Trending routes <em>from India</em>
            </h2>
            <div className="fp-routes-grid">
              {TRENDING_ROUTES.map(route => (
                <div
                  key={`${route.fromCode}-${route.toCode}`}
                  className="fp-route-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setFrom({ code: route.fromCode, city: route.from });
                    setTo({ code: route.toCode, city: route.to });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      setFrom({ code: route.fromCode, city: route.from });
                      setTo({ code: route.toCode, city: route.to });
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                  }}
                >
                  <div
                    className="fp-route-img"
                    style={{ backgroundImage: `url(${route.image})` }}
                  >
                    <div className="fp-route-badge">{route.discount} member rate</div>
                  </div>
                  <div className="fp-route-body">
                    <div className="fp-route-name">{route.from} → {route.to}</div>
                    <div className="fp-route-price">from {route.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WHY VOYAGR CLUB ──────────────────────────────────────────────── */}
        <section className="fp-section fp-section--alt">
          <div className="fp-section-inner">
            <div className="fp-section-eyebrow">Why Voyagr Club</div>
            <h2 className="fp-section-title">
              Why Voyagr Club <em>for flights</em>
            </h2>
            <div className="fp-why-grid">
              {WHY_ITEMS.map(item => (
                <div key={item.num} className="fp-why-card">
                  <div className="fp-why-num">{item.num}</div>
                  <div className="fp-why-title">{item.title}</div>
                  <div className="fp-why-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>

      <style>{`
        /* ── Root ── */
        .fp-root {
          background: #0a0a0a;
          min-height: 100vh;
          color: #f7f5f2;
        }

        /* ── Hero ── */
        .fp-hero {
          position: relative;
          min-height: 75vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-top: 72px;
        }
        .fp-hero-bg {
          position: absolute;
          inset: 0;
          background-color: #0a0a0a;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          z-index: 0;
        }
        .fp-hero-inner {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 56px 40px 60px;
          width: 100%;
        }

        /* ── Editorial copy ── */
        .fp-eyebrow {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C9A961;
          margin-bottom: 16px;
        }
        .fp-headline {
          font-family: var(--font-display);
          font-size: 56px;
          font-weight: 500;
          line-height: 1.05;
          color: #f7f5f2;
          letter-spacing: -0.025em;
          max-width: 700px;
          margin-bottom: 16px;
        }
        .fp-headline em {
          font-style: italic;
          font-weight: 400;
        }
        .fp-subhead {
          font-size: 16px;
          color: rgba(255,255,255,0.75);
          max-width: 520px;
          line-height: 1.6;
          margin-bottom: 32px;
          font-family: var(--font-body);
        }

        /* ── Search block ── */
        .fp-search-block {
          max-width: 1000px;
        }

        /* ── Trip type toggles ── */
        .fp-toggles {
          display: flex;
          gap: 8px;
          margin-bottom: 14px;
        }
        .fp-toggle {
          padding: 8px 20px;
          border-radius: 9999px;
          border: 1px solid #C9A961;
          background: transparent;
          color: #C9A961;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .fp-toggle.act {
          background: #C9A961;
          color: #0a0a0a;
        }
        .fp-toggle:hover:not(.act) {
          background: rgba(201,169,97,0.1);
        }

        /* ── Pill form ── */
        .fp-pill-wrap {
          position: relative;
          margin-bottom: 20px;
        }
        .fp-pill {
          display: flex;
          align-items: stretch;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 9999px;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .fp-field {
          flex: 1;
          padding: 14px 20px;
          cursor: pointer;
          min-width: 0;
          transition: background 0.15s;
        }
        .fp-field:hover:not(.disabled) {
          background: rgba(255,255,255,0.04);
        }
        .fp-field.act {
          background: rgba(201,169,97,0.08);
        }
        .fp-field.disabled {
          opacity: 0.42;
          cursor: default;
        }
        .fp-field-label {
          font-family: var(--font-body);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C9A961;
          margin-bottom: 4px;
        }
        .fp-field-value {
          font-size: 16px;
          font-weight: 500;
          color: #f7f5f2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: var(--font-body);
        }
        .fp-field-value.ph { color: rgba(247,245,242,0.38); }
        .fp-divider {
          width: 1px;
          background: rgba(255,255,255,0.1);
          align-self: stretch;
          flex-shrink: 0;
          margin: 10px 0;
        }
        .fp-search-wrap {
          padding: 6px;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .fp-search-btn {
          padding: 12px 28px;
          border-radius: 9999px;
          background: #f5f1e8;
          color: #1a1a1a;
          border: none;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s;
        }
        .fp-search-btn:hover:not(.disabled):not(:disabled) { opacity: 0.88; }
        .fp-search-btn.disabled,
        .fp-search-btn:disabled { opacity: 0.38; cursor: not-allowed; }

        /* ── Airport dropdown ── */
        .fp-airport-drop {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #141210;
          border: 1px solid rgba(201,169,97,0.2);
          border-radius: 14px;
          max-height: 280px;
          overflow-y: auto;
          z-index: 200;
          box-shadow: 0 20px 56px rgba(0,0,0,0.75);
        }
        .fp-airport-input {
          width: 100%;
          padding: 14px 20px;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          color: #f7f5f2;
          font-family: var(--font-body);
          font-size: 15px;
          outline: none;
          caret-color: #C9A961;
        }
        .fp-airport-input::placeholder { color: rgba(247,245,242,0.35); }
        .fp-airport-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 20px;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .fp-airport-row:last-child { border-bottom: none; }
        .fp-airport-row:hover { background: rgba(255,255,255,0.05); }
        .fp-airport-code {
          font-size: 13px;
          font-weight: 700;
          color: #C9A961;
          min-width: 36px;
          font-family: var(--font-mono);
        }
        .fp-airport-city {
          font-size: 14px;
          color: #f7f5f2;
          font-weight: 500;
          font-family: var(--font-body);
        }
        .fp-airport-name {
          font-size: 11px;
          color: rgba(247,245,242,0.4);
          font-family: var(--font-body);
          margin-top: 2px;
        }

        /* ── Pax popover ── */
        .fp-pax-pop {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 300px;
          background: #141210;
          border: 1px solid rgba(201,169,97,0.2);
          border-radius: 14px;
          padding: 16px;
          z-index: 200;
          box-shadow: 0 20px 56px rgba(0,0,0,0.75);
        }
        .fpx-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .fpx-row:last-of-type { border-bottom: none; }
        .fpx-label {
          font-size: 14px;
          font-weight: 600;
          color: #f7f5f2;
          font-family: var(--font-body);
        }
        .fpx-hint {
          font-size: 11px;
          color: rgba(247,245,242,0.42);
          font-family: var(--font-body);
          margin-top: 2px;
        }
        .fpx-ctrl {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .fpx-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid #C9A961;
          background: transparent;
          color: #C9A961;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          transition: background 0.2s, opacity 0.2s;
        }
        .fpx-btn:hover:not(:disabled) { background: rgba(201,169,97,0.12); }
        .fpx-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .fpx-num {
          color: #f7f5f2;
          font-size: 15px;
          font-weight: 600;
          min-width: 18px;
          text-align: center;
          font-family: var(--font-mono);
        }
        .fpx-cabin-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding-top: 14px;
          margin-top: 4px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .fpx-cabin-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(247,245,242,0.65);
          font-family: var(--font-body);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .fpx-cabin-select {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          color: #f7f5f2;
          font-family: var(--font-body);
          font-size: 13px;
          padding: 8px 10px;
          outline: none;
          cursor: pointer;
          color-scheme: dark;
          min-width: 140px;
        }
        .fpx-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 12px;
          margin-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .fpx-meta {
          font-size: 11px;
          color: rgba(247,245,242,0.4);
          font-family: var(--font-body);
        }
        .fpx-done {
          background: #C9A961;
          color: #0a0a0a;
          padding: 7px 18px;
          border-radius: 6px;
          border: none;
          font-family: var(--font-body);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .fpx-done:hover { opacity: 0.88; }

        /* ── Chips ── */
        .fp-chips-area {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          align-items: flex-start;
        }
        .fp-chips-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .fp-chips-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #C9A961;
          font-family: var(--font-body);
        }
        .fp-chips-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .fp-chip {
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: rgba(247,245,242,0.85);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .fp-chip:hover {
          border-color: #C9A961;
          color: #C9A961;
          background: rgba(201,169,97,0.08);
        }

        /* ── Below-fold sections ── */
        .fp-section {
          padding: 72px 0 56px;
          background: #0a0a0a;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .fp-section--alt {
          background: #0e0d0b;
        }
        .fp-section-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
        }
        .fp-section-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #C9A961;
          margin-bottom: 12px;
          font-family: var(--font-body);
        }
        .fp-section-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 3vw, 44px);
          font-weight: 500;
          color: #f7f5f2;
          letter-spacing: -0.025em;
          line-height: 1.1;
          margin-bottom: 36px;
        }
        .fp-section-title em {
          font-style: italic;
          font-weight: 400;
        }

        /* ── Route cards ── */
        .fp-routes-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .fp-route-card {
          border-radius: 12px;
          overflow: hidden;
          background: #141210;
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: transform 0.22s ease, border-color 0.2s;
          outline: none;
        }
        .fp-route-card:hover,
        .fp-route-card:focus-visible {
          transform: translateY(-4px);
          border-color: rgba(201,169,97,0.3);
        }
        .fp-route-img {
          height: 180px;
          background: #1a1814;
          background-size: cover;
          background-position: center;
          position: relative;
        }
        .fp-route-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: #C9A961;
          color: #0a0a0a;
          padding: 3px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          font-family: var(--font-body);
        }
        .fp-route-body { padding: 18px 20px 20px; }
        .fp-route-name {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 500;
          color: #f7f5f2;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .fp-route-price {
          font-size: 14px;
          color: #C9A961;
          font-weight: 600;
          font-family: var(--font-body);
        }

        /* ── Why grid ── */
        .fp-why-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .fp-why-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 28px;
          transition: border-color 0.2s;
        }
        .fp-why-card:hover { border-color: rgba(201,169,97,0.2); }
        .fp-why-num {
          font-family: var(--font-display);
          font-size: 28px;
          color: #C9A961;
          opacity: 0.55;
          margin-bottom: 16px;
          line-height: 1;
        }
        .fp-why-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 500;
          color: #f7f5f2;
          margin-bottom: 10px;
          line-height: 1.2;
          letter-spacing: -0.01em;
        }
        .fp-why-desc {
          font-size: 14px;
          color: rgba(247,245,242,0.65);
          line-height: 1.7;
          font-family: var(--font-body);
        }

        /* ── Mobile ── */
        @media (max-width: 767px) {
          .fp-hero {
            min-height: 60vh;
            padding-top: 60px;
          }
          .fp-hero-inner {
            padding: 32px 20px 44px;
          }
          .fp-headline { font-size: 36px; }
          .fp-subhead {
            font-size: 15px;
            margin-bottom: 24px;
          }

          /* Stack pill into a card on mobile */
          .fp-pill {
            flex-direction: column;
            border-radius: 14px;
          }
          .fp-field {
            border-bottom: 1px solid rgba(255,255,255,0.07);
          }
          .fp-field--travellers { border-bottom: none; }
          /* Hide dividers — horizontal borders replace them */
          .fp-divider { display: none; }
          /* Hide the Return field on mobile when trip type is One Way */
          .fp-field.fp-return-ow { display: none; }
          .fp-search-wrap {
            padding: 10px 12px 14px;
          }
          .fp-search-btn {
            width: 100%;
            padding: 14px;
          }
          .fp-pax-pop {
            right: 0;
            left: 0;
            width: auto;
          }
          .fp-chips-area {
            flex-direction: column;
            gap: 14px;
          }

          .fp-section { padding: 48px 0 40px; }
          .fp-section-inner { padding: 0 20px; }

          .fp-routes-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .fp-why-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
        }

        @media (max-width: 479px) {
          .fp-routes-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
