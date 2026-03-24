"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBookingFlow, PaymentInfo } from "@/context/BookingFlowContext";

export default function PaymentPage() {
  const router = useRouter();
  const flow = useBookingFlow();

  const [form, setForm] = useState<PaymentInfo>({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PaymentInfo, string>>>({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (flow.selectedRooms.length === 0) {
      router.replace("/book/rooms");
    } else if (!flow.guestInfo) {
      router.replace("/book/guest-details");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field: keyof PaymentInfo, value: string) => {
    let processed = value;
    if (field === "cardNumber") {
      processed = value.replace(/\D/g, "").slice(0, 16);
      processed = processed.replace(/(.{4})/g, "$1 ").trim();
    }
    if (field === "expiry") {
      processed = value.replace(/\D/g, "").slice(0, 4);
      if (processed.length >= 3) {
        processed = processed.slice(0, 2) + "/" + processed.slice(2);
      }
    }
    if (field === "cvv") {
      processed = value.replace(/\D/g, "").slice(0, 4);
    }
    setForm((prev) => ({ ...prev, [field]: processed }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof PaymentInfo, string>> = {};
    if (!form.cardholderName.trim()) errs.cardholderName = "Cardholder name is required";
    const digits = form.cardNumber.replace(/\s/g, "");
    if (digits.length < 13) errs.cardNumber = "Valid card number required";
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) errs.expiry = "MM/YY format required";
    if (form.cvv.length < 3) errs.cvv = "Valid CVV required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;
    setProcessing(true);
    flow.setPaymentInfo(form);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));
    flow.confirmBooking();
    router.push("/book/confirmation");
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
  });

  const labelStyle = {
    fontFamily: "var(--sans)",
    fontSize: "var(--text-body-sm)",
    fontWeight: 500 as const,
    color: "var(--ink-mid)",
    marginBottom: 6,
    display: "block" as const,
  };

  const taxesAndFees = Math.round(flow.totalPrice * 0.14);
  const grandTotal = flow.totalPrice + taxesAndFees;

  return (
    <div>
      <h3 style={{
        fontFamily: "var(--serif)",
        fontSize: "var(--text-heading-3)",
        fontWeight: 500,
        color: "var(--ink)",
        margin: "0 0 24px",
      }}>
        Payment
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Price breakdown */}
        <div style={{
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--cream-border)",
          padding: "20px",
        }}>
          <h4 style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 600,
            color: "var(--ink)",
            margin: "0 0 16px",
          }}>
            Price Breakdown
          </h4>

          {flow.selectedRooms.map((r) => (
            <div key={r.roomType.id} style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
            }}>
              <span style={{ color: "var(--ink-mid)" }}>
                {r.quantity}x {r.roomType.name} &times; {flow.nights} night{flow.nights !== 1 ? "s" : ""}
              </span>
              <span style={{ fontWeight: 500, color: "var(--ink)" }}>
                ${(r.roomType.pricePerNight * r.quantity * flow.nights).toLocaleString()}
              </span>
            </div>
          ))}

          <div style={{
            borderTop: "1px dashed var(--cream-border)",
            paddingTop: 10,
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body-sm)",
            color: "var(--ink-mid)",
          }}>
            <span>Taxes & fees (14%)</span>
            <span>${taxesAndFees.toLocaleString()}</span>
          </div>

          <div style={{
            borderTop: "1px solid var(--cream-border)",
            paddingTop: 12,
            marginTop: 12,
            display: "flex",
            justifyContent: "space-between",
            fontFamily: "var(--sans)",
          }}>
            <span style={{ fontSize: "var(--text-body)", fontWeight: 600, color: "var(--ink)" }}>Total</span>
            <span style={{
              fontFamily: "var(--serif)",
              fontSize: "var(--text-heading-2)",
              fontWeight: 600,
              color: "var(--ink)",
            }}>
              ${grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment form */}
        <div style={{
          background: "var(--white)",
          borderRadius: 16,
          border: "1px solid var(--cream-border)",
          padding: "24px 20px",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "var(--ink-light)" }}>lock</span>
            <span style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-sm)",
              color: "var(--ink-light)",
            }}>
              Secure payment — your details are encrypted
            </span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Cardholder Name *</label>
            <input
              type="text"
              value={form.cardholderName}
              onChange={(e) => update("cardholderName", e.target.value)}
              placeholder="John Smith"
              style={inputStyle(!!errors.cardholderName)}
            />
            {errors.cardholderName && (
              <span style={{ fontFamily: "var(--sans)", fontSize: "var(--text-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
                {errors.cardholderName}
              </span>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Card Number *</label>
            <input
              type="text"
              value={form.cardNumber}
              onChange={(e) => update("cardNumber", e.target.value)}
              placeholder="4242 4242 4242 4242"
              style={inputStyle(!!errors.cardNumber)}
            />
            {errors.cardNumber && (
              <span style={{ fontFamily: "var(--sans)", fontSize: "var(--text-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
                {errors.cardNumber}
              </span>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Expiry *</label>
              <input
                type="text"
                value={form.expiry}
                onChange={(e) => update("expiry", e.target.value)}
                placeholder="MM/YY"
                style={inputStyle(!!errors.expiry)}
              />
              {errors.expiry && (
                <span style={{ fontFamily: "var(--sans)", fontSize: "var(--text-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
                  {errors.expiry}
                </span>
              )}
            </div>
            <div>
              <label style={labelStyle}>CVV *</label>
              <input
                type="text"
                value={form.cvv}
                onChange={(e) => update("cvv", e.target.value)}
                placeholder="123"
                style={inputStyle(!!errors.cvv)}
              />
              {errors.cvv && (
                <span style={{ fontFamily: "var(--sans)", fontSize: "var(--text-caption)", color: "var(--error)", marginTop: 4, display: "block" }}>
                  {errors.cvv}
                </span>
              )}
            </div>
          </div>
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
          onClick={() => router.push("/book/guest-details")}
          disabled={processing}
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 500,
            padding: "14px 28px",
            borderRadius: 10,
            border: "1px solid var(--cream-border)",
            background: "var(--white)",
            color: "var(--ink-mid)",
            cursor: processing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: processing ? 0.5 : 1,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          Back
        </button>
        <button
          onClick={handlePay}
          disabled={processing}
          style={{
            fontFamily: "var(--sans)",
            fontSize: "var(--text-body)",
            fontWeight: 500,
            padding: "14px 36px",
            borderRadius: 10,
            border: "none",
            background: processing ? "var(--ink-light)" : "var(--gold)",
            color: "white",
            cursor: processing ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            minWidth: 180,
            justifyContent: "center",
          }}
        >
          {processing ? (
            <>
              Processing...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
              Pay ${grandTotal.toLocaleString()}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
