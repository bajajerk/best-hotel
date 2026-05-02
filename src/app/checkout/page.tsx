"use client";

import { useState } from "react";

/* ─── Mock data (would come from booking context in production) ─── */
const BOOKING = {
  hotelName: "The Cormorant",
  dates: "22 Apr – 25 Apr 2026",
  room: "Deluxe Sea-View Suite · 2 Adults",
  nights: 3,
  roomRate: 54000,
  taxes: 9720,
  memberDiscount: 8100,
};
const TOTAL = BOOKING.roomRate + BOOKING.taxes - BOOKING.memberDiscount;
const SAVING = BOOKING.memberDiscount;

const PREFILLED = {
  name: "Mayank Bajaj",
  email: "mayank@voyagrclub.com",
  phone: "+91 98765 43210",
};

type PaymentTab = "upi" | "card" | "netbanking" | "emi";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

const CANCELLATION_DATE = "19 Apr 2026";

export default function CheckoutPage() {
  const [activeStep] = useState(1);
  const [payTab, setPayTab] = useState<PaymentTab>("upi");

  const [name, setName] = useState(PREFILLED.name);
  const [email, setEmail] = useState(PREFILLED.email);
  const [phone, setPhone] = useState(PREFILLED.phone);
  const [upiId, setUpiId] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [selectedBank, setSelectedBank] = useState("");

  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => setProcessing(false), 2500);
  };

  const steps = ["Details", "Payment", "Confirmed"];
  const tabs: { key: PaymentTab; label: string }[] = [
    { key: "upi", label: "UPI" },
    { key: "card", label: "Card" },
    { key: "netbanking", label: "Net Banking" },
    { key: "emi", label: "EMI" },
  ];

  const banks = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak", "Yes Bank"];

  return (
    <div className="vc-checkout">
      <div className="vc-checkout__inner">

        {/* ── PROGRESS BAR ── */}
        <div className="vc-steps">
          {steps.map((step, i) => (
            <div key={step} className="vc-steps__item">
              <span className={`vc-steps__label ${i === activeStep ? "vc-steps__label--active" : ""} ${i < activeStep ? "vc-steps__label--done" : ""} ${i > activeStep ? "vc-steps__label--upcoming" : ""}`}>
                {step}
              </span>
              {i < steps.length - 1 && (
                <span className="vc-steps__arrow">→</span>
              )}
            </div>
          ))}
        </div>

        {/* ── ORDER SUMMARY CARD ── */}
        <div className="vc-card" style={{ marginBottom: 24 }}>
          <h2 className="vc-card__hotel">{BOOKING.hotelName}</h2>
          <p className="vc-card__meta">
            {BOOKING.dates} · {BOOKING.room}
          </p>

          <div className="vc-card__rows">
            <div className="vc-card__row">
              <span className="vc-card__row-label">Room rate ({BOOKING.nights} nights)</span>
              <span className="vc-card__row-value">{fmt(BOOKING.roomRate)}</span>
            </div>
            <div className="vc-card__row">
              <span className="vc-card__row-label">Taxes + GST</span>
              <span className="vc-card__row-value">{fmt(BOOKING.taxes)}</span>
            </div>
            <div className="vc-card__row">
              <span className="vc-card__row-label">Member discount</span>
              <span className="vc-card__row-value vc-card__row-value--gold">−{fmt(BOOKING.memberDiscount)}</span>
            </div>
          </div>

          <div className="vc-card__divider" />

          <div className="vc-card__total">
            <span className="vc-card__total-label">Total</span>
            <span className="vc-card__total-value">{fmt(TOTAL)}</span>
          </div>

          <p className="vc-card__saving">
            You&apos;re saving {fmt(SAVING)} vs. public rate
          </p>
        </div>

        {/* ── FORM FIELDS (3 fields, max 4) ── */}
        <div className="vc-fields">
          <input
            className="vc-input"
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="vc-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="vc-input"
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        {/* ── PAYMENT OPTIONS ── */}
        <div className="vc-card" style={{ marginBottom: 24 }}>
          <div className="vc-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPayTab(tab.key)}
                className={`vc-tabs__btn ${payTab === tab.key ? "vc-tabs__btn--active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* UPI */}
          {payTab === "upi" && (
            <div>
              <label className="vc-label">UPI ID</label>
              <input
                className="vc-input"
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              <p className="vc-hint">
                You will receive a payment request on your UPI app
              </p>
            </div>
          )}

          {/* Card */}
          {payTab === "card" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="vc-label">Card number</label>
                <input
                  className="vc-input"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setCardNumber(v.replace(/(.{4})/g, "$1 ").trim());
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label className="vc-label">Expiry</label>
                  <input
                    className="vc-input"
                    type="text"
                    placeholder="MM / YY"
                    value={cardExpiry}
                    onChange={(e) => {
                      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (v.length >= 3) v = v.slice(0, 2) + " / " + v.slice(2);
                      setCardExpiry(v);
                    }}
                  />
                </div>
                <div>
                  <label className="vc-label">CVV</label>
                  <input
                    className="vc-input"
                    type="text"
                    placeholder="•••"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Net Banking */}
          {payTab === "netbanking" && (
            <div>
              <label className="vc-label">Select your bank</label>
              <div className="vc-bank-grid">
                {banks.map((bank) => (
                  <button
                    key={bank}
                    onClick={() => setSelectedBank(bank)}
                    className={`vc-bank-btn ${selectedBank === bank ? "vc-bank-btn--active" : ""}`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* EMI */}
          {payTab === "emi" && (
            <div>
              <p className="vc-emi-text">
                No-cost EMI available from <span style={{ color: "var(--ink)" }}>₹4,635/month</span> (12 months)
              </p>
              <div className="vc-emi-note">
                <p className="vc-emi-note__text">Available on HDFC, ICICI, Axis cards</p>
              </div>
              <p className="vc-hint" style={{ marginTop: 12 }}>
                EMI options will be shown after entering card details on the next step
              </p>
            </div>
          )}
        </div>

        {/* ── CANCELLATION POLICY (directly above pay button) ── */}
        <p className="vc-cancellation">
          Free cancellation until {CANCELLATION_DATE}.<br />
          Full refund within 5–7 business days.
        </p>

        {/* ── PAY BUTTON ── */}
        <button
          onClick={handlePay}
          disabled={processing}
          className="vc-pay-btn"
        >
          {processing ? "Processing…" : `Pay ${fmt(TOTAL)} Securely →`}
        </button>

        {/* ── TRUST LINE (below pay button) ── */}
        <p className="vc-trust">
          256-bit encrypted · Powered by Razorpay · GST invoice included
        </p>
      </div>

      <style>{`
        /* ── Page shell ── */
        .vc-checkout {
          min-height: 100vh;
          background: var(--cream);
          display: flex;
          justify-content: center;
          padding: 0 16px;
        }
        .vc-checkout__inner {
          width: 100%;
          max-width: 560px;
          padding: 60px 40px;
        }
        @media (max-width: 600px) {
          .vc-checkout__inner {
            padding: 40px 20px;
          }
        }

        /* ── Progress bar ── */
        .vc-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 48px;
        }
        .vc-steps__item {
          display: flex;
          align-items: center;
        }
        .vc-steps__label {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-light);
          padding-bottom: 6px;
          border-bottom: 2px solid transparent;
          transition: all 0.3s ease;
        }
        .vc-steps__label--active {
          color: var(--ink);
          border-bottom-color: var(--gold);
        }
        .vc-steps__label--done {
          color: var(--ink);
        }
        .vc-steps__arrow {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 10px;
          color: var(--ink-light);
          margin: 0 16px;
          margin-bottom: 6px;
        }

        /* ── Card container ── */
        .vc-card {
          background: var(--white);
          border: 1px solid rgba(201,168,76,0.10);
          border-radius: 12px;
          padding: 24px;
        }
        .vc-card__hotel {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: 20px;
          font-weight: 500;
          color: var(--ink);
          margin: 0 0 4px;
        }
        .vc-card__meta {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          color: var(--ink-mid);
          margin: 0 0 20px;
        }

        /* Price rows */
        .vc-card__rows {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .vc-card__row {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
        }
        .vc-card__row-label {
          color: var(--ink-mid);
        }
        .vc-card__row-value {
          color: var(--ink);
        }
        .vc-card__row-value--gold {
          color: var(--gold);
        }
        .vc-card__divider {
          height: 1px;
          background: rgba(201,168,76,0.15);
          margin: 16px 0;
        }
        .vc-card__total {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .vc-card__total-label {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 14px;
          font-weight: 500;
          color: var(--ink);
        }
        .vc-card__total-value {
          font-family: var(--font-display, 'Cormorant Garamond', serif);
          font-size: 22px;
          font-weight: 600;
          color: var(--ink);
        }
        .vc-card__saving {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          color: #6b9e7a;
          margin: 12px 0 0;
        }

        /* ── Form fields ── */
        .vc-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .vc-input {
          width: 100%;
          padding: 12px 16px;
          background: var(--white);
          border: 1px solid var(--cream-border);
          border-radius: 8px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          color: var(--ink);
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        .vc-input::placeholder {
          color: var(--ink-light);
        }
        .vc-input:focus {
          border-color: var(--gold);
        }
        .vc-label {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          font-weight: 500;
          color: var(--ink-light);
          margin-bottom: 6px;
          display: block;
          letter-spacing: 0.02em;
        }
        .vc-hint {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 11px;
          color: var(--ink-light);
          margin-top: 8px;
        }

        /* ── Payment tabs ── */
        .vc-tabs {
          display: flex;
          border-bottom: 1px solid var(--cream-border);
          margin-bottom: 20px;
        }
        .vc-tabs__btn {
          flex: 1;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          font-weight: 400;
          color: var(--ink-light);
          padding: 0 0 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .vc-tabs__btn--active {
          color: var(--ink);
          font-weight: 500;
          border-bottom-color: var(--gold);
        }

        /* ── Bank grid ── */
        .vc-bank-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 4px;
        }
        .vc-bank-btn {
          background: var(--cream-deep);
          border: 1px solid var(--cream-border);
          border-radius: 8px;
          padding: 10px 12px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          color: var(--ink-mid);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }
        .vc-bank-btn--active {
          background: rgba(201,168,76,0.12);
          border-color: rgba(201,168,76,0.4);
          color: var(--gold);
        }

        /* ── EMI ── */
        .vc-emi-text {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 13px;
          color: var(--ink-mid);
          line-height: 1.6;
          margin: 0;
        }
        .vc-emi-note {
          margin-top: 16px;
          padding: 12px 16px;
          background: var(--cream-deep);
          border-radius: 8px;
          border: 1px solid var(--cream-border);
        }
        .vc-emi-note__text {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          color: var(--ink-light);
          margin: 0;
        }

        /* ── Cancellation ── */
        .vc-cancellation {
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 12px;
          color: var(--ink-mid);
          line-height: 1.6;
          margin-bottom: 16px;
          text-align: center;
        }

        /* ── Pay button ── */
        .vc-pay-btn {
          width: 100%;
          padding: 16px 24px;
          background: var(--gold);
          border: 1px solid var(--gold);
          border-radius: 8px;
          font-family: var(--font-body, 'DM Sans', sans-serif);
          font-size: 15px;
          font-weight: 500;
          color: var(--ink);
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.01em;
        }
        .vc-pay-btn:hover:not(:disabled) {
          background: var(--gold-light);
        }
        .vc-pay-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* ── Trust line ── */
        .vc-trust {
          font-family: var(--font-mono, 'DM Mono', monospace);
          font-size: 9px;
          color: var(--ink-light);
          text-align: center;
          margin-top: 14px;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
