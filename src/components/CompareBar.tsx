"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCompare } from "@/context/CompareContext";

const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70";

function sanitizePhoto(url: string | null): string {
  if (!url) return PLACEHOLDER_IMG;
  let src = url.startsWith("http://") ? url.replace("http://", "https://") : url;
  if (!src.startsWith("https://"))
    src = `https://photos.hotelbeds.com/giata/${src}`;
  return src;
}

export default function CompareBar() {
  const { hotels, remove, clear } = useCompare();
  const router = useRouter();

  if (hotels.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="compare-bar-mobile"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 150,
          background: "var(--ink)",
          borderTop: "1px solid rgba(201, 168, 76, 0.3)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Hotel thumbnails */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {hotels.map((hotel) => (
            <div
              key={hotel.hotel_id}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(201, 168, 76, 0.25)",
                padding: "6px 10px 6px 6px",
                maxWidth: 200,
              }}
            >
              <img
                src={sanitizePhoto(hotel.photo1)}
                alt={hotel.hotel_name}
                style={{
                  width: 36,
                  height: 36,
                  objectFit: "cover",
                  flexShrink: 0,
                  filter: "saturate(0.88)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "#fdfaf5",
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: 120,
                }}
              >
                {hotel.hotel_name}
              </span>
              <button
                onClick={() => remove(hotel.hotel_id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  fontSize: 14,
                  lineHeight: 1,
                  padding: "0 0 0 4px",
                  flexShrink: 0,
                }}
                aria-label={`Remove ${hotel.hotel_name} from compare`}
              >
                &times;
              </button>
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 2 - hotels.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              style={{
                width: 36,
                height: 36,
                border: "1px dashed rgba(201, 168, 76, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: "rgba(201, 168, 76, 0.4)",
              }}
            >
              +
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: 8 }}>
          <button
            onClick={clear}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 11,
              fontFamily: "var(--font-body)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
          <button
            onClick={() => router.push("/compare")}
            disabled={hotels.length < 2}
            style={{
              background: hotels.length >= 2 ? "var(--gold)" : "rgba(201, 168, 76, 0.3)",
              border: "none",
              color: hotels.length >= 2 ? "var(--ink)" : "rgba(255,255,255,0.4)",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "var(--font-body)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              padding: "8px 24px",
              cursor: hotels.length >= 2 ? "pointer" : "not-allowed",
            }}
          >
            Compare ({hotels.length})
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
