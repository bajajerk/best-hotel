"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Hotel data
// ---------------------------------------------------------------------------
interface RecommendationHotel {
  id: number;
  name: string;
  city: string;
  image: string;
  perks: string[];
  rating: number;
  categoryTags: string[];
}

const hotels: RecommendationHotel[] = [
  {
    id: 1,
    name: "The Ritz-Carlton Bali",
    city: "Bali",
    image: "/hotels/ritz-bali.jpg",
    perks: [
      "Oceanfront room upgrade",
      "Late checkout",
      "Welcome drinks",
      "Spa credit",
    ],
    rating: 5,
    categoryTags: ["beach", "family", "deal-high", "season-summer"],
  },
  {
    id: 2,
    name: "Taj Palace New Delhi",
    city: "New Delhi",
    image: "/hotels/taj-delhi.jpg",
    perks: ["Heritage suite upgrade", "Breakfast included", "Airport transfer"],
    rating: 5,
    categoryTags: ["city", "india", "anniversary"],
  },
  {
    id: 3,
    name: "Aman Tokyo",
    city: "Tokyo",
    image: "/hotels/aman-tokyo.jpg",
    perks: ["Room upgrade", "Late checkout", "Onsen access"],
    rating: 5,
    categoryTags: ["city", "wellness", "hidden"],
  },
  {
    id: 4,
    name: "Mandarin Oriental Bangkok",
    city: "Bangkok",
    image: "/hotels/mandarin-bangkok.jpg",
    perks: ["River view upgrade", "Spa credit", "Romantic dinner"],
    rating: 5,
    categoryTags: ["city", "romantic", "use-honeymoon"],
  },
  {
    id: 5,
    name: "The Oberoi Mumbai",
    city: "Mumbai",
    image: "/hotels/oberoi-mumbai.jpg",
    perks: ["Sea view upgrade", "Breakfast included"],
    rating: 5,
    categoryTags: ["city", "india"],
  },
  {
    id: 6,
    name: "Park Hyatt Tokyo",
    city: "Tokyo",
    image: "/hotels/park-hyatt-tokyo.jpg",
    perks: ["Skyline view", "Late checkout"],
    rating: 5,
    categoryTags: ["city", "usa"],
  },
];

// ---------------------------------------------------------------------------
// Season detection
// ---------------------------------------------------------------------------
function getCurrentSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "autumn";
  return "winter";
}

function getSeasonLabel(season: string): string {
  return season.charAt(0).toUpperCase() + season.slice(1);
}

const currentSeason = getCurrentSeason();
const seasonLabel = getSeasonLabel(currentSeason);

// ---------------------------------------------------------------------------
// Collection category data model
// ---------------------------------------------------------------------------
interface CollectionCategory {
  key: string;
  label: string;
  description: string;
  iconKey: string;
  backgroundImage: string;
  filter: (hotel: RecommendationHotel) => boolean;
}

