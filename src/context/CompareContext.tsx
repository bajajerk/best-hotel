"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { CuratedHotel } from "@/lib/api";
import { trackCompareHotelAdded, trackCompareHotelRemoved } from "@/lib/analytics";

const MAX_COMPARE = 4;

interface CompareContextValue {
  hotels: CuratedHotel[];
  add: (hotel: CuratedHotel) => void;
  remove: (hotelId: number) => void;
  clear: () => void;
  has: (hotelId: number) => boolean;
  isFull: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [hotels, setHotels] = useState<CuratedHotel[]>([]);

  const add = useCallback((hotel: CuratedHotel) => {
    setHotels((prev) => {
      if (prev.length >= MAX_COMPARE) return prev;
      if (prev.some((h) => h.hotel_id === hotel.hotel_id)) return prev;
      const next = [...prev, hotel];
      trackCompareHotelAdded({
        hotel_id: hotel.hotel_id,
        hotel_name: hotel.hotel_name,
        city: hotel.city_name,
        compare_count: next.length,
      });
      return next;
    });
  }, []);

  const remove = useCallback((hotelId: number) => {
    setHotels((prev) => {
      const removed = prev.find((h) => h.hotel_id === hotelId);
      const next = prev.filter((h) => h.hotel_id !== hotelId);
      if (removed) {
        trackCompareHotelRemoved({
          hotel_id: removed.hotel_id,
          hotel_name: removed.hotel_name,
          compare_count: next.length,
        });
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setHotels([]), []);

  const has = useCallback(
    (hotelId: number) => hotels.some((h) => h.hotel_id === hotelId),
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
