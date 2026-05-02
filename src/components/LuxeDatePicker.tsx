"use client";

/* ════════════════════════════════════════════════════════════════════════════
   LuxeDatePicker
   ──────────────
   One world-class, brand-coherent date-range picker for the entire site.
   Replaces every `<input type="date">` and powers the popover inside DateBar.

   Design language:
     • Charcoal var(--luxe-black) · champagne var(--luxe-champagne) · ivory var(--cream)
     • Glass blur (backdrop-filter) on the popover panel
     • Playfair Display italic for month names
     • JetBrains Mono caps for day-of-week + eyebrow + presets
     • Manrope for date numbers and body
     • Two months side-by-side ≥640px; vertical scroll-stack on mobile
     • Past dates dimmed and disabled
     • Today gets a subtle champagne dot
     • Range hover preview while choosing check-out
     • Quick presets (this weekend, next weekend, 1w, 2w)
     • Footer shows nights count + "Confirm" gold pill

   Mobile (≤640px) uses a true iOS-style bottom sheet:
     • Slide-up from bottom, ~92vh, 28px top corners, drag handle
     • Sticky header (title + live subtitle + × close)
     • Sticky weekday bar
     • Vertical scroll-stack of months, ~18 months out
     • 44×44 minimum tap targets (clamp(44px, 13vw, 56px))
     • Sticky bottom action bar with nights summary + Confirm pill
     • Backdrop fade + slide-down close, body scroll lock, Esc parity

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
  useLayoutEffect,
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

function formatShort(iso: string | null): string {
  if (!iso) return "";
  return fromIso(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric",
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

const DESKTOP_PANEL_VARIANTS = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: -2 },
};

const MOBILE_SHEET_VARIANTS = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
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
  const sheetScrollRef = useRef<HTMLDivElement | null>(null);
  const monthRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Track whether we're rendering into a phone-sized viewport so we can
  // switch to a bottom-sheet layout instead of the desktop popover.
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

  // Body-scroll lock + Esc key while sheet/popover is open.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevTouch = document.body.style.touchAction;
    if (isMobile) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouch;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, isMobile, closePanel]);

  // Outside click — desktop only. On mobile the backdrop has its own onClick
  // and the sheet is full-bleed, so there's no "outside" mouse target.
  useEffect(() => {
    if (!open || isMobile) return;
    function onDocMouseDown(e: MouseEvent) {
      const t = e.target as Node;
      if (panelRef.current && panelRef.current.contains(t)) return;
      if (triggerRef.current && triggerRef.current.contains(t)) return;
      const anchor = anchorRef?.current;
      if (anchor && anchor.contains(t)) return;
      closePanel();
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
    };
  }, [open, isMobile, anchorRef, closePanel]);

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

  /* ─── mobile vertical-scroll month list ─── */
  // Build the full list of months from `today` up to maxIso so users can
  // scroll through 18 months in one continuous list — feels native, no nav.
  const mobileMonths = useMemo(() => {
    if (!isMobile) return [];
    const start = new Date();
    start.setDate(1);
    const end = fromIso(maxIso);
    const out: { year: number; month: number; key: string }[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cur <= end) {
      out.push({
        year: cur.getFullYear(),
        month: cur.getMonth(),
        key: `${cur.getFullYear()}-${cur.getMonth()}`,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  }, [isMobile, maxIso]);

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
          // Desktop: auto-close on completed range.
          // Mobile: keep sheet open so the user can hit Confirm — gives a
          // clear "I'm done" moment and is consistent with iOS patterns.
          if (!isMobile) closePanel();
        }
      }
    },
    [mode, selecting, checkIn, checkOut, onChange, closePanel, isMobile],
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
      if (!focusIso || isMobile) return;
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
    [focusIso, isMobile, minIso, maxIso, handleDayClick, baseDate, showTwoMonths],
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
      // On mobile: scroll the picked month into view in the long stack.
      if (isMobile) {
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        // Defer to next frame so DOM has settled.
        requestAnimationFrame(() => {
          const el = monthRefs.current.get(key);
          if (el && sheetScrollRef.current) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      }
    },
    [onChange, isMobile],
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

  /* ─── auto-scroll the relevant month into view on mobile ─── */
  // When the sheet opens, jump to the month containing checkIn (or today).
  // When the user has just picked check-in and is now picking check-out,
  // smooth-scroll to the check-in month so they can continue from context.
  useLayoutEffect(() => {
    if (!isMobile || !open) return;
    const anchorIso =
      (mode === "range" && selecting === "checkOut" && checkIn) ||
      checkIn ||
      today;
    if (!anchorIso) return;
    const d = fromIso(anchorIso);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    // Two passes: first an instant jump on open, then any subsequent updates
    // scroll smoothly. We don't have a "just-opened" flag, so always smooth.
    requestAnimationFrame(() => {
      const el = monthRefs.current.get(key);
      const scroller = sheetScrollRef.current;
      if (!el || !scroller) return;
      // Use scrollTop math (not scrollIntoView) so we don't pull the parent
      // page along — the scroller is the months list inside the sheet.
      const top = el.offsetTop - 4;
      scroller.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  }, [open, isMobile, selecting, checkIn, today, mode, prefersReducedMotion]);

  /* ────────────────────────────────────────────────────────────────────── */
  /* Render — month                                                          */
  /* ────────────────────────────────────────────────────────────────────── */

  const renderMonth = (
    year: number,
    month: number,
    weeks: DayCell[][],
    opts: { mobile?: boolean; showWeekdays?: boolean } = {},
  ) => {
    const { mobile = false, showWeekdays = true } = opts;
    const cellHeight = mobile ? "clamp(44px, 13vw, 56px)" : 42;
    const pillSize = mobile ? "clamp(40px, 12vw, 50px)" : 38;
    const numberFontSize = mobile ? 16 : 14;

    return (
      <div
        style={{
          flex: 1,
          minWidth: mobile ? 0 : 240,
          width: mobile ? "100%" : undefined,
          marginBottom: mobile ? 4 : 0,
        }}
      >
        {/* Month name — Playfair italic with champagne underline */}
        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-display, serif)",
            fontStyle: "italic",
            fontSize: mobile ? 24 : 22,
            fontWeight: 500,
            letterSpacing: "0.005em",
            color: variant === "dark" ? "var(--luxe-soft-white)" : "var(--ink)",
            marginBottom: 14,
            paddingBottom: 10,
            position: "relative",
          }}
        >
          {MONTH_NAMES[month]}{" "}
          <span style={{ fontStyle: "normal", color: "var(--luxe-champagne, var(--luxe-champagne))", fontWeight: 400 }}>
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
              background: "linear-gradient(90deg, transparent, var(--luxe-champagne, var(--luxe-champagne)), transparent)",
            }}
          />
        </div>

        {/* Weekday header — JetBrains Mono caps. On mobile this is rendered
            once at the sheet level (sticky), so suppress it per-month. */}
        {showWeekdays && (
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
        )}

        {/* Day cells */}
        <div role="grid">
          {weeks.map((week, wi) => (
            <div
              key={wi}
              role="row"
              style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}
            >
              {week.map((cell, ci) => {
                if (!cell.iso) return <div key={ci} style={{ height: cellHeight }} />;

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
                const isFocused = focusIso === cell.iso && !mobile;

                // Range fill stretches edge-to-edge of the row cell. Force it to
                // sit BEHIND the day-number pill (z-index: 0) so the number is
                // always legible — even on selected check-in/check-out, where the
                // champagne pill paints atop a tinted row.
                const cellStyle: CSSProperties = {
                  position: "relative",
                  height: cellHeight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: disabled ? "default" : "pointer",
                  background: inRange
                    ? "rgba(200, 170, 118, 0.18)"
                    : "transparent",
                  // Square the range edges so the connecting tint reads as a single bar.
                  borderRadius: isCheckIn && mode === "range" && checkOut
                    ? "999px 0 0 999px"
                    : isCheckOut
                      ? "0 999px 999px 0"
                      : isCheckIn && mode === "range" && !checkOut
                        ? "999px"
                        : 0,
                  zIndex: 0,
                  // Mobile: make the entire cell the tap target (44+ px).
                  WebkitTapHighlightColor: "transparent",
                };

                const pillStyle: CSSProperties = {
                  width: pillSize,
                  height: pillSize,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  background: isSelected
                    ? "var(--luxe-champagne, var(--luxe-champagne))"
                    : "transparent",
                  // Selected: charcoal text on champagne fill (button-grade contrast).
                  // In-range: keep numbers in the soft-white / ink tone — readable on
                  // the 0.18 champagne tint without losing range continuity.
                  color: disabled
                    ? variant === "dark"
                      ? "var(--luxe-soft-white-30, rgba(247,245,242,0.3))"
                      : "rgba(0,0,0,0.25)"
                    : isSelected
                      ? "var(--luxe-black, var(--luxe-black))"
                      : variant === "dark"
                        ? "var(--luxe-soft-white)"
                        : "var(--ink)",
                  fontFamily: "var(--font-body, sans-serif)",
                  fontSize: numberFontSize,
                  fontWeight: isSelected ? 600 : cell.isToday ? 600 : 400,
                  outline: isFocused
                    ? `1px solid ${isSelected ? "rgba(12,11,10,0.6)" : "var(--luxe-champagne, var(--luxe-champagne))"}`
                    : "none",
                  outlineOffset: isFocused ? 2 : 0,
                  transition: prefersReducedMotion
                    ? "none"
                    : "background 80ms ease-out, color 120ms ease, transform 80ms ease-out",
                  position: "relative",
                  // Day number always sits above the range fill.
                  zIndex: 1,
                  // Apple-style press feedback.
                  willChange: "transform",
                };

                return (
                  <div
                    key={ci}
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-disabled={disabled}
                    aria-label={cell.iso}
                    onClick={() => !disabled && handleDayClick(cell.iso)}
                    onMouseEnter={() => !disabled && !mobile && setHoverIso(cell.iso)}
                    onMouseLeave={() => !mobile && setHoverIso(null)}
                    onFocus={() => !mobile && setFocusIso(cell.iso)}
                    onTouchStart={(e) => {
                      if (disabled) return;
                      const pill = (e.currentTarget.firstElementChild as HTMLDivElement | null);
                      if (pill && !prefersReducedMotion) {
                        pill.style.transform = "scale(0.92)";
                        if (!isSelected) {
                          pill.style.background = "rgba(200, 170, 118, 0.30)";
                        }
                      }
                    }}
                    onTouchEnd={(e) => {
                      if (disabled) return;
                      const pill = (e.currentTarget.firstElementChild as HTMLDivElement | null);
                      if (pill && !prefersReducedMotion) {
                        pill.style.transform = "";
                        if (!isSelected) pill.style.background = "transparent";
                      }
                    }}
                    onTouchCancel={(e) => {
                      const pill = (e.currentTarget.firstElementChild as HTMLDivElement | null);
                      if (pill) {
                        pill.style.transform = "";
                        if (!isSelected) pill.style.background = "transparent";
                      }
                    }}
                    tabIndex={disabled || mobile ? -1 : isFocused ? 0 : -1}
                    style={cellStyle}
                  >
                    <div
                      style={pillStyle}
                      onMouseEnter={(e) => {
                        if (disabled || isSelected || mobile) return;
                        (e.currentTarget as HTMLDivElement).style.background =
                          "rgba(200, 170, 118, 0.28)";
                      }}
                      onMouseLeave={(e) => {
                        if (disabled || isSelected || mobile) return;
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
                            bottom: mobile ? 7 : 5,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            background: "var(--luxe-champagne, var(--luxe-champagne))",
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
  };

  /* ────────────────────────────────────────────────────────────────────── */
  /* Render — popover panel (DESKTOP)                                        */
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

  const desktopPanel = (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "single" ? "Select date" : "Select check-in and check-out dates"}
      onKeyDown={onGridKeyDown}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      exit="exit"
      variants={DESKTOP_PANEL_VARIANTS}
      transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: panelBg,
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        border: `1px solid ${panelBorder}`,
        borderRadius: 18,
        boxShadow: variant === "dark"
          ? "0 24px 64px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35)"
          : "0 24px 64px rgba(20,18,15,0.18), 0 4px 12px rgba(20,18,15,0.08)",
        padding: 22,
        color: panelText,
        width: "min(720px, calc(100vw - 24px))",
        maxWidth: "100vw",
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
            color: "var(--luxe-champagne, var(--luxe-champagne))",
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
          gap: 28,
          flexWrap: "wrap",
          justifyContent: "center",
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
            (e.currentTarget as HTMLButtonElement).style.background = "var(--luxe-champagne, var(--luxe-champagne))";
          }}
        >
          Done
        </button>
      </div>
    </motion.div>
  );

  /* ────────────────────────────────────────────────────────────────────── */
  /* Render — bottom sheet (MOBILE)                                          */
  /* ────────────────────────────────────────────────────────────────────── */

  // Live header subtitle: communicates state without making the user hunt
  // for it in the footer. Updates the moment a date is tapped.
  const mobileSubtitle = (() => {
    if (mode === "single") {
      return checkIn ? formatLong(checkIn) : "Choose a date";
    }
    if (checkIn && checkOut) {
      return `${formatShort(checkIn)} → ${formatShort(checkOut)} · ${nights} night${nights !== 1 ? "s" : ""}`;
    }
    if (checkIn) {
      return `From ${formatShort(checkIn)} · pick check-out`;
    }
    return "Choose check-in";
  })();

  const sheetTitle = mode === "single" ? "Select date" : "Select dates";
  const canConfirm = mode === "single" ? !!checkIn : !!(checkIn && checkOut);

  // Sheet surface always renders dark on mobile to feel premium and stand
  // apart from the page chrome. We still respect `variant` for token mapping
  // back to the desktop sub-renderer (e.g. weekday text color), but the sheet
  // itself uses charcoal + champagne always.
  const sheetSurface = "rgba(20, 18, 15, 0.98)";
  const sheetText = "var(--luxe-soft-white)";
  const sheetSubText = "var(--luxe-soft-white-70)";
  const sheetMutedText = "var(--luxe-soft-white-50)";
  const sheetHairline = "rgba(255, 255, 255, 0.07)";

  const mobileSheet = (
    <motion.div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "single" ? "Select date" : "Select check-in and check-out dates"}
      initial={prefersReducedMotion ? false : "hidden"}
      animate="visible"
      exit="exit"
      variants={MOBILE_SHEET_VARIANTS}
      transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        height: "92vh",
        background: sheetSurface,
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        boxShadow: "0 -12px 48px rgba(0,0,0,0.55)",
        color: sheetText,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        // Top hairline kiss of champagne to set a luxe edge against backdrop.
        borderTop: "1px solid var(--luxe-champagne-line, rgba(200,170,118,0.28))",
      }}
    >
      {/* Drag handle */}
      <div
        aria-hidden
        style={{
          position: "relative",
          height: 18,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 8,
        }}
      >
        <span
          style={{
            width: 44,
            height: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,0.18)",
          }}
        />
      </div>

      {/* Sticky header */}
      <div
        style={{
          flexShrink: 0,
          padding: "6px 20px 14px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          borderBottom: `1px solid ${sheetHairline}`,
          background: sheetSurface,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-display, serif)",
              fontStyle: "italic",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.005em",
              color: sheetText,
              lineHeight: 1.1,
            }}
          >
            {sheetTitle}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body, sans-serif)",
              fontSize: 13,
              color: checkIn ? sheetSubText : "var(--luxe-champagne)",
              letterSpacing: "0.01em",
              marginTop: 4,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {mobileSubtitle}
          </div>
        </div>
        <button
          type="button"
          onClick={closePanel}
          aria-label="Close"
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 999,
            background: "transparent",
            color: sheetText,
            cursor: "pointer",
            flexShrink: 0,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M6 6 18 18M18 6 6 18" />
          </svg>
        </button>
      </div>

      {/* Presets row — horizontal scroller (only in range mode) */}
      {presets.length > 0 && (
        <div
          style={{
            flexShrink: 0,
            padding: "12px 16px 4px",
            borderBottom: `1px solid ${sheetHairline}`,
            background: sheetSurface,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              scrollSnapType: "x proximity",
              paddingBottom: 8,
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
            }}
          >
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                style={{
                  ...presetChipStyle(variant),
                  scrollSnapAlign: "start",
                  flexShrink: 0,
                  padding: "8px 14px",
                  fontSize: 11,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sticky weekday bar */}
      <div
        style={{
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          padding: "10px 16px",
          borderBottom: `1px solid ${sheetHairline}`,
          background: sheetSurface,
        }}
      >
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
              color: sheetMutedText,
            }}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Scrollable months stack */}
      <div
        ref={sheetScrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: "16px 16px 12px",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {mobileMonths.map((mm) => {
          const weeks = buildMonth(mm.year, mm.month, minIso, maxIso, today);
          return (
            <div
              key={mm.key}
              ref={(el) => {
                if (el) monthRefs.current.set(mm.key, el);
                else monthRefs.current.delete(mm.key);
              }}
              style={{ marginBottom: 18 }}
            >
              {renderMonth(mm.year, mm.month, weeks, { mobile: true, showWeekdays: false })}
            </div>
          );
        })}
        <div style={{ height: 12 }} />
      </div>

      {/* Sticky bottom action bar */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 16px calc(14px + env(safe-area-inset-bottom, 0))",
          borderTop: `1px solid ${sheetHairline}`,
          background: sheetSurface,
        }}
      >
        <div style={{ minWidth: 0 }}>
          {mode === "range" ? (
            checkIn && checkOut ? (
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: 11,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: "var(--luxe-champagne)",
                  }}
                >
                  {nights} night{nights !== 1 ? "s" : ""}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body, sans-serif)",
                    fontSize: 12,
                    color: sheetSubText,
                    marginTop: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {formatShort(checkIn)} → {formatShort(checkOut)}
                </div>
              </div>
            ) : (
              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: sheetMutedText,
                  fontWeight: 500,
                }}
              >
                {checkIn ? "Pick check-out" : "Pick check-in"}
              </div>
            )
          ) : (
            <div
              style={{
                fontFamily: "var(--font-body, sans-serif)",
                fontSize: 13,
                color: checkIn ? sheetSubText : sheetMutedText,
              }}
            >
              {checkIn ? formatLong(checkIn) : "Pick a date"}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={closePanel}
          disabled={!canConfirm}
          style={{
            ...doneBtnStyle(),
            padding: "13px 28px",
            fontSize: 14,
            opacity: canConfirm ? 1 : 0.5,
            cursor: canConfirm ? "pointer" : "not-allowed",
            minHeight: 48,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          Confirm
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
          isMobile ? (
            // Mobile: full-screen overlay with backdrop + slide-up sheet.
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                pointerEvents: "auto",
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.22 }}
                onClick={closePanel}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.55)",
                }}
                aria-hidden
              />
              {mobileSheet}
            </div>
          ) : (
            // Desktop: centered popover with light backdrop.
            <div
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
                pointerEvents: "none",
              }}
            >
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
                }}
              >
                {desktopPanel}
              </div>
            </div>
          )
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
    color: "var(--luxe-champagne, var(--luxe-champagne))",
    background: variant === "dark" ? "rgba(200,170,118,0.08)" : "rgba(200,170,118,0.10)",
    border: "1px solid var(--luxe-champagne-line, rgba(200,170,118,0.28))",
    borderRadius: 999,
    cursor: "pointer",
    transition: "background 140ms ease, border-color 140ms ease",
    whiteSpace: "nowrap",
  };
}

function doneBtnStyle(): CSSProperties {
  return {
    padding: "10px 22px",
    background: "var(--luxe-champagne, var(--luxe-champagne))",
    color: "var(--luxe-black, var(--luxe-black))",
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
