"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BookingData } from "@/app/page";

interface Props {
  data: BookingData;
  onBack: () => void;
  onNext: () => void;
  onUpdate: (updates: Partial<BookingData>) => void;
}

export default function ConfirmScreen({ data, onBack, onNext, onUpdate }: Props) {
  const [scanning, setScanning] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setScanning(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField) {
      onUpdate({ [editingField]: editValue });
      setEditingField(null);
    }
  };

  const fields = [
    { key: "hotel", label: "Hotel", value: data.hotel },
    { key: "dates", label: "Dates", value: data.dates },
    { key: "room", label: "Room", value: data.room },
    { key: "guests", label: "Guests", value: data.guests },
  ];

  return (
    <div
      className="h-full flex flex-col overflow-y-auto"
      style={{ background: "var(--bg-black)", padding: "16px 24px 32px" }}
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
          2/6
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
        <motion.div
          initial={{ width: "16.6%" }}
          animate={{ width: "33.3%" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            background: "var(--gold)",
            borderRadius: 1,
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {scanning ? (
          <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            {/* Scanning animation */}
            <div
              className="relative mb-6 overflow-hidden"
              style={{
                width: 120,
                height: 120,
                borderRadius: 16,
                border: "1px solid var(--gold-border)",
                background: "var(--white-04)",
              }}
            >
              {data.screenshotUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.screenshotUrl}
                  alt="Screenshot"
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.4 }}
                />
              )}
              {/* Scan line */}
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  width: "100%",
                  height: 2,
                  background:
                    "linear-gradient(90deg, transparent, var(--gold), transparent)",
                }}
              />
            </div>

            <div
              className="animate-pulse-glow"
              style={{
                fontFamily: "var(--font-instrument-serif)",
                fontSize: 22,
                fontWeight: 400,
                color: "var(--white-80)",
                marginBottom: 8,
              }}
            >
              scanning your screenshot
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--white-30)",
                fontWeight: 300,
              }}
            >
              extracting hotel details...
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col"
          >
            {/* Centered content */}
            <div className="flex-1 flex flex-col justify-center">
            {/* Screenshot thumbnail */}
            <div
              className="flex items-center mb-5"
              style={{
                width: "100%",
                height: 64,
                background: "var(--white-04)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "0 14px",
                gap: 12,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 36,
                  height: 36,
                  background: "var(--white-08)",
                  borderRadius: 8,
                  fontSize: 16,
                  overflow: "hidden",
                }}
              >
                {data.screenshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.screenshotUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>&#128444;</span>
                )}
              </div>
              <div className="flex-1">
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--white-80)",
                  }}
                >
                  {data.screenshotName || "screenshot.jpg"}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--green)",
                    fontWeight: 400,
                    marginTop: 1,
                  }}
                >
                  &#10003; scanned
                </div>
              </div>
            </div>

            {/* Section label */}
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 10,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                color: "var(--white-30)",
                marginBottom: 10,
                marginTop: 4,
              }}
            >
              Extracted Details
            </div>

            {/* Fields */}
            {fields.map((field) => (
              <div
                key={field.key}
                className="flex justify-between items-center"
                style={{
                  background: "var(--white-04)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 6,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "var(--white-30)",
                      fontWeight: 400,
                      letterSpacing: 0.3,
                    }}
                  >
                    {field.label}
                  </div>
                  {editingField === field.key ? (
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      autoFocus
                      className="bg-transparent border-none outline-none"
                      style={{
                        fontSize: 14,
                        fontWeight: 400,
                        color: "var(--white)",
                        marginTop: 1,
                        width: "100%",
                        fontFamily: "var(--font-dm-sans)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 400,
                        color: "var(--white)",
                        marginTop: 1,
                      }}
                    >
                      {field.value}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => startEdit(field.key, field.value)}
                  style={{
                    fontSize: 10,
                    color: "var(--white-30)",
                    fontWeight: 400,
                    cursor: "pointer",
                    border: "1px solid var(--border)",
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "transparent",
                  }}
                >
                  edit
                </button>
              </div>
            ))}

            {/* Price field */}
            <div
              className="flex justify-between items-center"
              style={{
                background: "var(--gold-soft)",
                border: "1px solid var(--gold-border)",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 6,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--white-30)",
                    fontWeight: 400,
                    letterSpacing: 0.3,
                  }}
                >
                  {data.source} Price
                </div>
                <div
                  style={{
                    color: "var(--gold)",
                    fontFamily: "var(--font-instrument-serif)",
                    fontSize: 20,
                    fontStyle: "italic",
                    marginTop: 1,
                  }}
                >
                  &#8377;{data.originalPrice.toLocaleString("en-IN")}
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: 11,
                      fontStyle: "normal",
                      color: "var(--white-30)",
                    }}
                  >
                    {" "}
                    /night
                  </span>
                </div>
              </div>
            </div>

            </div>
            {/* CTA */}
            <div className="pt-4">
              <button
                onClick={onNext}
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
                Find a Better Deal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
