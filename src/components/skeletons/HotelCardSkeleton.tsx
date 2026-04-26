/* ────────────────────────────────────────────────────────────
   HotelCardSkeleton — search-results placeholder
   Mirrors the shape of `.search-hotel-card` (220px image rail +
   text column with price chip on the right). Renders a single
   row; compose a column of these in the search-results loader.
   ──────────────────────────────────────────────────────────── */

import LuxeSkeleton from "./LuxeSkeleton";

export default function HotelCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="search-hotel-card"
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        overflow: "hidden",
      }}
    >
      {/* Image rail */}
      <div style={{ height: 160 }}>
        <LuxeSkeleton width="100%" height="100%" radius={0} />
      </div>

      {/* Text column */}
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* eyebrow / city */}
        <LuxeSkeleton width={110} height={10} radius={2} />

        {/* hotel name */}
        <LuxeSkeleton width="70%" height={20} radius={3} />

        {/* meta line */}
        <LuxeSkeleton width="45%" height={12} radius={3} />

        {/* spacer */}
        <div style={{ flex: 1, minHeight: 14 }} />

        {/* footer: rating + price chip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <LuxeSkeleton width={84} height={14} radius={3} />
          <LuxeSkeleton width={108} height={28} radius={2} />
        </div>
      </div>
    </div>
  );
}
