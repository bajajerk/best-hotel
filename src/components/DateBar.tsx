"use client";

import { useState, useRef, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { useBooking } from "@/context/BookingContext";
import GuestRoomPicker from "@/components/GuestRoomPicker";

interface DateBarProps {
  variant?: "dark" | "light";
}

export interface DateBarHandle {
  openCheckIn: () => void;
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

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayCell {
  date: string;
  day: number;
  disabled: boolean;
}

function buildMonth(year: number, month: number, todayIso: string): DayCell[][] {
  const firstDay = new Date(year, month, 1);
  let startIdx = firstDay.getDay() - 1;
  if (startIdx < 0) startIdx = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: DayCell[][] = [];
  let week: DayCell[] = [];

  for (let i = 0; i < startIdx; i++) {
    week.push({ date: "", day: 0, disabled: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toIso(new Date(year, month, d));
    week.push({ date: iso, day: d, disabled: iso < todayIso });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push({ date: "", day: 0, disabled: true });
    weeks.push(week);
  }
  return weeks;
}

/* ═══════════════════ Component ═══════════════════ */

const DateBar = forwardRef<DateBarHandle, DateBarProps>(function DateBar({ variant = "light" }, ref) {
  const { checkIn, checkOut, setCheckIn, setCheckOut, setDates, formatDate } = useBooking();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selecting, setSelecting] = useState<"checkIn" | "checkOut">("checkIn");
  const [hoverDate, setHoverDate] = useState("");
  const [baseDate, setBaseDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const calRef = useRef<HTMLDivElement>(null);

  const isDark = variant === "dark";
  const bgCard = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  const bgInput = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const labelColor = isDark ? "rgba(255,255,255,0.3)" : "#7a7465";
  const valueColor = isDark ? "rgba(255,255,255,0.8)" : "#1a1710";
  const placeholderColor = isDark ? "rgba(255,255,255,0.3)" : "#7a7465";

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [calendarOpen]);

  const todayIso = useMemo(() => toIso(new Date()), []);

  const month1 = useMemo(() => ({ year: baseDate.getFullYear(), month: baseDate.getMonth() }), [baseDate]);
  const month2 = useMemo(() => {
    const d = addMonths(baseDate, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [baseDate]);

  const weeks1 = useMemo(() => buildMonth(month1.year, month1.month, todayIso), [month1, todayIso]);
  const weeks2 = useMemo(() => buildMonth(month2.year, month2.month, todayIso), [month2, todayIso]);

  const canGoPrev = useMemo(() => {
    const now = new Date();
    return baseDate > new Date(now.getFullYear(), now.getMonth(), 1);
  }, [baseDate]);

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

  const handleDayClick = useCallback((iso: string) => {
    if (!iso) return;
    if (selecting === "checkIn") {
      setCheckIn(iso);
      if (checkOut && checkOut <= iso) setCheckOut("");
      setSelecting("checkOut");
    } else {
      if (checkIn && iso <= checkIn) {
        setDates(iso, "");
        setSelecting("checkOut");
      } else {
        setCheckOut(iso);
        setSelecting("checkIn");
        setCalendarOpen(false);
      }
    }
  }, [selecting, checkIn, checkOut, setCheckIn, setCheckOut, setDates]);

  const openCalendar = (target: "checkIn" | "checkOut") => {
    setSelecting(target);
    setCalendarOpen(true);
  };

  useImperativeHandle(ref, () => ({
    openCheckIn: () => {
      setSelecting("checkIn");
      setCalendarOpen(true);
    },
  }), []);

  const nightCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const a = new Date(checkIn + "T00:00:00");
    const b = new Date(checkOut + "T00:00:00");
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
  }, [checkIn, checkOut]);

  /* ── Render single month ── */
  const renderMonth = (year: number, month: number, weeks: DayCell[][]) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-display)",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--ink)",
          marginBottom: 18,
          letterSpacing: "0.01em",
        }}
      >
        {MONTH_NAMES[month]} {year}
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            style={{
              textAlign: "center",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase" as const,
              color: "var(--ink-light)",
              padding: "6px 0",
              fontFamily: "var(--font-body)",
            }}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {week.map((cell, ci) => {
            if (!cell.date) return <div key={ci} style={{ padding: "5px 2px" }} />;

            const isCheckIn = checkIn === cell.date;
            const isCheckOut = checkOut === cell.date;
            const isSelected = isCheckIn || isCheckOut;
            const rangeEnd = selecting === "checkOut" && hoverDate ? hoverDate : checkOut;
            const inRange = checkIn && rangeEnd && cell.date > checkIn && cell.date < rangeEnd;
            const isHover = hoverDate === cell.date && !cell.disabled;

            return (
              <div
                key={ci}
                onClick={() => !cell.disabled && handleDayClick(cell.date)}
                onMouseEnter={() => !cell.disabled && setHoverDate(cell.date)}
                onMouseLeave={() => setHoverDate("")}
                style={{
                  position: "relative",
                  padding: "4px 2px",
                  textAlign: "center",
                  cursor: cell.disabled ? "default" : "pointer",
                  background: inRange ? "var(--gold-pale)" : "transparent",
                  borderRadius: isCheckIn ? "10px 0 0 10px" : isCheckOut ? "0 10px 10px 0" : 0,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    margin: "0 auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 10,
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
                      fontSize: 15,
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
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <div ref={calRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 0,
          background: bgCard,
          borderBottom: `1px solid ${border}`,
        }}
      >
        {/* Date row */}
        <div style={{ display: "flex", gap: 8, padding: "10px 16px 6px" }}>
          <div
            onClick={() => openCalendar("checkIn")}
            style={{
              flex: 1,
              cursor: "pointer",
              background: calendarOpen && selecting === "checkIn" ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(201,168,76,0.08)") : bgInput,
              border: `1px solid ${calendarOpen && selecting === "checkIn" ? (isDark ? "rgba(255,255,255,0.2)" : "var(--gold)") : border}`,
              borderRadius: 10,
              padding: "8px 12px",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: labelColor,
                marginBottom: 2,
              }}
            >
              CHECK-IN
            </div>
            <div
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 13,
                fontWeight: 400,
                color: checkIn ? valueColor : placeholderColor,
              }}
            >
              {formatDate(checkIn, "Select date")}
            </div>
          </div>
          <div
            onClick={() => openCalendar("checkOut")}
            style={{
              flex: 1,
              cursor: "pointer",
              background: calendarOpen && selecting === "checkOut" ? (isDark ? "rgba(255,255,255,0.12)" : "rgba(201,168,76,0.08)") : bgInput,
              border: `1px solid ${calendarOpen && selecting === "checkOut" ? (isDark ? "rgba(255,255,255,0.2)" : "var(--gold)") : border}`,
              borderRadius: 10,
              padding: "8px 12px",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 9,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: labelColor,
                marginBottom: 2,
              }}
            >
              CHECK-OUT
            </div>
            <div
              style={{
                fontFamily: "var(--font-body), sans-serif",
                fontSize: 13,
                fontWeight: 400,
                color: checkOut ? valueColor : placeholderColor,
              }}
            >
              {formatDate(checkOut, "Select date")}
            </div>
          </div>
        </div>
        {/* Guests row */}
        <div style={{ padding: "0 16px 10px" }}>
          <GuestRoomPicker variant={variant} compact />
        </div>
      </div>

      {/* Calendar dropdown panel */}
      {calendarOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "var(--white, #fdfaf5)",
            border: "1px solid var(--cream-border, #ddd5c3)",
            borderRadius: 20,
            boxShadow: "0 16px 48px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)",
            padding: "28px 32px 24px",
            marginTop: 6,
            minWidth: 360,
            width: "max-content",
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          {/* Header: nav + instruction */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
              paddingBottom: 16,
              borderBottom: "1px solid var(--cream-border, #ddd5c3)",
            }}
          >
            <button
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="cursor-pointer"
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--cream-border)",
                borderRadius: 10,
                background: "var(--cream, #f5f0e8)",
                color: canGoPrev ? "var(--ink)" : "var(--cream-border)",
                cursor: canGoPrev ? "pointer" : "default",
                fontSize: 20,
                transition: "background 0.15s",
              }}
              aria-label="Previous month"
            >
              &#8249;
            </button>

            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--gold)",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {selecting === "checkIn" ? "Select check-in" : "Select check-out"}
              </span>
              {nightCount > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-light)",
                    fontFamily: "var(--font-body)",
                    marginTop: 4,
                  }}
                >
                  {nightCount} night{nightCount !== 1 ? "s" : ""} selected
                </div>
              )}
            </div>

            <button
              onClick={nextMonth}
              className="cursor-pointer"
              style={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--cream-border)",
                borderRadius: 10,
                background: "var(--cream, #f5f0e8)",
                color: "var(--ink)",
                cursor: "pointer",
                fontSize: 20,
                transition: "background 0.15s",
              }}
              aria-label="Next month"
            >
              &#8250;
            </button>
          </div>

          {/* Two-month grid */}
          <div
            style={{ display: "flex", gap: 40 }}
            className="flex-col sm:flex-row"
          >
            {renderMonth(month1.year, month1.month, weeks1)}
            {renderMonth(month2.year, month2.month, weeks2)}
          </div>

          {/* Selection summary bar */}
          {checkIn && (
            <div
              style={{
                marginTop: 24,
                padding: "14px 18px",
                background: "var(--cream, #f5f0e8)",
                border: "1px solid var(--cream-border)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-light)", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    Check-in
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", fontFamily: "var(--font-body)", marginTop: 2 }}>
                    {new Date(checkIn + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--gold)" }}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
                <div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ink-light)", fontFamily: "var(--font-body)", fontWeight: 600 }}>
                    Check-out
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: checkOut ? "var(--ink)" : "var(--ink-light)", fontFamily: "var(--font-body)", fontStyle: checkOut ? "normal" : "italic", marginTop: 2 }}>
                    {checkOut
                      ? new Date(checkOut + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                      : "Select date"}
                  </div>
                </div>
              </div>
              {nightCount > 0 && (
                <button
                  onClick={() => setCalendarOpen(false)}
                  className="cursor-pointer"
                  style={{
                    padding: "10px 24px",
                    background: "var(--gold, #C9A84C)",
                    color: "var(--white, #fdfaf5)",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                    transition: "background 0.15s",
                  }}
                >
                  Done
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DateBar;
