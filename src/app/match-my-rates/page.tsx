"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  trackMatchMyRateStarted,
  trackScreenshotUploaded,
  trackExtractionCompleted,
  trackManualFormSubmitted,
  trackRateComparisonViewed,
} from "@/lib/analytics";

/* ─────────────────────────── Types ─────────────────────────── */

type Step = "upload" | "extracting" | "verify" | "searching" | "result";

interface ExtractedData {
  hotelName: string;
  location: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  guests: string;
  otaName: string;
  otaPrice: number;
  currency: string;
  confidence: number;
}

interface WholesaleResult {
  hotelName: string;
  location: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: string;
  otaName: string;
  otaPrice: number;
  ourPrice: number;
  savings: number;
  savingsPercent: number;
  totalOta: number;
  totalOurs: number;
  currency: string;
  includesBreakfast: boolean;
  freeCancellation: boolean;
}

interface ManualFormData {
  hotelName: string;
  location: string;
  bookingSite: string;
  pricePerNight: string;
  checkIn: string;
  checkOut: string;
  roomType: string;
  guests: string;
}

const OTA_SITES = [
  "MakeMyTrip",
  "Booking.com",
  "Agoda",
  "Cleartrip",
  "Expedia",
  "Goibibo",
  "Other",
];

const SCANNING_STEPS = [
  "Reading screenshot with AI...",
  "Identifying hotel & dates...",
  "Extracting price details...",
];

const SEARCH_STEPS = [
  "Checking direct hotel rates...",
  "Scanning B2B partner networks...",
  "Finding best available rate...",
];

/* ─────────────────────────── Helpers ─────────────────────────── */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* ─────────────────────────── Component ─────────────────────────── */

