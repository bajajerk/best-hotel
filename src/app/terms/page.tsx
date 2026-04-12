"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main
        style={{
          minHeight: "100vh",
          paddingTop: "100px",
          paddingBottom: "80px",
          background: "var(--cream)",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px" }}>
          <h1
            className="type-display-3"
            style={{ color: "var(--ink)", marginBottom: "16px" }}
          >
            Terms of Service
          </h1>
          <p
            className="type-body-lg"
            style={{ color: "var(--ink-light)", marginBottom: "40px" }}
          >
            Last updated: April 12, 2026
          </p>

          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom: "32px" }}>
              <h2
                className="type-display-5"
                style={{ color: "var(--ink)", marginBottom: "12px" }}
              >
                {s.title}
              </h2>
              <div
                className="type-body"
                style={{ color: "var(--ink-mid)", lineHeight: 1.7 }}
              >
                {s.content}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
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
      "Voyagr Club is a hotel booking platform that provides access to preferred wholesale hotel rates. We act as an intermediary between you and hotel supply partners. We do not own or operate any hotels.",
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
