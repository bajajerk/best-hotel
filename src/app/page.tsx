"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LandingScreen from "@/components/LandingScreen";
import ConfirmScreen from "@/components/ConfirmScreen";
import PhoneScreen from "@/components/PhoneScreen";
import OTPScreen from "@/components/OTPScreen";
import RevealScreen from "@/components/RevealScreen";
import BookScreen from "@/components/BookScreen";

export interface BookingData {
  screenshotUrl: string | null;
  screenshotName: string;
  hotel: string;
  dates: string;
  room: string;
  guests: string;
  originalPrice: number;
  ourPrice: number;
  source: string;
  phone: string;
  nights: number;
  savings: number;
}

const defaultData: BookingData = {
  screenshotUrl: null,
  screenshotName: "",
  hotel: "Taj Lands End",
  dates: "Mar 15 – Mar 18",
  room: "Deluxe Sea View",
  guests: "2 Adults",
  originalPrice: 8500,
  ourPrice: 5900,
  source: "MakeMyTrip",
  phone: "",
  nights: 3,
  savings: 2600,
};

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const pageTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<BookingData>(defaultData);

  const goNext = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(1, s - 1));
  }, []);

  const handleScreenshot = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      setData((d) => ({ ...d, screenshotUrl: url, screenshotName: file.name }));
      goNext();
    },
    [goNext]
  );

  const handlePhone = useCallback(
    (phone: string) => {
      setData((d) => ({ ...d, phone }));
      goNext();
    },
    [goNext]
  );

  const handleReset = useCallback(() => {
    setData(defaultData);
    setStep(1);
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#050505] md:p-6">
      <div
        className="w-full max-w-[430px] relative overflow-hidden md:rounded-[40px] md:border md:shadow-[0_40px_80px_rgba(0,0,0,0.5)]"
        style={{
          height: "100dvh",
          maxHeight: "932px",
          background: "var(--bg-black)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="landing"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <LandingScreen onUpload={handleScreenshot} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="confirm"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <ConfirmScreen
                data={data}
                onBack={goBack}
                onNext={goNext}
                onUpdate={(updates) =>
                  setData((d) => ({ ...d, ...updates }))
                }
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="phone"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <PhoneScreen
                onBack={goBack}
                onSubmit={handlePhone}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="otp"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <OTPScreen
                phone={data.phone}
                onBack={goBack}
                onVerified={goNext}
              />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="reveal"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <RevealScreen
                data={data}
                onBack={goBack}
                onBook={goNext}
                onTryAnother={handleReset}
              />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="book"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <BookScreen data={data} onBack={goBack} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
