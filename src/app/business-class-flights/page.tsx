"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

/* ── Flight deal data (sourced & rebranded from Eiffel Travel) ── */

type Deal = {
  from: string;
  to: string;
  businessPrice: string;
  firstPrice?: string;
  regularPrice: string;
  savings: string;
  type: string;
  region: string;
};

const DEALS: Deal[] = [
  // Europe
  { from: "Delhi", to: "London", businessPrice: "₹65,000", regularPrice: "₹1,50,000", savings: "57%", type: "Business Class", region: "Europe" },
  { from: "Delhi", to: "Paris", businessPrice: "₹65,000", regularPrice: "₹1,30,000", savings: "50%", type: "Business Class", region: "Europe" },
  { from: "Delhi", to: "Frankfurt", businessPrice: "₹65,000", regularPrice: "₹1,30,000", savings: "50%", type: "Business Class", region: "Europe" },
  { from: "Delhi", to: "Zurich", businessPrice: "₹65,000", regularPrice: "₹1,30,000", savings: "50%", type: "Business Class", region: "Europe" },
  { from: "Delhi", to: "Amsterdam", businessPrice: "₹65,000", regularPrice: "₹1,30,000", savings: "50%", type: "Business Class", region: "Europe" },
  { from: "Delhi", to: "Vienna", businessPrice: "₹65,000", regularPrice: "₹1,30,000", savings: "50%", type: "Business Class", region: "Europe" },
  { from: "Delhi", to: "Milan", businessPrice: "₹65,000", regularPrice: "₹1,30,000", savings: "50%", type: "Business Class", region: "Europe" },
  { from: "Delhi", to: "Copenhagen", businessPrice: "₹65,000", regularPrice: "₹1,30,000", savings: "50%", type: "Business Class", region: "Europe" },
  { from: "Delhi", to: "Reykjavik", businessPrice: "₹90,000", regularPrice: "₹1,35,000", savings: "33%", type: "Business Class", region: "Europe" },
  { from: "Mumbai", to: "London", businessPrice: "₹65,000", firstPrice: "₹1,00,000", regularPrice: "₹4,50,000", savings: "78%", type: "First Class Available", region: "Europe" },
  { from: "Bangalore", to: "London", businessPrice: "₹65,000", regularPrice: "₹1,50,000", savings: "57%", type: "Business Class", region: "Europe" },
  // Americas
  { from: "Delhi", to: "New York", businessPrice: "₹1,20,000", regularPrice: "₹3,00,000", savings: "60%", type: "Business Class", region: "Americas" },
  { from: "Delhi", to: "San Francisco", businessPrice: "₹1,20,000", firstPrice: "₹1,60,000", regularPrice: "₹5,50,000", savings: "71%", type: "First Class Available", region: "Americas" },
  { from: "Delhi", to: "Chicago", businessPrice: "₹1,20,000", regularPrice: "₹3,50,000", savings: "66%", type: "Business Class", region: "Americas" },
  { from: "Delhi", to: "Washington", businessPrice: "₹1,20,000", regularPrice: "₹3,50,000", savings: "66%", type: "Business Class", region: "Americas" },
  { from: "Mumbai", to: "New York", businessPrice: "₹1,20,000", regularPrice: "₹3,00,000", savings: "60%", type: "Business Class", region: "Americas" },
  { from: "Bangalore", to: "San Francisco", businessPrice: "₹1,20,000", regularPrice: "₹3,50,000", savings: "66%", type: "Business Class", region: "Americas" },
  { from: "Delhi", to: "Vancouver", businessPrice: "₹1,20,000", regularPrice: "₹3,50,000", savings: "66%", type: "Business Class", region: "Americas" },
  { from: "Delhi", to: "Toronto", businessPrice: "₹1,20,000", firstPrice: "₹1,60,000", regularPrice: "₹5,50,000", savings: "71%", type: "First Class Available", region: "Americas" },
  // Asia Pacific
  { from: "Delhi", to: "Sydney", businessPrice: "₹80,000", regularPrice: "₹2,00,000", savings: "60%", type: "Business Class", region: "Asia Pacific" },
  { from: "Delhi", to: "Melbourne", businessPrice: "₹80,000", regularPrice: "₹2,00,000", savings: "60%", type: "Business Class", region: "Asia Pacific" },
];

