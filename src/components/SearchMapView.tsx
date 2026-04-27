"use client";

import { useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { hotelUrl } from "@/lib/urls";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface MapHotel {
  /** Hotel master UUID. */
  master_id: string;
  /** SEO slug — used for the canonical pretty URL. */
  slug?: string | null;
  /** 8-hex short id — used for the canonical pretty URL. */
  short_id?: string | null;
  hotel_name: string;
  city: string;
  country: string;
  star_rating: number | null;
  photo1: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface SearchMapViewProps {
  hotels: MapHotel[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=60";

function safeImageSrc(url: string): string {
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
}

function sanitizePhoto(url: string | null): string {
  if (!url) return PLACEHOLDER_IMG;
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

// ---------------------------------------------------------------------------
// Custom marker icon (gold pin matching Voyagr theme)
// ---------------------------------------------------------------------------
function createGoldIcon(starRating: number | null): L.DivIcon {
  const stars = starRating && starRating > 0 ? starRating : 0;
  return L.divIcon({
    className: "voyagr-map-marker",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--gold, #C9A84C);
        border: 2px solid var(--white, #fff);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      ">
        <span style="
          transform: rotate(45deg);
          color: var(--white, #fff);
          font-size: 11px;
          font-weight: 600;
          font-family: var(--font-body, sans-serif);
        ">${stars > 0 ? stars + "★" : "H"}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function createActiveIcon(starRating: number | null): L.DivIcon {
  const stars = starRating && starRating > 0 ? starRating : 0;
  return L.divIcon({
    className: "voyagr-map-marker-active",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: var(--ink, #1a1710);
        border: 3px solid var(--gold, #C9A84C);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 16px rgba(0,0,0,0.35);
        transition: all 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          color: var(--gold, #C9A84C);
          font-size: 13px;
          font-weight: 700;
          font-family: var(--font-body, sans-serif);
        ">${stars > 0 ? stars + "★" : "H"}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SearchMapView({ hotels }: SearchMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Filter hotels that have valid coordinates
  const mappableHotels = useMemo(
    () =>
      hotels.filter(
        (h) =>
          h.latitude != null &&
          h.longitude != null &&
          h.latitude !== 0 &&
          h.longitude !== 0
      ),
    [hotels]
  );

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map if not already done
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
      });

      // Add zoom control to top-right
      L.control.zoom({ position: "topright" }).addTo(mapInstanceRef.current);

      // Voyagr-styled tile layer (muted tones)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (mappableHotels.length === 0) {
      // Default view: world
      map.setView([20, 0], 2);
      return;
    }

    // Add markers
    const bounds = L.latLngBounds([]);

    mappableHotels.forEach((hotel) => {
      const lat = hotel.latitude!;
      const lng = hotel.longitude!;
      const icon = createGoldIcon(hotel.star_rating);
      const activeIcon = createActiveIcon(hotel.star_rating);

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      // Hover effect
      marker.on("mouseover", () => {
        marker.setIcon(activeIcon);
        marker.setZIndexOffset(1000);
      });
      marker.on("mouseout", () => {
        marker.setIcon(icon);
        marker.setZIndexOffset(0);
      });

      // Popup with hotel info
      const photoSrc = sanitizePhoto(hotel.photo1);
      const starsHtml =
        hotel.star_rating && hotel.star_rating > 0
          ? `<div style="color: #C9A84C; font-size: 10px; letter-spacing: 1px; margin-bottom: 4px;">${"★".repeat(hotel.star_rating)}</div>`
          : "";

      marker.bindPopup(
        `<div style="font-family: var(--font-body, 'DM Sans', sans-serif); min-width: 220px; max-width: 260px; padding: 0;">
          <div style="width: 100%; height: 120px; overflow: hidden;">
            <img src="${photoSrc}" alt="${hotel.hotel_name}"
              onerror="this.src='${PLACEHOLDER_IMG}'"
              style="width: 100%; height: 100%; object-fit: cover; display: block; filter: saturate(0.88);" />
          </div>
          <div style="padding: 12px 14px;">
            ${starsHtml}
            <div style="font-family: var(--font-display, 'Cormorant Garamond', serif); font-size: 16px; font-weight: 500; font-style: italic; color: #1a1710; margin-bottom: 4px; line-height: 1.2;">
              ${hotel.hotel_name}
            </div>
            <div style="font-size: 11px; color: #8a8578; display: flex; align-items: center; gap: 4px; margin-bottom: 10px;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8a8578" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              ${hotel.city}, ${hotel.country}
            </div>
            <a href="${hotelUrl(hotel)}"
              style="display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; color: #C9A84C; text-decoration: none; letter-spacing: 0.06em; padding: 6px 14px; border: 1px solid #C9A84C; transition: all 0.2s;">
              View details &rarr;
            </a>
          </div>
        </div>`,
        {
          className: "voyagr-popup",
          closeButton: true,
          maxWidth: 280,
          minWidth: 220,
        }
      );

      bounds.extend([lat, lng]);
      markersRef.current.push(marker);
    });

    // Fit map to show all markers
    if (mappableHotels.length === 1) {
      map.setView(
        [mappableHotels[0].latitude!, mappableHotels[0].longitude!],
        13
      );
    } else {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    return () => {};
  }, [mappableHotels]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      {/* Map container */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "600px",
          border: "1px solid var(--cream-border)",
          background: "var(--cream-deep)",
        }}
      />

      {/* Hotel count overlay */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "var(--white)",
          border: "1px solid var(--cream-border)",
          padding: "8px 16px",
          fontSize: "12px",
          fontFamily: "var(--font-body)",
          color: "var(--ink)",
          fontWeight: 500,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          zIndex: 1000,
        }}
      >
        {mappableHotels.length} of {hotels.length} hotels on map
        {mappableHotels.length < hotels.length && (
          <span
            style={{
              display: "block",
              fontSize: "10px",
              color: "var(--ink-light)",
              marginTop: 2,
            }}
          >
            Some hotels lack location data
          </span>
        )}
      </div>

      {/* Sidebar list of hotels (scrollable) */}
      {mappableHotels.length > 0 && (
        <div
          className="map-hotel-sidebar"
          style={{
            display: "flex",
            gap: "12px",
            overflowX: "auto",
            padding: "16px 0",
            scrollbarWidth: "thin",
          }}
        >
          {mappableHotels.map((hotel) => (
            <Link
              key={hotel.master_id}
              href={hotelUrl(hotel)}
              style={{
                textDecoration: "none",
                display: "block",
                flexShrink: 0,
              }}
            >
              <div
                className="card-hover"
                style={{
                  width: "200px",
                  background: "var(--white)",
                  border: "1px solid var(--cream-border)",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <div style={{ height: "100px", overflow: "hidden" }}>
                  <img
                    src={sanitizePhoto(hotel.photo1)}
                    alt={hotel.hotel_name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                      filter: "saturate(0.88)",
                    }}
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                    }}
                  />
                </div>
                <div style={{ padding: "10px 12px" }}>
                  {hotel.star_rating && hotel.star_rating > 0 && (
                    <div
                      style={{
                        color: "var(--gold)",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        marginBottom: "2px",
                      }}
                    >
                      {"★".repeat(hotel.star_rating)}
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "14px",
                      fontWeight: 500,
                      fontStyle: "italic",
                      color: "var(--ink)",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {hotel.hotel_name}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "var(--ink-light)",
                      marginTop: "2px",
                    }}
                  >
                    {hotel.city}, {hotel.country}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {mappableHotels.length === 0 && hotels.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            padding: "32px 40px",
            textAlign: "center",
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "var(--ink)",
              fontWeight: 500,
              marginBottom: "6px",
            }}
          >
            No location data available
          </div>
          <div style={{ fontSize: "12px", color: "var(--ink-light)" }}>
            These hotels don&apos;t have map coordinates yet.
          </div>
        </div>
      )}

      {/* Custom popup styles */}
      <style>{`
        .voyagr-popup .leaflet-popup-content-wrapper {
          border-radius: 0 !important;
          padding: 0 !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          border: 1px solid var(--cream-border) !important;
        }
        .voyagr-popup .leaflet-popup-content {
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        .voyagr-popup .leaflet-popup-tip {
          border: 1px solid var(--cream-border) !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .voyagr-popup .leaflet-popup-close-button {
          color: var(--ink-light) !important;
          font-size: 18px !important;
          padding: 6px 8px !important;
          z-index: 10;
        }
        .voyagr-map-marker,
        .voyagr-map-marker-active {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
