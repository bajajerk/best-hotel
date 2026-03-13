"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Tab1Search from "@/components/Tab1Search";
import Tab2Premium from "@/components/Tab2Premium";
import Tab3BeatPrice from "@/components/Tab3BeatPrice";

const tabs = [
  {
    id: "search" as const,
    label: "Search",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: "premium" as const,
    label: "Premium",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    id: "beat" as const,
    label: "Beat Price",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
];

type TabId = (typeof tabs)[number]["id"];

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("search");

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#050505] md:p-6">
      <div
        className="w-full max-w-[430px] relative overflow-hidden md:rounded-[40px] md:border md:shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex flex-col"
        style={{
          height: "100dvh",
          maxHeight: "932px",
          background: "var(--bg-black)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Tab content */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {activeTab === "search" && (
              <motion.div
                key="search"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="h-full"
              >
                <Tab1Search />
              </motion.div>
            )}
            {activeTab === "premium" && (
              <motion.div
                key="premium"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="h-full"
              >
                <Tab2Premium />
              </motion.div>
            )}
            {activeTab === "beat" && (
              <motion.div
                key="beat"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={pageTransition}
                className="h-full"
              >
                <Tab3BeatPrice />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Tab Bar */}
        <div
          className="flex items-center justify-around shrink-0"
          style={{
            height: 64,
            background: "var(--bg-card)",
            borderTop: "1px solid var(--border)",
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors duration-200"
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: isActive ? "var(--gold)" : "var(--white-30)",
                }}
              >
                <div className="relative">
                  {tab.icon}
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: "var(--gold)",
                      }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-dm-sans)",
                    fontWeight: isActive ? 500 : 400,
                    letterSpacing: 0.3,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
