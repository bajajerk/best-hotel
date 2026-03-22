"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface BookingDates {
  checkIn: string;   // ISO date string YYYY-MM-DD or ""
  checkOut: string;  // ISO date string YYYY-MM-DD or ""
}

interface BookingContextValue extends BookingDates {
  setCheckIn: (date: string) => void;
  setCheckOut: (date: string) => void;
  setDates: (checkIn: string, checkOut: string) => void;
  /** Format a stored ISO date as "Mon DD" for display, or return fallback */
  formatDate: (isoDate: string, fallback?: string) => string;
}

const BookingContext = createContext<BookingContextValue | null>(null);

const STORAGE_KEY = "voyagr_booking_dates";

function loadDates(): BookingDates {
  if (typeof window === "undefined") return { checkIn: "", checkOut: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        checkIn: parsed.checkIn || "",
        checkOut: parsed.checkOut || "",
      };
    }
  } catch {
    // ignore
  }
  return { checkIn: "", checkOut: "" };
}

function saveDates(dates: BookingDates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
  } catch {
    // ignore
  }
}

function formatDateShort(isoDate: string, fallback = "Select date"): string {
  if (!isoDate) return fallback;
  const d = new Date(isoDate + "T00:00:00");
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [dates, setDatesState] = useState<BookingDates>({ checkIn: "", checkOut: "" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDatesState(loadDates());
    setHydrated(true);
  }, []);

  const updateDates = useCallback((next: BookingDates) => {
    setDatesState(next);
    saveDates(next);
  }, []);

  const setCheckIn = useCallback((checkIn: string) => {
    setDatesState((prev) => {
      const next = { ...prev, checkIn };
      saveDates(next);
      return next;
    });
  }, []);

  const setCheckOut = useCallback((checkOut: string) => {
    setDatesState((prev) => {
      const next = { ...prev, checkOut };
      saveDates(next);
      return next;
    });
  }, []);

  const setDates = useCallback((checkIn: string, checkOut: string) => {
    updateDates({ checkIn, checkOut });
  }, [updateDates]);

  const formatDate = useCallback((isoDate: string, fallback?: string) => {
    return formatDateShort(isoDate, fallback);
  }, []);

  // Don't render children until hydrated to avoid mismatch
  if (!hydrated) return null;

  return (
    <BookingContext.Provider value={{ ...dates, setCheckIn, setCheckOut, setDates, formatDate }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
