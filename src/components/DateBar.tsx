"use client";

/* ════════════════════════════════════════════════════════════════════════════
   DateBar
   ───────
   Search-summary widget used on the city + search pages. Reads/writes to
   useBooking() and renders LuxeDatePicker for the actual calendar UI.

   The component preserves its previous external contract:
     • <DateBar variant="dark" />        — stacked card (city)
     • <DateBar variant="light" inline /> — inline row (search)
     • ref.current.openCheckIn()          — programmatically open calendar
   ════════════════════════════════════════════════════════════════════════════ */

import {
  useState,
  useRef,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { useBooking } from "@/context/BookingContext";
import GuestRoomPicker from "@/components/GuestRoomPicker";
import LuxeDatePicker from "@/components/LuxeDatePicker";

interface DateBarProps {
  variant?: "dark" | "light";
  /** When true, renders check-in / check-out / guests inline in a row with no
   *  outer card chrome — designed for composition inside a unified search card. */
  inline?: boolean;
}

export interface DateBarHandle {
  openCheckIn: () => void;
}

const DateBar = forwardRef<DateBarHandle, DateBarProps>(function DateBar(
  { variant = "light", inline = false },
  ref,
) {
  const { checkIn, checkOut, setDates, formatDate } = useBooking();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isDark = variant === "dark";
  const bgCard = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  const bgInput = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const labelColor = isDark ? "rgba(255,255,255,0.3)" : "#7a7465";
  const valueColor = isDark ? "rgba(255,255,255,0.8)" : "#1a1710";
  const placeholderColor = isDark ? "rgba(255,255,255,0.3)" : "#7a7465";

  const handleChange = useCallback(
    ({ checkIn: ci, checkOut: co }: { checkIn: string | null; checkOut: string | null }) => {
      setDates(ci ?? "", co ?? "");
    },
    [setDates],
  );

  useImperativeHandle(
    ref,
    () => ({
      openCheckIn: () => setOpen(true),
    }),
    [],
  );

  const nightCount = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const a = new Date(checkIn + "T00:00:00").getTime();
    const b = new Date(checkOut + "T00:00:00").getTime();
    return Math.max(0, Math.round((b - a) / 86400000));
  }, [checkIn, checkOut]);

  /* ── Inline (composable) layout used inside the unified search card ── */
  if (inline) {
    const cellBase: React.CSSProperties = {
      flex: 1,
      minWidth: 0,
      cursor: "pointer",
      padding: "10px 16px",
      transition: "background 0.15s",
      background: "transparent",
      border: "none",
      textAlign: "left",
    };
    const labelStyle: React.CSSProperties = {
      fontFamily: "var(--font-body), sans-serif",
      fontSize: 10,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: "var(--ink-light)",
      marginBottom: 4,
      fontWeight: 600,
    };
    const valueStyle = (filled: boolean): React.CSSProperties => ({
      fontFamily: "var(--font-body), sans-serif",
      fontSize: 14,
      fontWeight: filled ? 500 : 400,
      color: filled ? "var(--ink)" : "var(--ink-light)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });

    return (
      <div
        ref={containerRef}
        className="usc-date-row"
        style={{ position: "relative", display: "flex", flex: 1, minWidth: 0 }}
      >
        <button
          type="button"
          className="usc-cell"
          onClick={() => setOpen(true)}
          style={cellBase}
        >
          <div style={labelStyle}>Check-in</div>
          <div style={valueStyle(!!checkIn)}>{formatDate(checkIn, "Add date")}</div>
        </button>
        <button
          type="button"
          className="usc-cell"
          onClick={() => setOpen(true)}
          style={cellBase}
        >
          <div style={labelStyle}>Check-out</div>
          <div style={valueStyle(!!checkOut)}>{formatDate(checkOut, "Add date")}</div>
        </button>
        <div className="usc-cell" style={{ flex: 1, minWidth: 0, padding: "6px 10px" }}>
          <GuestRoomPicker variant="light" compact />
        </div>

        <LuxeDatePicker
          mode="range"
          variant="light"
          checkIn={checkIn || null}
          checkOut={checkOut || null}
          onChange={handleChange}
          open={open}
          onClose={() => setOpen(false)}
          showTrigger={false}
          anchorRef={containerRef}
        />
      </div>
    );
  }

  /* ── Default (stacked card) layout ── */
  return (
    <div ref={containerRef} style={{ position: "relative" }}>
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
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              flex: 1,
              cursor: "pointer",
              background: bgInput,
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: "8px 12px",
              transition: "border-color 0.2s, background 0.2s",
              textAlign: "left",
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
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              flex: 1,
              cursor: "pointer",
              background: bgInput,
              border: `1px solid ${border}`,
              borderRadius: 10,
              padding: "8px 12px",
              transition: "border-color 0.2s, background 0.2s",
              textAlign: "left",
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
          </button>
        </div>

        {/* Optional nights hint */}
        {nightCount > 0 && (
          <div
            style={{
              padding: "0 16px 6px",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: isDark ? "var(--luxe-champagne, #c8aa76)" : "var(--gold)",
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 500,
            }}
          >
            {nightCount} night{nightCount !== 1 ? "s" : ""}
          </div>
        )}

        {/* Guests row */}
        <div style={{ padding: "0 16px 10px" }}>
          <GuestRoomPicker variant={variant} compact />
        </div>
      </div>

      <LuxeDatePicker
        mode="range"
        variant={isDark ? "dark" : "light"}
        checkIn={checkIn || null}
        checkOut={checkOut || null}
        onChange={handleChange}
        open={open}
        onClose={() => setOpen(false)}
        showTrigger={false}
        anchorRef={containerRef}
      />
    </div>
  );
});

export default DateBar;
