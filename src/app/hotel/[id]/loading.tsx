import Header from "@/components/Header";
import { LuxeSkeleton, RateRowSkeleton } from "@/components/skeletons";

/**
 * Route-transition loader for /hotel/[id].
 * Mirrors the in-page loading layout owned by HotelPageClient so the swap
 * from SSR loader → client loader → real page is visually seamless.
 */
export default function HotelLoading() {
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <Header />
      <div
        aria-busy="true"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "88px 24px 120px",
        }}
      >
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
          <LuxeSkeleton width={60} height={10} radius={2} />
          <LuxeSkeleton width={90} height={10} radius={2} />
          <LuxeSkeleton width={140} height={10} radius={2} />
        </div>

        {/* Hero image */}
        <LuxeSkeleton width="100%" height={460} radius={0} style={{ marginBottom: 28 }} />

        {/* Title + meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
          <LuxeSkeleton width="55%" height={28} radius={4} />
          <LuxeSkeleton width="32%" height={14} radius={3} />
        </div>

        {/* Body grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 360px",
            gap: 36,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <RateRowSkeleton />
            <RateRowSkeleton />
            <RateRowSkeleton />
            <RateRowSkeleton />
          </div>
          <LuxeSkeleton width="100%" height={320} radius={0} />
        </div>

        <span className="sr-only">Loading hotel…</span>
      </div>
    </div>
  );
}
