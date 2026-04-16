"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBooking } from "@/context/BookingContext";

type AppState = "upload" | "processing" | "result";
type EntryMode = "screenshot" | "manual";

interface ManualFormData {
  hotelName: string;
  bookingSite: string;
  pricePerNight: string;
  checkIn: string;
  checkOut: string;
  guests: string;
}

const BOOKING_SITES = [
  "MakeMyTrip",
  "Booking.com",
  "Agoda",
  "Goibibo",
  "Other",
];

const SCANNING_STEPS = [
  { text: "Checking direct hotel rates...", delay: 0.5 },
  { text: "Scanning partner networks...", delay: 1.2 },
  { text: "Finding best available rate...", delay: 2.0 },
];

export default function Tab3BeatPrice() {
  const booking = useBooking();
  const [state, setState] = useState<AppState>("upload");
  const [entryMode, setEntryMode] = useState<EntryMode>("screenshot");
  const [isDragging, setIsDragging] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [form, setForm] = useState<ManualFormData>({
    hotelName: "",
    bookingSite: "MakeMyTrip",
    pricePerNight: "",
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-transition from processing to result after 3 seconds
  useEffect(() => {
    if (state !== "processing") return;
    const timer = setTimeout(() => setState("result"), 3000);
    return () => clearTimeout(timer);
  }, [state]);

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setScreenshotUrl(url);
    setEntryMode("screenshot");
    setState("processing");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleManualSubmit = () => {
    setEntryMode("manual");
    setState("processing");
  };

  const handleReset = () => {
    setState("upload");
    setScreenshotUrl(null);
    setForm({
      hotelName: "",
      bookingSite: "MakeMyTrip",
      pricePerNight: "",
      checkIn: "",
      checkOut: "",
      guests: "",
    });
  };

  // ─── Shared Logo ───
  const Logo = (
    <div
      className="text-center mb-1"
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
  );

  // ─── STATE 1: UPLOAD ───
  const renderUpload = () => (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col flex-1"
    >
      {/* Hero text */}
      <div className="text-center mt-4 mb-2">
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 36,
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--white)",
            lineHeight: 1.1,
            letterSpacing: -0.3,
          }}
        >
          beat my price
        </h1>
        <p
          className="mt-2.5"
          style={{
            fontSize: 13,
            color: "var(--white-30)",
            fontWeight: 300,
            lineHeight: 1.5,
          }}
        >
          upload any hotel screenshot and
          <br />
          we&apos;ll find a better rate
        </p>
      </div>

      {/* Drag & Drop Zone */}
      <div
        className="text-center cursor-pointer mt-5"
        style={{
          border: isDragging
            ? "2px solid var(--gold)"
            : "2px dashed var(--gold-border)",
          borderRadius: 16,
          padding: "32px 16px",
          background: isDragging ? "var(--gold-soft)" : "transparent",
          transition: "all 0.2s ease",
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Upload icon */}
        <div
          className="flex items-center justify-center mx-auto mb-3"
          style={{
            width: 48,
            height: 48,
            border: "1px solid var(--gold-border)",
            borderRadius: 14,
            color: "var(--gold)",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <p
          style={{
            color: "var(--white-80)",
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 4,
          }}
        >
          drop your screenshot here
        </p>
        <p style={{ fontSize: 12, color: "var(--white-30)", fontWeight: 300 }}>
          MakeMyTrip, Booking, Agoda — anything
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* OR divider */}
      <div
        className="text-center my-5"
        style={{ fontSize: 12, color: "var(--white-30)", fontWeight: 300 }}
      >
        — or enter manually —
      </div>

      {/* Manual Entry Form */}
      <div className="flex flex-col gap-3">
        {/* Hotel Name */}
        <input
          type="text"
          placeholder="e.g. Taj Lands End"
          value={form.hotelName}
          onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--white-80)",
            fontSize: 13,
            fontFamily: "var(--font-dm-sans)",
          }}
        />

        {/* Booking Site */}
        <div style={{ position: "relative" }}>
          <select
            value={form.bookingSite}
            onChange={(e) => setForm({ ...form, bookingSite: e.target.value })}
            style={{
              width: "100%",
              padding: "14px 16px",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--white-80)",
              fontSize: 13,
              fontFamily: "var(--font-dm-sans)",
              appearance: "none",
              WebkitAppearance: "none",
            }}
          >
            {BOOKING_SITES.map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
          <div
            className="absolute pointer-events-none"
            style={{
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--white-30)",
              fontSize: 10,
            }}
          >
            &#9660;
          </div>
        </div>

        {/* Price per Night */}
        <div style={{ position: "relative" }}>
          <span
            className="absolute"
            style={{
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--white-30)",
              fontSize: 13,
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            &#8377;
          </span>
          <input
            type="text"
            placeholder="8,500"
            value={form.pricePerNight}
            onChange={(e) =>
              setForm({ ...form, pricePerNight: e.target.value })
            }
            style={{
              width: "100%",
              padding: "14px 16px 14px 32px",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--white-80)",
              fontSize: 13,
              fontFamily: "var(--font-dm-sans)",
            }}
          />
        </div>

        {/* Check-in / Check-out */}
        <div className="flex gap-3">
          <input
            type="date"
            placeholder="Check-in"
            value={form.checkIn}
            onChange={(e) => {
              setForm({ ...form, checkIn: e.target.value });
              booking.setCheckIn(e.target.value);
            }}
            style={{
              flex: 1,
              padding: "14px 12px",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--white-80)",
              fontSize: 12,
              fontFamily: "var(--font-dm-sans)",
              colorScheme: "dark",
            }}
          />
          <input
            type="date"
            placeholder="Check-out"
            value={form.checkOut}
            min={form.checkIn || undefined}
            onChange={(e) => {
              setForm({ ...form, checkOut: e.target.value });
              booking.setCheckOut(e.target.value);
            }}
            style={{
              flex: 1,
              padding: "14px 12px",
              background: "var(--bg-input)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--white-80)",
              fontSize: 12,
              fontFamily: "var(--font-dm-sans)",
              colorScheme: "dark",
            }}
          />
        </div>

        {/* Guests */}
        <input
          type="text"
          placeholder="2 Adults"
          value={form.guests}
          onChange={(e) => setForm({ ...form, guests: e.target.value })}
          style={{
            width: "100%",
            padding: "14px 16px",
            background: "var(--bg-input)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            color: "var(--white-80)",
            fontSize: 13,
            fontFamily: "var(--font-dm-sans)",
          }}
        />

        {/* Submit */}
        <button
          onClick={handleManualSubmit}
          className="w-full cursor-pointer mt-1"
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
          Check Our Rate
        </button>
      </div>
    </motion.div>
  );

  // ─── STATE 2: PROCESSING ───
  const renderProcessing = () => (
    <motion.div
      key="processing"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col flex-1 items-center justify-center"
    >
      {/* Screenshot thumbnail or pulsing card */}
      {entryMode === "screenshot" && screenshotUrl ? (
        <div
          className="relative overflow-hidden mb-8"
          style={{
            width: 200,
            height: 280,
            borderRadius: 16,
            border: "1px solid var(--gold-border)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshotUrl}
            alt="Uploaded screenshot"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.6,
            }}
          />
          {/* Scan line */}
          <div
            className="absolute left-0 right-0"
            style={{
              height: 2,
              background:
                "linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--gold) 70%, transparent 100%)",
              boxShadow: "0 0 20px var(--gold), 0 0 40px rgba(201,169,98,0.3)",
              animation: "scan-line 1.8s ease-in-out infinite",
            }}
          />
          {/* Gold overlay shimmer */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(201,169,98,0.05) 0%, transparent 50%, rgba(201,169,98,0.05) 100%)",
            }}
          />
        </div>
      ) : (
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8"
          style={{
            width: 220,
            padding: "24px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--gold-border)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              color: "var(--white-80)",
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            {form.hotelName || "Taj Lands End"}
          </div>
          <div style={{ fontSize: 11, color: "var(--white-30)", marginBottom: 4 }}>
            {form.bookingSite || "MakeMyTrip"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-instrument-serif)",
              fontSize: 22,
              color: "var(--gold)",
              fontStyle: "italic",
            }}
          >
            &#8377;{form.pricePerNight || "8,500"}
            <span
              style={{
                fontSize: 11,
                color: "var(--white-30)",
                fontStyle: "normal",
                fontFamily: "var(--font-dm-sans)",
                marginLeft: 4,
              }}
            >
              /night
            </span>
          </div>
        </motion.div>
      )}

      {/* Scanning text */}
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-center mb-2"
        style={{
          fontFamily: "var(--font-instrument-serif)",
          fontSize: 22,
          fontStyle: "italic",
          color: "var(--white)",
        }}
      >
        scanning rates...
      </motion.div>

      <p
        className="text-center mb-6"
        style={{ fontSize: 12, color: "var(--white-30)", fontWeight: 300 }}
      >
        checking 50+ hotel partners
      </p>

      {/* Animated dots */}
      <div className="flex gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--gold)",
            }}
          />
        ))}
      </div>

      {/* Scanning steps */}
      <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 280 }}>
        {SCANNING_STEPS.map((step, idx) => (
          <ScanningStep key={idx} text={step.text} delay={step.delay} />
        ))}
      </div>
    </motion.div>
  );

  // ─── STATE 3: RESULT ───
  const renderResult = () => (
    <motion.div
      key="result"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col flex-1"
    >
      {/* Green glow background */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "35%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 300,
          background:
            "radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)",
        }}
      />

      {/* DEAL FOUND tag */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.35, type: "spring", stiffness: 200 }}
        className="inline-block self-start mb-5 mt-3"
        style={{
          fontFamily: "var(--font-dm-mono)",
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
        &#10003; better rate found
      </motion.div>

      {/* Price Comparison */}
      <div className="relative z-[1] mb-4">
        {/* Their price */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="flex justify-between items-baseline mb-2.5"
          style={{
            background: "var(--red-soft)",
            border: "1px solid var(--red-border)",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--red)", fontWeight: 400 }}>
            MakeMyTrip
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
            &#8377;8,500
          </span>
        </motion.div>

        {/* Our price */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="flex justify-between items-baseline"
          style={{
            background: "var(--green-soft)",
            border: "1px solid var(--green-border)",
            borderRadius: 16,
            padding: "20px 16px",
          }}
        >
          <span style={{ fontSize: 11, color: "var(--green)", fontWeight: 400 }}>
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
            &#8377;5,900
          </span>
        </motion.div>
      </div>

      {/* Savings banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7 }}
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
          your rate: &#8377;2,600 less per night
        </div>
      </motion.div>

      {/* Hotel details card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.85 }}
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
          Taj Lands End, Mumbai
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--white-30)",
            lineHeight: 1.7,
            fontWeight: 300,
          }}
        >
          Deluxe Sea View &middot; 2 Adults
          <br />
          Mar 15 – Mar 18 &middot; 3 nights
          <br />
          Total:{" "}
          <span style={{ color: "var(--white-80)", fontWeight: 500 }}>
            &#8377;17,700
          </span>{" "}
          vs{" "}
          <span
            style={{
              textDecoration: "line-through",
              color: "var(--red)",
              opacity: 0.6,
            }}
          >
            &#8377;25,500
          </span>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.0 }}
        className="mt-auto pt-4"
      >
        <button
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
          Book This Rate
        </button>
        <button
          onClick={handleReset}
          className="w-full cursor-pointer mt-3"
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
          Try Another
        </button>

        {/* Trust text */}
        <p
          className="text-center mt-3"
          style={{ fontSize: 11, color: "var(--white-30)", fontWeight: 300 }}
        >
          our team confirms availability and processes payment on call
        </p>
      </motion.div>
    </motion.div>
  );

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden overflow-y-auto"
      style={{ background: "var(--bg-black)", padding: "16px 24px 32px" }}
    >
      {/* Gold corner glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -80,
          right: -80,
          width: 260,
          height: 260,
          background:
            "radial-gradient(circle, rgba(201,169,98,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Logo header */}
      {Logo}

      {/* State transitions */}
      <AnimatePresence mode="wait">
        {state === "upload" && renderUpload()}
        {state === "processing" && renderProcessing()}
        {state === "result" && renderResult()}
      </AnimatePresence>
    </div>
  );
}

// ─── Scanning Step sub-component ───
function ScanningStep({ text, delay }: { text: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay * 1000);
    const doneTimer = setTimeout(() => setDone(true), (delay + 0.8) * 1000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(doneTimer);
    };
  }, [delay]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2.5"
    >
      {/* Spinner or checkmark */}
      <div
        style={{
          width: 16,
          height: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {done ? (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--green)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </motion.svg>
        ) : (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            style={{
              width: 12,
              height: 12,
              border: "2px solid var(--white-08)",
              borderTop: "2px solid var(--gold)",
              borderRadius: "50%",
            }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: 12,
          color: done ? "var(--white-50)" : "var(--white-30)",
          fontWeight: 300,
          transition: "color 0.3s ease",
        }}
      >
        {text}
      </span>
    </motion.div>
  );
}
