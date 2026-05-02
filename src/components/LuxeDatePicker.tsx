"use client";

/* ════════════════════════════════════════════════════════════════════════════
   LuxeDatePicker
   ──────────────
   One world-class, brand-coherent date-range picker for the entire site.
   Replaces every `<input type="date">` and powers the popover inside DateBar.

   Design language:
     • Charcoal #0c0b0a · champagne #c8aa76 · ivory #f5f0e8
     • Glass blur (backdrop-filter) on the popover panel
     • Playfair Display italic for month names
     • JetBrains Mono caps for day-of-week + eyebrow + presets
     • Manrope for date numbers and body
     • Two months side-by-side ≥768px; one month on mobile
     • Past dates dimmed and disabled
     • Today gets a subtle champagne dot
     • Range hover preview while choosing check-out
     • Quick presets (this weekend, next weekend, 1w, 2w)
     • Footer shows nights count + "Done" gold pill

   API is dead-simple and headless: the parent owns the dates and passes
   them in, so context-bound consumers (DateBar → useBooking()) keep working.

   Build choices:
     • No new deps. date-fns isn't installed and we don't need it. ~25 lines
       of date math handles month grids, range diffing, presets.
     • framer-motion is already in the bundle — used for entry/exit.
     • Pure inline-styles to dodge Tailwind v4 surprises and stay portable.
     • All styling tokens reference existing CSS variables (--luxe-*, --gold,
       --ink, etc.) so we inherit the live theme.

   Modes:
     • mode="range" (default) — check-in + check-out
     • mode="single" — single ISO date (used for DOB-style inputs)
   ════════════════════════════════════════════════════════════════════════════ */

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  CSSProperties,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export type LuxeDatePickerVariant = "dark" | "light";
export type LuxeDatePickerMode = "range" | "single";