const FEATURES = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
      </svg>
    ),
    title: "Premium Business Class",
    description: "Save up to 70% on Business & First Class flights worldwide with our exclusive member rates.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: "Guaranteed Savings",
    description: "50–70% off regular business class fares on major airlines. If you find it cheaper, we'll match it.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
    title: "Direct Airline Partners",
    description: "Access to exclusive airline partnerships and over 1M+ airmiles for members-only fares.",
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Book After Confirmation",
    description: "Secure your discounted premium seat first — pay only after we confirm availability.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Direct Airline Partnerships",
    description: "Our exclusive partnerships with major airlines give us access to millions of airmiles, allowing us to secure premium seats at a fraction of the cost.",
  },
  {
    step: "02",
    title: "Points Optimisation",
    description: "We leverage our vast pool of 1M+ airmiles through strategic booking windows and route optimisation to maximise savings for our members.",
  },
  {
    step: "03",
    title: "Preferred Rates",
    description: "By bulk-purchasing airmiles and maintaining strong relationships with airlines, we secure preferred rates that translate to significant savings for you.",
  },
];

const TESTIMONIALS = [
  {
    text: "I was amazed to save over $2,000 on my luxury round-trip to Switzerland and Paris last year. Their service went above and beyond — truly exceptional value for premium travel.",
    author: "Raunit",
    role: "International Traveller",
  },
  {
    text: "As a frequent flyer, I exclusively book through them now. They consistently find me remarkable rates even during peak festival seasons when prices are normally sky-high.",
    author: "Divij",
    role: "Frequent Flyer",
  },
  {
    text: "I never thought luxury travel to Canada could be this accessible. Thanks to Mer Voyage Club, I now enjoy business class comfort to Toronto at literally half the regular price.",
    author: "Simran",
    role: "Business Class Traveller",
  },
];

const REGIONS = ["All", "Europe", "Americas", "Asia Pacific"] as const;

