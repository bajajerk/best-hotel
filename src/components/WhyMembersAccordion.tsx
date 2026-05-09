"use client";

const ITEMS: Array<{ num: string; title: string; desc: string }> = [
  {
    num: "01",
    title: "Preferred access",
    desc: "Member-only rates at 1,500+ curated luxury properties.",
  },
  {
    num: "02",
    title: "Human concierge",
    desc: "Real people on WhatsApp — not bots, not forms.",
  },
  {
    num: "03",
    title: "Handpicked perks",
    desc: "Upgrades, breakfast, late checkout — negotiated per property.",
  },
  {
    num: "04",
    title: "Verified properties",
    desc: "Every hotel vetted — no surprises, no filler inventory.",
  },
  {
    num: "05",
    title: "Flexible support",
    desc: "Change dates, cancel, or rebook — we handle it.",
  },
];

const GOLD_LABEL = "#b8956a";
const GOLD_ACCENT = "#c9a66b";
const MUTED = "#8a857d";
const HAIRLINE = "rgba(255,255,255,0.08)";

export default function WhyMembersAccordion() {
  return (
    <section
      aria-labelledby="why-members-heading"
      className="wm-grid-section"
    >
      <style>{`
        .wm-grid-section {
          background: #0c0c0c;
          padding: 60px 20px;
        }
        .wm-grid-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 40% 60%;
          gap: 48px;
          align-items: start;
        }
        .wm-grid-row {
          display: grid;
          grid-template-columns: 28px 1fr;
          gap: 16px;
          padding: 16px 0;
          border-top: 1px solid ${HAIRLINE};
          align-items: baseline;
        }
        .wm-grid-row:last-child {
          border-bottom: 1px solid ${HAIRLINE};
        }
        @media (max-width: 767px) {
          .wm-grid-section {
            padding: 48px 20px;
          }
          .wm-grid-inner {
            grid-template-columns: 1fr;
            gap: 28px;
          }
        }
      `}</style>

      <div className="wm-grid-inner">
        <div>
          <div
            style={{
              fontFamily:
                "'Inter', 'Montserrat', var(--font-body), system-ui, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: GOLD_LABEL,
              marginBottom: 16,
            }}
          >
            The Difference
          </div>
          <h2
            id="why-members-heading"
            style={{
              fontFamily:
                "'Cormorant Garamond', var(--font-display), Georgia, serif",
              fontSize: 32,
              fontWeight: 400,
              lineHeight: 1.25,
              color: "#ffffff",
              margin: 0,
            }}
          >
            Why members{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                color: GOLD_ACCENT,
              }}
            >
              stay
            </em>{" "}
            with us
          </h2>
        </div>

        <div role="list">
          {ITEMS.map((item) => (
            <div role="listitem" key={item.num} className="wm-grid-row">
              <span
                style={{
                  fontFamily:
                    "'Inter', 'Montserrat', var(--font-body), system-ui, sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: GOLD_ACCENT,
                  letterSpacing: "0.04em",
                  lineHeight: 1.3,
                }}
              >
                {item.num}
              </span>
              <div>
                <div
                  style={{
                    fontFamily:
                      "'Cormorant Garamond', var(--font-display), Georgia, serif",
                    fontSize: 18,
                    fontWeight: 500,
                    color: "#ffffff",
                    lineHeight: 1.3,
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontFamily:
                      "'Inter', 'Montserrat', var(--font-body), system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 400,
                    color: MUTED,
                    lineHeight: 1.55,
                  }}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
