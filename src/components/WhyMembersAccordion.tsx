"use client";

import { useRef, useState, useEffect } from "react";

const ITEMS: Array<{ num: string; title: string; desc: string }> = [
  {
    num: "01",
    title: "Preferred Access",
    desc: "Curated luxury hotels with member-only privileges.",
  },
  {
    num: "02",
    title: "Human Concierge",
    desc: "Real concierge on WhatsApp, 24/7.",
  },
  {
    num: "03",
    title: "Handpicked Perks",
    desc: "Upgrades, spa credits, breakfast, late checkout — on every stay.",
  },
  {
    num: "04",
    title: "Verified Properties",
    desc: "Personally vetted for service, cleanliness, and guest experience.",
  },
  {
    num: "05",
    title: "Flexible Support",
    desc: "Changes, special requests, anything — handled.",
  },
];

const GOLD = "#c9a96e";

function AccordionItem({
  num,
  title,
  desc,
  open,
  onToggle,
}: {
  num: string;
  title: string;
  desc: string;
  open: boolean;
  onToggle: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (open) {
      setMaxH(el.scrollHeight);
    } else {
      setMaxH(0);
    }
  }, [open]);

  const panelId = `wm-acc-panel-${num}`;
  const headerId = `wm-acc-header-${num}`;

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.07)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8,
        background: open ? "rgba(201,169,110,0.05)" : "transparent",
        transition: "background 0.35s ease",
      }}
    >
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "baseline",
          width: "100%",
          padding: "18px 18px",
          gap: 14,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
          fontFamily: "inherit",
        }}
      >
        <span
          style={{
            fontFamily:
              "'Cormorant Garamond', var(--font-display), Georgia, serif",
            fontSize: 13,
            fontWeight: 400,
            color: GOLD,
            letterSpacing: "0.02em",
            lineHeight: 1,
            minWidth: 22,
          }}
        >
          {num}
        </span>
        <span
          style={{
            fontFamily:
              "'Cormorant Garamond', var(--font-display), Georgia, serif",
            fontSize: 20,
            fontWeight: 400,
            color: "#ffffff",
            lineHeight: 1.2,
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </span>
        <span
          aria-hidden="true"
          style={{
            fontFamily:
              "'Montserrat', var(--font-body), system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 300,
            color: GOLD,
            lineHeight: 1,
            transition: "transform 0.35s ease",
            display: "inline-block",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          +
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        style={{
          maxHeight: maxH,
          opacity: open ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.35s ease, opacity 0.35s ease",
        }}
      >
        <div
          ref={bodyRef}
          style={{
            padding: "0 18px 18px 50px",
            fontFamily:
              "'Montserrat', var(--font-body), system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 300,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.65,
            letterSpacing: "0.005em",
          }}
        >
          {desc}
        </div>
      </div>
    </div>
  );
}

export default function WhyMembersAccordion() {
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <section
      aria-labelledby="why-members-heading"
      style={{
        background: "#0a0a0a",
        padding: "56px 20px 48px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              fontFamily:
                "'Montserrat', var(--font-body), system-ui, sans-serif",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 14,
            }}
          >
            The Difference
          </div>
          <h2
            id="why-members-heading"
            style={{
              fontFamily:
                "'Cormorant Garamond', var(--font-display), Georgia, serif",
              fontSize: 34,
              fontWeight: 300,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              color: "#ffffff",
              margin: "0 0 12px",
            }}
          >
            Why members{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              stay
            </em>{" "}
            with us
          </h2>
          <p
            style={{
              fontFamily:
                "'Montserrat', var(--font-body), system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 300,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.45)",
              margin: 0,
            }}
          >
            Five small things that quietly add up to a different way of
            travelling.
          </p>
        </div>

        <div role="list">
          {ITEMS.map((item, i) => (
            <div role="listitem" key={item.num}>
              <AccordionItem
                num={item.num}
                title={item.title}
                desc={item.desc}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