export default function MatchMyRatesPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [result, setResult] = useState<WholesaleResult | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [manualForm, setManualForm] = useState<ManualFormData>({
    hotelName: "",
    location: "",
    bookingSite: "MakeMyTrip",
    pricePerNight: "",
    checkIn: "",
    checkOut: "",
    roomType: "",
    guests: "2 Adults",
  });
  const [extractError, setExtractError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  /* ── File handling ── */
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    trackMatchMyRateStarted({ method: 'screenshot' });
    trackScreenshotUploaded({ file_size_kb: Math.round(file.size / 1024), file_type: file.type });
    const url = URL.createObjectURL(file);
    setScreenshotUrl(url);
    setIsManual(false);
    setStep("extracting");

    // Call the analyze API
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const token = await getIdToken();
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/match-my-rate/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ image: base64 }),
        });
        const json = await res.json();
        if (json.success && json.data) {
          setExtracted(json.data);
          setStep("verify");
          trackExtractionCompleted({
            success: true,
            hotel_name: json.data.hotelName,
            ota_name: json.data.otaName,
            ota_price: json.data.otaPrice,
            confidence: json.data.confidence,
          });
        } else {
          trackExtractionCompleted({ success: false, error_message: 'extraction_failed' });
          setExtractError("Could not extract details. Please enter manually.");
          setStep("upload");
          setIsManual(true);
        }
      } catch {
        trackExtractionCompleted({ success: false, error_message: 'network_error' });
        setExtractError("Analysis failed. Please enter details manually.");
        setStep("upload");
        setIsManual(true);
      }
    };
    reader.readAsDataURL(file);
  }, [getIdToken]);

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

  /* ── Manual form submit ── */
  const handleManualSubmit = () => {
    if (!manualForm.hotelName || !manualForm.pricePerNight) return;
    trackMatchMyRateStarted({ method: 'manual' });

    const price = parseInt(manualForm.pricePerNight.replace(/,/g, ""), 10);
    const checkIn = manualForm.checkIn;
    const checkOut = manualForm.checkOut;
    let nights = 1;
    if (checkIn && checkOut) {
      const diff =
        new Date(checkOut).getTime() - new Date(checkIn).getTime();
      nights = Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }

    const data: ExtractedData = {
      hotelName: manualForm.hotelName,
      location: manualForm.location,
      checkIn,
      checkOut,
      nights,
      roomType: manualForm.roomType || "Standard Room",
      guests: manualForm.guests || "2 Adults",
      otaName: manualForm.bookingSite,
      otaPrice: price,
      currency: "INR",
      confidence: 1.0,
    };
    setExtracted(data);
    setIsManual(true);
    setStep("verify");
    trackManualFormSubmitted({
      hotel_name: manualForm.hotelName,
      booking_site: manualForm.bookingSite,
      price_per_night: price,
      has_dates: !!(manualForm.checkIn && manualForm.checkOut),
    });
  };

  /* ── Confirm extracted data & search wholesale ── */
  const handleConfirmAndSearch = async () => {
    if (!extracted) return;
    setStep("searching");
    try {
      const token = await getIdToken();
      const res = await fetch("/api/match-my-rate/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(extracted),
      });
      const json = await res.json();
      if (json.success) {
        // Map backend response to WholesaleResult shape
        setResult({
          hotelName: json.hotel_name || extracted.hotelName,
          location: json.location || extracted.location,
          roomType: json.roomType || extracted.roomType,
          checkIn: json.checkIn || extracted.checkIn,
          checkOut: json.checkOut || extracted.checkOut,
          nights: json.nights || extracted.nights,
          guests: json.guests || extracted.guests,
          otaName: json.otaName || extracted.otaName,
          otaPrice: json.otaPrice || extracted.otaPrice,
          ourPrice: json.agodaRate || 0,
          savings: json.savings || 0,
          savingsPercent: json.savingsPercent || 0,
          totalOta: json.totalOta || extracted.otaPrice * extracted.nights,
          totalOurs: json.totalAgoda || 0,
          currency: json.currency || extracted.currency,
          includesBreakfast: json.includesBreakfast || false,
          freeCancellation: false,
        });
        setStep("result");
        trackRateComparisonViewed({
          hotel_name: json.hotel_name || extracted.hotelName,
          ota_name: json.otaName || extracted.otaName,
          ota_price: json.otaPrice || extracted.otaPrice,
          our_price: json.agodaRate || 0,
          savings_percent: json.savingsPercent || 0,
          currency: json.currency || extracted.currency,
        });
      } else {
        setExtractError(json.error || "Could not find rates for this hotel");
        setStep("verify");
      }
    } catch {
      setExtractError("Search failed. Please try again.");
      setStep("verify");
    }
  };

  /* ── Reset ── */
  const handleReset = () => {
    setStep("upload");
    setScreenshotUrl(null);
    setExtracted(null);
    setResult(null);
    setExtractError("");
    setIsManual(false);
    setManualForm({
      hotelName: "",
      location: "",
      bookingSite: "MakeMyTrip",
      pricePerNight: "",
      checkIn: "",
      checkOut: "",
      roomType: "",
      guests: "2 Adults",
    });
  };

  /* ── Step indicator ── */
  const stepOrder: Step[] = ["upload", "verify", "result"];
  const stepLabels = ["Upload", "Review", "Compare"];
  const currentStepIndex = stepOrder.indexOf(
    step === "extracting" ? "upload" : step === "searching" ? "verify" : step
  );

  /* ═══════════════════════════ RENDER ═══════════════════════════ */

  if (authLoading) {
    return (
      <div className="luxe">
        <Header />
        <main className="min-h-screen flex items-center justify-center" style={{ background: "#0c0b0a" }}>
          <div style={{ color: "rgba(247,245,242,0.7)" }}>Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="luxe">
      <Header />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
          background: "var(--cream)",
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          {/* ── Hero ── */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div
              style={{
                display: "inline-block",
                padding: "5px 14px",
                background: "var(--gold-pale)",
                borderRadius: 20,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  fontWeight: 500,
                }}
              >
                Powered by AI
              </span>
            </div>
            <h1
              className="type-display-2"
              style={{
                color: "var(--ink)",
                marginBottom: 12,
                fontStyle: "italic",
              }}
            >
              Match My Rate
            </h1>
            <p
              className="type-body-lg"
              style={{
                color: "var(--ink-light)",
                maxWidth: 480,
                margin: "0 auto",
              }}
            >
              Screenshot any hotel rate from any booking site — we&apos;ll
              check it against our preferred B2B rates that aren&apos;t
              available to the public.
            </p>
          </div>

          {/* ── Step Indicator ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 0,
              marginBottom: 40,
            }}
          >
            {stepLabels.map((label, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 500,
                      fontFamily: "var(--font-body)",
                      background:
                        i <= currentStepIndex
                          ? "var(--gold)"
                          : "var(--cream-deep)",
                      color:
                        i <= currentStepIndex
                          ? "var(--white)"
                          : "var(--ink-light)",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {i < currentStepIndex ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: i <= currentStepIndex ? 500 : 400,
                      color:
                        i <= currentStepIndex
                          ? "var(--ink)"
                          : "var(--ink-light)",
                      letterSpacing: 0.3,
                      transition: "all 0.3s ease",
                    }}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    style={{
                      width: 48,
                      height: 1,
                      background:
                        i < currentStepIndex
                          ? "var(--gold)"
                          : "var(--cream-border)",
                      marginBottom: 20,
                      marginLeft: 8,
                      marginRight: 8,
                      transition: "background 0.3s ease",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* ── Content ── */}
          <AnimatePresence mode="wait">
            {step === "upload" && (
              <UploadStep
                key="upload"
                isDragging={isDragging}
                isManual={isManual}
                setIsManual={setIsManual}
                screenshotUrl={screenshotUrl}
                manualForm={manualForm}
                setManualForm={setManualForm}
                extractError={extractError}
                fileInputRef={fileInputRef}
                onFileChange={handleFileChange}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onManualSubmit={handleManualSubmit}
              />
            )}
            {step === "extracting" && (
              <ExtractingStep
                key="extracting"
                screenshotUrl={screenshotUrl}
                isSearching={false}
              />
            )}
            {step === "searching" && (
              <ExtractingStep
                key="searching"
                screenshotUrl={screenshotUrl}
                isSearching={true}
              />
            )}
            {step === "verify" && extracted && (
              <VerifyStep
                key="verify"
                data={extracted}
                setData={setExtracted}
                screenshotUrl={screenshotUrl}
                isManual={isManual}
                onConfirm={handleConfirmAndSearch}
                onBack={() => {
                  setStep("upload");
                  setExtracted(null);
                }}
              />
            )}
            {step === "result" && result && (
              <ResultStep
                key="result"
                result={result}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STEP COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* ────────── STEP 1: UPLOAD ────────── */
function UploadStep({
  isDragging,
  isManual,
  setIsManual,
  screenshotUrl,
  manualForm,
  setManualForm,
  extractError,
  fileInputRef,
  onFileChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onManualSubmit,
}: {
  isDragging: boolean;
  isManual: boolean;
  setIsManual: (v: boolean) => void;
  screenshotUrl: string | null;
  manualForm: ManualFormData;
  setManualForm: (v: ManualFormData) => void;
  extractError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onManualSubmit: () => void;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    background: "var(--white)",
    border: "1px solid var(--cream-border)",
    borderRadius: 10,
    color: "var(--ink)",
    fontSize: 13,
    fontFamily: "var(--font-body)",
    outline: "none",
    transition: "border-color 0.2s ease",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Error message */}
      {extractError && (
        <div
          style={{
            background: "var(--red-soft)",
            border: "1px solid var(--red-border)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            fontSize: 13,
            color: "var(--error)",
          }}
        >
          {extractError}
        </div>
      )}

      {/* Toggle: Screenshot vs Manual */}
      <div
        style={{
          display: "flex",
          background: "var(--cream-deep)",
          borderRadius: 10,
          padding: 3,
          marginBottom: 28,
        }}
      >
        {[
          { key: false, label: "Upload Screenshot" },
          { key: true, label: "Enter Manually" },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => setIsManual(tab.key)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: isManual === tab.key ? "var(--white)" : "transparent",
              color:
                isManual === tab.key ? "var(--ink)" : "var(--ink-light)",
              fontSize: 13,
              fontWeight: isManual === tab.key ? 500 : 400,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow:
                isManual === tab.key
                  ? "0 1px 3px rgba(0,0,0,0.06)"
                  : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {!isManual ? (
        /* ── Screenshot upload zone ── */
        <div
          style={{
            background: "var(--white)",
            border: isDragging
              ? "2px solid var(--gold)"
              : "2px dashed var(--cream-border)",
            borderRadius: 16,
            padding: "48px 24px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.25s ease",
          }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "var(--gold-pale)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>

          <p
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: 6,
            }}
          >
            Drop your screenshot here
          </p>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-light)",
              marginBottom: 16,
              fontWeight: 300,
            }}
          >
            or click to browse — PNG, JPG up to 10MB
          </p>

          {/* OTA logos hint */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              "MakeMyTrip",
              "Booking.com",
              "Agoda",
              "Cleartrip",
              "Expedia",
            ].map((ota) => (
              <span
                key={ota}
                style={{
                  fontSize: 11,
                  color: "var(--ink-light)",
                  fontWeight: 400,
                  opacity: 0.7,
                }}
              >
                {ota}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* ── Manual entry form ── */
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            borderRadius: 16,
            padding: "28px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Hotel Name */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--ink-light)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  display: "block",
                }}
              >
                Hotel Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Taj Lands End, Mumbai"
                value={manualForm.hotelName}
                onChange={(e) =>
                  setManualForm({ ...manualForm, hotelName: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            {/* Location */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: "var(--ink-light)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                  display: "block",
                }}
              >
                City / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Mumbai, India"
                value={manualForm.location}
                onChange={(e) =>
                  setManualForm({ ...manualForm, location: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            {/* Booking Site + Price Row */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-light)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Booking Site
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={manualForm.bookingSite}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        bookingSite: e.target.value,
                      })
                    }
                    style={{
                      ...inputStyle,
                      appearance: "none",
                      WebkitAppearance: "none",
                      paddingRight: 32,
                    }}
                  >
                    {OTA_SITES.map((site) => (
                      <option key={site} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--ink-light)",
                      fontSize: 10,
                      pointerEvents: "none",
                    }}
                  >
                    &#9660;
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-light)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Price / Night *
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--ink-light)",
                      fontSize: 14,
                    }}
                  >
                    &#8377;
                  </span>
                  <input
                    type="text"
                    placeholder="8,500"
                    value={manualForm.pricePerNight}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        pricePerNight: e.target.value,
                      })
                    }
                    style={{ ...inputStyle, paddingLeft: 30 }}
                  />
                </div>
              </div>
            </div>

            {/* Dates Row */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-light)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Check-in
                </label>
                <input
                  type="date"
                  value={manualForm.checkIn}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, checkIn: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-light)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Check-out
                </label>
                <input
                  type="date"
                  value={manualForm.checkOut}
                  min={manualForm.checkIn || undefined}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, checkOut: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Room Type + Guests */}
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-light)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Room Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deluxe Sea View"
                  value={manualForm.roomType}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, roomType: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ink-light)",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                    display: "block",
                  }}
                >
                  Guests
                </label>
                <input
                  type="text"
                  placeholder="2 Adults"
                  value={manualForm.guests}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, guests: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={onManualSubmit}
              disabled={!manualForm.hotelName || !manualForm.pricePerNight}
              style={{
                width: "100%",
                padding: 16,
                background:
                  manualForm.hotelName && manualForm.pricePerNight
                    ? "var(--gold)"
                    : "var(--cream-deep)",
                color:
                  manualForm.hotelName && manualForm.pricePerNight
                    ? "var(--white)"
                    : "var(--ink-light)",
                fontSize: 14,
                fontWeight: 500,
                fontFamily: "var(--font-body)",
                border: "none",
                borderRadius: 12,
                cursor:
                  manualForm.hotelName && manualForm.pricePerNight
                    ? "pointer"
                    : "not-allowed",
                marginTop: 4,
                transition: "all 0.2s ease",
              }}
            >
              Find Better Price
            </button>
          </div>
        </div>
      )}

      {/* ── How it works ── */}
      <div style={{ marginTop: 48, textAlign: "center" }}>
        <h3
          className="type-heading-3"
          style={{
            color: "var(--ink)",
            marginBottom: 28,
            fontStyle: "italic",
          }}
        >
          How it works
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              icon: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              ),
              title: "Screenshot",
              desc: "Take a screenshot of any hotel listing on any OTA",
            },
            {
              icon: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M12 12l4-4" />
                  <path d="M22 2l-6 6" />
                </svg>
              ),
              title: "AI Extracts",
              desc: "Our AI reads the hotel, dates, room type & price",
            },
            {
              icon: (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              ),
              title: "Save 15–40%",
              desc: "Get B2B preferred rates that OTAs mark up",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "var(--white)",
                border: "1px solid var(--cream-border)",
                borderRadius: 14,
                padding: "24px 20px",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--gold-pale)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                {item.icon}
              </div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--ink)",
                  marginBottom: 6,
                }}
              >
                {item.title}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-light)",
                  fontWeight: 300,
                  lineHeight: 1.5,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust badges ── */}
      <div
        style={{
          marginTop: 32,
          display: "flex",
          justifyContent: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        {[
          "Works with any OTA",
          "Members only",
          "Prices verified in real-time",
        ].map((badge) => (
          <div
            key={badge}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--success)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span
              style={{
                fontSize: 12,
                color: "var(--ink-light)",
                fontWeight: 400,
              }}
            >
              {badge}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ────────── STEP 2: EXTRACTING / SEARCHING ────────── */
function ExtractingStep({
  screenshotUrl,
  isSearching,
}: {
  screenshotUrl: string | null;
  isSearching: boolean;
}) {
  const steps = isSearching ? SEARCH_STEPS : SCANNING_STEPS;
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    steps.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleSteps((prev) => [...prev, i]);
        }, (i + 1) * 800)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [steps]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      style={{ textAlign: "center" }}
    >
      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--cream-border)",
          borderRadius: 20,
          padding: "48px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Screenshot thumbnail */}
        {screenshotUrl && !isSearching && (
          <div
            style={{
              width: 120,
              height: 160,
              borderRadius: 12,
              border: "1px solid var(--cream-border)",
              overflow: "hidden",
              margin: "0 auto 24px",
              position: "relative",
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
                opacity: 0.7,
              }}
            />
            {/* Scan line */}
            <motion.div
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: 2,
                background:
                  "linear-gradient(90deg, transparent, var(--gold), transparent)",
                boxShadow: "0 0 12px var(--gold)",
              }}
            />
          </div>
        )}

        {/* Pulsing icon for search */}
        {isSearching && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--gold-pale)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </motion.div>
        )}

        <h2
          className="type-display-3"
          style={{
            color: "var(--ink)",
            marginBottom: 8,
            fontStyle: "italic",
          }}
        >
          {isSearching ? "Finding better rates..." : "Analyzing screenshot..."}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--ink-light)",
            fontWeight: 300,
            marginBottom: 32,
          }}
        >
          {isSearching
            ? "Checking 50+ hotel partners"
            : "Our AI is reading your screenshot"}
        </p>

        {/* Progress steps */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            maxWidth: 280,
            margin: "0 auto",
            textAlign: "left",
          }}
        >
          {steps.map((text, i) => (
            <AnimatePresence key={i}>
              {visibleSteps.includes(i) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid var(--cream-deep)",
                      borderTopColor: "var(--gold)",
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ink-light)",
                      fontWeight: 300,
                    }}
                  >
                    {text}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        {/* Animated dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 28,
          }}
        >
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
      </div>
    </motion.div>
  );
}

/* ────────── STEP 3: VERIFY EXTRACTED DATA ────────── */
function VerifyStep({
  data,
  setData,
  screenshotUrl,
  isManual,
  onConfirm,
  onBack,
}: {
  data: ExtractedData;
  setData: (d: ExtractedData) => void;
  screenshotUrl: string | null;
  isManual: boolean;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div
        style={{
          background: "var(--white)",
          border: "1px solid var(--cream-border)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--cream-border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 10px",
                background: "var(--green-soft)",
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--success)",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {isManual ? "Details entered" : `${Math.round(data.confidence * 100)}% confident`}
              </span>
            </div>
            <h3
              className="type-heading-3"
              style={{ color: "var(--ink)" }}
            >
              Confirm Details
            </h3>
          </div>
          {!isManual && screenshotUrl && (
            <div
              style={{
                width: 56,
                height: 72,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid var(--cream-border)",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshotUrl}
                alt="Screenshot"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>

        {/* Extracted Details */}
        <div style={{ padding: "20px 24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px 20px",
            }}
          >
            <DetailRow
              label="Hotel"
              value={data.hotelName}
              span={2}
              editing={editing}
              onChange={(v) => setData({ ...data, hotelName: v })}
            />
            <DetailRow
              label="Location"
              value={data.location}
              span={2}
              editing={editing}
              onChange={(v) => setData({ ...data, location: v })}
            />
            <DetailRow
              label="OTA"
              value={data.otaName}
              editing={editing}
              onChange={(v) => setData({ ...data, otaName: v })}
            />
            <DetailRow
              label="Price / Night"
              value={`₹${formatCurrency(data.otaPrice)}`}
              editing={editing}
              onChange={(v) =>
                setData({
                  ...data,
                  otaPrice: parseInt(v.replace(/[^0-9]/g, ""), 10) || 0,
                })
              }
            />
            <DetailRow
              label="Check-in"
              value={formatDate(data.checkIn)}
              editing={editing}
              onChange={(v) => setData({ ...data, checkIn: v })}
              type="date"
              rawValue={data.checkIn}
            />
            <DetailRow
              label="Check-out"
              value={formatDate(data.checkOut)}
              editing={editing}
              onChange={(v) => setData({ ...data, checkOut: v })}
              type="date"
              rawValue={data.checkOut}
            />
            <DetailRow
              label="Room Type"
              value={data.roomType}
              editing={editing}
              onChange={(v) => setData({ ...data, roomType: v })}
            />
            <DetailRow
              label="Guests"
              value={data.guests}
              editing={editing}
              onChange={(v) => setData({ ...data, guests: v })}
            />
          </div>

          {/* Edit toggle */}
          <button
            onClick={() => setEditing(!editing)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 0",
              marginTop: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              color: "var(--gold)",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {editing ? "Done editing" : "Edit details"}
          </button>
        </div>

        {/* Actions */}
        <div
          style={{
            padding: "16px 24px 24px",
            display: "flex",
            gap: 12,
          }}
        >
          <button
            onClick={onBack}
            style={{
              flex: "0 0 auto",
              padding: "14px 20px",
              background: "transparent",
              border: "1px solid var(--cream-border)",
              borderRadius: 12,
              color: "var(--ink-light)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Back
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "14px 20px",
              background: "var(--gold)",
              color: "var(--white)",
              fontSize: 14,
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Find Better Price
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Detail Row sub-component ── */
function DetailRow({
  label,
  value,
  span,
  editing,
  onChange,
  type,
  rawValue,
}: {
  label: string;
  value: string;
  span?: number;
  editing: boolean;
  onChange: (v: string) => void;
  type?: string;
  rawValue?: string;
}) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "var(--ink-light)",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {editing ? (
        <input
          type={type || "text"}
          value={type === "date" ? rawValue || "" : value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "var(--cream)",
            border: "1px solid var(--cream-border)",
            borderRadius: 8,
            color: "var(--ink)",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            outline: "none",
          }}
        />
      ) : (
        <div
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "var(--ink)",
          }}
        >
          {value}
        </div>
      )}
    </div>
  );
}

/* ────────── STEP 4: RESULT ────────── */
function ResultStep({
  result,
  onReset,
}: {
  result: WholesaleResult;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35 }}
    >
      {/* Savings headline */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          textAlign: "center",
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            background: "var(--green-soft)",
            border: "1px solid var(--green-border)",
            borderRadius: 20,
            marginBottom: 14,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--success)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--success)",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Better rate found
          </span>
        </div>
        <h2
          className="type-display-2"
          style={{
            color: "var(--ink)",
            marginBottom: 4,
            fontStyle: "italic",
          }}
        >
          ₹{formatCurrency(result.savings)} less{" "}
          <span style={{ fontSize: "0.7em", fontStyle: "normal", fontWeight: 300 }}>
            /night
          </span>
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-light)", fontWeight: 300 }}>
          Our rate vs {result.otaName}
        </p>
      </motion.div>

      {/* Price comparison cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* OTA Price (struck through) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            background: "var(--red-soft)",
            border: "1px solid var(--red-border)",
            borderRadius: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--error)",
                fontWeight: 400,
                marginBottom: 2,
              }}
            >
              {result.otaName}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--error)",
                opacity: 0.6,
                fontWeight: 300,
              }}
            >
              per night
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              color: "var(--error)",
              textDecoration: "line-through",
              opacity: 0.7,
              fontStyle: "italic",
            }}
          >
            ₹{formatCurrency(result.otaPrice)}
          </div>
        </motion.div>

        {/* Our Price */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 20px",
            background: "var(--green-soft)",
            border: "1px solid var(--green-border)",
            borderRadius: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--success)",
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              Voyagr Club
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--success)",
                opacity: 0.7,
                fontWeight: 300,
              }}
            >
              per night
            </div>
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 34,
              color: "var(--success)",
              fontStyle: "italic",
            }}
          >
            ₹{formatCurrency(result.ourPrice)}
          </div>
        </motion.div>
      </div>

      {/* Total savings banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.4 }}
        style={{
          background: "var(--gold-pale)",
          border: "1px solid rgba(201, 168, 76, 0.25)",
          borderRadius: 12,
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "var(--gold)",
            fontStyle: "italic",
            fontFamily: "var(--font-display)",
            fontWeight: 400,
          }}
        >
          Total for {result.nights} night{result.nights > 1 ? "s" : ""}
        </span>
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--ink-light)",
              textDecoration: "line-through",
              marginRight: 10,
            }}
          >
            ₹{formatCurrency(result.totalOta)}
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 500,
              color: "var(--ink)",
              fontFamily: "var(--font-display)",
            }}
          >
            ₹{formatCurrency(result.totalOurs)}
          </span>
        </div>
      </motion.div>

      {/* Hotel details card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        style={{
          background: "var(--white)",
          border: "1px solid var(--cream-border)",
          borderRadius: 14,
          padding: "20px 20px",
          marginBottom: 24,
        }}
      >
        <h4
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 17,
            fontWeight: 400,
            color: "var(--ink)",
            marginBottom: 10,
            fontStyle: "italic",
          }}
        >
          {result.hotelName}
          {result.location && (
            <span
              style={{
                fontSize: 13,
                color: "var(--ink-light)",
                fontStyle: "normal",
                fontWeight: 300,
                marginLeft: 6,
              }}
            >
              — {result.location}
            </span>
          )}
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px 16px",
            fontSize: 12,
            color: "var(--ink-light)",
            fontWeight: 300,
            lineHeight: 1.7,
          }}
        >
          <div>
            <span style={{ color: "var(--ink-light)", opacity: 0.7 }}>
              Room:{" "}
            </span>
            <span style={{ color: "var(--ink-mid)" }}>{result.roomType}</span>
          </div>
          <div>
            <span style={{ color: "var(--ink-light)", opacity: 0.7 }}>
              Guests:{" "}
            </span>
            <span style={{ color: "var(--ink-mid)" }}>{result.guests}</span>
          </div>
          <div>
            <span style={{ color: "var(--ink-light)", opacity: 0.7 }}>
              Check-in:{" "}
            </span>
            <span style={{ color: "var(--ink-mid)" }}>
              {formatDate(result.checkIn)}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--ink-light)", opacity: 0.7 }}>
              Check-out:{" "}
            </span>
            <span style={{ color: "var(--ink-mid)" }}>
              {formatDate(result.checkOut)}
            </span>
          </div>
        </div>

        {/* Perks */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 14,
            paddingTop: 14,
            borderTop: "1px solid var(--cream-border)",
          }}
        >
          {result.includesBreakfast && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--success)",
                fontWeight: 400,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Breakfast included
            </div>
          )}
          {result.freeCancellation && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--success)",
                fontWeight: 400,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Free cancellation
            </div>
          )}
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.4 }}
      >
        <a
          href={`https://wa.me/919876543210?text=${encodeURIComponent(
            `Hi Voyagr, I'd like to book ${result.hotelName} (${result.roomType}) for ${formatDate(result.checkIn)} – ${formatDate(result.checkOut)} at ₹${formatCurrency(result.ourPrice)}/night. Match My Rate reference.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: "100%",
            padding: 16,
            background: "var(--gold)",
            color: "var(--white)",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "var(--font-body)",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            textAlign: "center",
            textDecoration: "none",
            transition: "all 0.2s ease",
          }}
        >
          Book This Deal on WhatsApp
        </a>

        <button
          onClick={onReset}
          style={{
            display: "block",
            width: "100%",
            padding: 14,
            marginTop: 10,
            background: "transparent",
            border: "1px solid var(--cream-border)",
            borderRadius: 12,
            color: "var(--ink-light)",
            fontSize: 13,
            fontFamily: "var(--font-body)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Try Another Screenshot
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: 11,
            color: "var(--ink-light)",
            fontWeight: 300,
            lineHeight: 1.6,
          }}
        >
          Our team will confirm availability and process your booking over call
          or WhatsApp. No payment required upfront.
        </p>
      </motion.div>
    </motion.div>
  );
}
