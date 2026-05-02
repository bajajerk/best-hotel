"use client";

import { useState, useEffect, useRef } from "react";
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
const ROTATE_MS = 4000;
const RESUME_DELAY_MS = 2000;

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export default function EditorsBentoCarousel({ hotels }: { hotels: BentoHotel[] }) {
  const slides = chunkArray(hotels, SLIDE_SIZE);

  const [activeSlide, setActiveSlide] = useState(0);
  const [activeMobile, setActiveMobile] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPausedRef = useRef(false);
  const startIntervalRef = useRef<() => void>(() => {});
  const mobileScrollRef = useRef<HTMLDivElement>(null);

  // Detect prefers-reduced-motion on client
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-rotation — startIntervalRef is kept fresh so jumpToSlide can restart it
  useEffect(() => {
    startIntervalRef.current = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (prefersReduced || slides.length <= 1) return;
      intervalRef.current = setInterval(() => {
        if (isPausedRef.current) return;
        setActiveSlide((prev) => {
          const next = (prev + 1) % slides.length;
          setProgressKey((k) => k + 1);
          return next;
        });
        setActiveMobile((prev) => (prev + 1) % hotels.length);
      }, ROTATE_MS);
    };

    startIntervalRef.current();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [prefersReduced, slides.length, hotels.length]);

  // Scroll mobile strip to active hotel
  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: activeMobile * el.clientWidth, behavior: "smooth" });
  }, [activeMobile]);

  const pause = () => {
    isPausedRef.current = true;
    if (resumeRef.current) clearTimeout(resumeRef.current);
  };

  const resume = () => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, RESUME_DELAY_MS);
  };

  // Jump to a specific desktop slide and restart the timer from that point
  const jumpToSlide = (index: number) => {
    setActiveSlide(index);
    setProgressKey((k) => k + 1);
    startIntervalRef.current();
  };

  if (hotels.length === 0) return null;

  return (
    <div className="ep-wrapper">
      {/* ── Desktop + Tablet: asymmetric bento carousel ─────────────────── */}
      <div className="ep-desktop" onMouseEnter={pause} onMouseLeave={resume}>
        <div className="ep-slides-container">
          {slides.map((slide, slideIdx) => (
            <div
              key={slideIdx}
              className={`ep-slide${slideIdx === activeSlide ? " ep-slide--active" : ""}`}
              aria-hidden={slideIdx !== activeSlide}
            >
              <div className="ep-bento-grid">
                {slide.map((hotel, tileIdx) => (
                  <Link
                    key={hotel.id}
                    href={hotel.href}
                    className={`ep-tile ep-tile--${tileIdx + 1}`}
                    tabIndex={slideIdx !== activeSlide ? -1 : 0}
                  >
                    {/* Image wrapper — overflow:hidden clips the zoom effect */}
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
                        loading={slideIdx === 0 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    </div>

                    {/* Bottom gradient scrim */}
                    <div className="ep-tile-scrim" aria-hidden />

                    {/* Text overlay — counterscaled so it stays crisp on tile hover */}
                    <div className="ep-tile-text">
                      <div className="ep-tile-location">
                        {hotel.city}&nbsp;&middot;&nbsp;{hotel.country}
                      </div>
                      <div
                        className={`ep-tile-name${tileIdx === 0 ? " ep-tile-name--hero" : ""}`}
                      >
                        {hotel.name}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Controls: progress bars (normal) or arrow buttons (reduced-motion) */}
        {prefersReduced ? (
          <div className="ep-arrows">
            <button className="ep-arrow" onClick={() => jumpToSlide((activeSlide - 1 + slides.length) % slides.length)} aria-label="Previous slide">
              &#8592;
            </button>
            <button className="ep-arrow" onClick={() => jumpToSlide((activeSlide + 1) % slides.length)} aria-label="Next slide">
              &#8594;
            </button>
          </div>
        ) : (
          <div className="ep-progress-bars" role="tablist" aria-label="Carousel slides">
            {slides.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === activeSlide}
                aria-label={`Slide ${i + 1}`}
                className={`ep-progress-bar${i === activeSlide ? " ep-progress-bar--active" : ""}`}
                onClick={() => jumpToSlide(i)}
              >
                {/* key forces re-mount → CSS animation restarts on slide change */}
                <span
                  key={i === activeSlide ? `run-${progressKey}` : `idle-${i}`}
                  className={`ep-progress-fill${i === activeSlide ? " ep-progress-fill--run" : ""}`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile: full-width scroll-snap, one hotel per view ───────────── */}
      <div className="ep-mobile">
        <div ref={mobileScrollRef} className="ep-mobile-scroll">
          {hotels.map((hotel, i) => (
            <Link
              key={hotel.id}
              href={hotel.href}
              className="ep-mobile-card"
            >
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
                <div className="ep-tile-location">{hotel.city}&nbsp;&middot;&nbsp;{hotel.country}</div>
                <div className="ep-tile-name ep-tile-name--hero">{hotel.name}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Progress dots */}
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
