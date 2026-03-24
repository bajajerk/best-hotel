"use client";

import { useRouter } from "next/navigation";

export type FlowStep = "search" | "results" | "select-room" | "unlock-rate" | "whatsapp";

const STEPS: { key: FlowStep; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "results", label: "Results" },
  { key: "select-room", label: "Select Room" },
  { key: "unlock-rate", label: "Unlock Rate" },
  { key: "whatsapp", label: "WhatsApp" },
];

interface FlowProgressBarProps {
  currentStep: FlowStep;
  /** href to navigate back to results (preserves query params) */
  resultsHref?: string;
  /** called when navigating away from modal (e.g. clicking a completed step) */
  onNavigateAway?: () => void;
}

export default function FlowProgressBar({
  currentStep,
  resultsHref,
  onNavigateAway,
}: FlowProgressBarProps) {
  const router = useRouter();
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  function handleClick(step: FlowStep, idx: number) {
    if (idx >= currentIdx) return; // only completed steps are clickable
    onNavigateAway?.();
    if (step === "search") {
      router.push("/");
    } else if (step === "results") {
      router.push(resultsHref || "/results");
    }
    // select-room: stay on hotel page (no-op if already there)
    // guest-details / confirmation are forward steps, not navigable back
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "14px 16px",
        fontFamily: "var(--font-body)",
      }}
    >
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIdx;
        const isActive = i === currentIdx;
        const isClickable = isCompleted;

        return (
          <div
            key={step.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
            }}
          >
            {/* Step dot + label */}
            <button
              type="button"
              onClick={() => handleClick(step.key, i)}
              disabled={!isClickable}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                padding: "2px 4px",
                cursor: isClickable ? "pointer" : "default",
                outline: "none",
                minWidth: 56,
              }}
              title={isClickable ? `Go back to ${step.label}` : undefined}
            >
              {/* Dot / checkmark */}
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.3s",
                  ...(isCompleted
                    ? {
                        background: "var(--success, #4a7c59)",
                        color: "#fff",
                        border: "2px solid var(--success, #4a7c59)",
                      }
                    : isActive
                    ? {
                        background: "var(--gold, #b8955a)",
                        color: "var(--ink, #1a1710)",
                        border: "2px solid var(--gold, #b8955a)",
                        boxShadow: "0 0 0 3px rgba(184,149,90,0.25)",
                      }
                    : {
                        background: "transparent",
                        color: "var(--ink-light, #7a7465)",
                        border: "2px solid var(--cream-border, #e0d8c8)",
                      }),
                }}
              >
                {isCompleted ? (
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
                  <span style={{ fontSize: "10px" }}>{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 400,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: isCompleted
                    ? "var(--success, #4a7c59)"
                    : isActive
                    ? "var(--gold, #b8955a)"
                    : "var(--ink-light, #7a7465)",
                  whiteSpace: "nowrap",
                  transition: "color 0.3s",
                  textDecoration: isClickable ? "none" : "none",
                }}
                onMouseEnter={(e) => {
                  if (isClickable) (e.currentTarget as HTMLElement).style.textDecoration = "underline";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.textDecoration = "none";
                }}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 28,
                  height: 2,
                  background: i < currentIdx
                    ? "var(--success, #4a7c59)"
                    : "var(--cream-border, #e0d8c8)",
                  transition: "background 0.3s",
                  flexShrink: 0,
                  marginTop: -16,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