export default function BusinessClassFlightsPage() {
  const [activeRegion, setActiveRegion] = useState<string>("All");

  const filteredDeals =
    activeRegion === "All"
      ? DEALS
      : DEALS.filter((d) => d.region === activeRegion);

  const openContactForm = () => {
    window.open(
      "https://wa.me/919876543210?text=Hi%2C%20I%27m%20interested%20in%20business%20class%20flights%20via%20Mer%20Voyage%20Club",
      "_blank",
    );
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: "100vh", background: "var(--cream)" }}>
        {/* ── Hero ── */}
        <section
          style={{
            position: "relative",
            minHeight: "85vh",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {/* Background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                'url("https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&q=80&w=1920")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(26,23,16,0.88) 0%, rgba(26,23,16,0.55) 50%, rgba(26,23,16,0.3) 100%)",
              }}
            />
          </div>

          {/* Content */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "120px 24px 80px",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-caption)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--gold)",
                marginBottom: "16px",
              }}
            >
              Mer Voyage Club — Premium Flights
            </p>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "clamp(36px, 6vw, 72px)",
                lineHeight: 1.1,
                color: "#fdfaf5",
                maxWidth: "700px",
                marginBottom: "20px",
              }}
            >
              Luxury Travel at{" "}
              <span style={{ color: "var(--gold)" }}>Economy Prices</span>
            </h1>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(16px, 2vw, 20px)",
                color: "rgba(253,250,245,0.8)",
                maxWidth: "560px",
                lineHeight: 1.7,
                marginBottom: "40px",
              }}
            >
              Experience business & first class flights at up to 70% off.
              Fly premium, pay economy.
            </p>

            {/* Featured deal cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "16px",
                maxWidth: "560px",
                marginBottom: "40px",
              }}
            >
              {[
                { route: "Delhi → London", price: "₹65,000", save: "57%" },
                { route: "Delhi → New York", price: "₹1,20,000", save: "60%" },
              ].map((feat) => (
                <div
                  key={feat.route}
                  style={{
                    background: "rgba(253,250,245,0.08)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(253,250,245,0.15)",
                    borderRadius: "16px",
                    padding: "20px 24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                    </svg>
                    <span
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "#fdfaf5",
                      }}
                    >
                      {feat.route}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "28px",
                      color: "#fdfaf5",
                      marginBottom: "4px",
                    }}
                  >
                    {feat.price}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      color: "rgba(253,250,245,0.6)",
                    }}
                  >
                    Business Class
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      color: "var(--gold)",
                      marginTop: "6px",
                    }}
                  >
                    Save {feat.save} off regular price
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={openContactForm}
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                fontSize: "15px",
                letterSpacing: "0.04em",
                color: "var(--ink)",
                background: "var(--gold)",
                border: "none",
                borderRadius: "100px",
                padding: "16px 40px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--gold-light)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--gold)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Book Your Premium Flight
            </button>
          </div>
        </section>

        {/* ── Why Choose Us ── */}
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "80px 24px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-caption)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--gold)",
              textAlign: "center",
              marginBottom: "12px",
            }}
          >
            The Mer Advantage
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-display-2)",
              color: "var(--ink)",
              textAlign: "center",
              marginBottom: "56px",
            }}
          >
            Why Fly With Us
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  borderRadius: "16px",
                  padding: "32px 28px",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(26,23,16,0.06)";
                  e.currentTarget.style.borderColor = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.borderColor = "var(--cream-border)";
                }}
              >
                <div style={{ marginBottom: "16px" }}>{f.icon}</div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "var(--text-heading-3)",
                    color: "var(--ink)",
                    marginBottom: "8px",
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-body)",
                    color: "var(--ink-light)",
                    lineHeight: 1.7,
                  }}
                >
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Flight Deals ── */}
        <section
          style={{
            background: "var(--cream-deep)",
            padding: "80px 24px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-caption)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--gold)",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              Exclusive Member Rates
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "var(--text-display-2)",
                color: "var(--ink)",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              Premium Flight Offers
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-body-lg)",
                color: "var(--ink-light)",
                textAlign: "center",
                marginBottom: "40px",
              }}
            >
              Business class fares at unprecedented prices
            </p>

            {/* Region filter */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "40px",
                flexWrap: "wrap",
              }}
            >
              {REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-body-sm)",
                    fontWeight: 500,
                    letterSpacing: "0.03em",
                    padding: "10px 24px",
                    borderRadius: "100px",
                    border:
                      activeRegion === region
                        ? "1.5px solid var(--gold)"
                        : "1.5px solid var(--cream-border)",
                    background:
                      activeRegion === region ? "var(--gold)" : "var(--white)",
                    color:
                      activeRegion === region ? "var(--ink)" : "var(--ink-mid)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {region}
                </button>
              ))}
            </div>

            {/* Deal cards grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredDeals.map((deal, i) => (
                <div
                  key={`${deal.from}-${deal.to}-${i}`}
                  style={{
                    background: "var(--white)",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid var(--cream-border)",
                    transition: "box-shadow 0.2s, border-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(26,23,16,0.08)";
                    e.currentTarget.style.borderColor = "var(--gold)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "var(--cream-border)";
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      background: "var(--ink)",
                      padding: "20px 24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "var(--text-heading-3)",
                          color: "#fdfaf5",
                        }}
                      >
                        {deal.from} → {deal.to}
                      </h3>
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-caption)",
                          color: deal.type.includes("First")
                            ? "var(--gold)"
                            : "rgba(253,250,245,0.5)",
                          marginTop: "4px",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {deal.type}
                      </p>
                    </div>
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
                    </svg>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "24px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-body)",
                          color: "var(--ink-light)",
                        }}
                      >
                        Business Class
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "var(--text-body-lg)",
                          color: "var(--ink)",
                        }}
                      >
                        {deal.businessPrice}
                      </span>
                    </div>

                    {deal.firstPrice && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "var(--text-body)",
                            color: "var(--ink-light)",
                          }}
                        >
                          First Class
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 600,
                            fontSize: "var(--text-body-lg)",
                            color: "var(--gold)",
                          }}
                        >
                          {deal.firstPrice}
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "20px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-body)",
                          color: "var(--ink-light)",
                        }}
                      >
                        Regular Price
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "var(--text-body)",
                          color: "var(--ink-light)",
                          textDecoration: "line-through",
                        }}
                      >
                        {deal.regularPrice}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-caption)",
                          color: "var(--ink-light)",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Limited Time Offer
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "var(--text-caption)",
                          fontWeight: 600,
                          color: "var(--success)",
                          background: "var(--success-soft)",
                          padding: "4px 12px",
                          borderRadius: "100px",
                          letterSpacing: "0.04em",
                        }}
                      >
                        Save {deal.savings}
                      </span>
                    </div>

                    <button
                      onClick={openContactForm}
                      style={{
                        width: "100%",
                        fontFamily: "var(--font-body)",
                        fontWeight: 600,
                        fontSize: "var(--text-body-sm)",
                        letterSpacing: "0.04em",
                        color: "#fdfaf5",
                        background: "var(--ink)",
                        border: "none",
                        borderRadius: "100px",
                        padding: "12px 0",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--gold)";
                        e.currentTarget.style.color = "var(--ink)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--ink)";
                        e.currentTarget.style.color = "#fdfaf5";
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom quote CTA */}
            <div
              style={{
                marginTop: "56px",
                background: "var(--white)",
                border: "1px solid var(--cream-border)",
                borderRadius: "20px",
                padding: "48px 32px",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "var(--text-heading-2)",
                  color: "var(--ink)",
                  marginBottom: "12px",
                }}
              >
                Looking for Other Destinations?
              </h3>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-body-lg)",
                  color: "var(--ink-light)",
                  maxWidth: "600px",
                  margin: "0 auto 28px",
                  lineHeight: 1.7,
                }}
              >
                We offer unbeatable prices on premium flights to all
                international destinations. Share your travel details and
                we&apos;ll find you the best luxury fares available.
              </p>
              <button
                onClick={openContactForm}
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "15px",
                  letterSpacing: "0.04em",
                  color: "var(--ink)",
                  background: "var(--gold)",
                  border: "none",
                  borderRadius: "100px",
                  padding: "16px 40px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--gold-light)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--gold)";
                }}
              >
                Get Your Custom Quote
              </button>
            </div>
          </div>
        </section>

        {/* ── How We Offer Unbeatable Rates ── */}
        <section
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "80px 24px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-caption)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--gold)",
              textAlign: "center",
              marginBottom: "12px",
            }}
          >
            Our Process
          </p>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-display-2)",
              color: "var(--ink)",
              textAlign: "center",
              marginBottom: "12px",
            }}
          >
            How We Offer Unbeatable Rates
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-lg)",
              color: "var(--ink-light)",
              textAlign: "center",
              maxWidth: "640px",
              margin: "0 auto 56px",
              lineHeight: 1.7,
            }}
          >
            Our unique approach combines airline partnerships, points
            optimisation, and preferred rates to bring you luxury travel at
            economy prices.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px",
            }}
          >
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-display-2)",
                    fontWeight: 700,
                    color: "var(--gold-pale)",
                    marginBottom: "16px",
                  }}
                >
                  {item.step}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "var(--text-heading-3)",
                    color: "var(--ink)",
                    marginBottom: "12px",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "var(--text-body)",
                    color: "var(--ink-light)",
                    lineHeight: 1.7,
                    maxWidth: "320px",
                    margin: "0 auto",
                  }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section
          style={{
            background: "var(--cream-deep)",
            padding: "80px 24px",
          }}
        >
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-caption)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "var(--gold)",
                textAlign: "center",
                marginBottom: "12px",
              }}
            >
              Member Stories
            </p>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 600,
                fontSize: "var(--text-display-2)",
                color: "var(--ink)",
                textAlign: "center",
                marginBottom: "48px",
              }}
            >
              What Our Members Say
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "24px",
              }}
            >
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.author}
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--cream-border)",
                    borderRadius: "16px",
                    padding: "32px 28px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "var(--text-body-lg)",
                      color: "var(--ink-mid)",
                      lineHeight: 1.8,
                      fontStyle: "italic",
                      marginBottom: "24px",
                    }}
                  >
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "var(--text-body-lg)",
                        color: "var(--ink)",
                      }}
                    >
                      {t.author}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "var(--text-caption)",
                        color: "var(--gold)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 600,
              fontSize: "var(--text-display-2)",
              color: "var(--ink)",
              marginBottom: "16px",
            }}
          >
            Ready to Fly Premium?
          </h2>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-body-lg)",
              color: "var(--ink-light)",
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Join thousands of Mer Voyage Club members who fly business class
            at economy prices. Contact us on WhatsApp for instant quotes.
          </p>
          <button
            onClick={openContactForm}
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: "16px",
              letterSpacing: "0.04em",
              color: "var(--ink)",
              background: "var(--gold)",
              border: "none",
              borderRadius: "100px",
              padding: "18px 48px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gold-light)";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(201,168,76,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--gold)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Book Your Premium Flight Now
          </button>
        </section>
      </main>
      <Footer />
    </>
  );
}
