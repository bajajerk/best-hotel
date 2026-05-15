"use client";

/* /checkout is a legacy demo page with hardcoded mock data — superseded
   by the real /book/review → /book/guest-details → /book/payment →
   /book/payment/processing → /book/confirmation flow which is wired to
   BookingFlowContext + MMADPay. Nothing in the codebase links to
   /checkout anymore, but bookmarks may exist, so we redirect to the
   real entry instead of 404'ing.
*/

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyCheckoutRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/search");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--luxe-black)",
        color: "var(--luxe-soft-white-50)",
        fontFamily: "var(--font-mono), monospace",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
      }}
    >
      Redirecting…
    </div>
  );
}
