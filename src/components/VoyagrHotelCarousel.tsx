"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Hotel = {
  name: string;
  location: string;
  tag: string;
  rate: string;
  perk: string;
  image: string;
};

const HOTELS: Hotel[] = [
  {
    name: "Raffles Singapore",
    location: "Singapore",
    tag: "Editor's Pick",
    rate: "from ₹28,000",
    perk: "Daily breakfast + room upgrade",
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Amanjiwo",
    location: "Borobudur, Indonesia",
    tag: "Exclusive",
    rate: "from ₹65,000",
    perk: "Spa credit + late checkout",
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Oberoi Udaivilas",
    location: "Udaipur, India",
    tag: "Member Fav",
    rate: "from ₹42,000",
    perk: "Sunset boat ride included",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Capella Bangkok",
    location: "Bangkok, Thailand",
    tag: "New",
    rate: "from ₹22,000",
    perk: "Welcome amenity + early check-in",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Park Hyatt Tokyo",
    location: "Tokyo, Japan",
    tag: "Iconic",
    rate: "from ₹38,000",
    perk: "Breakfast + club lounge access",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80",
  },
];

const AUTOPLAY_MS = 3500;
const DRAG_THRESHOLD = 50;
const RESUME_DELAY_MS = 1000;

const GOLD = "#c9a96e";
const INK = "#0a0a0a";

type CardOffset = {
  translate: number;
  scale: number;
  opacity: number;
  blur: number;
  z: number;
};

function offsetToTransform(offset: number): CardOffset {
  const abs = Math.abs(offset);
  if (abs === 0)
    return { translate: 0, scale: 1, opacity: 1, blur: 0, z: 10 };
  if (abs === 1) {
    return {
      translate: offset > 0 ? 82 : -82,
      scale: 0.88,
      opacity: 0.55,
      blur: 1,
      z: 5,
    };
  }
  return {
    translate: offset > 0 ? 164 : -164,
    scale: 0.78,
    opacity: 0.2,
    blur: 3,
    z: 1,
  };
}

