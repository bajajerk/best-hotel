"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className="back-button"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 0",
        fontFamily: "var(--sans)",
        fontSize: 13,
        fontWeight: 400,
        letterSpacing: "0.04em",
        color: "var(--ink-mid)",
        transition: "color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--ink-mid)";
      }}
    >
      {/* Left arrow chevron */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 3L5 8L10 13" />
      </svg>
      Back
    </button>
  );
}
