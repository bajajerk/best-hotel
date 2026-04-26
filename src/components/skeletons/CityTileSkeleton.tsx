/* ────────────────────────────────────────────────────────────
   CityTileSkeleton — destination grid placeholder
   Matches the 4:5 portrait tile used on /search and the home
   "Top Cities" section.
   ──────────────────────────────────────────────────────────── */

import LuxeSkeleton from "./LuxeSkeleton";

export default function CityTileSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "relative", aspectRatio: "4 / 5" }}>
        <LuxeSkeleton width="100%" height="100%" radius={0} />
      </div>
      <div
        style={{
          padding: "14px 16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <LuxeSkeleton width="60%" height={16} radius={3} />
        <LuxeSkeleton width="35%" height={11} radius={3} />
      </div>
    </div>
  );
}
