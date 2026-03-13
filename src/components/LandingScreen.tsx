"use client";

import { useRef } from "react";

interface Props {
  onUpload: (file: File) => void;
}

export default function LandingScreen({ onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden overflow-y-auto"
      style={{ background: "var(--bg-black)", padding: "16px 22px 20px" }}
    >
      {/* Glow effect */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -80,
          right: -80,
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle, rgba(201,169,98,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          fontFamily: "var(--font-instrument-serif)",
          fontSize: 18,
          fontWeight: 400,
          fontStyle: "italic",
          color: "var(--white-80)",
          letterSpacing: -0.3,
        }}
      >
        beatmyrate
      </div>

      {/* Spacer */}
      <div className="flex-1 min-h-4 max-h-16" />

      {/* Hero */}
      <div className="mb-7">
        <h2
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 38,
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: -0.5,
            color: "var(--white)",
          }}
        >
          they
          <br />
          overcharge.
          <br />
          <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
            we don&apos;t.
          </em>
        </h2>
        <p
          className="mt-3.5"
          style={{
            fontSize: 13,
            color: "var(--white-30)",
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          screenshot any hotel price.
          <br />
          we&apos;ll find you a better deal.
        </p>
      </div>

      {/* Upload area */}
      <div
        className="text-center mb-3.5 cursor-pointer"
        style={{
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "28px 16px",
          background: "var(--white-04)",
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div
          className="flex items-center justify-center mx-auto mb-3"
          style={{
            width: 40,
            height: 40,
            border: "1px solid var(--gold-border)",
            borderRadius: 12,
            color: "var(--gold)",
            fontSize: 18,
          }}
        >
          <svg
            width="18"
            height="18"
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
        <p>
          <strong
            style={{
              color: "var(--white-80)",
              display: "block",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 2,
            }}
          >
            drop your screenshot
          </strong>
          <span
            style={{
              fontSize: 12,
              color: "var(--white-30)",
              fontWeight: 300,
              lineHeight: 1.5,
            }}
          >
            MakeMyTrip, Booking, Agoda — anything.
          </span>
        </p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* CTA Buttons */}
      <button
        onClick={() => fileInputRef.current?.click()}
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
        Upload Screenshot
      </button>

      <button
        onClick={() => cameraInputRef.current?.click()}
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
        Take a Photo
      </button>

      {/* Social proof */}
      <div
        className="text-center mt-4"
        style={{ fontSize: 11, color: "var(--white-30)", fontWeight: 300 }}
      >
        <span
          style={{
            color: "var(--gold)",
            fontWeight: 500,
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 11,
          }}
        >
          2,340
        </span>{" "}
        travelers already saving
      </div>
    </div>
  );
}
