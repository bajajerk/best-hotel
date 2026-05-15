"use client";

import { motion } from "framer-motion";

const benefits = [
  {
    icon: "\u2726",
    title: "Guaranteed Lowest Price",
    description:
      "If you find a lower rate anywhere, we\u2019ll match it + give you 10% off",
  },
  {
    icon: "\u21BB",
    title: "Free Cancellation",
    description:
      "Plans change. Cancel anytime up to 24hrs before check-in",
  },
  {
    icon: "\u2B06",
    title: "Room Upgrades",
    description:
      "Complimentary upgrades when available at check-in",
  },
  {
    icon: "\u23F0",
    title: "Early Check-in / Late Checkout",
    description:
      "Flexible timing based on availability",
  },
  {
    icon: "\u260E",
    title: "24/7 Concierge",
    description:
      "Dedicated support for any booking changes or requests",
  },
  {
    icon: "\uD83D\uDD12",
    title: "Price Lock",
    description:
      "Lock today\u2019s rate for 48 hours while you decide",
  },
];

export default function Tab2Premium() {
  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: "var(--cream)" }}
    >
      {/* Gold glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          height: 300,
          background:
            "radial-gradient(circle, rgba(201,169,98,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center relative"
        style={{ padding: "24px 24px 0" }}
      >
        <div
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 18,
            fontWeight: 400,
            fontStyle: "italic",
            color: "var(--ink-mid)",
            letterSpacing: -0.3,
            marginBottom: 4,
          }}
        >
          beatmyrate
        </div>
        <div
          style={{
            fontSize: 20,
            color: "var(--gold)",
            letterSpacing: 4,
          }}
        >
          &#9670;
        </div>
      </motion.div>

      {/* ─── Hero ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-center"
        style={{ padding: "24px 24px 0" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: 38,
            fontWeight: 400,
            fontStyle: "italic",
            lineHeight: 1.1,
            letterSpacing: -0.5,
            color: "var(--gold)",
            marginBottom: 10,
          }}
        >
          premium rates
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 300,
            color: "var(--ink-light)",
            lineHeight: 1.5,
          }}
        >
          insider rates. zero markup.
        </p>
      </motion.div>

      {/* ─── Benefit Cards ─── */}
      <div style={{ padding: "32px 24px 0" }}>
        <div className="flex flex-col gap-3.5">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{
                duration: 0.45,
                delay: i * 0.08,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex gap-4 items-start"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 16,
              }}
            >
              {/* Icon Circle */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid var(--gold-border)",
                  background: "var(--gold-soft)",
                  fontSize: 18,
                  color: "var(--gold)",
                }}
              >
                {benefit.icon}
              </div>

              {/* Content */}
              <div className="flex-1" style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: 4,
                    lineHeight: 1.3,
                  }}
                >
                  {benefit.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 300,
                    color: "var(--ink-light)",
                    lineHeight: 1.55,
                  }}
                >
                  {benefit.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── CTA Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{ padding: "36px 24px 0" }}
      >
        {/* Call Button */}
        <button
          onClick={() => window.open("tel:+919833534627")}
          className="w-full cursor-pointer"
          style={{
            padding: 16,
            background: "var(--gold)",
            color: "var(--ink)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: 14,
            fontWeight: 500,
            border: "none",
            borderRadius: 14,
            letterSpacing: 0.3,
            marginBottom: 12,
          }}
        >
          Call to Unlock Rates
        </button>

        {/* WhatsApp Button */}
        <button
          onClick={() =>
            window.open(
              "https://wa.me/919833534627?text=Hi,%20I%27m%20interested%20in%20premium%20rates"
            )
          }
          className="w-full cursor-pointer"
          style={{
            padding: 14,
            background: "transparent",
            color: "var(--ink-mid)",
            fontFamily: "var(--font-dm-sans)",
            fontSize: 13,
            fontWeight: 400,
            border: "1px solid var(--border)",
            borderRadius: 14,
          }}
        >
          WhatsApp Us
        </button>

        {/* Trust Text */}
        <div
          className="text-center"
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "var(--ink-light)",
            fontWeight: 300,
            lineHeight: 1.5,
            letterSpacing: 0.2,
          }}
        >
          our team confirms availability
          <br />
          and processes payment on call
        </div>
      </motion.div>

      {/* ─── Bottom Social Proof ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center"
        style={{ padding: "32px 24px 40px" }}
      >
        <div
          style={{
            background: "var(--cream-deep)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "20px 16px",
          }}
        >
          <div
            className="flex items-center justify-center gap-2"
            style={{ marginBottom: 6 }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono)",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--gold)",
              }}
            >
              2,340+
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "var(--ink)",
              }}
            >
              trusted travelers
            </span>
          </div>

          <div
            style={{
              fontSize: 12,
              fontWeight: 300,
              color: "var(--ink-mid)",
            }}
          >
            Average saving{" "}
            <span
              style={{
                fontFamily: "var(--font-instrument-serif)",
                fontStyle: "italic",
                color: "var(--gold)",
                fontSize: 14,
              }}
            >
              &#8377;2,800
            </span>
            /night
          </div>
        </div>
      </motion.div>
    </div>
  );
}