const COLLECTIONS: CollectionCategory[] = [
  {
    key: "seasons",
    label: `Best for ${seasonLabel}`,
    description: "Seasonal picks by our editors",
    iconKey: "sun",
    backgroundImage:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    filter: (h) => h.categoryTags.includes(`season-${currentSeason}`),
  },
  {
    key: "deals",
    label: "Best Value",
    description: "Exceptional value at top properties",
    iconKey: "tag",
    backgroundImage:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    filter: (h) => h.categoryTags.includes("deal-high"),
  },
  {
    key: "beach",
    label: "Beachfront Bliss",
    description: "Oceanfront retreats & island escapes",
    iconKey: "wave",
    backgroundImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    filter: (h) => h.categoryTags.includes("beach"),
  },
  {
    key: "city",
    label: "City Skyline Icons",
    description: "Iconic stays in world-class cities",
    iconKey: "building",
    backgroundImage:
      "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80",
    filter: (h) => h.categoryTags.includes("city"),
  },
  {
    key: "hidden",
    label: "Hidden Gems",
    description: "Boutique finds off the beaten path",
    iconKey: "diamond",
    backgroundImage:
      "https://images.unsplash.com/photo-1600011689032-26628de3ee78?w=800&q=80",
    filter: (h) => h.categoryTags.includes("hidden"),
  },
  {
    key: "romantic",
    label: "Romantic Getaways",
    description: "Enchanting escapes for two",
    iconKey: "heart",
    backgroundImage:
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800&q=80",
    filter: (h) => h.categoryTags.includes("romantic"),
  },
  // --- Visible via "More" modal ---
  {
    key: "sustainable",
    label: "Sustainable Luxury",
    description: "Eco-conscious five-star stays",
    iconKey: "leaf",
    backgroundImage:
      "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80",
    filter: (h) => h.categoryTags.includes("sustainable"),
  },
  {
    key: "most-loved",
    label: "Most Loved",
    description: "Guest favorites with top reviews",
    iconKey: "star",
    backgroundImage:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    filter: () => true,
  },
  {
    key: "wellness",
    label: "Wellness & Spa",
    description: "Rejuvenate mind, body & soul",
    iconKey: "droplet",
    backgroundImage:
      "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&q=80",
    filter: (h) => h.categoryTags.includes("wellness"),
  },
  {
    key: "family",
    label: "Family Adventures",
    description: "Space, fun & memories for all ages",
    iconKey: "users",
    backgroundImage:
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80",
    filter: (h) => h.categoryTags.includes("family"),
  },
  {
    key: "new",
    label: "New Arrivals",
    description: "Just added to our collection",
    iconKey: "zap",
    backgroundImage:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    filter: () => true,
  },
  {
    key: "trending",
    label: "Trending Now",
    description: "What travellers are booking this week",
    iconKey: "trending",
    backgroundImage:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    filter: () => true,
  },
  {
    key: "india",
    label: "Best in India",
    description: "Crown jewels of Indian hospitality",
    iconKey: "map-pin",
    backgroundImage:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
    filter: (h) => h.categoryTags.includes("india"),
  },
];

const VISIBLE_COUNT = 6;

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80";

// ---------------------------------------------------------------------------
// Editor's Picks — fallback hotels shown when a filter returns zero results
// ---------------------------------------------------------------------------
interface EditorPickHotel {
  id: number;
  name: string;
  city: string;
  tagline: string;
  image: string;
  rating: number;
}

const EDITORS_PICKS: EditorPickHotel[] = [
  {
    id: 101,
    name: "Four Seasons Bali at Sayan",
    city: "Ubud, Bali",
    tagline: "Riverside jungle sanctuary with infinity pools",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    rating: 5,
  },
  {
    id: 102,
    name: "Aman Venice",
    city: "Venice, Italy",
    tagline: "16th-century palazzo on the Grand Canal",
    image:
      "https://images.unsplash.com/photo-1534113414509-0eec2bfb493f?w=800&q=80",
    rating: 5,
  },
  {
    id: 103,
    name: "One&Only Reethi Rah",
    city: "North Malé Atoll, Maldives",
    tagline: "Private island retreat with overwater villas",
    image:
      "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800&q=80",
    rating: 5,
  },
  {
    id: 104,
    name: "The Peninsula Tokyo",
    city: "Tokyo, Japan",
    tagline: "Timeless elegance in the heart of Marunouchi",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    rating: 5,
  },
  {
    id: 105,
    name: "Rosewood London",
    city: "Holborn, London",
    tagline: "Edwardian grandeur meets modern luxury",
    image:
      "https://images.unsplash.com/photo-1529290130-4ca3753253ae?w=800&q=80",
    rating: 5,
  },
  {
    id: 106,
    name: "Singita Kruger National Park",
    city: "Kruger, South Africa",
    tagline: "Ultra-luxury safari lodge in the wild",
    image:
      "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800&q=80",
    rating: 5,
  },
  {
    id: 107,
    name: "Belmond Hotel Caruso",
    city: "Ravello, Amalfi Coast",
    tagline: "Cliff-top infinity pool above the Mediterranean",
    image:
      "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800&q=80",
    rating: 5,
  },
  {
    id: 108,
    name: "Taj Lake Palace",
    city: "Udaipur, India",
    tagline: "Floating marble palace on Lake Pichola",
    image:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&q=80",
    rating: 5,
  },
];

