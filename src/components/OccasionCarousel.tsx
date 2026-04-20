"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Occasion data
// ---------------------------------------------------------------------------
interface OccasionCard {
  key: string;
  label: string;
  image: string;
}

const OCCASIONS: OccasionCard[] = [
  {
    key: "anniversary",
    label: "Anniversary",
    image:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80",
  },
  {
    key: "family-holiday",
    label: "Family Holiday",
    image:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
  },
  {
    key: "honeymoon",
    label: "Honeymoon",
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
  },
  {
    key: "long-weekend",
    label: "Long Weekend",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  },
  {
    key: "leisure",
    label: "Leisure",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  },
  {
    key: "solo-escape",
    label: "Solo Escape",
    image:
      "https://images.unsplash.com/photo-1600011689032-26628de3ee78?w=800&q=80",
  },
];

// We clone the full set for seamless infinite scroll
const ITEMS = [...OCCASIONS, ...OCCASIONS, ...OCCASIONS];
const CLONE_COUNT = OCCASIONS.length; // offset to start at middle clone set

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function OccasionCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragState = useRef({ startX: 0, scrollLeft: 0, active: false });
  const isTransitioning = useRef(false);

  // --- Get card width + gap ---
  const getCardMetrics = useCallback(() => {
    const track = trackRef.current;
    if (!track) return { cardWidth: 0, gap: 0 };
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const firstChild = track.children[0] as HTMLElement | undefined;
    const cardWidth = firstChild ? firstChild.offsetWidth : 0;
    return { cardWidth, gap };
  }, []);

  // --- Initialize scroll to middle clone set ---
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Wait for layout
    requestAnimationFrame(() => {
      const { cardWidth, gap } = getCardMetrics();
      if (cardWidth > 0) {
        track.scrollLeft = CLONE_COUNT * (cardWidth + gap);
      }
    });
  }, [getCardMetrics]);

  // --- Infinite loop repositioning ---
  const handleScroll = useCallback(() => {
    if (isTransitioning.current) return;
    const track = trackRef.current;
    if (!track) return;

    const { cardWidth, gap } = getCardMetrics();
    if (cardWidth === 0) return;

    const step = cardWidth + gap;
    const setWidth = CLONE_COUNT * step;

    // If we've scrolled past the end of the second set, jump back
    if (track.scrollLeft >= setWidth * 2) {
      isTransitioning.current = true;
      track.style.scrollBehavior = "auto";
      track.scrollLeft -= setWidth;
      track.style.scrollBehavior = "smooth";
      requestAnimationFrame(() => {
        isTransitioning.current = false;
      });
    }
    // If we've scrolled before the first set, jump forward
    else if (track.scrollLeft < step * 0.5) {
      isTransitioning.current = true;
      track.style.scrollBehavior = "auto";
      track.scrollLeft += setWidth;
      track.style.scrollBehavior = "smooth";
      requestAnimationFrame(() => {
        isTransitioning.current = false;
      });
    }
  }, [getCardMetrics]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => track.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // --- Auto-rotation ---
  const scrollByOne = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { cardWidth, gap } = getCardMetrics();
    if (cardWidth === 0) return;
    track.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
  }, [getCardMetrics]);

  const startAutoRotation = useCallback(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(scrollByOne, 3000);
  }, [scrollByOne]);

  const stopAutoRotation = useCallback(() => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      startAutoRotation();
    }, 4000); // resume after 4s of inactivity
  }, [startAutoRotation]);

  // Start auto-rotation on mount
  useEffect(() => {
    startAutoRotation();
    return () => {
      stopAutoRotation();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [startAutoRotation, stopAutoRotation]);

  // Pause on hover
  useEffect(() => {
    if (isHovered || isDragging) {
      stopAutoRotation();
    } else {
      scheduleResume();
    }
  }, [isHovered, isDragging, stopAutoRotation, scheduleResume]);

  // --- Manual navigation ---
  const scrollPrev = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { cardWidth, gap } = getCardMetrics();
    if (cardWidth === 0) return;
    track.scrollBy({ left: -(cardWidth + gap), behavior: "smooth" });
  }, [getCardMetrics]);

  const scrollNext = useCallback(() => {
    scrollByOne();
  }, [scrollByOne]);

  // --- Mouse drag ---
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;
    dragState.current = {
      startX: e.pageX - track.offsetLeft,
      scrollLeft: track.scrollLeft,
      active: true,
    };
    setIsDragging(true);
    track.style.scrollBehavior = "auto";
    track.style.scrollSnapType = "none";
    track.style.cursor = "grabbing";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.current.active) return;
    const track = trackRef.current;
    if (!track) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - dragState.current.startX) * 1.2;
    track.scrollLeft = dragState.current.scrollLeft - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    setIsDragging(false);
    const track = trackRef.current;
    if (track) {
      track.style.scrollBehavior = "smooth";
      track.style.scrollSnapType = "x mandatory";
      track.style.cursor = "";
    }
  }, []);

  // Touch interaction pauses auto-rotation
  const onTouchStart = useCallback(() => {
    stopAutoRotation();
  }, [stopAutoRotation]);

  const onTouchEnd = useCallback(() => {
    scheduleResume();
  }, [scheduleResume]);

  // Keyboard navigation
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  return (
    <section
      className="section-pad occasion-carousel-section"
      style={{ background: "#0B1B2B" }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: "center", marginBottom: 40 }}
        >
          <div
            className="type-eyebrow"
            style={{ marginBottom: 8, color: "#C9A84C" }}
          >
            Explore
          </div>
          <h2
            className="type-display-2"
            style={{ color: "#F5F0E8", marginBottom: 10 }}
          >
            By{" "}
            <em style={{ fontStyle: "italic", color: "#C9A84C" }}>
              Occasion
            </em>
          </h2>
          <p
            className="type-body"
            style={{
              color: "#F5F0E8",
              lineHeight: 1.7,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            Find the perfect stay for every milestone and moment
          </p>
        </motion.div>

        {/* Carousel */}
        <div
          className="occasion-carousel"
          onMouseEnter={() => {
            setIsHovered(true);
            setShowArrows(true);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            setShowArrows(false);
          }}
          role="region"
          aria-label="Browse by occasion"
          aria-roledescription="carousel"
        >
          {/* Navigation arrows */}
          <button
            className={`oc-arrow oc-arrow-prev${showArrows ? " oc-arrow-visible" : ""}`}
            onClick={scrollPrev}
            aria-label="Previous occasion"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className={`oc-arrow oc-arrow-next${showArrows ? " oc-arrow-visible" : ""}`}
            onClick={scrollNext}
            aria-label="Next occasion"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 6 15 12 9 18" />
            </svg>
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            className={`oc-track${isDragging ? " oc-dragging" : ""}`}
            tabIndex={0}
            role="list"
            aria-label="Occasion slides"
            onKeyDown={onKeyDown}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {ITEMS.map((occasion, i) => (
              <div
                key={`${occasion.key}-${i}`}
                className="oc-slide"
                role="listitem"
                aria-label={occasion.label}
              >
                <div className="oc-card">
                  <img
                    className="oc-card-img"
                    src={occasion.image}
                    alt={occasion.label}
                    loading="lazy"
                    draggable={false}
                  />
                  <div className="oc-card-gradient" />
                  <span className="oc-card-label">{occasion.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