export default function VoyagrHotelCarousel() {
  const total = HOTELS.length;
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [paused, setPaused] = useState(false);

  const dragStartX = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageWidthRef = useRef(0);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(
    (dir: 1 | -1) => {
      setActive((prev) => (prev + dir + total) % total);
    },
    [total]
  );

  const goTo = useCallback(
    (i: number) => {
      setActive(((i % total) + total) % total);
    },
    [total]
  );

  // autoplay
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, total]);

  const pauseThenResume = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setPaused(false);
    }, RESUME_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // measure stage width once mounted, for converting drag px → % of card width
  useEffect(() => {
    const measure = () => {
      if (stageRef.current) {
        stageWidthRef.current = stageRef.current.clientWidth;
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const beginDrag = (clientX: number) => {
    dragStartX.current = clientX;
    setIsDragging(true);
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  };

  const updateDrag = (clientX: number) => {
    if (dragStartX.current === null) return;
    setDrag(clientX - dragStartX.current);
  };

  const endDrag = () => {
    if (dragStartX.current === null) return;
    const delta = drag;
    if (Math.abs(delta) > DRAG_THRESHOLD) {
      advance(delta < 0 ? 1 : -1);
    }
    dragStartX.current = null;
    setDrag(0);
    setIsDragging(false);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(
      () => setPaused(false),
      RESUME_DELAY_MS
    );
  };

  // mouse handlers — bind globally so drag continues outside the stage
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => updateDrag(e.clientX);
    const onUp = () => endDrag();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, drag]);

  // drag delta as a fraction of card width (76% of stage)
  const cardWidthPx = stageWidthRef.current * 0.76 || 1;
  const dragPercent = (drag / cardWidthPx) * 100;

  return (
    <section
      style={{
        background: INK,
        color: "#ffffff",
        padding: "96px 24px",
        fontFamily:
          "'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@400;500;600;700&display=swap');

        .voyagr-progress-fill {
          animation: voyagrFill 3.5s linear forwards;
        }
        @keyframes voyagrFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
        .voyagr-arrow:hover {
          border-color: ${GOLD} !important;
          color: ${GOLD} !important;
        }
        .voyagr-cta:hover {
          background: #d8b97e !important;
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "center",
            gap: 6,
            marginBottom: 56,
            letterSpacing: "0.18em",
          }}
        >
          <span
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: 18,
              color: "#ffffff",
            }}
          >
            VOYAGR
          </span>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 22,
              color: GOLD,
              letterSpacing: "0.04em",
            }}
          >
            CLUB
          </span>
        </div>

        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: 9,
              letterSpacing: "3.5px",
              color: GOLD,
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 18,
            }}
          >
            Preferred Hotels
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: "clamp(34px, 5vw, 54px)",
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Stays we&rsquo;d{" "}
            <span
              style={{
                fontStyle: "italic",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              book ourselves
            </span>
          </h2>
        </div>

        {/* Carousel stage */}
        <div
          ref={stageRef}
          onMouseDown={(e) => {
            e.preventDefault();
            beginDrag(e.clientX);
          }}
          onTouchStart={(e) => beginDrag(e.touches[0].clientX)}
          onTouchMove={(e) => updateDrag(e.touches[0].clientX)}
          onTouchEnd={endDrag}
          style={{
            position: "relative",
            height: 480,
            overflow: "hidden",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "pan-y",
            userSelect: "none",
          }}
        >
          {HOTELS.map((hotel, i) => {
            // signed offset with wrap-around
            let offset = i - active;
            if (offset > total / 2) offset -= total;
            if (offset < -total / 2) offset += total;

            const t = offsetToTransform(offset);
            const isActive = offset === 0;
            const translateX = t.translate + (isDragging ? dragPercent : 0);

            const transition = isDragging
              ? "transform 0.05s linear"
              : "transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.55s ease, filter 0.4s ease";

            return (
              <article
                key={hotel.name}
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  marginLeft: "-38%",
                  width: "76%",
                  height: "100%",
                  borderRadius: 22,
                  overflow: "hidden",
                  transformOrigin: "center center",
                  transform: `translateX(${translateX}%) scale(${t.scale})`,
                  opacity: t.opacity,
                  filter: t.blur ? `blur(${t.blur}px)` : "none",
                  zIndex: t.z,
                  willChange: "transform",
                  transition,
                  boxShadow: isActive
                    ? "0 30px 80px rgba(0,0,0,0.55)"
                    : "0 10px 30px rgba(0,0,0,0.35)",
                  background: "#1a1a1a",
                }}
              >
                {/* Hotel image with Ken Burns when active */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  draggable={false}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transform: isActive ? "scale(1.08)" : "scale(1)",
                    transition: "transform 8s ease",
                  }}
                />

                {/* Gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(160deg, transparent 40%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.92) 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Gold progress bar — only on active card */}
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2.5,
                      background: "rgba(255,255,255,0.08)",
                      zIndex: 3,
                    }}
                  >
                    <div
                      key={`${active}-${paused ? "p" : "r"}`}
                      className={paused ? "" : "voyagr-progress-fill"}
                      style={{
                        height: "100%",
                        background: GOLD,
                        width: paused ? "0%" : undefined,
                      }}
                    />
                  </div>
                )}

                {/* Gold tag pill */}
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    left: 18,
                    background: "rgba(201,169,110,0.92)",
                    color: INK,
                    fontFamily: "'Montserrat', sans-serif",
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    padding: "5px 10px",
                    borderRadius: 100,
                    zIndex: 3,
                  }}
                >
                  {hotel.tag}
                </div>

                {/* Bottom content */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: "28px 32px",
                    color: "#ffffff",
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontSize: 9,
                      letterSpacing: "2px",
                      color: "rgba(255,255,255,0.5)",
                      textTransform: "uppercase",
                      marginBottom: 8,
                      fontWeight: 500,
                    }}
                  >
                    {hotel.location}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 30,
                      fontWeight: 300,
                      color: "#ffffff",
                      lineHeight: 1.1,
                      marginBottom: 14,
                    }}
                  >
                    {hotel.name}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 20,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: 18,
                        height: 1,
                        background: GOLD,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 10,
                        color: GOLD,
                        letterSpacing: "0.5px",
                      }}
                    >
                      {hotel.perk}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 12,
                        color: "#ffffff",
                        fontWeight: 500,
                      }}
                    >
                      {hotel.rate}
                    </span>
                    <button
                      type="button"
                      className="voyagr-cta"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        background: GOLD,
                        color: INK,
                        fontFamily: "'Montserrat', sans-serif",
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        border: "none",
                        borderRadius: 100,
                        padding: "8px 16px",
                        cursor: "pointer",
                        transition: "background 0.2s ease",
                      }}
                    >
                      View Stay
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Controls row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            marginTop: 48,
          }}
        >
          <button
            type="button"
            aria-label="Previous"
            className="voyagr-arrow"
            onClick={() => {
              advance(-1);
              pauseThenResume();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 16,
              transition: "border-color 0.3s ease, color 0.3s ease",
            }}
          >
            &larr;
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {HOTELS.map((_, i) => {
              const isActive = i === active;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => {
                    goTo(i);
                    pauseThenResume();
                  }}
                  style={{
                    width: isActive ? 24 : 4,
                    height: 4,
                    borderRadius: 100,
                    border: "none",
                    padding: 0,
                    background: isActive ? GOLD : "rgba(255,255,255,0.25)",
                    cursor: "pointer",
                    transition:
                      "width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), background 0.4s ease",
                  }}
                />
              );
            })}
          </div>

          <button
            type="button"
            aria-label="Next"
            className="voyagr-arrow"
            onClick={() => {
              advance(1);
              pauseThenResume();
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "transparent",
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 16,
              transition: "border-color 0.3s ease, color 0.3s ease",
            }}
          >
            &rarr;
          </button>
        </div>

        {/* Status line */}
        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 8,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: paused ? GOLD : "rgba(255,255,255,0.2)",
            transition: "color 0.3s ease",
          }}
        >
          {paused ? "● Paused" : "● Autoplaying"}
        </div>
      </div>
    </section>
  );
}
