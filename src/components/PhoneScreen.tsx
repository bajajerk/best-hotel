"use client";

import { useState } from "react";

interface Props {
  onBack: () => void;
  onSubmit: (phone: string) => void;
}

export default function PhoneScreen({ onBack, onSubmit }: Props) {
  const [phone, setPhone] = useState("");

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length > 5) {
      return digits.slice(0, 5) + " " + digits.slice(5);
    }
    return digits;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length > 0) {
      onSubmit("+91 " + phone);
    }
  };

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
          3/6
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
            width: "50%",
            background: "var(--gold)",
            borderRadius: 1,
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <div
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 30,
            fontWeight: 400,
            lineHeight: 1.15,
            letterSpacing: -0.3,
            marginBottom: 8,
          }}
        >
          your number,
          <br />
          <em style={{ color: "var(--gold)" }}>our best price.</em>
        </div>

        <div
          style={{
            fontSize: 13,
            color: "var(--white-30)",
            marginBottom: 32,
            lineHeight: 1.5,
            fontWeight: 300,
          }}
        >
          we&apos;ll send a quick OTP to verify.
          <br />
          no spam. no selling your data.
        </div>

        {/* Input group */}
        <div className="flex gap-2 mb-4">
          <div
            className="flex items-center justify-center"
            style={{
              background: "var(--white-04)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "14px 10px",
              color: "var(--white-50)",
              fontSize: 14,
              fontWeight: 400,
              width: 64,
              textAlign: "center",
              fontFamily: "var(--font-dm-sans)",
            }}
          >
            +91
          </div>
          <input
            type="tel"
            value={phone}
            onChange={handleChange}
            placeholder="98765 43210"
            autoFocus
            className="flex-1"
            style={{
              background: "var(--white-04)",
              border: "1px solid var(--border-focus)",
              borderRadius: 12,
              padding: "14px 16px",
              color: "var(--white)",
              fontSize: 18,
              fontWeight: 400,
              fontFamily: "var(--font-jetbrains-mono)",
              letterSpacing: 2,
            }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={handleSubmit}
          className="w-full cursor-pointer"
          style={{
            padding: 16,
            background:
              phone.replace(/\D/g, "").length > 0
                ? "var(--gold)"
                : "var(--white-08)",
            color:
              phone.replace(/\D/g, "").length > 0
                ? "var(--bg-black)"
                : "var(--white-30)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            borderRadius: 14,
            letterSpacing: 0.3,
            transition: "all 0.2s ease",
          }}
        >
          Send OTP
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
          we&apos;ll text you a 4-digit code
        </div>
      </div>
    </div>
  );
}
