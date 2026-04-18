"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingFlow, GuestInfo } from "@/context/BookingFlowContext";

export default function GuestDetailsPage() {
  const router = useRouter();
  const flow = useBookingFlow();

  const [form, setForm] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    specialRequests: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof GuestInfo, string>>>({});

  // Redirect if no rooms selected
  useEffect(() => {
    if (flow.selectedRooms.length === 0) {
      router.replace("/book/rooms");
    }
    // Restore previous info
    if (flow.guestInfo) {
      setForm(flow.guestInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field: keyof GuestInfo, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof GuestInfo, string>> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^\+?[\d\s\-()]{7,}$/.test(form.phone)) errs.phone = "Invalid phone number";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    flow.setGuestInfo(form);
    router.push("/book/payment");
  };

  const inputStyle = (hasError: boolean) => ({
    width: "100%",
    padding: "12px 16px",
    borderRadius: 10,
    border: `1px solid ${hasError ? "var(--error)" : "var(--cream-border)"}`,
    background: "var(--white)",
    fontFamily: "var(--sans)",
    fontSize: "var(--text-body)",
    color: "var(--ink)",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s ease",
  });

  const labelStyle = {
    fontFamily: "var(--sans)",
    fontSize: "var(--text-body-sm)",
    fontWeight: 500 as const,
    color: "var(--ink-mid)",
    marginBottom: 6,
    display: "block" as const,
  };

  return (
    <div>
      <h3 style={{
        fontFamily: "var(--serif)",
        fontSize: "var(--text-heading-3)",
        fontWeight: 500,
        color: "var(--ink)",
        margin: "0 0 8px",
      }}>
        Guest Information
      </h3>
      <p style={{
        fontFamily: "var(--sans)",
        fontSize: "var(--text-body-sm)",
        color: "var(--ink-light)",
        margin: "0 0 24px",
      }}>
        Enter the primary guest&apos;s details for this booking.
      </p>

      {/* Booking summary mini card */}
      <div style={{
        background: "var(--cream-deep)",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 24,
        fontFamily: "var(--sans)",
        fontSize: "var(--text-body-sm)",
      }}>
        <div style={{ fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
          {flow.hotelName}
        </div>
        <div style={{ color: "var(--ink-light)", display: "flex", gap: 12, flexWrap: "wrap" }}>
          <span>{flow.nights} night{flow.nights !== 1 ? "s" : ""}</span>
          <span>&middot;</span>
          <span>{flow.selectedRooms.map((r) => `${r.quantity}x ${r.roomType.name}`).join(", ")}</span>
          <span>&middot;</span>
          {/* TODO: implement USD→INR conversion via live rates. */}
          <span style={{ fontWeight: 500, color: "var(--ink)" }}>
            {"\u20B9"}{Math.round(flow.totalPrice * 83).toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Form */}
      <div style={{
        background: "var(--white)",
        borderRadius: 16,
        border: "1px solid var(--cream-border)",
        padding: "24px 20px",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>First Name *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="John"
              style={inputStyle(!!errors.firstName)}
            />
            {errors.firstName && (
              <span style={{ fontFamily: "var(--sans)", fontSize: "var(--text-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
                {errors.firstName}
              </span>
            )}
          </div>
          <div>
            <label style={labelStyle}>Last Name *</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Smith"
              style={inputStyle(!!errors.lastName)}
            />
            {errors.lastName && (
              <span style={{ fontFamily: "var(--sans)", fontSize: "var(--text-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
                {errors.lastName}
              </span>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email Address *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="john.smith@email.com"
            style={inputStyle(!!errors.email)}
          />
          {errors.email && (
            <span style={{ fontFamily: "var(--sans)", fontSize: "var(--text-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
              {errors.email}
            </span>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Phone Number *</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            style={inputStyle(!!errors.phone)}
          />
          {errors.phone && (
            <span style={{ fontFamily: "var(--sans)", fontSize: "var(--text-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
              {errors.phone}
            </span>
          )}
        </div>

        <div>
          <label style={labelStyle}>Special Requests</label>
          <textarea
            value={form.specialRequests}
            onChange={(e) => update("specialRequests", e.target.value)}
            placeholder="Late check-in, extra pillows, dietary requirements..."
            rows={3}
            style={{
              ...inputStyle(false),
              resize: "vertical" as const,
              minHeight: 80,
            }}
          />
        </div>
      </div>

      {/* Navigation buttons */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: 24,
        gap: 16,
      }}>
        <button
          onClick={() => router.push("/book/rooms")}
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 500,
            padding: "14px 28px",
            borderRadius: 10,
            border: "1px solid var(--cream-border)",
            background: "var(--white)",
            color: "var(--ink-mid)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back
        </button>
        <button
          onClick={handleContinue}
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 500,
            padding: "14px 36px",
            borderRadius: 10,
            border: "none",
            background: "var(--ink)",
            color: "var(--white)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Continue to Payment
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
