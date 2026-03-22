"use client";

import { useState, useRef, useEffect } from "react";
import { useBooking } from "@/context/BookingContext";

interface GuestRoomPickerProps {
  variant?: "dark" | "light";
  /** Compact mode for DateBar */
  compact?: boolean;
}

function CounterButton({
  onClick,
  disabled,
  label,
  variant,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  variant: "dark" | "light";
}) {
  const isDark = variant === "dark";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer"
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
        background: disabled
          ? "transparent"
          : isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.04)",
        color: disabled
          ? isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)"
          : isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)",
        fontSize: 16,
        fontWeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        lineHeight: 1,
      }}
      aria-label={label}
    >
      {label === "decrease" ? "−" : "+"}
    </button>
  );
}

export default function GuestRoomPicker({ variant = "dark", compact = false }: GuestRoomPickerProps) {
  const {
    rooms, addRoom, removeRoom, setRoomAdults, setRoomChildren,
    guestSummary,
  } = useBooking();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const isDark = variant === "dark";
  const bgCard = isDark ? "var(--bg-input, rgba(255,255,255,0.06))" : "rgba(0,0,0,0.04)";
  const borderColor = isDark ? "var(--border, rgba(255,255,255,0.08))" : "rgba(0,0,0,0.08)";
  const labelColor = isDark ? "var(--white-30, rgba(255,255,255,0.3))" : "#7a7465";
  const valueColor = isDark ? "var(--white-80, rgba(255,255,255,0.8))" : "#1a1710";
  const dropdownBg = isDark ? "#1e1e1e" : "#ffffff";
  const dropdownBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";
  const rowBorder = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const subLabelColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: bgCard,
          border: `1px solid ${borderColor}`,
          borderRadius: compact ? 10 : 12,
          padding: compact ? "8px 12px" : "12px 14px",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            fontFamily: compact ? "var(--font-body, sans-serif)" : "var(--font-jetbrains-mono)",
            fontSize: 9,
            letterSpacing: compact ? 1 : 1.2,
            textTransform: "uppercase",
            color: labelColor,
            marginBottom: compact ? 2 : 4,
          }}
        >
          GUESTS
        </div>
        <div
          style={{
            fontFamily: compact ? "var(--font-body, sans-serif)" : "var(--font-dm-sans)",
            fontSize: compact ? 13 : 14,
            fontWeight: 400,
            color: valueColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{guestSummary}</span>
          <svg
            width="10" height="6" viewBox="0 0 10 6" fill="none"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            <path d="M1 1L5 5L9 1" stroke={labelColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: dropdownBg,
            border: `1px solid ${dropdownBorder}`,
            borderRadius: 14,
            padding: "12px 14px",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.5)"
              : "0 8px 32px rgba(0,0,0,0.12)",
          }}
        >
          {rooms.map((room, idx) => (
            <div key={idx}>
              {/* Room header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  marginTop: idx > 0 ? 4 : 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans, sans-serif)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: valueColor,
                  }}
                >
                  Room {idx + 1}
                </span>
                {rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRoom(idx)}
                    className="cursor-pointer"
                    style={{
                      background: "none",
                      border: "none",
                      padding: "2px 6px",
                      fontSize: 11,
                      color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)",
                      cursor: "pointer",
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Adults row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: valueColor, fontFamily: "var(--font-dm-sans, sans-serif)" }}>Adults</div>
                  <div style={{ fontSize: 10, color: subLabelColor, fontFamily: "var(--font-dm-sans, sans-serif)" }}>Age 13+</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CounterButton
                    onClick={() => setRoomAdults(idx, room.adults - 1)}
                    disabled={room.adults <= 1}
                    label="decrease"
                    variant={variant}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      fontSize: 14,
                      fontWeight: 500,
                      color: valueColor,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {room.adults}
                  </span>
                  <CounterButton
                    onClick={() => setRoomAdults(idx, room.adults + 1)}
                    disabled={room.adults >= 6}
                    label="increase"
                    variant={variant}
                  />
                </div>
              </div>

              {/* Children row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: idx < rooms.length - 1 ? 12 : 0,
                  borderBottom: idx < rooms.length - 1 ? `1px solid ${rowBorder}` : "none",
                  marginBottom: idx < rooms.length - 1 ? 12 : 0,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: valueColor, fontFamily: "var(--font-dm-sans, sans-serif)" }}>Children</div>
                  <div style={{ fontSize: 10, color: subLabelColor, fontFamily: "var(--font-dm-sans, sans-serif)" }}>Age 0-12</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <CounterButton
                    onClick={() => setRoomChildren(idx, room.children - 1)}
                    disabled={room.children <= 0}
                    label="decrease"
                    variant={variant}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      fontSize: 14,
                      fontWeight: 500,
                      color: valueColor,
                      minWidth: 18,
                      textAlign: "center",
                    }}
                  >
                    {room.children}
                  </span>
                  <CounterButton
                    onClick={() => setRoomChildren(idx, room.children + 1)}
                    disabled={room.children >= 4}
                    label="increase"
                    variant={variant}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Room button */}
          {rooms.length < 5 && (
            <button
              type="button"
              onClick={addRoom}
              className="cursor-pointer"
              style={{
                width: "100%",
                marginTop: 12,
                padding: "10px 0",
                background: "transparent",
                border: `1px dashed ${dropdownBorder}`,
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 500,
                color: isDark ? "var(--gold, #c9a96e)" : "#8b7340",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans, sans-serif)",
              }}
            >
              + Add Room
            </button>
          )}

          {/* Done button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="cursor-pointer"
            style={{
              width: "100%",
              marginTop: 10,
              padding: "10px 0",
              background: isDark ? "var(--gold, #c9a96e)" : "#1a1710",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              color: isDark ? "var(--bg-black, #0a0a0a)" : "#ffffff",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans, sans-serif)",
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
