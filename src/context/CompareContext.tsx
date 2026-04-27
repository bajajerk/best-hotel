"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { CuratedHotel } from "@/lib/api";
import { trackCompareHotelAdded, trackCompareHotelRemoved } from "@/lib/analytics";

const MAX_COMPARE = 4;

interface CompareContextValue {
  hotels: CuratedHotel[];
  add: (hotel: CuratedHotel) => void;
  /** Hotel master UUID. */
  remove: (masterId: string) => void;
  clear: () => void;
  has: (masterId: string) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [hotels, setHotels] = useState<CuratedHotel[]>([]);

  const add = useCallback((hotel: CuratedHotel) => {
    setHotels((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some((h) => h.master_id === hotel.master_id)) return prev;
      const next = [...prev, hotel];
      trackCompareHotelAdded({
        hotel_id: hotel.master_id,
        hotel_name: hotel.hotel_name,
        city: hotel.city_name,
        compare_count: next.length,
      });
      return next;
    });
  }, []);

  const remove = useCallback((masterId: string) => {
    setHotels((prev) => {
      const removed = prev.find((h) => h.master_id === masterId);
      const next = prev.filter((h) => h.master_id !== masterId);
      if (removed) {
        trackCompareHotelRemoved({
          hotel_id: removed.master_id,
          hotel_name: removed.hotel_name,
          compare_count: next.length,
        });
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setHotels([]), []);

  const has = useCallback(
    (masterId: string) => hotels.some((h) => h.master_id === masterId),
    [hotels]
  );

  return (
    <CompareContext.Provider
      value={{ hotels, add, remove, clear, has, isFull: hotels.length >= MAX_COMPARE }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}
