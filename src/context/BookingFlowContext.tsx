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

export interface RoomGuest {
  firstName: string;
  lastName: string;
  specialRequests: string;
}

export interface IdentityInfo {
  pan: string;
  gstin: string;
}

export interface PaymentInfo {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export type PaymentMethodKind = "upi" | "credit-card" | "debit-card" | "emi" | "net-banking";

export interface BookingFlowState {
  // Hotel meta (live data from /api/hotels/{path}/rates or RatePlan).
  // Post-Phase D this is the hotel master UUID (canonical), threaded through
  // every step of the booking flow and submitted as `hotel_master_id` to
  // POST /api/bookings.
  hotelMasterId: string | null;
  hotelName: string;
  hotelImage: string;
  hotelPhoto: string;
  hotelCity: string;
  hotelStars: number;

  // Rate plan / room (live from RatePlan)
  optionId: string;
  roomName: string;
  mealBasis: string;
  refundable: boolean;
  freeCancelUntil: string;
  totalPrice: number;
  bestMarketRate: number | null;
  currency: string;

  // Stay
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  rooms: number;

  // Guest
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string;

  // Legacy (kept for back-compat with older flow code paths)
  selectedRooms: SelectedRoom[];
  guestInfo: GuestInfo | null;
  roomGuests: RoomGuest[];
  identity: IdentityInfo;
  paymentInfo: PaymentInfo | null;
  paymentMethod: PaymentMethodKind | null;

  // Booking outcome
  bookingId: number | null;
  /** Epoch ms when the 5-minute rate hold began. null = not yet started. */
  holdStartedAt: number | null;

