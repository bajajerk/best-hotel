"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PreferredHotel } from "@/lib/api";
import { hotelUrl } from "@/lib/urls";
import EditorialCard from "./EditorialCard";

const PAGE_SIZE = 3;
const AUTOPLAY_MS = 4000;
const TRANSITION_MS = 600;
const RESUME_DELAY_MS = 2000;

function safeImg(u: string | null | undefined): string {
  if (!u?.trim()) return "";
  return u.startsWith("http://") ? u.replace("http://", "https://") : u;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function PreferredHotelsCarousel({
  hotels,
}: {
  hotels: PreferredHotel[];
}) {
  const pages = chunk(hotels, PAGE_SIZE);
  const N = pages.length;

  // Extended array: [clone-of-last, ...pages, clone-of-first]
  const extended = N > 1 ? [pages[N - 1], ...pages, pages[0]] : pages;
  const extLen = extended.length;

  const posRef = useRef(N > 1 ? 1 : 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const afterJump = useCallback(
    (targetPos: number) => {
      setTimeout(() => {
        moveTo(targetPos, false);
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
    const next = posRef.current + 1;
    moveTo(next, true);
    if (next === N + 1) {
      afterJump(1);
      setActiveIndex(0);
    } else {
      setActiveIndex(next - 1);
    }
  }, [N, moveTo, afterJump]);

  const retreat = useCallback(() => {
    if (N <= 1) return;
    const prev = posRef.current - 1;
    moveTo(prev, true);
    if (prev === 0) {
      afterJump(N);
      setActiveIndex(N - 1);
    } else {
      setActiveIndex(prev - 1);
    }
  }, [N, moveTo, afterJump]);

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

  // Set initial position without transition
  useEffect(() => {
    moveTo(N > 1 ? 1 : 0, false);
  }, [N, moveTo]);

  // Detect reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Autoplay
  useEffect(() => {
    if (prefersReduced || N <= 1) return;
    autoplayTimerRef.current = setInterval(() => {
      if (!isPausedRef.current) advance();
    }, AUTOPLAY_MS);
    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [prefersReduced, N, advance]);

  // Mobile scroll
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [activeMobile, setActiveMobile] = useState(0);

  useEffect(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    el.scrollTo({ left: activeMobile * el.clientWidth, behavior: "smooth" });
  }, [activeMobile]);

  if (hotels.length === 0) return null;

  return (
    <div className="ph-wrapper">
      {/* ── Desktop + Tablet carousel ── */}
      <div className="ph-desktop" onMouseEnter={pause} onMouseLeave={resume}>
        {N > 1 && (
          <div className="ph-nav">
            <button
              className="ph-arrow"
              onClick={retreat}
              aria-label="Previous hotels"
            >
              &#8592;
            </button>
            <button
              className="ph-arrow"
              onClick={advance}
              aria-label="Next hotels"
            >
              &#8594;
            </button>
          </div>
        )}

        <div className="ph-track-viewport">
          <div
            ref={trackRef}
            className="ph-track"
            style={{ width: `${extLen * 100}%` }}
          >
            {extended.map((page, pagePos) => {
              const isCurrent = N > 1 ? pagePos === posRef.current : true;
              return (
                <div
                  key={pagePos}
                  className="ph-page"
                  style={{ width: `${100 / extLen}%` }}
                  aria-hidden={!isCurrent}
                >
                  {page.map((h, idx) => (
                    <EditorialCard
                      key={`${h.id}-${pagePos}`}
                      href={hotelUrl(h)}
                      imageUrl={safeImg(h.image_url)}
                      imageAlt={h.name}
                      eyebrow="PREFERRED"
                      name={h.name}
                      subline={
                        h.tagline
                          ? h.tagline
                          : `${h.city_name} · ${h.country}`
                      }
                      chips={h.benefits ?? []}
                      variant="hotel"
                      aspectRatio="4 / 5"
                      eager={pagePos <= 1 && idx === 0}
                      tabIndex={isCurrent ? 0 : -1}
                      sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {N > 1 && (
          <div className="ph-indicators" role="tablist" aria-label="Hotel pages">
            {pages.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Page ${i + 1}`}
                className={`ph-dot${i === activeIndex ? " ph-dot--active" : ""}`}
                onClick={() => {
                  moveTo(i + 1, true);
                  setActiveIndex(i);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Mobile: single-card scroll-snap ── */}
      <div className="ph-mobile">
        <div ref={mobileScrollRef} className="ph-mobile-scroll">
          {hotels.map((h, i) => (
            <div key={h.id} className="ph-mobile-slide">
              <EditorialCard
                href={hotelUrl(h)}
                imageUrl={safeImg(h.image_url)}
                imageAlt={h.name}
                eyebrow="PREFERRED"
                name={h.name}
                subline={
                  h.tagline
                    ? h.tagline
                    : `${h.city_name} · ${h.country}`
                }
                chips={h.benefits ?? []}
                variant="hotel"
                aspectRatio="4 / 5"
                eager={i === 0}
                sizes="100vw"
              />
            </div>
          ))}
        </div>
        <div className="ph-indicators" role="tablist">
          {hotels.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeMobile}
              aria-label={`Hotel ${i + 1}`}
              className={`ph-dot${i === activeMobile ? " ph-dot--active" : ""}`}
              onClick={() => setActiveMobile(i)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
