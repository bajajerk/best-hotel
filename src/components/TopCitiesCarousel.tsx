"use client";

import { useEffect, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import Image from "next/image";
import type { HomeFeaturedCity } from "@/lib/api";

type BentoType = "tall" | "short" | "wide";
const BENTO_PATTERN: BentoType[] = ["tall", "tall", "short", "short", "wide", "tall"];
const BENTO_WIDTHS: Record<BentoType, number> = { tall: 155, short: 242, wide: 336 };
const FALLBACK_GRADIENT =
  "linear-gradient(135deg, rgba(200,170,118,0.32) 0%, rgba(20,18,15,0.92) 100%)";

function safeImg(u: string | null | undefined): string {
  if (!u?.trim()) return "";
  return u.startsWith("http://") ? u.replace("http://", "https://") : u;
}

type SlideNode = {
  slide: HTMLElement;
  inner: HTMLElement | null;
  img: HTMLElement | null;
};

export default function TopCitiesCarousel({
  items,
}: {
  items: HomeFeaturedCity[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: false,
    containScroll: false,
    // ~35 frames ≈ 580ms at 60fps — weighty, premium feel
    duration: 35,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);
  const hoveredRef = useRef<number | null>(null);
  const revealedRef = useRef(false);
  const slidesRef = useRef<SlideNode[]>([]);
  const lastAutoplayTimeRef = useRef(0);

  const AUTOPLAY_MS = 4000;

  // ── Main RAF loop: autoplay + continuous tween ───────────────────────────
  useEffect(() => {
    if (!emblaApi) return;

    const getSlides = (): SlideNode[] =>
      emblaApi.slideNodes().map((slide) => ({
        slide,
        inner: slide.querySelector<HTMLElement>(".top-city-card-inner"),
        img: slide.querySelector<HTMLElement>(".top-city-embla-img"),
      }));

    slidesRef.current = getSlides();
    emblaApi.on("reInit", () => {
      slidesRef.current = getSlides();
    });

    // Ken Burns settle: instant scale-up then transition to resting scale
    const onSelect = () => {
      const selected = emblaApi.selectedScrollSnap();
      const entry = slidesRef.current[selected];
      if (!entry?.img) return;
      const img = entry.img;
      const parallax = img.dataset.parallaxY ?? "0";
      img.dataset.entering = "1";
      img.style.transition = "none";
      img.style.transform = `scale(1.18) translateY(${parallax}px)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          img.style.transition =
            "transform 1200ms cubic-bezier(0.22,1,0.36,1)";
          img.style.transform = `scale(1.08) translateY(${parallax}px)`;
          setTimeout(() => {
            img.style.transition = "";
            delete img.dataset.entering;
          }, 1200);
        });
      });
    };
    emblaApi.on("select", onSelect);

    // Tween: runs every frame to compute scale / opacity / blur per slide
    const applyTweens = () => {
      const container = emblaApi.containerNode();
      const cRect = container.getBoundingClientRect();
      const vcx = cRect.left + cRect.width / 2;
      const hovered = hoveredRef.current;
      const anyHovered = hovered !== null;

      slidesRef.current.forEach(({ slide, inner, img }, i) => {
        const sRect = slide.getBoundingClientRect();
        const scx = sRect.left + sRect.width / 2;
        const norm = (scx - vcx) / (cRect.width * 0.5);
        const abs = Math.min(Math.abs(norm), 1);
        const isHovered = i === hovered;

        // Scale: 1.0 at centre → 0.92 at the edge
        const scale = isHovered ? 1 : 1 - abs * 0.08;
        // Opacity: 1.0 at centre → 0.7 at edge; dim siblings when one is hovered
        const baseOpacity = Math.max(0.45, 1 - abs * 0.3);
        const opacity = isHovered ? 1 : anyHovered ? baseOpacity * 0.7 : baseOpacity;
        // Blur: fades in only at the very edge (abs > 0.7)
        const blurPx = !isHovered && abs > 0.7 ? (abs - 0.7) / 0.3 : 0;

        slide.style.transform = `scale(${scale.toFixed(3)})`;
        slide.style.opacity = opacity.toFixed(3);
        slide.style.filter =
          blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : "";
        slide.style.zIndex = isHovered ? "2" : "";

        // Card inner: hover lift + premium shadow + amber border flash
        if (inner) {
          if (isHovered) {
            inner.style.transform = "translateY(-6px)";
            inner.style.boxShadow = "0 20px 40px -10px rgba(0,0,0,0.4)";
            inner.style.borderColor = "rgba(200,170,118,0.6)";
          } else {
            inner.style.transform = "";
            inner.style.boxShadow = "";
            inner.style.borderColor = "";
          }
        }

        // Image zoom on hover (skip during Ken Burns settle)
        if (img && !img.dataset.entering) {
          const parallax = img.dataset.parallaxY ?? "0";
          const imgScale = isHovered ? 1.13 : 1.08;
          img.style.transform = `scale(${imgScale}) translateY(${parallax}px)`;
        }
      });
    };

    // RAF loop: autoplay timer + continuous tween
    const loop = (time: number) => {
      if (!pausedRef.current) {
        if (lastAutoplayTimeRef.current === 0)
          lastAutoplayTimeRef.current = time;
        if (time - lastAutoplayTimeRef.current >= AUTOPLAY_MS) {
          lastAutoplayTimeRef.current = time;
          emblaApi.scrollNext();
        }
      } else {
        lastAutoplayTimeRef.current = 0;
      }
      applyTweens();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // ── Vertical parallax (0.85× page-scroll speed) ──────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh - rect.top) / (vh + rect.height);
      // ±12px range — image scale(1.08) provides ample overflow coverage
      const offset = ((progress - 0.5) * 24).toFixed(1);

      slidesRef.current.forEach(({ img }) => {
        if (!img || img.dataset.entering) return;
        img.dataset.parallaxY = offset;
        const isHovered = slidesRef.current.findIndex((s) => s.img === img);
        const scaleVal =
          isHovered === hoveredRef.current ? 1.13 : 1.08;
        img.style.transform = `scale(${scaleVal}) translateY(${offset}px)`;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Section entrance: IO at threshold 0.15, 80ms stagger per card ────────
  // Uses a wrapper element so CSS entrance animation is isolated from the
  // RAF tween (which controls the slide element's opacity/scale directly).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || revealedRef.current) return;
        revealedRef.current = true;
        observer.disconnect();
        slidesRef.current.forEach(({ slide }, i) => {
          setTimeout(
            () => slide.classList.add("city-slide--revealed"),
            i * 80
          );
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // ── Disable all transitions during resize (prevents jank) ────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      document.body.classList.add("resize-no-transitions");
      clearTimeout(timer);
      timer = setTimeout(
        () => document.body.classList.remove("resize-no-transitions"),
        300
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (items.length === 0) {
    return (
      <div
        style={{
          color: "var(--luxe-soft-white-50)",
          fontSize: 13,
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        Curating featured cities&hellip;
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="top-cities-embla-root"
      onMouseLeave={() => {
        pausedRef.current = false;
        hoveredRef.current = null;
      }}
      onTouchEnd={() => {
        setTimeout(() => {
          pausedRef.current = false;
        }, 1200);
      }}
    >
      <div
        ref={emblaRef}
        className="top-cities-embla-viewport"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onTouchStart={() => {
          pausedRef.current = true;
        }}
      >
        {/* GPU-composited scroll track */}
        <div
          className="top-cities-embla-track"
          style={{ willChange: "transform" }}
        >
          {items.map((c, i) => {
            const type = BENTO_PATTERN[i % BENTO_PATTERN.length];
            const cardW = BENTO_WIDTHS[type];
            const imgSrc = safeImg(c.image_url);

            return (
              <Link
                key={`${c.city_slug}-${i}`}
                href={`/city/${c.city_slug}`}
                // top-cities-embla-slide: RAF tween sets scale/opacity/filter
                // city-slide: IO adds city-slide--revealed to trigger wrapper anim
                className="top-city-tile top-city-bento-card top-cities-embla-slide city-slide"
                style={{
                  flex: `0 0 ${cardW}px`,
                  width: `${cardW}px`,
                  height: "100%",
                  textDecoration: "none",
                  color: "inherit",
                }}
                onMouseEnter={() => {
                  hoveredRef.current = i;
                }}
                onMouseLeave={() => {
                  hoveredRef.current = null;
                }}
              >
                {/*
                  Entrance animation wrapper — isolated from RAF tween.
                  Starts: opacity:0, translateY(18px)
                  Revealed: opacity:1, translateY(0)
                  Because tween only touches the slide element (parent),
                  compounding opacity = slide_opacity × wrapper_opacity.
                */}
                <div className="city-slide-anim-wrapper">
                  <div
                    className="top-city-card-inner"
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "100%",
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid rgba(200,170,118,0.22)",
                      background: FALLBACK_GRADIENT,
                      boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
                      transition:
                        "transform 400ms cubic-bezier(0.22,1,0.36,1), box-shadow 400ms ease, border-color 400ms ease",
                    }}
                  >
                    {/* Parallax clip container */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                      }}
                    >
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={`${c.city_name}, ${c.country}`}
                          fill
                          sizes={`${cardW}px`}
                          className="top-city-embla-img"
                          style={{
                            objectFit: "cover",
                            // scale(1.08): 8% overflow gives parallax headroom
                            transform: "scale(1.08) translateY(0px)",
                            transformOrigin: "center center",
                            transition:
                              "transform 800ms cubic-bezier(0.22,1,0.36,1)",
                          }}
                          loading={i < 4 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      ) : null}
                    </div>

                    {/* Gradient scrim */}
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(180deg, transparent 38%, rgba(0,0,0,0.76) 100%)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* City label */}
                    <div
                      style={{
                        position: "absolute",
                        left: 10,
                        right: 10,
                        bottom: 10,
                        color: "var(--luxe-soft-white)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 9,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "rgba(247,245,242,0.6)",
                          marginBottom: 3,
                        }}
                      >
                        {c.country}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 18,
                          fontWeight: 500,
                          letterSpacing: "-0.015em",
                          lineHeight: 1.15,
                          marginBottom: 7,
                        }}
                      >
                        {c.city_name}
                      </div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 8px",
                          borderRadius: 9999,
                          background: "rgba(12,11,10,0.42)",
                          backdropFilter: "blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          border: "1px solid rgba(200,170,118,0.18)",
                          fontFamily: "var(--font-mono, monospace)",
                          fontSize: 9,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "rgba(247,245,242,0.72)",
                        }}
                      >
                        {c.hotel_count} stays
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
