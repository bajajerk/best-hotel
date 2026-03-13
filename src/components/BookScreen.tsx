"use client";

import { useState, useEffect } from "react";
import type { BookingData } from "@/app/page";

interface Props {
  data: BookingData;
  onBack: () => void;
}

export default function BookScreen({ data, onBack }: Props) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const totalPrice = data.ourPrice * data.nights;

  const summaryRows = [
    { label: "Hotel", value: data.hotel },
    { label: "Room", value: data.room },
    { label: "Dates", value: data.dates },
    { label: "Guests", value: data.guests },
  ];

  return (
    <div
      className="h-full flex flex-col overflow-y-auto"
      style={{ background: "var(--bg-black)", padding: "16px 22px 20px" }}
    >
      {/* Nav */}
      <div className="flex justify-between items-center mb-2.5">
        <button
          onClick={onBack}
          style={{ fontSize: 18, color: "var(--white-50)", width: 28 }}
        >
          &#8592;
        </button>
        <div
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 15,
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--white-50)",
          }}
        >
          beatmyrate
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            color: "var(--white-30)",
            width: 28,
            textAlign: "right",
          }}
        >
          6/6
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="relative mb-7"
        style={{
          height: 1,
          background: "var(--white-08)",
          borderRadius: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "100%",
            background: "var(--gold)",
            borderRadius: 1,
          }}
        />
      </div>

      {/* Timer */}
      <div
        className="text-center mb-5"
        style={{
          border: "1px solid var(--red-border)",
          background: "var(--red-soft)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: "var(--red)",
            fontWeight: 400,
            letterSpacing: 0.5,
          }}
        >
          deal expires in
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 22,
            color: "var(--red)",
            fontWeight: 500,
            marginTop: 2,
          }}
        >
          {timerDisplay}
        </div>
      </div>

      {/* Booking reference */}
      <div className="text-center mb-5">
        <div
          style={{
            fontSize: 10,
            color: "var(--white-30)",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontWeight: 400,
          }}
        >
          Booking Reference
        </div>
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 20,
            fontWeight: 500,
            color: "var(--gold)",
            letterSpacing: 4,
            marginTop: 4,
          }}
        >
          BMR-7X2K
        </div>
      </div>

      {/* Summary */}
      <div
        className="mb-5"
        style={{
          background: "var(--white-04)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: 16,
        }}
      >
        {summaryRows.map((row) => (
          <div
            key={row.label}
            className="flex justify-between"
            style={{ padding: "6px 0", fontSize: 12 }}
          >
            <span style={{ color: "var(--white-30)", fontWeight: 300 }}>
              {row.label}
            </span>
            <span style={{ color: "var(--white-80)", fontWeight: 400 }}>
              {row.value}
            </span>
          </div>
        ))}

        {/* Total */}
        <div
          className="flex justify-between"
          style={{
            borderTop: "1px solid var(--border)",
            marginTop: 6,
            paddingTop: 10,
            padding: "10px 0 0",
            fontSize: 12,
          }}
        >
          <span style={{ color: "var(--white-30)", fontWeight: 300 }}>
            Total ({data.nights} nights)
          </span>
          <span
            style={{
              color: "var(--gold)",
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 18,
              fontStyle: "italic",
            }}
          >
            &#8377;{totalPrice.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex-1 min-h-2 max-h-6" />
      <div>
        <button
          onClick={() => window.open("tel:+919876543210")}
          className="w-full cursor-pointer mb-2"
          style={{
            padding: 16,
            background: "var(--gold)",
            color: "var(--bg-black)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            borderRadius: 14,
            letterSpacing: 0.3,
          }}
        >
          Call to Book
        </button>
        <button
          onClick={() =>
            window.open(
              "https://wa.me/919876543210?text=Hi,%20I%20want%20to%20book%20BMR-7X2K"
            )
          }
          className="w-full cursor-pointer"
          style={{
            padding: 14,
            background: "transparent",
            color: "var(--white-50)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: 13,
            fontWeight: 400,
            border: "1px solid var(--border)",
            borderRadius: 14,
          }}
        >
          WhatsApp Us
        </button>

        <div
          className="text-center mt-2.5"
          style={{
            fontSize: 11,
            color: "var(--white-30)",
            fontWeight: 300,
            lineHeight: 1.5,
            letterSpacing: 0.2,
          }}
        >
          our team confirms availability
          <br />
          and processes payment on call
        </div>
      </div>
    </div>
  );
}
