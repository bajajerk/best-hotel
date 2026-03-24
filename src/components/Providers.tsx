"use client";

import { ReactNode } from "react";
import { BookingProvider } from "@/context/BookingContext";
import { CompareProvider } from "@/context/CompareContext";
import { BookingFlowProvider } from "@/context/BookingFlowContext";
import PostHogProvider from "@/components/PostHogProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <BookingProvider>
        <CompareProvider>
          <BookingFlowProvider>{children}</BookingFlowProvider>
        </CompareProvider>
      </BookingProvider>
    </PostHogProvider>
  );
}
