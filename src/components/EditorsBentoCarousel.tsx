"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

export interface BentoHotel {
  id: string | number;
  name: string;
  city: string;
  country: string;
  imageUrl: string;
  href: string;
}

const SLIDE_SIZE = 5;
const AUTOPLAY_MS = 4000;
const TRANSITION_MS = 600;
const RESUME_DELAY_MS = 2000;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export default function EditorsBentoCarousel({ hotels }: { hotels: BentoHotel[] }) {
  const slides = chunkArray(hotels, SLIDE_SIZE);
  const N = slides.length;

  // Extended array: [clone-of-last, ...originalSlides, clone-of-first]
  // Positions: 0=clone-last, 1..N=real slides, N+1=clone-first
  const extended = N > 1 ? [slides[N - 1], ...slides, slides[0]] : slides;
  const extLen = extended.length;

  // Start at position 1 (first real slide)
  const posRef = useRef(N > 1 ? 1 : 0);
  // Real slide index for progress bars and aria (0-based)
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Move track to a position (with or without transition)
  const moveTo = useCallback(
    (pos: number, withTransition: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      posRef.current = pos;
      track.style.transition = withTransition
        ? `transform ${TRANSITION_MS}ms ease-out`
        : "none";
      track.style.transform = `translateX(${(-pos / extLen) * 100}%)`;
    },
    [extLen]
  );

  // After a clone-based jump, silently snap back to the real slide
  const afterJump = useCallback(
    (targetRealPos: number) => {
      setTimeout(() => {
        moveTo(targetRealPos, false);
        // Re-enable transitions after one paint cycle
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const track = trackRef.current;
            if (track) track.style.transition = "";
          })
        );
      }, TRANSITION_MS);
    },
    [moveTo]
  );

  const advance = useCallback(() => {
    if (N <= 1) return;
    const nextPos = posRef.current + 1;
    moveTo(nextPos, true);
    if (nextPos === N + 1) {
      // Reached clone-of-first → snap to real position 1
      afterJump(1);
      setActiveIndex(0);
    } else {
      setActiveIndex(nextPos - 1);
    }
    setProgressKey((k) => k + 1);
  }, [N, moveTo, afterJump]);

  const retreat = useCallback(() => {
    if (N <= 1) return;
    const prevPos = posRef.current - 1;
    moveTo(prevPos, true);
    if (prevPos === 0) {
      // Reached clone-of-last → snap to real position N
      afterJump(N);
      setActiveIndex(N - 1);
    } else {
      setActiveIndex(prevPos - 1);
    }
    setProgressKey((k) => k + 1);
  }, [N, moveTo, afterJump]);

  const jumpTo = useCallback(
    (realIndex: number) => {
      const pos = N > 1 ? realIndex + 1 : 0;
      moveTo(pos, true);
      setActiveIndex(realIndex);
      setProgressKey((k) => k + 1);
    },
    [N, moveTo]
  );

  const pause = useCallback(() => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const resume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, RESUME_DELAY_MS);
  }, []);

  // Set initial track position without transition
  useEffect(() => {
    moveTo(N > 1 ? 1 : 0, false);
  }, [N, moveTo]);

  // Autoplay
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReduced || N <= 1) return;
    autoplayTimerRef.current = setInterval(() => {
      if (!isPausedRef.current) advance();
    }, AUTOPLAY_MS);
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [prefersReduced, N, advance]);

  // Mobile scroll ref for snap
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [activeMobile, setActiveMobile] = useState(0);

  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: activeMobile * el.clientWidth, behavior: "smooth" });
  }, [activeMobile]);

  // Sync mobile when autoplay ticks
  useEffect(() => {
    setActiveMobile(activeIndex * SLIDE_SIZE);
  }, [activeIndex]);

  if (hotels.length === 0) return null;

  return (
    <div className="ep-wrapper">
      {/* ── Desktop + Tablet ── */}
      <div className="ep-desktop" onMouseEnter={pause} onMouseLeave={resume}>
        <div className="ep-slides-container">
          {/* Overflow-clipping viewport */}
          <div className="ep-track-viewport">
            {/* Track: width = extLen * 100%, slides are 100%/extLen each */}
            <div
              ref={trackRef}
              className="ep-track"
              style={{ width: `${extLen * 100}%` }}
            >
              {extended.map((slide, slidePos) => {
                const realIdx = N > 1 ? slidePos - 1 : slidePos;
                const isCurrent =
                  N > 1 ? slidePos === posRef.current : slidePos === 0;
                return (
                  <div
                    key={slidePos}
                    className="ep-slide ep-slide--visible"
                    style={{ width: `${100 / extLen}%` }}
                    aria-hidden={!isCurrent}
                  >
                    <div className="ep-bento-grid">
                      {slide.map((hotel, tileIdx) => (
                        <Link
                          key={`${hotel.id}-${slidePos}`}
                          href={hotel.href}
                          className={`ep-tile ep-tile--${tileIdx + 1}`}
                          tabIndex={isCurrent ? 0 : -1}
                        >
                          <div className="ep-tile-img-wrap">
                            <Image
                              src={hotel.imageUrl}
                              alt={hotel.name}
                              fill
                              sizes={
                                tileIdx === 0
                                  ? "(max-width: 1023px) 55vw, 42vw"
                                  : "(max-width: 1023px) 28vw, 20vw"
                              }
                              className="ep-tile-img"
                              style={{ objectFit: "cover" }}
                              loading={
                                (N > 1 ? slidePos === 1 : slidePos === 0) &&
                                tileIdx < 3
                                  ? "eager"
                                  : "lazy"
                              }
                              decoding="async"
                            />
                          </div>
                          <div className="ep-tile-scrim" aria-hidden />
                          <div className="ep-tile-text">
                            <div className="ep-tile-location">
                              {hotel.city}&nbsp;&middot;&nbsp;{hotel.country}
                            </div>
                            <div
                              className={`ep-tile-name${
                                tileIdx === 0 ? " ep-tile-name--hero" : ""
                              }`}
                            >
                              {hotel.name}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Controls */}
        {prefersReduced ? (
          <div className="ep-arrows">
            <button
              className="ep-arrow"
              onClick={retreat}
              aria-label="Previous slide"
            >
              &#8592;
            </button>
            <button
              className="ep-arrow"
              onClick={advance}
              aria-label="Next slide"
            >
              &#8594;
            </button>
          </div>
        ) : (
          <div
            className="ep-progress-bars"
            role="tablist"
            aria-label="Carousel slides"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Slide ${i + 1}`}
                className={`ep-progress-bar${
                  i === activeIndex ? " ep-progress-bar--active" : ""
                }`}
                onClick={() => jumpTo(i)}
              >
                <span
                  key={i === activeIndex ? `run-${progressKey}` : `idle-${i}`}
                  className={`ep-progress-fill${
                    i === activeIndex ? " ep-progress-fill--run" : ""
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile ── */}
      <div className="ep-mobile">
        <div ref={mobileScrollRef} className="ep-mobile-scroll">
          {hotels.map((hotel, i) => (
            <Link key={hotel.id} href={hotel.href} className="ep-mobile-card">
              <div className="ep-tile-img-wrap">
                <Image
                  src={hotel.imageUrl}
                  alt={hotel.name}
                  fill
                  sizes="100vw"
                  className="ep-tile-img"
                  style={{ objectFit: "cover" }}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </div>
              <div className="ep-tile-scrim" aria-hidden />
              <div className="ep-tile-text ep-mobile-text">
                <div className="ep-tile-location">
                  {hotel.city}&nbsp;&middot;&nbsp;{hotel.country}
                </div>
                <div className="ep-tile-name ep-tile-name--hero">{hotel.name}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="ep-dots" role="tablist" aria-label="Hotel slides">
          {hotels.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeMobile}
              aria-label={`Hotel ${i + 1}`}
              className={`ep-dot${i === activeMobile ? " ep-dot--active" : ""}`}
              onClick={() => setActiveMobile(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
