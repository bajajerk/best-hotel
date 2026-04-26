"use client";

import { useState, useEffect } from "react";
import { trackWhatsAppClicked } from "@/lib/analytics";

interface Props {
  hotelName: string;
}

export default function HotelPageWhatsAppTrigger({ hotelName }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 40_000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed || !visible) return null;

  const message = encodeURIComponent(
    `Hi, I'm looking at ${hotelName}. Can you help?`
  );
  const waLink = `https://wa.me/919876543210?text=${message}`;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        animation: "concierge-slide-up 0.3s ease forwards",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto 24px",
          background: "var(--white)",
          border: "1px solid var(--cream-border)",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          boxShadow: "0 8px 32px rgba(26,23,16,0.15)",
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--ink)",
              margin: "0 0 4px",
              fontWeight: 500,
            }}
          >
            Have a question about this hotel?
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackWhatsAppClicked({ page: "hotel_detail_trigger" })
            }
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: "var(--gold)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Ask Priya &rarr;
          </a>
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          style={{
            background: "none",
            border: "none",
            color: "var(--ink-light)",
            cursor: "pointer",
            padding: "4px",
            lineHeight: 1,
            fontSize: "18px",
          }}
        >
          &times;
        </button>
      </div>

      <style>{`
        @keyframes concierge-slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
