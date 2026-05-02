"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { BookingProvider } from "@/context/BookingContext";
import { CompareProvider } from "@/context/CompareContext";
import { BookingFlowProvider } from "@/context/BookingFlowContext";
import PostHogProvider from "@/components/PostHogProvider";
import LenisProvider from "@/components/LenisProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LenisProvider>
      <PostHogProvider>
        <AuthProvider>
          <BookingProvider>
            <CompareProvider>
              <BookingFlowProvider>{children}</BookingFlowProvider>
            </CompareProvider>
          </BookingProvider>
        </AuthProvider>
      </PostHogProvider>
    </LenisProvider>
  );
}
