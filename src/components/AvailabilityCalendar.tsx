"use client";

import { useState, useMemo, useCallback } from "react";
import { useBooking } from "@/context/BookingContext";

interface AvailabilityCalendarProps {
  ratesFrom: number | null;
  currency?: string;
}

/* ── Date helpers ── */

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isSameDay(a: string, b: string): boolean {
  return a === b;
}

function isInRange(day: string, start: string, end: string): boolean {
  return day > start && day < end;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* ── Rate simulation ── */

function getDayRate(
  base: number,
  year: number,
  month: number,
  day: number,
): number {
  // Deterministic pseudo-random variation based on date
  const seed = year * 10000 + month * 100 + day;
  const hash = ((seed * 2654435761) >>> 0) % 100;
  const dow = new Date(year, month, day).getDay();
  const isWeekend = dow === 0 || dow === 6;
  const weekendBump = isWeekend ? 1.15 : 1;
  // ±20% variation
  const variation = 0.8 + (hash / 100) * 0.4;
  return Math.round(base * variation * weekendBump);
}

type RateTier = "low" | "mid" | "high";

function rateTier(rate: number, base: number): RateTier {
  const ratio = rate / base;
  if (ratio < 0.95) return "low";
  if (ratio > 1.1) return "high";
  return "mid";
}

const TIER_DOT: Record<RateTier, string> = {
  low: "var(--success)",
  mid: "var(--gold)",
  high: "var(--error)",
};

/* ── Month grid builder ── */

interface DayCell {
  date: string; // ISO
  day: number;
  rate: number | null;
  tier: RateTier | null;
  disabled: boolean;
}

function buildMonth(
  year: number,
  month: number,
  todayIso: string,
  base: number | null,
): DayCell[][] {
  const firstDay = new Date(year, month, 1);
  // Monday-based: 0=Mon … 6=Sun
  let startIdx = firstDay.getDay() - 1;
  if (startIdx < 0) startIdx = 6;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: DayCell[][] = [];
  let week: DayCell[] = [];

  // Leading empty cells
  for (let i = 0; i < startIdx; i++) {
    week.push({ date: "", day: 0, rate: null, tier: null, disabled: true });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toIso(new Date(year, month, d));
    const past = iso < todayIso;
    const rate = base && !past ? getDayRate(base, year, month, d) : null;
    const tier = rate && base ? rateTier(rate, base) : null;
    week.push({ date: iso, day: d, rate, tier, disabled: past });

    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  // Trailing empty cells
  if (week.length > 0) {
    while (week.length < 7)
      week.push({ date: "", day: 0, rate: null, tier: null, disabled: true });
    weeks.push(week);
  }

  return weeks;
}

/* ── Format compact currency ── */

function fmtRate(amount: number, currency: string): string {
  if (currency === "USD" || currency === "US") return `$${amount}`;
  if (currency === "EUR") return `€${amount}`;
  if (currency === "GBP") return `£${amount}`;
  if (currency === "INR") return `₹${amount}`;
  return `${amount}`;
}

/* ═══════════════════ Component ═══════════════════ */

export default function AvailabilityCalendar({
  ratesFrom,
  currency = "USD",
}: AvailabilityCalendarProps) {
  const { checkIn, checkOut, setCheckIn, setCheckOut, setDates } = useBooking();
  const [baseDate, setBaseDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [hoverDate, setHoverDate] = useState<string>("");
  const [selecting, setSelecting] = useState<"checkIn" | "checkOut">("checkIn");

  const todayIso = useMemo(() => toIso(new Date()), []);

  const month1 = useMemo(
    () => ({
      year: baseDate.getFullYear(),
      month: baseDate.getMonth(),
    }),
    [baseDate],
  );
  const month2 = useMemo(() => {
    const d = addMonths(baseDate, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [baseDate]);

  const weeks1 = useMemo(
    () => buildMonth(month1.year, month1.month, todayIso, ratesFrom),
    [month1, todayIso, ratesFrom],
  );
  const weeks2 = useMemo(
    () => buildMonth(month2.year, month2.month, todayIso, ratesFrom),
    [month2, todayIso, ratesFrom],
  );

  const prevMonth = useCallback(() => {
    setBaseDate((d) => {
      const prev = addMonths(d, -1);
      const now = new Date();
      const minMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return prev < minMonth ? minMonth : prev;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setBaseDate((d) => addMonths(d, 1));
  }, []);

  const canGoPrev = useMemo(() => {
    const now = new Date();
    const minMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return baseDate > minMonth;
  }, [baseDate]);

  const handleDayClick = useCallback(
    (iso: string) => {
      if (!iso) return;
      if (selecting === "checkIn") {
        setCheckIn(iso);
        // Clear checkout if it's before new checkin
        if (checkOut && checkOut <= iso) setCheckOut("");
        setSelecting("checkOut");
      } else {
        if (checkIn && iso <= checkIn) {
          // Clicked before check-in — restart
          setDates(iso, "");
          setSelecting("checkOut");
        } else {
          setCheckOut(iso);
          setSelecting("checkIn");
        }
      }
    },
    [selecting, checkIn, checkOut, setCheckIn, setCheckOut, setDates],
  );

  const nightCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const a = new Date(checkIn + "T00:00:00");
    const b = new Date(checkOut + "T00:00:00");
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
  }, [checkIn, checkOut]);

  /* ── Render a single month ── */
  const renderMonth = (
    year: number,
    month: number,
    weeks: DayCell[][],
  ) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Month title */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-display)",
          fontSize: "18px",
          fontWeight: 400,
          color: "var(--ink)",
          marginBottom: 16,
        }}
      >
        {MONTH_NAMES[month]} {year}
      </div>

      {/* Weekday headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0,
          marginBottom: 4,
        }}
      >
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            style={{
              textAlign: "center",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-light)",
              padding: "4px 0",
              fontFamily: "var(--font-body)",
            }}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      {weeks.map((week, wi) => (
        <div
          key={wi}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 0,
          }}
        >
          {week.map((cell, ci) => {
            if (!cell.date) {
              return <div key={ci} style={{ padding: "6px 2px" }} />;
            }

            const isCheckIn = checkIn && isSameDay(cell.date, checkIn);
            const isCheckOut = checkOut && isSameDay(cell.date, checkOut);
            const isSelected = isCheckIn || isCheckOut;
            const rangeEnd = selecting === "checkOut" && hoverDate
              ? hoverDate
              : checkOut;
            const inRange = checkIn && rangeEnd && isInRange(cell.date, checkIn, rangeEnd);
            const isHover = hoverDate && isSameDay(cell.date, hoverDate) && !cell.disabled;

            return (
              <div
                key={ci}
                onClick={() => !cell.disabled && handleDayClick(cell.date)}
                onMouseEnter={() => !cell.disabled && setHoverDate(cell.date)}
                onMouseLeave={() => setHoverDate("")}
                style={{
                  position: "relative",
                  padding: "3px 1px",
                  textAlign: "center",
                  cursor: cell.disabled ? "default" : "pointer",
                  background: inRange
                    ? "var(--gold-pale)"
                    : "transparent",
                  borderRadius: isCheckIn
                    ? "6px 0 0 6px"
                    : isCheckOut
                      ? "0 6px 6px 0"
                      : 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 6,
                    background: isSelected
                      ? "var(--gold)"
                      : isHover
                        ? "var(--cream-deep)"
                        : "transparent",
                    transition: "background 0.15s",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: isSelected ? 600 : 400,
                      color: cell.disabled
                        ? "var(--cream-border)"
                        : isSelected
                          ? "var(--white)"
                          : "var(--ink)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1,
                    }}
                  >
                    {cell.day}
                  </span>
                  {/* Rate dot */}
                  {cell.tier && !cell.disabled && (
                    <span
                      style={{
                        display: "block",
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: TIER_DOT[cell.tier],
                        marginTop: 2,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      {/* Header row: nav arrows + instruction */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--cream-border)",
            borderRadius: 6,
            background: "var(--white)",
            color: canGoPrev ? "var(--ink)" : "var(--cream-border)",
            cursor: canGoPrev ? "pointer" : "default",
            fontSize: "16px",
          }}
          aria-label="Previous month"
        >
          &#8249;
        </button>

        <span
          style={{
            fontSize: "11px",
            color: "var(--ink-light)",
            fontFamily: "var(--font-body)",
          }}
        >
          {selecting === "checkIn"
            ? "Select check-in date"
            : "Select check-out date"}
        </span>

        <button
          onClick={nextMonth}
          style={{
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--cream-border)",
            borderRadius: 6,
            background: "var(--white)",
            color: "var(--ink)",
            cursor: "pointer",
            fontSize: "16px",
          }}
          aria-label="Next month"
        >
          &#8250;
        </button>
      </div>

      {/* Two-month grid */}
      <div
        style={{
          display: "flex",
          gap: 24,
        }}
        className="flex-col sm:flex-row"
      >
        {renderMonth(month1.year, month1.month, weeks1)}
        {renderMonth(month2.year, month2.month, weeks2)}
      </div>

      {/* Selection summary */}
      {checkIn && (
        <div
          style={{
            marginTop: 16,
            padding: "12px 16px",
            background: "var(--cream)",
            border: "1px solid var(--cream-border)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--ink-light)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Check-in
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--ink)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {new Date(checkIn + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: "var(--ink-light)" }}
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
            <div>
              <div
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--ink-light)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Check-out
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: checkOut ? "var(--ink)" : "var(--ink-light)",
                  fontFamily: "var(--font-body)",
                  fontStyle: checkOut ? "normal" : "italic",
                }}
              >
                {checkOut
                  ? new Date(checkOut + "T00:00:00").toLocaleDateString(
                      "en-US",
                      { weekday: "short", month: "short", day: "numeric" },
                    )
                  : "Select date"}
              </div>
            </div>
          </div>

          {nightCount > 0 && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--ink-light)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {nightCount} night{nightCount !== 1 ? "s" : ""}
              </div>
              {ratesFrom && (
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--our-rate)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  ~{fmtRate(ratesFrom * nightCount, currency)} total
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rate legend */}
      {ratesFrom && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--cream-border)",
          }}
        >
          <span
            style={{
              fontSize: "10px",
              color: "var(--ink-light)",
              fontFamily: "var(--font-body)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Rate indicator
          </span>
          {(
            [
              ["low", "Lower rate", "var(--success)"],
              ["mid", "Average", "var(--gold)"],
              ["high", "Peak rate", "var(--error)"],
            ] as const
          ).map(([, label, color]) => (
            <span
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: "11px",
                color: "var(--ink-light)",
                fontFamily: "var(--font-body)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: color,
                  display: "inline-block",
                }}
              />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
