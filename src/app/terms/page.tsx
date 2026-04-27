"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const TEXT_PRIMARY = "#f7f5f2";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const GOLD = "#c8aa76";

export default function TermsPage() {
  return (
    <div className="luxe">
      <Header />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "140px",
          paddingBottom: "120px",
        }}
      >
        <div style={{ maxWidth: "880px", margin: "0 auto", padding: "0 24px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 18,
            }}
          >
            Last updated · April 12, 2026
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(36px, 4.5vw, 56px)",
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              margin: "0 0 56px",
            }}
          >
            Terms of Service
          </h1>

          {sections.map((s, i) => (
            <section
              key={i}
              style={{
                marginBottom: 36,
                paddingBottom: 28,
                borderBottom: i === sections.length - 1 ? "none" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  fontWeight: 500,
                  color: TEXT_PRIMARY,
                  letterSpacing: "-0.012em",
                  lineHeight: 1.2,
                  margin: "0 0 12px",
                }}
              >
                {s.title}
              </h2>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 15,
                  color: TEXT_MUTED,
                  lineHeight: 1.75,
                }}
              >
                {s.content}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const sections = [
  {
    title: "1. Acceptance of Terms",
    content:
      "By accessing or using Voyagr Club (\"the Platform\"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.",
  },
  {
    title: "2. Description of Service",
    content:
      "Voyagr Club is a hotel booking platform that provides access to preferred hotel rates. We act as an intermediary between you and hotel supply partners. We do not own or operate any hotels.",
  },
  {
    title: "3. Account Registration",
    content:
      "To use certain features, you must create an account using your phone number, email address, or Google account. You are responsible for maintaining the security of your account credentials and for all activities under your account.",
  },
  {
    title: "4. Bookings and Payments",
    content:
      "All bookings are subject to availability and confirmation from our hotel supply partners. Prices displayed are in Indian Rupees (INR) unless otherwise stated. Payment is required at the time of booking. Cancellation and refund policies vary by hotel and rate type — these are displayed before you confirm your booking.",
  },
  {
    title: "5. User Responsibilities",
    content:
      "You agree to: provide accurate and complete information; use the Platform only for lawful purposes; not resell or commercially exploit rates obtained through the Platform; and not attempt to circumvent security measures or scrape data from the Platform.",
  },
  {
    title: "6. Intellectual Property",
    content:
      "All content on Voyagr Club — including text, graphics, logos, and software — is owned by us or our licensors and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.",
  },
  {
    title: "7. Limitation of Liability",
    content:
      "Voyagr Club is provided \"as is\" without warranties of any kind. We are not liable for: hotel service quality or disputes with hotels; booking errors caused by incorrect information you provided; service interruptions or technical issues; or indirect, incidental, or consequential damages arising from your use of the Platform.",
  },
  {
    title: "8. Price Accuracy",
    content:
      "While we strive to display accurate pricing, rates are sourced from third-party suppliers and may change. The confirmed price at the time of booking is the final price. We reserve the right to cancel bookings made at obviously incorrect prices.",
  },
  {
    title: "9. Privacy",
    content:
      "Your use of the Platform is also governed by our Privacy Policy, available at voyagr.club/privacy-policy.",
  },
  {
    title: "10. Termination",
    content:
      "We may suspend or terminate your account at our discretion if you violate these Terms. You may delete your account at any time by contacting us.",
  },
  {
    title: "11. Governing Law",
    content:
      "These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.",
  },
  {
    title: "12. Changes to Terms",
    content:
      "We may update these Terms from time to time. Continued use of the Platform after changes constitutes acceptance of the updated Terms.",
  },
  {
    title: "13. Contact",
    content:
      "For questions about these Terms, contact us at support@voyagr.club.",
  },
];
