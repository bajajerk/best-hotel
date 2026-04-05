import type { Metadata } from "next";
import OnboardingQuiz from "@/components/OnboardingQuiz";

export const metadata: Metadata = {
  title: "Welcome Quiz — Personalise Your Experience",
  description:
    "Answer five quick questions so Voyagr Club can recommend hotels tailored to the way you travel.",
};

export default function OnboardingPage() {
  return <OnboardingQuiz />;
}
