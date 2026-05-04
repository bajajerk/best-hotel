"use client";

import { useEffect, useRef, useState } from "react";

const GOLD = "#c9a96e";
const BG = "#0a0a0a";
const FOOTER_BG = "#0d0d0b";

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS = '"Montserrat", system-ui, -apple-system, sans-serif';

const QUOTES: { text: string; name: string; city: string }[] = [
  {
    text: "One WhatsApp message. Upgrades, reservations, even a birthday surprise — all arranged.",
    name: "Rahul Sharma",
    city: "Delhi",
  },
  {
    text: "Never knew preferred rates could feel this personal. My suite was ready two hours early.",
    name: "Priya Mehta",
    city: "Mumbai",
  },
  {
    text: "The concierge remembered my wife's anniversary. Without me asking. That's the difference.",
    name: "Arun Kapoor",
    city: "Bangalore",
  },
];

const STATS: { value: string; suffix: string; label: string }[] = [
  { value: "1,500", suffix: "+", label: "Partner Hotels" },
  { value: "50", suffix: "+", label: "Cities" },
  { value: "24/7", suffix: "", label: "WhatsApp Concierge" },
];

type AccordionSection = {
  id: string;
  label: string;
  links: { label: string; href: string }[];
};

const ACCORDION: AccordionSection[] = [
  {
    id: "explore",
    label: "Explore",
    links: [
      { label: "Top Cities", href: "#" },
      { label: "Weekend Escapes", href: "#" },
      { label: "By Occasion", href: "#" },
      { label: "Editor's Picks", href: "#" },
    ],
  },
  {
    id: "membership",
    label: "Membership",
    links: [
      { label: "Why Voyagr Club", href: "#" },
      { label: "Preferred Rates", href: "#" },
      { label: "Match My Rate", href: "#" },
      { label: "Preferred Partners", href: "#" },
    ],
  },
  {
    id: "company",
    label: "Company",
    links: [
      { label: "Our Story", href: "#" },
      { label: "Concierge", href: "#" },
      { label: "Contact Us", href: "#" },
    ],
  },
];

export default function VoyagrFooterSeasons() {
  return (
    <div
      style={{
        background: BG,
        color: "#fff",
        minHeight: "100vh",
        fontFamily: SANS,
      }}
    >
      {/* Self-contained font load — Cormorant Garamond + Montserrat */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');`,
        }}
      />
      <QuoteSection />
      <StatsGrid />
      <CtaBlock />
      <DarkFooter />
    </div>
  );
}

/* ───────────────────────── Section 1 — Rotating quote ───────────────────────── */

