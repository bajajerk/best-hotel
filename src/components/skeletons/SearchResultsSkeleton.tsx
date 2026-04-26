/* ────────────────────────────────────────────────────────────
   SearchResultsSkeleton — column of HotelCardSkeleton rows
   Drop-in replacement for the "Searching hotels…" text fallback
   on /search. Renders a header eyebrow + N rows.
   ──────────────────────────────────────────────────────────── */

import HotelCardSkeleton from "./HotelCardSkeleton";
import LuxeSkeleton from "./LuxeSkeleton";

export interface SearchResultsSkeletonProps {
  /** Number of card rows to render. Defaults to 8. */
  count?: number;
  /** When true, hide the eyebrow header (used inside a parent that already shows one). */
  bare?: boolean;
}

export default function SearchResultsSkeleton({
  count = 8,
  bare = false,
}: SearchResultsSkeletonProps) {
  return (
    <div aria-busy="true" aria-live="polite">
      {!bare && (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <LuxeSkeleton width={160} height={11} radius={2} />
          <LuxeSkeleton width={70} height={12} radius={2} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Array.from({ length: count }).map((_, i) => (
          <HotelCardSkeleton key={i} />
        ))}
      </div>

      <span className="sr-only">Loading hotels…</span>
    </div>
  );
}
