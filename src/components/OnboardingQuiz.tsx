"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Quiz data
// ---------------------------------------------------------------------------

export interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
  skipText?: string;
}

const QUIZ_INTRO = "Let\u2019s learn how you travel so we can find your perfect stay.";

const QUESTIONS: QuizQuestion[] = [
  {
    id: "travel_frequency",
    question: "How often do you find yourself travelling?",
    options: [
      { label: "Once a year", value: "1" },
      { label: "Two to three times", value: "2-3" },
      { label: "Four to six times", value: "4-6" },
      { label: "Almost monthly", value: "12+" },
    ],
    skipText: "I\u2019d rather not say",
  },
  {
    id: "travel_companions",
    question: "Who usually joins you on your trips?",
    options: [
      { label: "Just me", value: "solo" },
      { label: "My partner", value: "couple" },
      { label: "The whole family", value: "family" },
      { label: "Colleagues", value: "corporate" },
    ],
    skipText: "It varies",
  },
  {
    id: "destination_preference",
    question: "Where does your compass tend to point?",
    options: [
      { label: "Within India", value: "india_only" },
      { label: "Mostly India, some abroad", value: "mix_india" },
      { label: "Mostly abroad", value: "mostly_outbound" },
      { label: "Wherever the deal is", value: "open" },
    ],
    skipText: "No preference yet",
  },
  {
    id: "property_style",
    question: "What kind of property feels like you?",
    options: [
      { label: "City business hotel", value: "city_business" },
      { label: "Beach resort", value: "beach_resort" },
      { label: "Heritage or boutique", value: "heritage_boutique" },
      { label: "Wilderness retreat", value: "wilderness" },
    ],
    skipText: "I love them all",
  },
  {
    id: "most_valued_perk",
    question: "If we could arrange one perk, which would it be?",
    options: [
      { label: "Breakfast included", value: "breakfast" },
      { label: "Room upgrade", value: "upgrade" },
      { label: "Late checkout", value: "late_checkout" },
      { label: "Spa credit", value: "spa_credit" },
    ],
    skipText: "Surprise me",
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type QuizAnswers = Record<string, string | null>;

interface OnboardingQuizProps {
  onComplete?: (answers: QuizAnswers) => void;
}

export default function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const [step, setStep] = useState(-1); // -1 = intro screen
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [direction, setDirection] = useState(1);

  const totalQuestions = QUESTIONS.length;
  const currentQuestion = step >= 0 ? QUESTIONS[step] : null;
  const isComplete = step >= totalQuestions;

  function selectAnswer(value: string | null) {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    advance();
  }

  function advance() {
    setDirection(1);
    const next = step + 1;
    if (next >= totalQuestions) {
      setStep(next);
      onComplete?.(answers);
    } else {
      setStep(next);
    }
  }

  function goBack() {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    } else if (step === 0) {
      setDirection(-1);
      setStep(-1);
    }
  }

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  // Completion screen
  if (isComplete) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cream)",
          padding: "24px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            maxWidth: 480,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 40,
              marginBottom: 16,
            }}
          >
            &#10003;
          </div>
          <h2
            style={{
              fontFamily: "var(--serif)",
              fontSize: "var(--text-display-2)",
              color: "var(--ink)",
              marginBottom: 12,
              fontWeight: 400,
            }}
          >
            You&rsquo;re all set
          </h2>
          <p
            style={{
              fontFamily: "var(--sans)",
              fontSize: "var(--text-body-lg)",
              color: "var(--ink-mid)",
              lineHeight: 1.6,
            }}
          >
            We&rsquo;ll use your preferences to surface the stays that suit you best.
            Welcome to Voyagr Club.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--cream)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        {/* Progress bar */}
        {step >= 0 && (
          <div
            style={{
              height: 3,
              background: "var(--cream-border)",
              borderRadius: 2,
              marginBottom: 48,
              overflow: "hidden",
            }}
          >
            <motion.div
              style={{
                height: "100%",
                background: "var(--gold)",
                borderRadius: 2,
              }}
              initial={false}
              animate={{ width: `${((step + 1) / totalQuestions) * 100}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          {/* Intro screen */}
          {step === -1 && (
            <motion.div
              key="intro"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              style={{ textAlign: "center" }}
            >
              <h1
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "var(--text-display-2)",
                  fontWeight: 400,
                  color: "var(--ink)",
                  marginBottom: 16,
                  lineHeight: 1.25,
                }}
              >
                Welcome to Voyagr Club
              </h1>
              <p
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: "var(--text-body-lg)",
                  color: "var(--ink-mid)",
                  marginBottom: 40,
                  lineHeight: 1.6,
                }}
              >
                {QUIZ_INTRO}
              </p>
              <button
                onClick={() => {
                  setDirection(1);
                  setStep(0);
                }}
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: "var(--text-body)",
                  fontWeight: 500,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  background: "var(--ink)",
                  color: "var(--cream)",
                  border: "none",
                  borderRadius: 6,
                  padding: "14px 40px",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Let&rsquo;s Begin
              </button>
            </motion.div>
          )}

          {/* Question screens */}
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              {/* Step indicator */}
              <p
                style={{
                  fontFamily: "var(--sans)",
                  fontSize: "var(--text-caption)",
                  color: "var(--ink-light)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {step + 1} of {totalQuestions}
              </p>

              {/* Question */}
              <h2
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: "var(--text-display-3)",
                  fontWeight: 400,
                  color: "var(--ink)",
                  marginBottom: 32,
                  lineHeight: 1.35,
                }}
              >
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => selectAnswer(opt.value)}
                      style={{
                        fontFamily: "var(--sans)",
                        fontSize: "var(--text-body-lg)",
                        fontWeight: 400,
                        textAlign: "left",
                        padding: "16px 20px",
                        borderRadius: 8,
                        border: `1.5px solid ${isSelected ? "var(--gold)" : "var(--cream-border)"}`,
                        background: isSelected ? "var(--gold-pale)" : "var(--white)",
                        color: "var(--ink)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "var(--gold-light)";
                          e.currentTarget.style.background = "var(--cream-deep)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "var(--cream-border)";
                          e.currentTarget.style.background = "var(--white)";
                        }
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Skip + Back row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 24,
                }}
              >
                {step > 0 ? (
                  <button
                    onClick={goBack}
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: "var(--text-body-sm)",
                      color: "var(--ink-light)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 0",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    Back
                  </button>
                ) : (
                  <span />
                )}

                {currentQuestion.skipText && (
                  <button
                    onClick={() => selectAnswer(null)}
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: "var(--text-body-sm)",
                      color: "var(--ink-light)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 0",
                    }}
                  >
                    {currentQuestion.skipText}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
