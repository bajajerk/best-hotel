"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
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
    title: "1. Introduction",
    content:
      "Voyagr Club (\"we\", \"our\", \"us\") operates the website voyagr.club and related services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.",
  },
  {
    title: "2. Information We Collect",
    content:
      "We collect information you provide directly: name, email address, phone number, and payment details when making bookings. We also collect usage data such as pages visited, search queries, device information, and IP address through cookies and analytics tools.",
  },
  {
    title: "3. How We Use Your Information",
    content:
      "We use your information to: provide and maintain our hotel booking services; process reservations and payments; send booking confirmations and updates; authenticate your identity via phone OTP or Google sign-in; personalise your experience with curated hotel recommendations; communicate promotional offers (with your consent); and improve our platform.",
  },
  {
    title: "4. Phone Number Verification",
    content:
      "We use Firebase Authentication by Google to verify your phone number via one-time passwords (OTP). Your phone number is sent to Google's servers for verification purposes. Google's privacy policy applies to this processing. We store your phone number to identify your account and enable seamless login.",
  },
  {
    title: "5. Third-Party Services",
    content:
      "We work with third-party service providers including: Firebase (Google) for authentication; Supabase for secure data storage; PostHog for analytics; and hotel supply partners for booking fulfilment. These providers have access only to the information necessary to perform their functions.",
  },
  {
    title: "6. Data Storage and Security",
    content:
      "Your data is stored on secure cloud infrastructure. We use encryption in transit (HTTPS/TLS) and at rest. Access to personal data is restricted to authorised personnel only. While we implement industry-standard security measures, no method of electronic storage is 100% secure.",
  },
  {
    title: "7. Your Rights",
    content:
      "You have the right to: access your personal data; correct inaccurate information; request deletion of your account and data; opt out of marketing communications; and withdraw consent at any time. To exercise these rights, contact us at privacy@voyagr.club.",
  },
  {
    title: "8. Cookies",
    content:
      "We use essential cookies to maintain your session and preferences. We use analytics cookies (PostHog) to understand how our platform is used. You can control cookie settings through your browser.",
  },
  {
    title: "9. Data Retention",
    content:
      "We retain your personal data for as long as your account is active or as needed to provide services. Booking records are retained for legal and accounting purposes. You may request deletion of your account at any time.",
  },
  {
    title: "10. Changes to This Policy",
    content:
      "We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on our website with a revised date.",
  },
  {
    title: "11. Contact Us",
    content:
      "If you have questions about this Privacy Policy, contact us at privacy@voyagr.club.",
  },
];
