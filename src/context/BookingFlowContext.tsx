"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

/* ── Types ── */

export interface RoomType {
  id: string;
  name: string;
  description: string;
  bedType: string;
  maxGuests: number;
  amenities: string[];
  pricePerNight: number;
  currency: string;
  image: string;
  available: boolean;
}

export interface SelectedRoom {
  roomType: RoomType;
  quantity: number;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
}

export interface PaymentInfo {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface BookingFlowState {
  hotelName: string;
  hotelImage: string;
  hotelCity: string;
  hotelStars: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  selectedRooms: SelectedRoom[];
  guestInfo: GuestInfo | null;
  paymentInfo: PaymentInfo | null;
  bookingId: string | null;
}

interface BookingFlowContextValue extends BookingFlowState {
  totalPrice: number;
  currency: string;
  setHotel: (name: string, image: string, city: string, stars: number) => void;
  setStayDates: (checkIn: string, checkOut: string) => void;
  setSelectedRooms: (rooms: SelectedRoom[]) => void;
  setGuestInfo: (info: GuestInfo) => void;
  setPaymentInfo: (info: PaymentInfo) => void;
  confirmBooking: () => string;
  resetFlow: () => void;
}

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null);

const INITIAL_STATE: BookingFlowState = {
  hotelName: "",
  hotelImage: "",
  hotelCity: "",
  hotelStars: 5,
  checkIn: "",
  checkOut: "",
  nights: 0,
  selectedRooms: [],
  guestInfo: null,
  paymentInfo: null,
  bookingId: null,
};

function generateBookingId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  const year = new Date().getFullYear();
  return `VGR-${code}-${year}`;
}

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingFlowState>(INITIAL_STATE);

  const setHotel = useCallback((name: string, image: string, city: string, stars: number) => {
    setState((prev) => ({ ...prev, hotelName: name, hotelImage: image, hotelCity: city, hotelStars: stars }));
  }, []);

  const setStayDates = useCallback((checkIn: string, checkOut: string) => {
    const nights = Math.max(1, Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
    ));
    setState((prev) => ({ ...prev, checkIn, checkOut, nights }));
  }, []);

  const setSelectedRooms = useCallback((rooms: SelectedRoom[]) => {
    setState((prev) => ({ ...prev, selectedRooms: rooms }));
  }, []);

  const setGuestInfo = useCallback((info: GuestInfo) => {
    setState((prev) => ({ ...prev, guestInfo: info }));
  }, []);

  const setPaymentInfo = useCallback((info: PaymentInfo) => {
    setState((prev) => ({ ...prev, paymentInfo: info }));
  }, []);

  const confirmBooking = useCallback(() => {
    const id = generateBookingId();
    setState((prev) => ({ ...prev, bookingId: id }));
    return id;
  }, []);

  const resetFlow = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const totalPrice = state.selectedRooms.reduce(
    (sum, r) => sum + r.roomType.pricePerNight * r.quantity * state.nights,
    0
  );
  const currency = state.selectedRooms[0]?.roomType.currency || "USD";

  return (
    <BookingFlowContext.Provider value={{
      ...state,
      totalPrice,
      currency,
      setHotel,
      setStayDates,
      setSelectedRooms,
      setGuestInfo,
      setPaymentInfo,
      confirmBooking,
      resetFlow,
    }}>
      {children}
    </BookingFlowContext.Provider>
  );
}

export function useBookingFlow() {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) throw new Error("useBookingFlow must be used within BookingFlowProvider");
  return ctx;
}