function QuoteSection() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const jumpTo = (i: number) => {
    if (i === index) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setVisible(false);
    window.setTimeout(() => {
      setIndex(i);
      setVisible(true);
    }, 400);
    timerRef.current = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((cur) => (cur + 1) % QUOTES.length);
        setVisible(true);
      }, 400);
    }, 4000);
  };

  const q = QUOTES[index];

  return (
    <section style={{ padding: "60px 24px 40px" }} aria-label="Member testimonials">
      <div
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 400ms ease",
        }}
      >
        <div
          aria-hidden
          style={{
            fontFamily: SERIF,
            fontSize: 52,
            fontWeight: 300,
            color: GOLD,
            opacity: 0.7,
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          “
        </div>
        <p
          style={{
            fontFamily: SERIF,
            fontSize: 26,
            fontWeight: 300,
            fontStyle: "italic",
            color: "#fff",
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {q.text}
        </p>

        {/* Attribution row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 24,
          }}
        >
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 28,
              height: 1,
              background: GOLD,
            }}
          />
          <span
            style={{
              fontFamily: SANS,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "2px",
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
            }}
          >
            {q.name}
          </span>
          <span
            aria-hidden
            style={{
              width: 2,
              height: 2,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.35)",
            }}
          />
          <span
            style={{
              fontFamily: SANS,
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "2px",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
            }}
          >
            {q.city}
          </span>
        </div>
      </div>

      {/* Dot indicator (always visible — does not fade) */}
      <div
        role="tablist"
        aria-label="Choose testimonial"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 24,
        }}
      >
        {QUOTES.map((_, i) => {
          const active = i === index;
          return (
            <button
              key={i}
              role="tab"
              aria-selected={active}
              aria-label={`Show testimonial ${i + 1}`}
              onClick={() => jumpTo(i)}
              style={{
                width: active ? 20 : 4,
                height: 4,
                borderRadius: 100,
                background: active ? GOLD : "rgba(255,255,255,0.15)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "width 300ms ease, background 300ms ease",
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── Stats grid ───────────────────────── */

function StatsGrid() {
  const divider = "1px solid rgba(255,255,255,0.07)";
  return (
    <section
      aria-label="Voyagr Club at a glance"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        borderTop: divider,
        borderBottom: divider,
      }}
    >
      {STATS.map((s, i) => (
        <div
          key={s.label}
          style={{
            padding: "28px 0",
            textAlign: "center",
            borderLeft: i === 0 ? "none" : divider,
          }}
        >
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 32,
              fontWeight: 300,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {s.value}
            {s.suffix && (
              <span style={{ color: GOLD, fontSize: 22 }}>{s.suffix}</span>
            )}
          </div>
          <div
            style={{
              marginTop: 10,
              padding: "0 8px",
              fontFamily: SANS,
              fontSize: 7,
              fontWeight: 600,
              letterSpacing: "1.5px",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
              lineHeight: 1.4,
            }}
          >
            {s.label}
          </div>
        </div>
      ))}
    </section>
  );
}

/* ───────────────────────── CTA block ───────────────────────── */

function CtaBlock() {
  return (
    <section style={{ padding: "44px 24px 0" }}>
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: 30,
          fontWeight: 300,
          color: "#fff",
          margin: 0,
          marginBottom: 24,
          lineHeight: 1.2,
        }}
      >
        Ready for your next{" "}
        <em style={{ color: GOLD, fontStyle: "italic", fontWeight: 300 }}>
          unforgettable stay
        </em>
        ?
      </h2>

      <button
        type="button"
        style={{
          display: "block",
          width: "100%",
          background: GOLD,
          color: "#000",
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "2px",
          textTransform: "uppercase",
          border: "none",
          borderRadius: 100,
          padding: "16px",
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        Become a Member
      </button>

      <button
        type="button"
        style={{
          display: "block",
          width: "100%",
          background: "transparent",
          color: "rgba(255,255,255,0.6)",
          fontFamily: SANS,
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "2px",
          textTransform: "uppercase",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 100,
          padding: "16px",
          cursor: "pointer",
        }}
      >
        💬 WhatsApp Concierge
      </button>
    </section>
  );
}

/* ───────────────────────── Section 2 — Dark accordion footer ───────────────────────── */

function DarkFooter() {
  const [openId, setOpenId] = useState<string | null>("explore");

  return (
    <footer
      style={{
        background: FOOTER_BG,
        marginTop: 60,
      }}
      aria-label="Site footer"
    >
      {/* Top block */}
      <div style={{ padding: "40px 24px 32px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontFamily: SANS,
              fontSize: 16,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "1px",
            }}
          >
            VOYAGR
          </span>
          <span
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 18,
              color: GOLD,
            }}
          >
            Club
          </span>
        </div>

        <p
          style={{
            margin: "16px 0 24px",
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 300,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.7,
            maxWidth: 260,
          }}
        >
          Preferred rates. Handpicked perks. A concierge who actually picks up.
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          {[
            { icon: "💬", label: "WhatsApp" },
            { icon: "✉", label: "Email" },
            { icon: "📷", label: "Instagram" },
          ].map((s) => (
            <button
              key={s.label}
              type="button"
              aria-label={s.label}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.03)",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              {s.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion nav */}
      <nav
        aria-label="Footer navigation"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        {ACCORDION.map((section) => {
          const open = openId === section.id;
          return (
            <AccordionItem
              key={section.id}
              section={section}
              open={open}
              onToggle={() => setOpenId(open ? null : section.id)}
            />
          );
        })}
      </nav>

      {/* Bottom bar */}
      <div
        style={{
          padding: "20px 24px 36px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span
          style={{
            fontFamily: SANS,
            fontSize: 9,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "1px",
          }}
        >
          © 2025 Voyagr Club
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontSize: 9,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "1px",
          }}
        >
          Privacy · Terms
        </span>
      </div>
    </footer>
  );
}

function AccordionItem({
  section,
  open,
  onToggle,
}: {
  section: AccordionSection;
  open: boolean;
  onToggle: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    if (!panelRef.current) return;
    setMaxH(open ? panelRef.current.scrollHeight : 0);
  }, [open]);

  const panelId = `acc-panel-${section.id}`;
  const buttonId = `acc-btn-${section.id}`;

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <button
        id={buttonId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontFamily: SANS,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          color: open ? GOLD : "rgba(255,255,255,0.5)",
          transition: "color 300ms ease",
        }}
      >
        <span>{section.label}</span>
        <span
          aria-hidden
          style={{
            color: open ? GOLD : "rgba(255,255,255,0.25)",
            fontSize: 14,
            fontWeight: 300,
            lineHeight: 1,
            transition: "color 300ms ease",
          }}
        >
          {open ? "−" : "+"}
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        style={{
          maxHeight: maxH,
          overflow: "hidden",
          transition: "max-height 0.4s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      >
        <div
          ref={panelRef}
          style={{
            padding: "0 24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {section.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: SERIF,
                fontSize: 20,
                fontWeight: 300,
                color: "rgba(255,255,255,0.65)",
                textDecoration: "none",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