// Triple the items for seamless infinite loop
const PICKS_ITEMS = [...EDITORS_PICKS, ...EDITORS_PICKS, ...EDITORS_PICKS];
const PICKS_CLONE_COUNT = EDITORS_PICKS.length;

// ---------------------------------------------------------------------------
// Fallback Carousel — horizontal auto-rotating carousel of Editor's Picks
// ---------------------------------------------------------------------------
function FallbackCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showArrows, setShowArrows] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragState = useRef({ startX: 0, scrollLeft: 0, active: false });
  const isTransitioning = useRef(false);

  const getCardMetrics = useCallback(() => {
    const track = trackRef.current;
    if (!track) return { cardWidth: 0, gap: 0 };
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const firstChild = track.children[0] as HTMLElement | undefined;
    const cardWidth = firstChild ? firstChild.offsetWidth : 0;
    return { cardWidth, gap };
  }, []);

  // Initialize scroll to middle clone set
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    requestAnimationFrame(() => {
      const { cardWidth, gap } = getCardMetrics();
      if (cardWidth > 0) {
        track.scrollLeft = PICKS_CLONE_COUNT * (cardWidth + gap);
      }
    });
  }, [getCardMetrics]);

  // Infinite loop repositioning
  const handleScroll = useCallback(() => {
    if (isTransitioning.current) return;
    const track = trackRef.current;
    if (!track) return;
    const { cardWidth, gap } = getCardMetrics();
    if (cardWidth === 0) return;
    const step = cardWidth + gap;
    const setWidth = PICKS_CLONE_COUNT * step;

    if (track.scrollLeft >= setWidth * 2) {
      isTransitioning.current = true;
      track.style.scrollBehavior = "auto";
      track.scrollLeft -= setWidth;
      track.style.scrollBehavior = "smooth";
      requestAnimationFrame(() => {
        isTransitioning.current = false;
      });
    } else if (track.scrollLeft < step * 0.5) {
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

  // Auto-rotation
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
    }, 4000);
  }, [startAutoRotation]);

  useEffect(() => {
    startAutoRotation();
    return () => {
      stopAutoRotation();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, [startAutoRotation, stopAutoRotation]);

  useEffect(() => {
    if (isHovered || isDragging) {
      stopAutoRotation();
    } else {
      scheduleResume();
    }
  }, [isHovered, isDragging, stopAutoRotation, scheduleResume]);

  // Manual navigation
  const scrollPrev = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const { cardWidth, gap } = getCardMetrics();
    if (cardWidth === 0) return;
    track.scrollBy({ left: -(cardWidth + gap), behavior: "smooth" });
  }, [getCardMetrics]);

  // Mouse drag
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

  const onTouchStart = useCallback(() => {
    stopAutoRotation();
  }, [stopAutoRotation]);

  const onTouchEnd = useCallback(() => {
    scheduleResume();
  }, [scheduleResume]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByOne();
      }
    },
    [scrollPrev, scrollByOne],
  );

  return (
    <div>
      {/* Subtle message */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 28,
        }}
      >
        <p
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            color: "var(--ink-light)",
            fontStyle: "italic",
            letterSpacing: "0.01em",
            padding: "10px 24px",
            background: "var(--cream)",
            borderRadius: 8,
            border: "1px solid var(--cream-border)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          No exact matches — here are handpicked stays you may love
        </p>
      </div>

      {/* Carousel */}
      <div
        className="fb-carousel"
        onMouseEnter={() => {
          setIsHovered(true);
          setShowArrows(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowArrows(false);
        }}
        role="region"
        aria-label="Editor's picks carousel"
        aria-roledescription="carousel"
      >
        {/* Navigation arrows */}
        <button
          className={`fb-arrow fb-arrow-prev${showArrows ? " fb-arrow-visible" : ""}`}
          onClick={scrollPrev}
          aria-label="Previous hotel"
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
          className={`fb-arrow fb-arrow-next${showArrows ? " fb-arrow-visible" : ""}`}
          onClick={scrollByOne}
          aria-label="Next hotel"
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
          className={`fb-track${isDragging ? " fb-dragging" : ""}`}
          tabIndex={0}
          role="list"
          aria-label="Editor's picks"
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {PICKS_ITEMS.map((hotel, i) => (
            <div
              key={`${hotel.id}-${i}`}
              className="fb-slide"
              role="listitem"
              aria-label={hotel.name}
            >
              <div className="fb-card">
                <img
                  className="fb-card-img"
                  src={hotel.image}
                  alt={hotel.name}
                  loading="lazy"
                  draggable={false}
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="fb-card-gradient" />

                {/* Editor's Pick badge */}
                <div className="fb-card-badge">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  Editor&apos;s Pick
                </div>

                {/* Content overlay */}
                <div className="fb-card-content">
                  <div
                    style={{
                      color: "var(--gold-light)",
                      fontSize: 9,
                      letterSpacing: "2px",
                      marginBottom: 4,
                    }}
                  >
                    {"★".repeat(hotel.rating)}
                  </div>
                  <h4 className="fb-card-name">{hotel.name}</h4>
                  <p className="fb-card-city">{hotel.city}</p>
                  <p className="fb-card-tagline">{hotel.tagline}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons — lightweight inline SVGs (Lucide-inspired)
// ---------------------------------------------------------------------------
function CollectionIcon({ name, size = 16 }: { name: string; size?: number }) {
  const common: React.SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="m20.59 13.41-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" />
          <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
          <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
        </svg>
      );
    case "building":
      return (
        <svg {...common}>
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M12 14h.01M8 14h.01M16 14h.01" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...common}>
          <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case "droplet":
      return (
        <svg {...common}>
          <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "zap":
      return (
        <svg {...common}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "trending":
      return (
        <svg {...common}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case "map-pin":
      return (
        <svg {...common}>
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common} strokeWidth={1.3}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Collection Tile
// ---------------------------------------------------------------------------
function CollectionTile({
  category,
  isActive,
  onClick,
  index,
}: {
  category: CollectionCategory;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      role="tab"
      aria-selected={isActive}
      aria-label={`${category.label} — ${category.description}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className={`collection-tile${isActive ? " collection-tile-active" : ""}`}
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: "3 / 2",
        border: isActive
          ? "2px solid var(--gold)"
          : "2px solid transparent",
        borderRadius: 12,
        cursor: "pointer",
        background: "var(--ink)",
        padding: 0,
        textAlign: "left" as const,
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "flex-end",
        fontFamily: "var(--font-body)",
      }}
    >
      {/* Background image */}
      <div
        className="collection-tile-bg"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${category.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transition: "transform 0.5s ease, filter 0.5s ease",
          filter: isActive
            ? "brightness(0.7) saturate(1.1)"
            : "brightness(0.5) saturate(0.9)",
        }}
      />

      {/* Gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isActive
            ? "linear-gradient(to top, rgba(201, 168, 76, 0.3) 0%, transparent 60%)"
            : "linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 50%)",
          transition: "background 0.4s ease",
        }}
      />

      {/* Icon */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          color: isActive
            ? "var(--gold-light)"
            : "rgba(255, 255, 255, 0.5)",
          transition: "color 0.3s ease",
        }}
      >
        <CollectionIcon name={category.iconKey} size={18} />
      </div>

      {/* Active dot */}
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "var(--gold)",
            boxShadow: "0 0 8px rgba(201, 168, 76, 0.6)",
          }}
        />
      )}

      {/* Label + description */}
      <div style={{ position: "relative", padding: "0 16px 14px", zIndex: 1 }}>
        <h3
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "0.01em",
            marginBottom: 2,
            lineHeight: 1.3,
            fontFamily: "var(--font-display)",
          }}
        >
          {category.label}
        </h3>
        <p
          style={{
            color: isActive
              ? "rgba(255, 255, 255, 0.9)"
              : "rgba(255, 255, 255, 0.6)",
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: "0.02em",
            lineHeight: 1.4,
            margin: 0,
            transition: "color 0.3s ease",
          }}
        >
          {category.description}
        </p>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// "More" Tile
// ---------------------------------------------------------------------------
function MoreTile({
  count,
  isOpen,
  isActiveHidden,
  activeLabel,
  onClick,
  index,
}: {
  count: number;
  isOpen: boolean;
  isActiveHidden: boolean;
  activeLabel?: string;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      className="collection-tile collection-more-tile"
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={`Explore ${count} more collections`}
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: "3 / 2",
        border: isActiveHidden
          ? "2px solid var(--gold)"
          : "2px solid var(--cream-border)",
        borderRadius: 12,
        cursor: "pointer",
        background: isActiveHidden
          ? "linear-gradient(135deg, var(--gold-pale), var(--cream))"
          : "linear-gradient(135deg, var(--cream), var(--cream-deep))",
        padding: 0,
        display: "flex",
        flexDirection: "column" as const,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "var(--font-body)",
        transition: "all 0.3s ease",
      }}
    >
      <div
        style={{
          color: isActiveHidden ? "var(--gold)" : "var(--ink-light)",
          transition: "color 0.3s",
        }}
      >
        <CollectionIcon name="grid" size={28} />
      </div>

      <div style={{ textAlign: "center" }}>
        <span
          style={{
            display: "block",
            fontSize: 15,
            fontWeight: 600,
            color: isActiveHidden ? "var(--gold)" : "var(--ink)",
            fontFamily: "var(--font-display)",
            letterSpacing: "0.01em",
          }}
        >
          {isActiveHidden && activeLabel ? activeLabel : "More"}
        </span>
        <span
          style={{
            display: "block",
            fontSize: 11,
            color: "var(--ink-light)",
            marginTop: 2,
          }}
        >
          {isActiveHidden ? "Change collection" : `+${count} collections`}
        </span>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// "More" Modal — shows all categories
// ---------------------------------------------------------------------------
function MoreModal({
  categories,
  activeKey,
  onSelect,
  onClose,
}: {
  categories: CollectionCategory[];
  activeKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(26, 23, 16, 0.7)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 1000,
        }}
      />

      {/* Centering wrapper */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
          padding: 20,
          pointerEvents: "none",
        }}
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="All collections"
          aria-modal="true"
          tabIndex={-1}
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="more-collections-modal"
          style={{
            width: "100%",
            maxWidth: 760,
            maxHeight: "calc(100vh - 80px)",
            overflow: "auto",
            background: "var(--white)",
            borderRadius: 16,
            padding: "36px 32px",
            boxShadow:
              "0 24px 80px rgba(26, 23, 16, 0.25), 0 8px 24px rgba(201, 168, 76, 0.08)",
            pointerEvents: "auto",
            outline: "none",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 28,
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  color: "var(--ink)",
                  fontFamily: "var(--font-display)",
                  marginBottom: 4,
                }}
              >
                All Collections
              </h3>
              <p style={{ fontSize: 13, color: "var(--ink-light)", margin: 0 }}>
                Choose a collection to explore
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--cream)",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                color: "var(--ink-mid)",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
              className="modal-close-btn"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Category grid */}
          <div className="more-collections-grid">
            {categories.map((cat) => {
              const isActive = activeKey === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => onSelect(cat.key)}
                  aria-label={`${cat.label} — ${cat.description}`}
                  className={`collection-tile${isActive ? " collection-tile-active" : ""}`}
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    aspectRatio: "3 / 2",
                    borderRadius: 10,
                    border: isActive
                      ? "2px solid var(--gold)"
                      : "2px solid transparent",
                    cursor: "pointer",
                    background: "var(--ink)",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column" as const,
                    justifyContent: "flex-end",
                    textAlign: "left" as const,
                    fontFamily: "var(--font-body)",
                    transition: "border-color 0.2s",
                  }}
                >
                  <div
                    className="collection-tile-bg"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `url(${cat.backgroundImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: isActive
                        ? "brightness(0.65)"
                        : "brightness(0.45)",
                      transition: "transform 0.5s, filter 0.3s",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      color: isActive
                        ? "var(--gold-light)"
                        : "rgba(255,255,255,0.5)",
                    }}
                  >
                    <CollectionIcon name={cat.iconKey} size={14} />
                  </div>
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--gold)",
                        boxShadow: "0 0 6px rgba(201, 168, 76, 0.6)",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "relative",
                      padding: "0 12px 10px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "var(--font-display)",
                        lineHeight: 1.3,
                      }}
                    >
                      {cat.label}
                    </span>
                    <span
                      style={{
                        display: "block",
                        color: "rgba(255,255,255,0.6)",
                        fontSize: 10,
                        marginTop: 1,
                      }}
                    >
                      {cat.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function RecommendationHub() {
  const [activeKey, setActiveKey] = useState(COLLECTIONS[0].key);
  const [moreOpen, setMoreOpen] = useState(false);

  const visible = COLLECTIONS.slice(0, VISIBLE_COUNT);
  const hidden = COLLECTIONS.slice(VISIBLE_COUNT);
  const hasMore = hidden.length > 0;

  const activeCollection = useMemo(
    () => COLLECTIONS.find((c) => c.key === activeKey),
    [activeKey],
  );

  const filteredHotels = useMemo(() => {
    if (!activeCollection) return hotels;
    return hotels.filter(activeCollection.filter);
  }, [activeCollection]);

  const isActiveHidden = hidden.some((c) => c.key === activeKey);

  const selectCategory = useCallback((key: string) => {
    setActiveKey(key);
    setMoreOpen(false);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  // Close on Escape
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [moreOpen]);

  return (
    <section className="section-pad" style={{ background: "var(--white)" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h2
            className="type-display-2"
            style={{ color: "var(--ink)", marginBottom: 12 }}
          >
            Curated{" "}
            <em style={{ fontStyle: "italic", color: "var(--gold)" }}>
              Collections
            </em>
          </h2>
          <p
            className="type-body"
            style={{
              color: "var(--ink-light)",
              lineHeight: 1.7,
              maxWidth: 580,
              margin: "0 auto",
            }}
          >
            Handpicked hotel experiences across 1,500+ properties — each
            collection tells a story
          </p>
        </motion.div>

        {/* ── Collection Tiles — 12-col grid ── */}
        <div
          className="curated-collections-grid"
          role="tablist"
          aria-label="Curated hotel collections"
        >
          {visible.map((cat, i) => (
            <CollectionTile
              key={cat.key}
              category={cat}
              isActive={activeKey === cat.key}
              onClick={() => selectCategory(cat.key)}
              index={i}
            />
          ))}
          {hasMore && (
            <MoreTile
              count={hidden.length}
              isOpen={moreOpen}
              isActiveHidden={isActiveHidden}
              activeLabel={activeCollection?.label}
              onClick={() => setMoreOpen(!moreOpen)}
              index={VISIBLE_COUNT}
            />
          )}
        </div>

        {/* ── Active hidden-category banner ── */}
        <AnimatePresence>
          {isActiveHidden && activeCollection && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "12px 20px",
                background: "var(--cream)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--ink-light)" }}>
                Showing:
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--gold)",
                }}
              >
                {activeCollection.label}
              </span>
              <button
                onClick={() => selectCategory(visible[0].key)}
                style={{
                  fontSize: 11,
                  color: "var(--ink-light)",
                  background: "none",
                  border: "1px solid var(--cream-border)",
                  borderRadius: 4,
                  padding: "3px 10px",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
                aria-label="Clear filter and return to first collection"
              >
                Clear
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── More Modal ── */}
        <AnimatePresence>
          {moreOpen && (
            <MoreModal
              categories={COLLECTIONS}
              activeKey={activeKey}
              onSelect={selectCategory}
              onClose={() => setMoreOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* ── Hotel Grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            style={{ marginTop: 40 }}
          >
            {filteredHotels.length > 0 ? (
              <div
                className="recommendation-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 24,
                }}
              >
                {filteredHotels.map((hotel, i) => (
                  <motion.div
                    key={hotel.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                  >
                    <HotelRecommendationCard hotel={hotel} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <FallbackCarousel />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Hotel Card — unchanged from original
// ---------------------------------------------------------------------------
function HotelRecommendationCard({ hotel }: { hotel: RecommendationHotel }) {
  const whatsappMessage = encodeURIComponent(
    `Hi, interested in ${hotel.name} in ${hotel.city}. Send Voyagr preferred rate + perks.`,
  );
  const whatsappUrl = `https://wa.me/919876543210?text=${whatsappMessage}`;
  const conciergeMessage = encodeURIComponent(
    `Hi, I'd like to learn more about ${hotel.name} in ${hotel.city}. Can you help?`,
  );
  const conciergeUrl = `https://wa.me/919876543210?text=${conciergeMessage}`;

  const displayPerks = hotel.perks.slice(0, 3);

  return (
    <div
      className="card-hover"
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      <div
        style={{ position: "relative", height: "200px", overflow: "hidden" }}
      >
        <img
          className="card-img"
          src={hotel.image}
          alt={hotel.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
            filter: "saturate(0.88)",
          }}
          loading="lazy"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.src !== FALLBACK_IMAGE) img.src = FALLBACK_IMAGE;
          }}
        />
        {/* Preferred Rate badge */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "var(--gold)",
            color: "var(--white)",
            fontSize: "9px",
            fontWeight: 600,
            padding: "5px 12px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Preferred Rate
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: "18px 20px 22px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        {/* Stars */}
        <div
          style={{
            color: "var(--gold)",
            fontSize: "10px",
            letterSpacing: "2px",
            marginBottom: "6px",
          }}
        >
          {"★".repeat(hotel.rating)}
        </div>

        {/* Name */}
        <h3
          className="type-heading-3"
          style={{
            color: "var(--ink)",
            marginBottom: "4px",
            fontSize: "16px",
          }}
        >
          {hotel.name}
        </h3>

        {/* City */}
        <p
          style={{
            fontSize: "12px",
            color: "var(--ink-light)",
            letterSpacing: "0.04em",
            marginBottom: "14px",
          }}
        >
          {hotel.city}
        </p>

        {/* Perks */}
        <div style={{ marginBottom: "14px" }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase" as const,
              color: "var(--emerald, #10B981)",
              marginBottom: "6px",
            }}
          >
            Members enjoy:
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "3px" }}
          >
            {displayPerks.map((perk) => (
              <span
                key={perk}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  color: "var(--ink-mid)",
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--emerald, #10B981)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {perk}
              </span>
            ))}
          </div>
        </div>

        {/* Spacer to push buttons to bottom */}
        <div style={{ flex: 1 }} />

        {/* Buttons */}
        <div
          style={{
            borderTop: "1px solid var(--cream-border)",
            paddingTop: "14px",
            display: "flex",
            gap: "8px",
          }}
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "9px 12px",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: "#fff",
              background: "var(--emerald, #10B981)",
              border: "none",
              cursor: "pointer",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--emerald-dark, #059669)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background =
                "var(--emerald, #10B981)";
            }}
          >
            See Perks &amp; Rates
          </a>
          <a
            href={conciergeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "9px 12px",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: "var(--ink-mid)",
              background: "none",
              border: "1px solid var(--cream-border)",
              cursor: "pointer",
              textDecoration: "none",
              fontFamily: "var(--font-body)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "var(--gold)";
              el.style.color = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.borderColor = "var(--cream-border)";
              el.style.color = "var(--ink-mid)";
            }}
          >
            Ask Concierge
          </a>
        </div>
      </div>
    </div>
  );
}
