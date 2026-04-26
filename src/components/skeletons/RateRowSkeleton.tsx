/* ────────────────────────────────────────────────────────────
   RateRowSkeleton — hotel detail rates panel placeholder
   Tighter than HotelCardSkeleton — single column, no image.
   Use 3-5 of these while live rates fetch on /hotel/[id].
   ──────────────────────────────────────────────────────────── */

import LuxeSkeleton from "./LuxeSkeleton";

export default function RateRowSkeleton() {
  return (
    <div
      aria-hidden="true"
      style={{
        background: "var(--white)",
        border: "1px solid var(--cream-border)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {/* room name */}
      <LuxeSkeleton width="55%" height={18} radius={3} />

      {/* meal basis */}
      <LuxeSkeleton width="35%" height={12} radius={3} />

      {/* policy line */}
      <LuxeSkeleton width="42%" height={14} radius={3} />

      {/* footer */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: 8,
          gap: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <LuxeSkeleton width={120} height={24} radius={3} />
          <LuxeSkeleton width={90} height={12} radius={3} />
        </div>
        <LuxeSkeleton width={92} height={36} radius={2} />
      </div>
    </div>
  );
}
