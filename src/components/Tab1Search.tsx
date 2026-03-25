"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useBooking } from "@/context/BookingContext";
import DestinationSearch from "@/components/DestinationSearch";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const orchestrate = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

export default function Tab1Search() {
  const router = useRouter();
  const {
    checkIn, checkOut, setCheckIn, setCheckOut, setDates,
    setDestination, formatDate,
  } = useBooking();
  const [localDestination, setLocalDestination] = useState("");
  const [error, setError] = useState("");

  function handleSearch() {
    // Validate
    if (!localDestination.trim()) {
      setError("Please enter a destination");
      return;
    }
    if (!checkIn) {
      setError("Please select a check-in date");
      return;
    }
    if (!checkOut) {
      setError("Please select a check-out date");
      return;
    }

    // Calculate nights
    const nights = Math.max(
      1,
      Math.round(
        (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    // Store in app state
    setDestination(localDestination.trim());
    setDates(checkIn, checkOut);

    // Navigate to results
    const slug = localDestination.trim().toLowerCase().replace(/\s+/g, "-");
    router.push(`/results?q=${encodeURIComponent(localDestination.trim())}&city=${slug}&nights=${nights}`);
  }

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        minHeight: "100vh",
        overflow: "hidden",
      }}
      className="tab1-hero"
    >
      {/* ── Left: Text + Search Form ── */}
      <motion.div
        variants={orchestrate}
        initial="hidden"
        animate="visible"
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 60px",
          background: "var(--cream)",
          zIndex: 2,
        }}
        className="tab1-hero-left"
      >
        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--gold)",
            marginBottom: "20px",
          }}
        >
          Curated Hotel Collection
        </motion.p>

        <motion.h1
          variants={fadeUp}
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(32px, 4vw, 56px)",
            fontWeight: 400,
            lineHeight: 1.1,
            color: "var(--ink)",
            marginBottom: "20px",
          }}
        >
          Find your perfect stay
        </motion.h1>

        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            color: "var(--ink-light)",
            maxWidth: "420px",
            lineHeight: 1.6,
            marginBottom: "40px",
          }}
        >
          Handpicked hotels across 1,500+ properties worldwide.
          Direct relationships. Personally vetted stays.
        </motion.p>

        {/* ── Search Card ── */}
        <motion.div
          variants={fadeUp}
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "520px",
            boxShadow: "0 4px 32px rgba(26,23,16,0.06)",
          }}
        >
          {/* Destination */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "9px",
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: "var(--ink-light)",
                display: "block",
                marginBottom: "6px",
              }}
            >
              DESTINATION
            </label>
            <DestinationSearch
              variant="light"
              placeholder="City or hotel"
              onValueChange={(val) => {
                setLocalDestination(val);
                if (error) setError("");
              }}
              onSelect={(type, value) => {
                setLocalDestination(value);
                if (error) setError("");
              }}
            />
          </div>

          {/* Dates Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {/* Check-in */}
            <label
              style={{
                background: "var(--cream)",
                border: "1px solid var(--cream-border)",
                borderRadius: "10px",
                padding: "12px 14px",
                position: "relative",
                cursor: "pointer",
                display: "block",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "9px",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "var(--ink-light)",
                  marginBottom: "4px",
                }}
              >
                CHECK-IN
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: checkIn ? "var(--ink)" : "var(--ink-light)",
                }}
              >
                {formatDate(checkIn, "Select date")}
              </div>
              <input
                type="date"
                value={checkIn}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (error) setError("");
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                }}
              />
            </label>

            {/* Check-out */}
            <label
              style={{
                background: "var(--cream)",
                border: "1px solid var(--cream-border)",
                borderRadius: "10px",
                padding: "12px 14px",
                position: "relative",
                cursor: "pointer",
                display: "block",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "9px",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: "var(--ink-light)",
                  marginBottom: "4px",
                }}
              >
                CHECK-OUT
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: 400,
                  color: checkOut ? "var(--ink)" : "var(--ink-light)",
                }}
              >
                {formatDate(checkOut, "Select date")}
              </div>
              <input
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  if (error) setError("");
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                  width: "100%",
                  height: "100%",
                }}
              />
            </label>
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--error)",
                marginBottom: "12px",
              }}
            >
              {error}
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="cursor-pointer"
            style={{
              width: "100%",
              padding: "14px",
              background: "var(--ink)",
              color: "var(--cream)",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              borderRadius: "12px",
              letterSpacing: "0.3px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--ink)";
            }}
          >
            Search Hotels
          </button>

          {/* Nights preview */}
          {checkIn && checkOut && (
            <div
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                color: "var(--ink-light)",
                textAlign: "center",
                marginTop: "12px",
              }}
            >
              {Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))} night{Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))) !== 1 ? "s" : ""}
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={fadeUp}
          style={{ display: "flex", gap: "40px", marginTop: "40px" }}
        >
          {[
            { num: "1,500+", label: "Hotels" },
            { num: "50+", label: "Cities" },
            { num: "24/7", label: "Concierge" },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "28px",
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                {stat.num}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "var(--ink-light)",
                  marginTop: "4px",
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Right: Hero Image ── */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="tab1-hero-right"
        style={{
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80"
          alt="Luxury hotel pool at sunset"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {/* Subtle gradient overlay on left edge for blending */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to right, var(--cream) 0%, transparent 12%)",
            pointerEvents: "none",
          }}
        />
      </motion.div>

      {/* ── Responsive styles ── */}
      <style jsx global>{`
        .tab1-hero {
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }
        @media (max-width: 768px) {
          .tab1-hero {
            grid-template-columns: 1fr !important;
            min-height: auto;
          }
          .tab1-hero-left {
            padding: 40px 24px !important;
            order: 2;
          }
          .tab1-hero-right {
            height: 280px;
            order: 1;
          }
        }
      `}</style>
    </section>
  );
}
