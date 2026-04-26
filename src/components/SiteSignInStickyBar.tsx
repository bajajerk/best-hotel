"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoomSelectLoginModal from "@/components/RoomSelectLoginModal";
import { trackCtaClicked } from "@/lib/analytics";

export default function SiteSignInStickyBar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);

  // Flight booking pages have their own sticky CTA (Continue / Confirm & Pay).
  // Hide the sign-in upsell so the two don't stack on mobile.
  if (pathname?.startsWith("/flights/")) return null;
  if (loading || user) return null;

  const openModal = () => {
    trackCtaClicked({
      cta_name: "sign_in",
      cta_location: "site_sticky_bar",
    });
    setModalOpen(true);
  };

  return (
    <>
      <div className="sticky-mobile-cta">
        <div style={{ color: "#fff", flex: 1 }}>
          <div style={{ fontSize: "13px", fontWeight: 600 }}>
            Sign in to see member rates
          </div>
          <div style={{ fontSize: "10px", opacity: 0.85 }}>
            Free forever &middot; No fees
          </div>
        </div>
        <button
          type="button"
          onClick={openModal}
          style={{
            background: "#fff",
            color: "var(--emerald-dark)",
            padding: "10px 20px",
            fontSize: "12px",
            fontWeight: 700,
            border: "none",
            letterSpacing: "0.04em",
            whiteSpace: "nowrap",
            borderRadius: "2px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Sign In &rarr;
        </button>
      </div>

      {modalOpen && (
        <RoomSelectLoginModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
