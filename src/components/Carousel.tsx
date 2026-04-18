"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from "react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CarouselProps {
  children: ReactNode[];
  /** Show dot-style indicators (default true) */
  showIndicators?: boolean;
  /** Show a gold progress bar that fills over each autoplay tick */
  showProgressBar?: boolean;
  /** Extra className on the outer wrapper */
  className?: string;
  /** Extra style on the outer wrapper */
  style?: CSSProperties;
  /** ARIA label for the carousel region */
  ariaLabel?: string;
  /** Autoplay interval in ms (default 5000) */
  interval?: number;
  /** Disable autoplay entirely */
  autoPlay?: boolean;
}

const DEFAULT_INTERVAL = 5000;
const SWIPE_THRESHOLD = 40; // px
const RESUME_DELAY = 5000; // ms of inactivity before resuming

// ---------------------------------------------------------------------------
// Carousel — auto-playing translateX slider with loop, hover/swipe pause,
// dots, optional progress bar, and keyboard navigation.
// ---------------------------------------------------------------------------
export default function Carousel({
  children,
  showIndicators = true,
  showProgressBar = false,
  className = "",
  style,
  ariaLabel = "Carousel",
  interval = DEFAULT_INTERVAL,
  autoPlay = true,
}: CarouselProps) {
  const slides = useMemo(() => children.filter(Boolean), [children]);
  const slideCount = slides.length;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);

  // virtualIdx goes 0..slideCount; slideCount is the cloned first card.
  // Display index (for dots) = virtualIdx % slideCount.
  const [virtualIdx, setVirtualIdx] = useState(0);
  const [transitionOn, setTransitionOn] = useState(true);
  const [slideWidth, setSlideWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [paused, setPaused] = useState(false); // paused by recent interaction
  const [progressTick, setProgressTick] = useState(0); // bump to restart bar

  const activeIdx = slideCount > 0 ? virtualIdx % slideCount : 0;

  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragState = useRef({
    active: false,
    startX: 0,
    lastX: 0,
    moved: false,
  });

  const canAutoplay = autoPlay && slideCount > 1;
  const isPaused = hovered || paused;

  // --- Measure slide width (supports resize) ---
  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;
    const measure = () => {
      setSlideWidth(el.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [slideCount]);

  // --- Schedule resume-after-inactivity ---
  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      setPaused(false);
    }, RESUME_DELAY);
  }, []);

  const markInteraction = useCallback(() => {
    setPaused(true);
    scheduleResume();
  }, [scheduleResume]);

  // --- Core navigation ---
  const goTo = useCallback(
    (nextVirtual: number, animate = true) => {
      setTransitionOn(animate);
      setVirtualIdx(nextVirtual);
      setProgressTick((t) => t + 1);
    },
    [],
  );

  const next = useCallback(() => {
    if (slideCount <= 1) return;
    goTo(virtualIdx + 1);
  }, [goTo, virtualIdx, slideCount]);

  const prev = useCallback(() => {
    if (slideCount <= 1) return;
    // If at virtualIdx 0, jump to slideCount without animation, then back.
    if (virtualIdx === 0) {
      setTransitionOn(false);
      setVirtualIdx(slideCount);
      // Next tick: animate to slideCount - 1
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionOn(true);
          setVirtualIdx(slideCount - 1);
          setProgressTick((t) => t + 1);
        });
      });
      return;
    }
    goTo(virtualIdx - 1);
  }, [goTo, virtualIdx, slideCount]);

  const jumpToCard = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= slideCount) return;
      goTo(idx);
    },
    [goTo, slideCount],
  );

  // --- Autoplay loop ---
  useEffect(() => {
    if (!canAutoplay) return;
    if (isPaused) return;
    autoTimer.current = setInterval(() => {
      setVirtualIdx((v) => v + 1);
      setProgressTick((t) => t + 1);
      setTransitionOn(true);
    }, interval);
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, [canAutoplay, isPaused, interval, progressTick]);

  // --- Handle seamless loop: when we land on the cloned slide (virtualIdx === slideCount),
  //     reset to 0 without animation after the transition ends.
  useEffect(() => {
    if (slideCount <= 1) return;
    if (virtualIdx !== slideCount) return;
    const track = trackRef.current;
    if (!track) return;
    const onEnd = () => {
      setTransitionOn(false);
      setVirtualIdx(0);
    };
    track.addEventListener("transitionend", onEnd, { once: true });
    return () => track.removeEventListener("transitionend", onEnd);
  }, [virtualIdx, slideCount]);

  // --- Re-enable transition after a jump ---
  useEffect(() => {
    if (transitionOn) return;
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTransitionOn(true));
    });
    return () => cancelAnimationFrame(raf);
  }, [transitionOn, virtualIdx]);

  // --- Touch handlers (swipe to navigate) ---
  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      dragState.current = {
        active: true,
        startX: t.clientX,
        lastX: t.clientX,
        moved: false,
      };
      // Pause autoplay while actively swiping
      setPaused(true);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    },
    [],
  );

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.current.active) return;
    const t = e.touches[0];
    const dx = t.clientX - dragState.current.startX;
    dragState.current.lastX = t.clientX;
    if (Math.abs(dx) > 4) dragState.current.moved = true;
    setDragOffset(dx);
    setTransitionOn(false);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!dragState.current.active) return;
    const dx = dragState.current.lastX - dragState.current.startX;
    dragState.current.active = false;
    setDragOffset(0);
    setTransitionOn(true);
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) {
        next();
      } else {
        prev();
      }
    }
    scheduleResume();
  }, [next, prev, scheduleResume]);

  // --- Keyboard nav ---
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        markInteraction();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        markInteraction();
        next();
      }
    },
    [prev, next, markInteraction],
  );

  // --- Hover pause (desktop only via mouse events) ---
  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  // --- Arrow click handlers ---
  const onPrevClick = useCallback(() => {
    markInteraction();
    prev();
  }, [markInteraction, prev]);

  const onNextClick = useCallback(() => {
    markInteraction();
    next();
  }, [markInteraction, next]);

  const onDotClick = useCallback(
    (idx: number) => {
      markInteraction();
      jumpToCard(idx);
    },
    [markInteraction, jumpToCard],
  );

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, []);

  // --- Build render list with a clone of the first slide appended ---
  const renderSlides = useMemo(() => {
    if (slideCount <= 1) return slides;
    return [...slides, slides[0]];
  }, [slides, slideCount]);

  // --- Track transform ---
  const trackTransform = slideWidth
    ? `translate3d(${-(virtualIdx * slideWidth) + dragOffset}px, 0, 0)`
    : undefined;

  const trackStyle: CSSProperties = {
    transform: trackTransform,
    transition: transitionOn
      ? "transform 0.4s ease-in-out"
      : "none",
  };

  if (slideCount === 0) return null;

  return (
    <div
      ref={wrapperRef}
      className={`discovery-carousel ${className}`}
      style={style}
      role="region"
      aria-label={ariaLabel}
      aria-roledescription="carousel"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Navigation arrows (desktop only via CSS; hidden on mobile) */}
      {slideCount > 1 && (
        <>
          <button
            className="dc-arrow dc-arrow-prev"
            onClick={onPrevClick}
            aria-label="Previous"
            type="button"
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
            onClick={onNextClick}
            aria-label="Next"
            type="button"
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

      {/* Viewport */}
      <div
        className="dc-viewport"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div
          ref={trackRef}
          className="dc-track"
          style={trackStyle}
          tabIndex={0}
          role="list"
          aria-label="Slides"
          onKeyDown={onKeyDown}
        >
          {renderSlides.map((child, i) => (
            <div
              key={i}
              ref={i === 0 ? slideRef : undefined}
              className="dc-slide"
              role="listitem"
              aria-hidden={i !== activeIdx}
              aria-label={`Slide ${(i % slideCount) + 1} of ${slideCount}`}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar — resets on each card change */}
      {showProgressBar && slideCount > 1 && (
        <div className="dc-progress-bar" aria-hidden="true">
          <div
            key={`${activeIdx}-${progressTick}`}
            className={`dc-progress-fill${isPaused ? " dc-progress-paused" : ""}`}
            style={{ animationDuration: `${interval}ms` }}
          />
        </div>
      )}

      {/* Dot indicators — one dot per card */}
      {showIndicators && slideCount > 1 && (
        <div className="dc-dots" role="tablist" aria-label="Slide indicators">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dc-dot${i === activeIdx ? " dc-dot-active" : ""}`}
              onClick={() => onDotClick(i)}
              role="tab"
              aria-selected={i === activeIdx}
              aria-label={`Go to slide ${i + 1}`}
              type="button"
            />
          ))}
        </div>
      )}
    </div>
  );
}
