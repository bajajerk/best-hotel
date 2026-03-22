"use client";

import { useBooking } from "@/context/BookingContext";

interface DateBarProps {
  /** Light theme variant for pages with light background */
  variant?: "dark" | "light";
}

export default function DateBar({ variant = "light" }: DateBarProps) {
  const { checkIn, checkOut, setCheckIn, setCheckOut, formatDate } = useBooking();

  const isDark = variant === "dark";

  const bgCard = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  const bgInput = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const labelColor = isDark ? "rgba(255,255,255,0.3)" : "#7a7465";
  const valueColor = isDark ? "rgba(255,255,255,0.8)" : "#1a1710";
  const placeholderColor = isDark ? "rgba(255,255,255,0.3)" : "#7a7465";

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "10px 16px",
        background: bgCard,
        borderBottom: `1px solid ${border}`,
      }}
    >
      <label
        style={{
          flex: 1,
          position: "relative",
          cursor: "pointer",
          background: bgInput,
          border: `1px solid ${border}`,
          borderRadius: 10,
          padding: "8px 12px",
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
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            width: "100%",
            height: "100%",
          }}
        />
      </label>
      <label
        style={{
          flex: 1,
          position: "relative",
          cursor: "pointer",
          background: bgInput,
          border: `1px solid ${border}`,
          borderRadius: 10,
          padding: "8px 12px",
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
        <input
          type="date"
          value={checkOut}
          min={checkIn || undefined}
          onChange={(e) => setCheckOut(e.target.value)}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            width: "100%",
            height: "100%",
          }}
        />
      </label>
    </div>
  );
}
