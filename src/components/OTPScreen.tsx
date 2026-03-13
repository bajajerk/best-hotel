"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  phone: string;
  onBack: () => void;
  onVerified: () => void;
}

export default function OTPScreen({ phone, onBack, onVerified }: Props) {
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleVerify = useCallback(() => {
    onVerified();
  }, [onVerified]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (otp.every((d) => d !== "")) {
      const timer = setTimeout(handleVerify, 400);
      return () => clearTimeout(timer);
    }
  }, [otp, handleVerify]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((d) => d === "");
    if (nextEmpty >= 0) {
      inputRefs.current[nextEmpty]?.focus();
    } else {
      inputRefs.current[3]?.focus();
    }
  };

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
          4/6
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
            width: "66.6%",
            background: "var(--gold)",
            borderRadius: 1,
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        {/* Icon */}
        <div
          className="flex items-center justify-center mb-6"
          style={{
            width: 48,
            height: 48,
            border: "1px solid var(--border)",
            borderRadius: 14,
            fontSize: 20,
            color: "var(--white-50)",
          }}
        >
          &#9993;
        </div>

        <div
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 26,
            fontWeight: 400,
            marginBottom: 6,
          }}
        >
          check your texts
        </div>

        <div
          style={{
            fontSize: 12,
            color: "var(--white-30)",
            marginBottom: 36,
            fontWeight: 300,
          }}
        >
          sent to{" "}
          <span
            style={{
              color: "var(--white-80)",
              fontWeight: 500,
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: 11,
            }}
          >
            {phone || "+91 98765 43210"}
          </span>
        </div>

        {/* OTP boxes */}
        <div className="flex gap-3.5 mb-8" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="text-center"
              style={{
                width: 52,
                height: 60,
                background: digit
                  ? "var(--gold-soft)"
                  : "var(--white-04)",
                border: `1px solid ${
                  digit
                    ? "var(--gold-border)"
                    : "var(--border)"
                }`,
                borderRadius: 14,
                fontFamily: "var(--font-instrument-serif)",
                fontSize: 28,
                fontWeight: 400,
                color: digit ? "var(--gold)" : "var(--white)",
                caretColor: "var(--gold)",
                transition: "all 0.15s ease",
              }}
            />
          ))}
        </div>

        {/* Resend */}
        <div
          style={{
            fontSize: 12,
            color: "var(--white-30)",
            fontWeight: 300,
          }}
        >
          didn&apos;t receive it?{" "}
          {resendTimer > 0 ? (
            <span style={{ color: "var(--gold)", fontWeight: 500 }}>
              resend in 0:{resendTimer.toString().padStart(2, "0")}
            </span>
          ) : (
            <button
              onClick={() => setResendTimer(30)}
              style={{
                color: "var(--gold)",
                fontWeight: 500,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              resend now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
