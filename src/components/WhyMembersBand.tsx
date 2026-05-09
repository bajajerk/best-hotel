const ITEMS: Array<{ num: string; title: string; desc: string }> = [
  {
    num: "01",
    title: "Preferred access",
    desc: "Member rates at 1,500+ properties.",
  },
  {
    num: "02",
    title: "Human concierge",
    desc: "Real people on WhatsApp.",
  },
  {
    num: "03",
    title: "Handpicked perks",
    desc: "Upgrades, breakfast, late checkout.",
  },
  {
    num: "04",
    title: "Verified properties",
    desc: "Every hotel personally vetted.",
  },
  {
    num: "05",
    title: "Flexible support",
    desc: "Change, cancel, rebook — handled.",
  },
];

const GOLD = "#c8aa76";
const BG = "#0a0a0a";
const HAIRLINE = "rgba(255,255,255,0.08)";

const SERIF =
  "'Cormorant Garamond', var(--font-display), Georgia, serif";
const SANS =
  "'Inter', var(--font-body), system-ui, sans-serif";

export default function WhyMembersBand() {
  return (
    <section
      aria-labelledby="why-members-heading"
      style={{
        background: BG,
        padding: "48px 0 44px",
      }}
    >
      <style>{`
        .wmb-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 1px;
          background: ${HAIRLINE};
          border-top: 1px solid ${HAIRLINE};
          border-bottom: 1px solid ${HAIRLINE};
        }
        .wmb-cell {
          background: ${BG};
          padding: 22px 20px 24px;
        }
        .wmb-header {
          display: flex;
          align-items: baseline;
          gap: 18px;
          margin-bottom: 26px;
          flex-wrap: wrap;
        }
        @media (max-width: 768px) {
          .wmb-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .wmb-cell {
            padding: 20px 18px 22px;
          }
        }
        @media (max-width: 480px) {
          .wmb-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="luxe-container">
        <div className="wmb-header">
          <span
            style={{
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: GOLD,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            The difference
          </span>
          <h2
            id="why-members-heading"
            style={{
              fontFamily: SERIF,
              fontSize: 36,
              fontWeight: 300,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "#ffffff",
              margin: 0,
            }}
          >
            Why members{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 400,
                color: GOLD,
              }}
            >
              stay
            </em>{" "}
            with us
          </h2>
        </div>

        <div className="wmb-grid" role="list">
          {ITEMS.map((item) => (
            <div className="wmb-cell" role="listitem" key={item.num}>
              <div
                style={{
                  fontFamily: SANS,
                  fontSize: 12,
                  fontWeight: 500,
                  color: GOLD,
                  letterSpacing: "0.08em",
                  lineHeight: 1,
                  marginBottom: 14,
                }}
              >
                {item.num}
              </div>
              <h3
                style={{
                  fontFamily: SERIF,
                  fontSize: 19,
                  fontWeight: 400,
                  lineHeight: 1.2,
                  letterSpacing: "-0.005em",
                  color: "#ffffff",
                  margin: "0 0 8px",
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  fontFamily: SANS,
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.55)",
                  margin: 0,
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
