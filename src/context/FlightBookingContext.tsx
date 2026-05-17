"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type PaymentMethodKind = "upi" | "credit-card" | "debit-card" | "net-banking";

export type FlightBookingStatus =
  | "AWAITING_PAYMENT"
  | "PAYMENT_INITIATED"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELLED";

export type PaymentStatus =
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

export interface FlightPassenger {
  ti: string;
  fN: string;
  lN: string;
  dob: string;
  pt: "ADULT" | "CHILD" | "INFANT";
}

export interface FlightBookingState {
  // Flight meta
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  travelDate: string;
  returnDate: string;
  tripType: string;
  cabinClass: string;
  airlineName: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;

  // Fare
  totalFare: number;
  baseFare: number;
  taxes: number;
  currency: string;
  fareIdentifier: string;
  selectedFareId: string;
  priceIds: string[];

  // TripJack session
  tjBookingId: string;

  // Passengers
  passengers: FlightPassenger[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;

  // DB record
  flightBookingId: string | null;
  bookingStatus: FlightBookingStatus | null;

  // Payment
  paymentMethod: PaymentMethodKind | null;
  paymentTxnid: string | null;
  paymentId: number | null;
  paymentStatus: PaymentStatus;
  paymentIntentUrl: string | null;
  paymentLink: string | null;
  gatewayTxnid: string | null;
}

interface FlightBookingContextValue extends FlightBookingState {
  setFlightMeta: (meta: Partial<FlightBookingState>) => void;
  setPassengers: (pax: FlightPassenger[]) => void;
  setContact: (name: string, email: string, phone: string) => void;
  setTjBookingId: (id: string) => void;
  setFlightBookingId: (id: string) => void;
  setPaymentMethod: (m: PaymentMethodKind | null) => void;
  setPaymentResult: (txnid: string, id: number, intentUrl: string | null, paymentLink: string | null, gatewayTxnid: string | null) => void;
  setPaymentStatus: (s: PaymentStatus) => void;
  setBookingStatus: (s: FlightBookingStatus) => void;
  resetFlow: () => void;
}

const FlightBookingContext = createContext<FlightBookingContextValue | null>(null);

const INITIAL: FlightBookingState = {
  origin: "",
  originCity: "",
  destination: "",
  destinationCity: "",
  travelDate: "",
  returnDate: "",
  tripType: "O",
  cabinClass: "ECONOMY",
  airlineName: "",
  departureTime: "",
  arrivalTime: "",
  flightNumber: "",
  totalFare: 0,
  baseFare: 0,
  taxes: 0,
  currency: "INR",
  fareIdentifier: "",
  selectedFareId: "",
  priceIds: [],
  tjBookingId: "",
  passengers: [],
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  flightBookingId: null,
  bookingStatus: null,
  paymentMethod: null,
  paymentTxnid: null,
  paymentId: null,
  paymentStatus: null,
  paymentIntentUrl: null,
  paymentLink: null,
  gatewayTxnid: null,
};

export function FlightBookingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FlightBookingState>(INITIAL);

  const setFlightMeta = useCallback((meta: Partial<FlightBookingState>) => {
    setState(prev => ({ ...prev, ...meta }));
  }, []);

  const setPassengers = useCallback((pax: FlightPassenger[]) => {
    setState(prev => ({ ...prev, passengers: pax }));
  }, []);

  const setContact = useCallback((name: string, email: string, phone: string) => {
    setState(prev => ({ ...prev, contactName: name, contactEmail: email, contactPhone: phone }));
  }, []);

  const setTjBookingId = useCallback((id: string) => {
    setState(prev => ({ ...prev, tjBookingId: id }));
  }, []);

  const setFlightBookingId = useCallback((id: string) => {
    setState(prev => ({ ...prev, flightBookingId: id, bookingStatus: "AWAITING_PAYMENT" }));
  }, []);

  const setPaymentMethod = useCallback((m: PaymentMethodKind | null) => {
    setState(prev => ({ ...prev, paymentMethod: m }));
  }, []);

  const setPaymentResult = useCallback((
    txnid: string, id: number,
    intentUrl: string | null, paymentLink: string | null, gatewayTxnid: string | null,
  ) => {
    setState(prev => ({
      ...prev,
      paymentTxnid: txnid,
      paymentId: id,
      paymentStatus: "PENDING",
      paymentIntentUrl: intentUrl,
      paymentLink,
      gatewayTxnid,
    }));
  }, []);

  const setPaymentStatus = useCallback((s: PaymentStatus) => {
    setState(prev => ({ ...prev, paymentStatus: s }));
  }, []);

  const setBookingStatus = useCallback((s: FlightBookingStatus) => {
    setState(prev => ({ ...prev, bookingStatus: s }));
  }, []);

  const resetFlow = useCallback(() => {
    setState(INITIAL);
  }, []);

  return (
    <FlightBookingContext.Provider value={{
      ...state,
      setFlightMeta,
      setPassengers,
      setContact,
      setTjBookingId,
      setFlightBookingId,
      setPaymentMethod,
      setPaymentResult,
      setPaymentStatus,
      setBookingStatus,
      resetFlow,
    }}>
      {children}
    </FlightBookingContext.Provider>
  );
}

export function useFlightBooking() {
  const ctx = useContext(FlightBookingContext);
  if (!ctx) throw new Error("useFlightBooking must be used within FlightBookingProvider");
  return ctx;
}