  /** MMADPay merchant_txnid carried from /book/payment to /book/payment/processing. */
  paymentTxnid: string | null;
  /** Backend payments.id for the active attempt (for admin lookups + recovery). */
  paymentId: number | null;
  /** Last-known payment status — keeps the polling loop sticky across page nav. */
  paymentStatus:
    | "CREATED"
    | "PENDING"
    | "SUCCESS"
    | "FAILED"
    | "EXCEPTION"
    | "CHARGEBACK"
    | "REFUNDED"
    | "PARTIAL_REFUND"
    | "LIEN"
    | "UNKNOWN"
    | null;
  /** UPI deep-link for INTENT flow ('upi://pay?...') — keep for reopen-on-app-switch. */
  paymentIntentUrl: string | null;
}

export interface RatePlanInput {
  /** Hotel master UUID. */
  hotelMasterId: string;
  hotelName?: string;
  hotelPhoto?: string;
  hotelCity?: string;
  hotelStars?: number;
  optionId: string;
  roomName: string;
  mealBasis: string;
  refundable: boolean;
  freeCancelUntil: string;
  totalPrice: number;
  bestMarketRate?: number | null;
  currency: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
}

interface BookingFlowContextValue extends BookingFlowState {
  /** Total room count across all selectedRooms (sum of quantities). Legacy. */
  totalRoomCount: number;
  setHotel: (name: string, image: string, city: string, stars: number) => void;
  setHotelMeta: (meta: { hotelMasterId?: string; hotelName?: string; hotelPhoto?: string; hotelCity?: string; hotelStars?: number }) => void;
  setRatePlan: (plan: RatePlanInput) => void;
  setStayDates: (checkIn: string, checkOut: string) => void;
  setSelectedRooms: (rooms: SelectedRoom[]) => void;
  setGuestInfo: (info: GuestInfo) => void;
  setGuestDetails: (info: { guestName: string; guestEmail: string; guestPhone: string; specialRequests: string }) => void;
  setRoomGuests: (guests: RoomGuest[]) => void;
  setIdentity: (info: IdentityInfo) => void;
  setPaymentInfo: (info: PaymentInfo) => void;
  setPaymentMethod: (m: PaymentMethodKind | null) => void;
  setBookingId: (id: number) => void;
  setPaymentAttempt: (attempt: {
    paymentTxnid: string;
    paymentId: number;
    paymentStatus: BookingFlowState["paymentStatus"];
    paymentIntentUrl?: string | null;
  }) => void;
  setPaymentStatus: (status: BookingFlowState["paymentStatus"]) => void;
  resetPaymentAttempt: () => void;
  startHold: () => void;
  resetHold: () => void;
  resetFlow: () => void;
}

const BookingFlowContext = createContext<BookingFlowContextValue | null>(null);

const INITIAL_STATE: BookingFlowState = {
  hotelMasterId: null,
  hotelName: "",
  hotelImage: "",
  hotelPhoto: "",
  hotelCity: "",
  hotelStars: 5,

  optionId: "",
  roomName: "",
  mealBasis: "",
  refundable: false,
  freeCancelUntil: "",
  totalPrice: 0,
  bestMarketRate: null,
  currency: "INR",

  checkIn: "",
  checkOut: "",
  nights: 0,
  adults: 2,
  children: 0,
  rooms: 1,

  guestName: "",
  guestEmail: "",
  guestPhone: "",
  specialRequests: "",

  selectedRooms: [],
  guestInfo: null,
  roomGuests: [],
  identity: { pan: "", gstin: "" },
  paymentInfo: null,
  paymentMethod: null,

  bookingId: null,
  holdStartedAt: null,

  paymentTxnid: null,
  paymentId: null,
  paymentStatus: null,
  paymentIntentUrl: null,
};

function diffNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  return Math.max(
    1,
    Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function BookingFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BookingFlowState>(INITIAL_STATE);

  const setHotel = useCallback((name: string, image: string, city: string, stars: number) => {
    setState((prev) => ({
      ...prev,
      hotelName: name,
      hotelImage: image,
      hotelPhoto: image,
      hotelCity: city,
      hotelStars: stars,
    }));
  }, []);

  const setHotelMeta = useCallback(
    (meta: { hotelMasterId?: string; hotelName?: string; hotelPhoto?: string; hotelCity?: string; hotelStars?: number }) => {
      setState((prev) => ({
        ...prev,
        hotelMasterId: meta.hotelMasterId ?? prev.hotelMasterId,
        hotelName: meta.hotelName ?? prev.hotelName,
        hotelPhoto: meta.hotelPhoto ?? prev.hotelPhoto,
        hotelImage: meta.hotelPhoto ?? prev.hotelImage,
        hotelCity: meta.hotelCity ?? prev.hotelCity,
        hotelStars: meta.hotelStars ?? prev.hotelStars,
      }));
    },
    []
  );

  const setRatePlan = useCallback((plan: RatePlanInput) => {
    setState((prev) => ({
      ...prev,
      hotelMasterId: plan.hotelMasterId,
      hotelName: plan.hotelName ?? prev.hotelName,
      hotelPhoto: plan.hotelPhoto ?? prev.hotelPhoto,
      hotelImage: plan.hotelPhoto ?? prev.hotelImage,
      hotelCity: plan.hotelCity ?? prev.hotelCity,
      hotelStars: plan.hotelStars ?? prev.hotelStars,
      optionId: plan.optionId,
      roomName: plan.roomName,
      mealBasis: plan.mealBasis,
      refundable: plan.refundable,
      freeCancelUntil: plan.freeCancelUntil,
      totalPrice: plan.totalPrice,
      bestMarketRate: plan.bestMarketRate ?? null,
      currency: plan.currency,
      checkIn: plan.checkIn,
      checkOut: plan.checkOut,
      nights: diffNights(plan.checkIn, plan.checkOut),
      adults: plan.adults,
      children: plan.children,
      rooms: plan.rooms,
    }));
  }, []);

  const setStayDates = useCallback((checkIn: string, checkOut: string) => {
    setState((prev) => ({
      ...prev,
      checkIn,
      checkOut,
      nights: diffNights(checkIn, checkOut),
    }));
  }, []);

  const setSelectedRooms = useCallback((rooms: SelectedRoom[]) => {
    setState((prev) => ({ ...prev, selectedRooms: rooms }));
  }, []);

  const setGuestInfo = useCallback((info: GuestInfo) => {
    setState((prev) => ({ ...prev, guestInfo: info }));
  }, []);

  const setGuestDetails = useCallback(
    (info: { guestName: string; guestEmail: string; guestPhone: string; specialRequests: string }) => {
      setState((prev) => ({
        ...prev,
        guestName: info.guestName,
        guestEmail: info.guestEmail,
        guestPhone: info.guestPhone,
        specialRequests: info.specialRequests,
      }));
    },
    []
  );

  const setRoomGuests = useCallback((guests: RoomGuest[]) => {
    setState((prev) => ({ ...prev, roomGuests: guests }));
  }, []);

  const setIdentity = useCallback((info: IdentityInfo) => {
    setState((prev) => ({ ...prev, identity: info }));
  }, []);

  const setPaymentInfo = useCallback((info: PaymentInfo) => {
    setState((prev) => ({ ...prev, paymentInfo: info }));
  }, []);

  const setPaymentMethod = useCallback((m: PaymentMethodKind | null) => {
    setState((prev) => ({ ...prev, paymentMethod: m }));
  }, []);

  const setBookingId = useCallback((id: number) => {
    setState((prev) => ({ ...prev, bookingId: id }));
  }, []);

  const setPaymentAttempt = useCallback(
    (attempt: {
      paymentTxnid: string;
      paymentId: number;
      paymentStatus: BookingFlowState["paymentStatus"];
      paymentIntentUrl?: string | null;
    }) => {
      setState((prev) => ({
        ...prev,
        paymentTxnid: attempt.paymentTxnid,
        paymentId: attempt.paymentId,
        paymentStatus: attempt.paymentStatus,
        paymentIntentUrl: attempt.paymentIntentUrl ?? null,
      }));
    },
    []
  );

  const setPaymentStatus = useCallback((status: BookingFlowState["paymentStatus"]) => {
    setState((prev) => ({ ...prev, paymentStatus: status }));
  }, []);

  const resetPaymentAttempt = useCallback(() => {
    setState((prev) => ({
      ...prev,
      paymentTxnid: null,
      paymentId: null,
      paymentStatus: null,
      paymentIntentUrl: null,
    }));
  }, []);

  const startHold = useCallback(() => {
    setState((prev) => (prev.holdStartedAt ? prev : { ...prev, holdStartedAt: Date.now() }));
  }, []);

  const resetHold = useCallback(() => {
    setState((prev) => ({ ...prev, holdStartedAt: null }));
  }, []);

  const resetFlow = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const totalRoomCount = state.selectedRooms.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <BookingFlowContext.Provider
      value={{
        ...state,
        totalRoomCount,
        setHotel,
        setHotelMeta,
        setRatePlan,
        setStayDates,
        setSelectedRooms,
        setGuestInfo,
        setGuestDetails,
        setRoomGuests,
        setIdentity,
        setPaymentInfo,
        setPaymentMethod,
        setBookingId,
        setPaymentAttempt,
        setPaymentStatus,
        resetPaymentAttempt,
        startHold,
        resetHold,
        resetFlow,
      }}
    >
      {children}
    </BookingFlowContext.Provider>
  );
}

export function useBookingFlow() {
  const ctx = useContext(BookingFlowContext);
  if (!ctx) throw new Error("useBookingFlow must be used within BookingFlowProvider");
  return ctx;
}
