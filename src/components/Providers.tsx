"use client";

import { ReactNode } from "react";
import { BookingProvider } from "@/context/BookingContext";
import { CompareProvider } from "@/context/CompareContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <BookingProvider>
      <CompareProvider>{children}</CompareProvider>
    </BookingProvider>
  );
}
