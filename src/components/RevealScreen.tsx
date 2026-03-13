"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { BookingData } from "@/app/page";

interface Props {
  data: BookingData;
  onBack: () => void;
  onBook: () => void;
  onTryAnother: () => void;
}

export default function RevealScreen({
  data,
  onBack,
  onBook,
  onTryAnother,
}: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const totalOriginal = data.originalPrice * data.nights;
  const totalOurs = data.ourPrice * data.nights;

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden overflow-y-auto"
      style={{ background: "var(--bg-black)", padding: "16px 22px 20px" }}
    >
      {/* Green glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 260,
          height: 260,
          background:
            "radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)",
        }}
      />

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
          5/6
        </div>
      </div>

      {/* Deal found tag */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="inline-block self-start mb-5"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "var(--green)",
          padding: "5px 10px",
          background: "var(--green-soft)",
          border: "1px solid var(--green-border)",
          borderRadius: 6,
        }}
      >
        &#10003; deal found
      </motion.div>

      {/* Price comparison */}
      <div className="relative z-[1] mb-4">
        {/* Their price */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: revealed ? 1 : 0, x: revealed ? 0 : -20 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex justify-between items-baseline mb-2"
          style={{
            background: "var(--red-soft)",
            border: "1px solid var(--red-border)",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 400 }}>
            {data.source}
          </span>
          <span
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 22,
              color: "var(--red)",
              textDecoration: "line-through",
              opacity: 0.7,
            }}
          >
            &#8377;{data.originalPrice.toLocaleString("en-IN")}
          </span>
        </motion.div>

        {/* Our price */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: revealed ? 1 : 0, x: revealed ? 0 : -20 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex justify-between items-baseline"
          style={{
            background: "var(--green-soft)",
            border: "1px solid var(--green-border)",
            borderRadius: 16,
            padding: "20px 16px",
          }}
        >
          <span
            style={{ fontSize: 11, color: "var(--green)", fontWeight: 400 }}
          >
            BeatMyRate
          </span>
          <span
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 32,
              fontStyle: "italic",
              color: "var(--green)",
            }}
          >
            &#8377;{data.ourPrice.toLocaleString("en-IN")}
          </span>
        </motion.div>
      </div>

      {/* Savings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 10 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="text-center relative z-[1] mb-3.5"
        style={{
          background: "var(--gold-soft)",
          border: "1px solid var(--gold-border)",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 17,
            fontStyle: "italic",
            color: "var(--gold)",
          }}
        >
          you save &#8377;{data.savings.toLocaleString("en-IN")} per night
        </div>
      </motion.div>

      {/* Hotel details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 10 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="relative z-[1] mb-3.5"
        style={{
          background: "var(--white-04)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 14,
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 15,
            fontWeight: 400,
            marginBottom: 6,
            color: "var(--white-80)",
          }}
        >
          {data.hotel}, Mumbai
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--white-30)",
            lineHeight: 1.7,
            fontWeight: 300,
          }}
        >
          {data.room} &middot; {data.guests}
          <br />
          {data.dates} &middot; {data.nights} nights
          <br />
          Total:{" "}
          <span style={{ color: "var(--white-80)", fontWeight: 500 }}>
            &#8377;{totalOurs.toLocaleString("en-IN")}
          </span>{" "}
          vs{" "}
          <span
            style={{
              textDecoration: "line-through",
              color: "var(--red)",
              opacity: 0.6,
            }}
          >
            &#8377;{totalOriginal.toLocaleString("en-IN")}
          </span>
        </div>
      </motion.div>

      {/* CTAs */}
      <div className="flex-1 min-h-2 max-h-6" />
      <div>
        <button
          onClick={onBook}
          className="w-full cursor-pointer"
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
          Book This Deal
        </button>
        <button
          onClick={onTryAnother}
          className="w-full cursor-pointer mt-2"
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
          Try Another Hotel
        </button>
      </div>
    </div>
  );
}