export interface LuxeDatePickerProps {
  /** ISO YYYY-MM-DD or null. In single mode, only `checkIn` is used. */
  checkIn: string | null;
  checkOut?: string | null;
  onChange: (range: { checkIn: string | null; checkOut: string | null }) => void;
  /** "range" (default) for hotel/flight search, "single" for DOB-style fields. */
  mode?: LuxeDatePickerMode;
  /** Visual variant. "dark" matches hero/city/hotel pages; "light" for /search. */
  variant?: LuxeDatePickerVariant;
  /** Earliest selectable date (ISO). Defaults to today (or no minimum in single mode). */
  minDate?: string;
  /** Latest selectable date (ISO). Defaults to ~18 months from today. */
  maxDate?: string;
  /** Show the trigger button rendered by the picker. If false, picker is open-controlled via `open`. */
  showTrigger?: boolean;
  /** Controlled open state — when provided, picker doesn't render its own trigger button. */
  open?: boolean;
  /** Callback when popover should close (outside click, Esc, Done). */
  onClose?: () => void;
  /** Anchor element to position popover under. If absent, popover is centered modal on mobile. */
  anchorRef?: React.RefObject<HTMLElement | null>;
  /** Optional label rendered inside trigger when `showTrigger=true`. */
  triggerLabel?: string;
  /** Placeholder text in trigger / single mode. */
  placeholder?: string;
  /** Hide quick-preset chip row (e.g. for DOB / past-date selection). */
  hidePresets?: boolean;
  /** Number of months side-by-side on desktop. 1 or 2. Defaults to 2 in range mode, 1 in single. */
  monthsToShow?: 1 | 2;
  /** Optional className for trigger button. */
  className?: string;
  /** Optional inline style for trigger button. */
  style?: CSSProperties;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Date helpers (zero-dep, ISO YYYY-MM-DD-centric)                            */
/* ────────────────────────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function pad2(n: number) { return String(n).padStart(2, "0"); }

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function fromIso(iso: string): Date {
  // Avoid TZ surprises by anchoring at noon local.
  return new Date(`${iso}T12:00:00`);
}

function todayIso(): string {
  return toIso(new Date());
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function addDays(iso: string, n: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

function daysBetween(a: string, b: string): number {
  const ms = fromIso(b).getTime() - fromIso(a).getTime();
  return Math.round(ms / 86400000);
}

function nextWeekday(from: string, weekday: number /* 0=Sun..6=Sat */): string {
  const d = fromIso(from);
  const diff = (weekday + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return toIso(d);
}

function thisOrNextFriday(from: string): string {
  const d = fromIso(from);
  // If today is Fri or Sat, "this weekend" is still this Friday/coming Saturday.
  if (d.getDay() === 5) return from;            // Friday today
  if (d.getDay() === 6) return addDays(from, -1); // Sat → use yesterday's Fri (weekend already started)
  return nextWeekday(from, 5);
}

function formatLong(iso: string | null): string {
  if (!iso) return "";
  return fromIso(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Month grid                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

interface DayCell {
  iso: string;
  day: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isFuture: boolean; // beyond maxDate
  isToday: boolean;
}

function buildMonth(
  year: number,
  month: number,
  minIso: string,
  maxIso: string,
  today: string,
): DayCell[][] {
  const firstDay = new Date(year, month, 1);
  // Monday-based week start: 0=Mon..6=Sun
  let startIdx = firstDay.getDay() - 1;
  if (startIdx < 0) startIdx = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: DayCell[][] = [];
  let week: DayCell[] = [];

  // Leading filler from previous month (kept blank — we don't render numbers
  // outside the month to keep visual density tight).
  for (let i = 0; i < startIdx; i++) {
    week.push({
      iso: "",
      day: 0,
      isCurrentMonth: false,
      isPast: true,
      isFuture: false,
      isToday: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toIso(new Date(year, month, d));
    week.push({
      iso,
      day: d,
      isCurrentMonth: true,
      isPast: iso < minIso,
      isFuture: iso > maxIso,
      isToday: iso === today,
    });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) {
      week.push({
        iso: "",
        day: 0,
        isCurrentMonth: false,
        isPast: true,
        isFuture: false,
        isToday: false,
      });
    }
    weeks.push(week);
  }

  return weeks;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Component                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const PANEL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: -2 },
};

export default function LuxeDatePicker(props: LuxeDatePickerProps) {
  const {
    checkIn,
    checkOut = null,
    onChange,
    mode = "range",
    variant = "dark",
    minDate,
    maxDate,
    showTrigger = true,
    open: openProp,
    onClose,
    anchorRef,
    triggerLabel,
    placeholder = "Select dates",
    hidePresets = false,
    monthsToShow,
    className,
    style,
  } = props;

  const isControlled = typeof openProp === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp! : internalOpen;

  // In single mode you might want past dates (DOB). Default minDate to today
  // in range mode, but to "1900-01-01" in single mode unless caller overrides.
  const minIso = useMemo(
    () => minDate ?? (mode === "single" ? "1900-01-01" : todayIso()),
    [minDate, mode],
  );
  const maxIso = useMemo(() => {
    if (maxDate) return maxDate;
    const d = new Date();
    d.setMonth(d.getMonth() + 18);
    return toIso(d);
  }, [maxDate]);

  const [selecting, setSelecting] = useState<"checkIn" | "checkOut">("checkIn");
  const [hoverIso, setHoverIso] = useState<string | null>(null);
  const [baseDate, setBaseDate] = useState<Date>(() => {
    // Anchor calendar to the first selected date if present, else current month.
    if (checkIn) {
      const d = fromIso(checkIn);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [navDir, setNavDir] = useState<1 | -1>(1);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Track whether we're rendering into a phone-sized viewport so we can
  // switch to a fullscreen-sheet layout instead of the desktop popover.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const closePanel = useCallback(() => {
    if (isControlled) onClose?.();
    else setInternalOpen(false);
  }, [isControlled, onClose]);

  const openPanel = useCallback(
    (target: "checkIn" | "checkOut" = "checkIn") => {
      setSelecting(target);
      if (!isControlled) setInternalOpen(true);
    },
    [isControlled],
  );

  // When opening, snap baseDate to the relevant selection so users don't have
  // to click "next" 6 times to find their existing booking month.
  useEffect(() => {
    if (!open) return;
    const target = mode === "range" && selecting === "checkOut" && checkOut
      ? checkOut
      : checkIn;
    if (target) {
      const d = fromIso(target);
      setBaseDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Outside click + Esc.
  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      const anchor = anchorRef?.current;
      if (anchor && anchor.contains(t)) return;
      closePanel();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel();
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, anchorRef, closePanel]);

  /* ─── month-grid memos ─── */
  const today = useMemo(() => todayIso(), []);
  const showTwoMonths =
    (monthsToShow ?? (mode === "range" ? 2 : 1)) === 2 && !isMobile;

  const m1 = useMemo(
    () => ({ year: baseDate.getFullYear(), month: baseDate.getMonth() }),
    [baseDate],
  );
  const m2 = useMemo(() => {
    const d = addMonths(baseDate, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }, [baseDate]);

  const weeks1 = useMemo(
    () => buildMonth(m1.year, m1.month, minIso, maxIso, today),
    [m1, minIso, maxIso, today],
  );
  const weeks2 = useMemo(
    () => buildMonth(m2.year, m2.month, minIso, maxIso, today),
    [m2, minIso, maxIso, today],
  );

  const canGoPrev = useMemo(() => {
    const minBase = fromIso(minIso);
    const minMonth = new Date(minBase.getFullYear(), minBase.getMonth(), 1);
    return baseDate > minMonth;
  }, [baseDate, minIso]);

  const canGoNext = useMemo(() => {
    const maxBase = fromIso(maxIso);
    const maxMonth = new Date(maxBase.getFullYear(), maxBase.getMonth(), 1);
    const lastShown = showTwoMonths ? addMonths(baseDate, 1) : baseDate;
    return lastShown < maxMonth;
  }, [baseDate, maxIso, showTwoMonths]);

  /* ─── handlers ─── */
  const handleDayClick = useCallback(
    (iso: string) => {
      if (!iso) return;
      if (mode === "single") {
        onChange({ checkIn: iso, checkOut: null });
        closePanel();
        return;
      }
      // range mode
      if (selecting === "checkIn" || !checkIn) {
        onChange({
          checkIn: iso,
          checkOut: checkOut && checkOut > iso ? checkOut : null,
        });
        setSelecting("checkOut");
      } else {
        if (iso <= checkIn) {
          // Clicked before check-in → restart range from the new date.
          onChange({ checkIn: iso, checkOut: null });
          setSelecting("checkOut");
        } else {
          onChange({ checkIn, checkOut: iso });
          setSelecting("checkIn");
          // Auto-close on completed range — that's the standard delight pattern.
          closePanel();
        }
      }
    },
    [mode, selecting, checkIn, checkOut, onChange, closePanel],
  );

  const goPrev = useCallback(() => {
    if (!canGoPrev) return;
    setNavDir(-1);
    setBaseDate((d) => addMonths(d, -1));
  }, [canGoPrev]);

  const goNext = useCallback(() => {
    if (!canGoNext) return;
    setNavDir(1);
    setBaseDate((d) => addMonths(d, 1));
  }, [canGoNext]);

  /* ─── keyboard nav inside grid ─── */
  const [focusIso, setFocusIso] = useState<string | null>(null);
  useEffect(() => {
    if (!open) {
      setFocusIso(null);
      return;
    }
    if (!focusIso) {
      setFocusIso(checkIn || today);
    }
  }, [open, checkIn, today, focusIso]);

  const onGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!focusIso) return;
      let next: string | null = null;
      if (e.key === "ArrowLeft") next = addDays(focusIso, -1);
      else if (e.key === "ArrowRight") next = addDays(focusIso, 1);
      else if (e.key === "ArrowUp") next = addDays(focusIso, -7);
      else if (e.key === "ArrowDown") next = addDays(focusIso, 7);
      else if (e.key === "PageUp") next = addDays(focusIso, -30);
      else if (e.key === "PageDown") next = addDays(focusIso, 30);
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (focusIso >= minIso && focusIso <= maxIso) handleDayClick(focusIso);
        return;
      } else return;
      if (next) {
        e.preventDefault();
        if (next < minIso) next = minIso;
        if (next > maxIso) next = maxIso;
        setFocusIso(next);
        // shift visible months if focus crossed boundary
        const nd = fromIso(next);
        const visStart = baseDate;
        const visEnd = showTwoMonths ? addMonths(baseDate, 2) : addMonths(baseDate, 1);
        if (nd < visStart) {
          setNavDir(-1);
          setBaseDate(new Date(nd.getFullYear(), nd.getMonth(), 1));
        } else if (nd >= visEnd) {
          setNavDir(1);
          setBaseDate(new Date(nd.getFullYear(), nd.getMonth(), 1));
        }
      }
    },
    [focusIso, minIso, maxIso, handleDayClick, baseDate, showTwoMonths],
  );

  /* ─── presets ─── */
  const presets = useMemo(() => {
    if (hidePresets || mode !== "range") return [];
    const base = today;
    const fri = thisOrNextFriday(base);
    const sun = addDays(fri, 2);
    const nextFri = addDays(fri, 7);
    const nextSun = addDays(nextFri, 2);
    const oneWeekStart = addDays(base, 7);
    const oneWeekEnd = addDays(oneWeekStart, 7);
    const twoWeekStart = addDays(base, 7);
    const twoWeekEnd = addDays(twoWeekStart, 14);
    return [
      { label: "This weekend", checkIn: fri, checkOut: sun },
      { label: "Next weekend", checkIn: nextFri, checkOut: nextSun },
      { label: "1 week",       checkIn: oneWeekStart, checkOut: oneWeekEnd },
      { label: "2 weeks",      checkIn: twoWeekStart, checkOut: twoWeekEnd },
    ];
  }, [today, hidePresets, mode]);

  const applyPreset = useCallback(
    (p: { checkIn: string; checkOut: string }) => {
      onChange({ checkIn: p.checkIn, checkOut: p.checkOut });
      setSelecting("checkIn");
      const d = fromIso(p.checkIn);
      setBaseDate(new Date(d.getFullYear(), d.getMonth(), 1));
    },
    [onChange],
  );

  /* ─── nights count ─── */
  const nights = useMemo(() => {
    if (mode !== "range" || !checkIn || !checkOut) return 0;
    return Math.max(0, daysBetween(checkIn, checkOut));
  }, [mode, checkIn, checkOut]);

  /* ─── reduced motion ─── */
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /* ────────────────────────────────────────────────────────────────────── */
  /* Render — month                                                          */
  /* ────────────────────────────────────────────────────────────────────── */

  const renderMonth = (year: number, month: number, weeks: DayCell[][]) => (
    <div style={{ flex: 1, minWidth: isMobile ? 0 : 240, width: isMobile ? "100%" : undefined }}>
      {/* Month name — Playfair italic with champagne underline */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "var(--font-display, serif)",
          fontStyle: "italic",
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "0.005em",
          color: variant === "dark" ? "var(--luxe-soft-white)" : "var(--ink)",
          marginBottom: 14,
          paddingBottom: 10,
          position: "relative",
        }}
      >
        {MONTH_NAMES[month]}{" "}
        <span style={{ fontStyle: "normal", color: "var(--luxe-champagne, #c8aa76)", fontWeight: 400 }}>
          {year}
        </span>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            width: 28,
            height: 1,
            transform: "translateX(-50%)",
            background: "linear-gradient(90deg, transparent, var(--luxe-champagne, #c8aa76), transparent)",
          }}
        />
      </div>

      {/* Weekday header — JetBrains Mono caps */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
        {WEEKDAYS.map((wd) => (
          <div
            key={wd}
            style={{
              textAlign: "center",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: variant === "dark" ? "var(--luxe-soft-white-50)" : "var(--ink-light)",
              padding: "6px 0",
            }}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div role="grid">
        {weeks.map((week, wi) => (
          <div
            key={wi}
            role="row"
            style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
          >
            {week.map((cell, ci) => {
              if (!cell.iso) return <div key={ci} style={{ height: 42 }} />;

              const disabled = cell.isPast || cell.isFuture;
              const isCheckIn = checkIn === cell.iso;
              const isCheckOut = checkOut === cell.iso;
              const isSelected = isCheckIn || isCheckOut;
              const previewEnd =
                mode === "range" && selecting === "checkOut" && hoverIso && checkIn && hoverIso > checkIn
                  ? hoverIso
                  : checkOut;
              const inRange =
                mode === "range" &&
                checkIn &&
                previewEnd &&
                cell.iso > checkIn &&
                cell.iso < previewEnd;
              const isFocused = focusIso === cell.iso;

              // Range fill stretches edge-to-edge of the row cell. Force it to
              // sit BEHIND the day-number pill (z-index: 0) so the number is
              // always legible — even on selected check-in/check-out, where the
              // champagne pill paints atop a tinted row.
              const cellStyle: CSSProperties = {
                position: "relative",
                height: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabled ? "default" : "pointer",
                background: inRange
                  ? variant === "dark"
                    ? "rgba(200, 170, 118, 0.18)"
                    : "rgba(200, 170, 118, 0.18)"
                  : "transparent",
                // Square the range edges so the connecting tint reads as a single bar.
                borderRadius: isCheckIn
                  ? mode === "range"
                    ? "999px 0 0 999px"
                    : "999px"
                  : isCheckOut
                    ? "0 999px 999px 0"
                    : 0,
                zIndex: 0,
              };

              const pillStyle: CSSProperties = {
                width: 38,
                height: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: isSelected
                  ? "var(--luxe-champagne, #c8aa76)"
                  : "transparent",
                // Selected: charcoal text on champagne fill (button-grade contrast).
                // In-range: keep numbers in the soft-white / ink tone — readable on
                // the 0.18 champagne tint without losing range continuity.
                color: disabled
                  ? variant === "dark"
                    ? "var(--luxe-soft-white-30, rgba(247,245,242,0.3))"
                    : "rgba(0,0,0,0.25)"
                  : isSelected
                    ? "var(--luxe-black, #0c0b0a)"
                    : variant === "dark"
                      ? "var(--luxe-soft-white)"
                      : "var(--ink)",
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: 14,
                fontWeight: isSelected ? 600 : cell.isToday ? 600 : 400,
                outline: isFocused
                  ? `1px solid ${isSelected ? "rgba(12,11,10,0.6)" : "var(--luxe-champagne, #c8aa76)"}`
                  : "none",
                outlineOffset: isFocused ? 2 : 0,
                transition: prefersReducedMotion
                  ? "none"
                  : "background 120ms ease, color 120ms ease, transform 120ms ease",
                position: "relative",
                // Day number always sits above the range fill.
                zIndex: 1,
              };

              return (
                <div
                  key={ci}
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-disabled={disabled}
                  onClick={() => !disabled && handleDayClick(cell.iso)}
                  onMouseEnter={() => !disabled && setHoverIso(cell.iso)}
                  onMouseLeave={() => setHoverIso(null)}
                  onFocus={() => setFocusIso(cell.iso)}
                  tabIndex={disabled ? -1 : isFocused ? 0 : -1}
                  style={cellStyle}
                >
                  <div
                    style={pillStyle}
                    onMouseEnter={(e) => {
                      if (disabled || isSelected) return;
                      (e.currentTarget as HTMLDivElement).style.background =
                        "rgba(200, 170, 118, 0.28)";
                    }}
                    onMouseLeave={(e) => {
                      if (disabled || isSelected) return;
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                    }}
                  >
                    {cell.day}
                    {/* Today dot — only when not selected (selection state already implies focus). */}
                    {cell.isToday && !isSelected && (
                      <span
                        aria-hidden
                        style={{
                          position: "absolute",
                          bottom: 5,
                          left: "50%",
                          transform: "translateX(-50%)",
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: "var(--luxe-champagne, #c8aa76)",
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
    </div>
  );

  /* ────────────────────────────────────────────────────────────────────── */
  /* Render — popover panel                                                  */
  /* ────────────────────────────────────────────────────────────────────── */

  const eyebrow = mode === "single"
    ? "SELECT DATE"
    : selecting === "checkIn"
      ? "CHOOSING CHECK-IN"
      : "CHOOSING CHECK-OUT";

  const panelBg = variant === "dark"
    ? "rgba(20, 18, 15, 0.96)"
    : "rgba(255, 253, 248, 0.96)";
  const panelBorder = variant === "dark"
    ? "var(--luxe-champagne-line, rgba(200,170,118,0.28))"
    : "rgba(200, 170, 118, 0.4)";
  const panelText = variant === "dark" ? "var(--luxe-soft-white)" : "var(--ink)";

  const panel = (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "single" ? "Select date" : "Select check-in and check-out dates"}
      onKeyDown={onGridKeyDown}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      exit="exit"
      variants={PANEL_VARIANTS}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: panelBg,
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        border: isMobile ? "none" : `1px solid ${panelBorder}`,
        borderRadius: isMobile ? 0 : 18,
        boxShadow: isMobile
          ? "none"
          : variant === "dark"
            ? "0 24px 64px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)"
            : "0 24px 64px rgba(20,18,15,0.18), 0 4px 12px rgba(20,18,15,0.08)",
        padding: isMobile ? "18px 16px calc(20px + env(safe-area-inset-bottom, 0))" : 22,
        color: panelText,
        width: isMobile ? "100vw" : "min(720px, calc(100vw - 24px))",
        maxWidth: "100vw",
        height: isMobile ? "100vh" : undefined,
        maxHeight: isMobile ? "100vh" : undefined,
        overflowY: isMobile ? "auto" : undefined,
        display: isMobile ? "flex" : undefined,
        flexDirection: isMobile ? "column" : undefined,
      }}
    >
      {/* Eyebrow + nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          aria-label="Previous month"
          style={navBtnStyle(variant, canGoPrev)}
        >
          {"‹"}
        </button>
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontSize: 10,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--luxe-champagne, #c8aa76)",
            fontWeight: 500,
          }}
        >
          {eyebrow}
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Next month"
          style={navBtnStyle(variant, canGoNext)}
        >
          {"›"}
        </button>
      </div>

      {/* Months */}
      <motion.div
        key={`${m1.year}-${m1.month}`}
        initial={prefersReducedMotion ? false : { opacity: 0, x: navDir * 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: "flex",
          gap: isMobile ? 0 : 28,
          flexWrap: "wrap",
          justifyContent: "center",
          flex: isMobile ? 1 : undefined,
          minHeight: 0,
        }}
      >
        {renderMonth(m1.year, m1.month, weeks1)}
        {showTwoMonths && (
          <div className="luxe-dp-second-month" style={{ display: "flex", flex: 1, minWidth: 240 }}>
            {renderMonth(m2.year, m2.month, weeks2)}
          </div>
        )}
      </motion.div>

      {/* Presets */}
      {presets.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 18,
            paddingTop: 14,
            borderTop: `1px solid ${variant === "dark" ? "var(--luxe-hairline, rgba(255,255,255,0.06))" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              style={presetChipStyle(variant)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginTop: 16,
          paddingTop: 14,
          borderTop: `1px solid ${variant === "dark" ? "var(--luxe-hairline, rgba(255,255,255,0.06))" : "rgba(0,0,0,0.06)"}`,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: 12,
            color: variant === "dark" ? "var(--luxe-soft-white-70)" : "var(--ink-light)",
            letterSpacing: "0.01em",
          }}
        >
          {mode === "single" ? (
            checkIn ? formatLong(checkIn) : "Pick a date"
          ) : checkIn && checkOut ? (
            <>
              <span style={{ color: variant === "dark" ? "var(--luxe-soft-white)" : "var(--ink)", fontWeight: 500 }}>
                {nights} night{nights !== 1 ? "s" : ""}
              </span>
              {"  ·  "}
              <span>{formatLong(checkIn)} → {formatLong(checkOut)}</span>
            </>
          ) : checkIn ? (
            <>
              <span>From </span>
              <span style={{ color: variant === "dark" ? "var(--luxe-soft-white)" : "var(--ink)", fontWeight: 500 }}>
                {formatLong(checkIn)}
              </span>
              <span>{"  ·  Pick check-out"}</span>
            </>
          ) : (
            <span>{mode === "range" ? "Free cancellation if available" : ""}</span>
          )}
        </div>
        <button
          type="button"
          onClick={closePanel}
          style={doneBtnStyle()}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#d8b985";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--luxe-champagne, #c8aa76)";
          }}
        >
          Done
        </button>
      </div>
    </motion.div>
  );

  /* ────────────────────────────────────────────────────────────────────── */
  /* Render — wrapper                                                        */
  /* ────────────────────────────────────────────────────────────────────── */

  return (
    <>
      {showTrigger && (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? closePanel() : openPanel("checkIn"))}
          className={className}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: "transparent",
            border: `1px solid ${variant === "dark" ? "var(--luxe-hairline-strong, rgba(255,255,255,0.12))" : "rgba(0,0,0,0.12)"}`,
            borderRadius: 10,
            color: variant === "dark" ? "var(--luxe-soft-white)" : "var(--ink)",
            fontFamily: "var(--font-body, sans-serif)",
            fontSize: 13,
            cursor: "pointer",
            ...style,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
          </svg>
          <span>
            {mode === "single"
              ? checkIn ? formatLong(checkIn) : (triggerLabel ?? placeholder)
              : checkIn && checkOut
                ? `${formatLong(checkIn)} → ${formatLong(checkOut)}`
                : checkIn
                  ? `${formatLong(checkIn)} → Pick check-out`
                  : (triggerLabel ?? placeholder)}
          </span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <div
            // Anchored vs centered modal layout. When an anchor is provided we
            // try to attach to its bottom-left; on small screens we fall back
            // to a centered overlay so the picker is always reachable.
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: isMobile ? "stretch" : "center",
              justifyContent: "center",
              padding: isMobile ? 0 : 12,
              pointerEvents: "none",
            }}
          >
            {/* Backdrop — subtle, doesn't darken the page much (this is a tool, not a takeover) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              onClick={closePanel}
              style={{
                position: "absolute",
                inset: 0,
                background: variant === "dark" ? "rgba(0,0,0,0.32)" : "rgba(20,18,15,0.18)",
                pointerEvents: "auto",
              }}
              aria-hidden
            />
            <div
              style={{
                position: "relative",
                pointerEvents: "auto",
                maxWidth: "100%",
                width: isMobile ? "100%" : undefined,
                display: isMobile ? "flex" : undefined,
              }}
            >
              {panel}
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Style helpers                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function navBtnStyle(variant: LuxeDatePickerVariant, enabled: boolean): CSSProperties {
  return {
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${variant === "dark" ? "var(--luxe-hairline-strong, rgba(255,255,255,0.12))" : "rgba(0,0,0,0.1)"}`,
    borderRadius: 999,
    background: "transparent",
    color: enabled
      ? variant === "dark" ? "var(--luxe-soft-white)" : "var(--ink)"
      : variant === "dark" ? "var(--luxe-soft-white-30, rgba(247,245,242,0.3))" : "rgba(0,0,0,0.25)",
    cursor: enabled ? "pointer" : "default",
    fontSize: 18,
    lineHeight: 1,
    fontFamily: "var(--font-body, sans-serif)",
    transition: "background 120ms ease, border-color 120ms ease",
  };
}

function presetChipStyle(variant: LuxeDatePickerVariant): CSSProperties {
  return {
    padding: "6px 12px",
    fontFamily: "var(--font-mono, monospace)",
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 500,
    color: "var(--luxe-champagne, #c8aa76)",
    background: variant === "dark" ? "rgba(200,170,118,0.08)" : "rgba(200,170,118,0.10)",
    border: "1px solid var(--luxe-champagne-line, rgba(200,170,118,0.28))",
    borderRadius: 999,
    cursor: "pointer",
    transition: "background 140ms ease, border-color 140ms ease",
  };
}

function doneBtnStyle(): CSSProperties {
  return {
    padding: "10px 22px",
    background: "var(--luxe-champagne, #c8aa76)",
    color: "var(--luxe-black, #0c0b0a)",
    border: "none",
    borderRadius: 999,
    fontFamily: "var(--font-body, sans-serif)",
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "background 140ms ease",
  };
}
