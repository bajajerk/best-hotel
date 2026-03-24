"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type CSSProperties,
} from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CarouselProps {
  children: ReactNode[];
  /** Show dot-style progress indicators (default true) */
  showIndicators?: boolean;
  /** Show scroll progress bar instead of dots */
  showProgressBar?: boolean;
  /** Extra className on the outer wrapper */
  className?: string;
  /** Extra style on the outer wrapper */
  style?: CSSProperties;
  /** ARIA label for the carousel region */
  ariaLabel?: string;
}

// ---------------------------------------------------------------------------
// Carousel — CSS scroll-snap based, touch + mouse drag, keyboard nav
// ---------------------------------------------------------------------------
export default function Carousel({
  children,
  showIndicators = true,
  showProgressBar = false,
  className = "",
  style,
  ariaLabel = "Carousel",
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [cardCount, setCardCount] = useState(children.length);
  const [visibleCount, setVisibleCount] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0, active: false });

  // Number of "pages" (snap positions)
  const maxIdx = Math.max(0, cardCount - Math.floor(visibleCount));
  const dotCount = maxIdx + 1;
  const canScroll = cardCount > Math.floor(visibleCount);

  // --- Measure visible cards on resize ---
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const measure = () => {
      const firstChild = track.children[0] as HTMLElement | undefined;
      if (!firstChild) return;
      const trackWidth = track.clientWidth;
      const childWidth = firstChild.offsetWidth;
      if (childWidth > 0) {
        setVisibleCount(trackWidth / childWidth);
      }
      setCardCount(track.children.length);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    return () => ro.disconnect();
  }, [children.length]);

  // --- Sync active index + progress on scroll ---
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const firstChild = track.children[0] as HTMLElement | undefined;
          if (firstChild) {
            const gap = parseFloat(getComputedStyle(track).gap) || 0;
            const childWidth = firstChild.offsetWidth + gap;
            const newIdx = Math.round(track.scrollLeft / childWidth);
            setActiveIdx(Math.min(newIdx, maxIdx));
          }
          // Progress 0→1
          const maxScroll = track.scrollWidth - track.clientWidth;
          setScrollProgress(maxScroll > 0 ? track.scrollLeft / maxScroll : 0);
          ticking = false;
        });
      }
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [maxIdx]);

  // --- Scroll to index ---
  const scrollTo = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const firstChild = track.children[0] as HTMLElement | undefined;
    if (!firstChild) return;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const childWidth = firstChild.offsetWidth + gap;
    track.scrollTo({ left: childWidth * idx, behavior: "smooth" });
  }, []);

  const prev = useCallback(() => {
    scrollTo(Math.max(0, activeIdx - 1));
  }, [activeIdx, scrollTo]);

  const next = useCallback(() => {
    scrollTo(Math.min(maxIdx, activeIdx + 1));
  }, [activeIdx, maxIdx, scrollTo]);

  // --- Mouse drag (desktop) ---
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const track = trackRef.current;
    if (!track) return;
    dragState.current = {
      startX: e.pageX - track.offsetLeft,
      scrollLeft: track.scrollLeft,
      active: true,
    };
    setIsDragging(true);
    setHasInteracted(true);
    track.style.scrollBehavior = "auto";
    track.style.cursor = "grabbing";
    track.style.userSelect = "none";
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
    dragState.current.active = false;
    setIsDragging(false);
    const track = trackRef.current;
    if (track) {
      track.style.scrollBehavior = "smooth";
      track.style.cursor = "";
      track.style.userSelect = "";
    }
  }, []);

  // Touch interaction mark
  const onTouchStart = useCallback(() => {
    setHasInteracted(true);
  }, []);

  // --- Keyboard nav ---
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    },
    [prev, next],
  );

  // Center-align items if fewer than visible
  const trackStyle: CSSProperties = !canScroll
    ? { justifyContent: "center" }
    : {};

  return (
    <div
      className={`discovery-carousel ${className}`}
      style={style}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
    >
      {/* Navigation arrows (desktop only, only when scrollable) */}
      {canScroll && (
        <>
          <button
            className="dc-arrow dc-arrow-prev"
            onClick={prev}
            disabled={activeIdx === 0}
            aria-label="Previous"
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
            className="dc-arrow dc-arrow-next"
            onClick={next}
            disabled={activeIdx >= maxIdx}
            aria-label="Next"
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
        </>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className={`dc-track${isDragging ? " dc-dragging" : ""}`}
        style={trackStyle}
        tabIndex={0}
        role="list"
        aria-label="Slides"
        onKeyDown={onKeyDown}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="dc-slide"
            role="listitem"
            aria-label={`Slide ${i + 1} of ${cardCount}`}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Scroll hint — fades after first interaction */}
      {canScroll && !hasInteracted && (
        <div className="dc-scroll-hint" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </div>
      )}

      {/* Progress bar */}
      {showProgressBar && canScroll && (
        <div className="dc-progress-bar" aria-hidden="true">
          <div
            className="dc-progress-fill"
            style={{ width: `${Math.max(5, scrollProgress * 100)}%` }}
          />
        </div>
      )}

      {/* Dot indicators */}
      {showIndicators && !showProgressBar && canScroll && dotCount > 1 && dotCount <= 12 && (
        <div className="dc-dots" role="tablist" aria-label="Slide indicators">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              className={`dc-dot${i === activeIdx ? " dc-dot-active" : ""}`}
              onClick={() => scrollTo(i)}
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
