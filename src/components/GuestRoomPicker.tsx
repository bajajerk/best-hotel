"use client";

import { useState, useRef, useEffect } from "react";
import { useBooking } from "@/context/BookingContext";

interface GuestRoomPickerProps {
  variant?: "dark" | "light";
  /** Compact mode for DateBar */
  compact?: boolean;
  /** Override the trigger label (default "GUESTS") */
  label?: string;
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
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const baseBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)";
  const hoverBorder = isDark ? "rgba(200,170,118,0.55)" : "rgba(0,0,0,0.4)";
  const baseBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const hoverBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const baseColor = isDark ? "rgba(255,255,255,0.78)" : "rgba(0,0,0,0.75)";
  const hoverColor = isDark ? "#f7f5f2" : "#000";
  const disabledColor = isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.22)";
  const disabledBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      disabled={disabled}
      className="cursor-pointer"
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: `1px solid ${disabled ? disabledBorder : (hover ? hoverBorder : baseBorder)}`,
        background: disabled ? "transparent" : (hover ? hoverBg : baseBg),
        color: disabled ? disabledColor : (hover ? hoverColor : baseColor),
        fontSize: 16,
        fontWeight: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        lineHeight: 1,
        transition: "all 0.2s ease",
        transform: active && !disabled ? "scale(0.94)" : "scale(1)",
        outline: "none",
        padding: 0,
      }}
      aria-label={label}
    >
      {label === "decrease" ? "−" : "+"}
    </button>
  );
}

export default function GuestRoomPicker({ variant = "dark", compact = false, label = "GUESTS" }: GuestRoomPickerProps) {
  const {
    rooms, addRoom, removeRoom, setRoomAdults, setRoomChildren,
    guestSummary,
  } = useBooking();
  const [open, setOpen] = useState(false);
  const [doneHover, setDoneHover] = useState(false);
  const [addRoomHover, setAddRoomHover] = useState(false);
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
  const labelColor = isDark ? "var(--white-30, rgba(255,255,255,0.3))" : "var(--ink-light)";
  const valueColor = isDark ? "var(--white-80, rgba(255,255,255,0.85))" : "var(--ink)";
  const dropdownBg = isDark ? "#151515" : "#ffffff";
  const dropdownBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const sectionLabelColor = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.92)";
  const subLabelColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)";
  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const goldBase = isDark ? "#c8aa76" : "#8b7340";
  const goldHover = isDark ? "#d6bb88" : "#7a6334";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger — borderless when compact (parent .usc-cell already has chrome) */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: compact ? "transparent" : bgCard,
          border: compact ? "none" : `1px solid ${borderColor}`,
          borderRadius: compact ? 0 : 12,
          padding: compact ? 0 : "12px 14px",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            fontFamily: compact ? "var(--font-body, sans-serif)" : "var(--font-dm-mono)",
            fontSize: compact ? 10 : 9,
            letterSpacing: compact ? "0.08em" : 1.2,
            textTransform: "uppercase",
            fontWeight: compact ? 600 : 400,
            color: compact ? "var(--ink-light, var(--ink-light))" : labelColor,
            marginBottom: compact ? 4 : 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: compact ? "var(--font-body, sans-serif)" : "var(--font-dm-sans)",
            fontSize: compact ? 16 : 15,
            fontWeight: compact ? 500 : 500,
            letterSpacing: compact ? "0.2px" : undefined,
            color: compact ? "var(--ink, var(--ink))" : valueColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <span
            title={guestSummary}
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
              flex: 1,
            }}
          >
            {guestSummary}
          </span>
          <svg
            width="10" height="6" viewBox="0 0 10 6" fill="none"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            <path d="M1 1L5 5L9 1" stroke={compact ? "var(--ink-light, var(--ink-light))" : labelColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            zIndex: 1000,
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            minWidth: 320,
            background: dropdownBg,
            border: `1px solid ${dropdownBorder}`,
            borderRadius: 18,
            padding: "18px 20px",
            boxShadow: isDark
              ? "0 10px 30px rgba(0,0,0,0.35)"
              : "0 10px 30px rgba(0,0,0,0.12)",
            transition: "all 0.2s ease",
          }}
        >
          {rooms.map((room, idx) => (
            <div
              key={idx}
              style={{
                paddingBottom: idx < rooms.length - 1 ? 16 : 0,
                marginBottom: idx < rooms.length - 1 ? 16 : 0,
                borderBottom: idx < rooms.length - 1 ? `1px solid ${dividerColor}` : "none",
              }}
            >
              {/* Room header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-dm-sans, sans-serif)",
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: subLabelColor,
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
                      fontWeight: 500,
                      color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)",
                      cursor: "pointer",
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      transition: "color 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
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
                  paddingBottom: 14,
                  marginBottom: 14,
                  borderBottom: `1px solid ${dividerColor}`,
                  minHeight: 36,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: sectionLabelColor,
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      lineHeight: 1.3,
                    }}
                  >
                    Adults
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: subLabelColor,
                      opacity: 0.85,
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      marginTop: 2,
                    }}
                  >
                    Age 13+
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CounterButton
                    onClick={() => setRoomAdults(idx, room.adults - 1)}
                    disabled={room.adults <= 1}
                    label="decrease"
                    variant={variant}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      fontSize: 16,
                      fontWeight: 500,
                      color: sectionLabelColor,
                      minWidth: 22,
                      textAlign: "center",
                      lineHeight: 1,
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
                  minHeight: 36,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: sectionLabelColor,
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      lineHeight: 1.3,
                    }}
                  >
                    Children
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: subLabelColor,
                      opacity: 0.85,
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      marginTop: 2,
                    }}
                  >
                    Age 0–12
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <CounterButton
                    onClick={() => setRoomChildren(idx, room.children - 1)}
                    disabled={room.children <= 0}
                    label="decrease"
                    variant={variant}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans, sans-serif)",
                      fontSize: 16,
                      fontWeight: 500,
                      color: sectionLabelColor,
                      minWidth: 22,
                      textAlign: "center",
                      lineHeight: 1,
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
              onMouseEnter={() => setAddRoomHover(true)}
              onMouseLeave={() => setAddRoomHover(false)}
              className="cursor-pointer"
              style={{
                width: "100%",
                marginTop: 16,
                padding: "12px 0",
                background: addRoomHover
                  ? (isDark ? "rgba(200,170,118,0.08)" : "rgba(139,115,64,0.06)")
                  : "transparent",
                border: `1px dashed ${addRoomHover
                  ? (isDark ? "rgba(200,170,118,0.55)" : "rgba(139,115,64,0.55)")
                  : (isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)")}`,
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.02em",
                color: addRoomHover ? goldHover : goldBase,
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans, sans-serif)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1, marginTop: -1 }}>+</span>
              <span>Add Another Room</span>
            </button>
          )}

          {/* Done button */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            onMouseEnter={() => setDoneHover(true)}
            onMouseLeave={() => setDoneHover(false)}
            className="cursor-pointer"
            style={{
              width: "100%",
              height: 44,
              marginTop: 16,
              padding: 0,
              background: isDark
                ? (doneHover ? goldHover : goldBase)
                : (doneHover ? "#000" : "var(--ink, #1a1a1a)"),
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: isDark ? "#0a0a0a" : "#ffffff",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans, sans-serif)",
              transition: "all 0.2s ease",
              boxShadow: doneHover
                ? (isDark ? "0 6px 18px rgba(200,170,118,0.25)" : "0 6px 18px rgba(0,0,0,0.18)")
                : "none",
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
