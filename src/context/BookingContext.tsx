"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { trackBookingDatesChanged, trackGuestsChanged } from "@/lib/analytics";

interface BookingDates {
  checkIn: string;   // ISO date string YYYY-MM-DD or ""
  checkOut: string;  // ISO date string YYYY-MM-DD or ""
}

export interface RoomGuests {
  adults: number;
  children: number;
}

interface BookingState extends BookingDates {
  destination: string;
  nights: number;
  rooms: RoomGuests[];
}

interface BookingContextValue extends BookingState {
  setDestination: (destination: string) => void;
  setCheckIn: (date: string) => void;
  setCheckOut: (date: string) => void;
  setDates: (checkIn: string, checkOut: string) => void;
  setRooms: (rooms: RoomGuests[]) => void;
  addRoom: () => void;
  removeRoom: (index: number) => void;
  setRoomAdults: (index: number, count: number) => void;
  setRoomChildren: (index: number, count: number) => void;
  totalAdults: number;
  totalChildren: number;
  totalGuests: number;
  guestSummary: string;
  /** Format a stored ISO date as "Mon DD" for display, or return fallback */
  formatDate: (isoDate: string, fallback?: string) => string;
}

const BookingContext = createContext<BookingContextValue | null>(null);

const STORAGE_KEY = "voyagr_booking_dates";
const ROOMS_STORAGE_KEY = "voyagr_booking_rooms";
const DESTINATION_STORAGE_KEY = "voyagr_booking_destination";

const DEFAULT_ROOM: RoomGuests = { adults: 2, children: 0 };

function loadDestination(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(DESTINATION_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function saveDestination(dest: string) {
  try {
    localStorage.setItem(DESTINATION_STORAGE_KEY, dest);
  } catch {
    // ignore
  }
}

function calculateNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

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

function loadRooms(): RoomGuests[] {
  if (typeof window === "undefined") return [{ ...DEFAULT_ROOM }];
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [{ ...DEFAULT_ROOM }];
}

function saveDates(dates: BookingDates) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dates));
  } catch {
    // ignore
  }
}

function saveRooms(rooms: RoomGuests[]) {
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
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
  const [destination, setDestinationState] = useState("");
  const [rooms, setRoomsState] = useState<RoomGuests[]>([{ ...DEFAULT_ROOM }]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDatesState(loadDates());
    setDestinationState(loadDestination());
    setRoomsState(loadRooms());
    setHydrated(true);
  }, []);

  const setDestination = useCallback((dest: string) => {
    setDestinationState(dest);
    saveDestination(dest);
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
    if (checkIn && checkOut) {
      const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)));
      trackBookingDatesChanged({ check_in: checkIn, check_out: checkOut, nights, source: 'date_picker' });
    }
  }, [updateDates]);

  const setRooms = useCallback((newRooms: RoomGuests[]) => {
    setRoomsState(newRooms);
    saveRooms(newRooms);
    const adults = newRooms.reduce((s, r) => s + r.adults, 0);
    const children = newRooms.reduce((s, r) => s + r.children, 0);
    trackGuestsChanged({ rooms: newRooms.length, adults, children, source: 'guest_picker' });
  }, []);

  const addRoom = useCallback(() => {
    setRoomsState((prev) => {
      if (prev.length >= 5) return prev;
      const next = [...prev, { ...DEFAULT_ROOM }];
      saveRooms(next);
      return next;
    });
  }, []);

  const removeRoom = useCallback((index: number) => {
    setRoomsState((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      saveRooms(next);
      return next;
    });
  }, []);

  const setRoomAdults = useCallback((index: number, count: number) => {
    setRoomsState((prev) => {
      const next = prev.map((r, i) => i === index ? { ...r, adults: Math.max(1, Math.min(6, count)) } : r);
      saveRooms(next);
      return next;
    });
  }, []);

  const setRoomChildren = useCallback((index: number, count: number) => {
    setRoomsState((prev) => {
      const next = prev.map((r, i) => i === index ? { ...r, children: Math.max(0, Math.min(4, count)) } : r);
      saveRooms(next);
      return next;
    });
  }, []);

  const totalAdults = rooms.reduce((sum, r) => sum + r.adults, 0);
  const totalChildren = rooms.reduce((sum, r) => sum + r.children, 0);
  const totalGuests = totalAdults + totalChildren;

  const guestSummary = (() => {
    const parts: string[] = [];
    parts.push(`${rooms.length} Room${rooms.length > 1 ? "s" : ""}`);
    parts.push(`${totalAdults} Adult${totalAdults !== 1 ? "s" : ""}`);
    if (totalChildren > 0) parts.push(`${totalChildren} Child${totalChildren !== 1 ? "ren" : ""}`);
    return parts.join(", ");
  })();

  const formatDate = useCallback((isoDate: string, fallback?: string) => {
    return formatDateShort(isoDate, fallback);
  }, []);

  // Don't render children until hydrated to avoid mismatch
  if (!hydrated) return null;

  return (
    <BookingContext.Provider value={{
      ...dates,
      destination,
      nights: calculateNights(dates.checkIn, dates.checkOut),
      rooms,
      setDestination,
      setCheckIn, setCheckOut, setDates,
      setRooms, addRoom, removeRoom, setRoomAdults, setRoomChildren,
      totalAdults, totalChildren, totalGuests, guestSummary,
      formatDate,
    }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
}
