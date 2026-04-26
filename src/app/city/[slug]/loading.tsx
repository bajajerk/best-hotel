import Header from "@/components/Header";
import { LuxeSkeleton, HotelCardSkeleton } from "@/components/skeletons";

/**
 * Route-transition loader for /city/[slug].
 * The CityPageClient owns its own in-page loading state once mounted; this
 * file only covers the SSR → client handoff so the page never flashes
 * a blank cream rectangle.
 */
export default function CityLoading() {
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <Header />
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "88px 24px 80px",
        }}
      >
        {/* Hero band */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 32 }}>
          <LuxeSkeleton width={130} height={11} radius={2} />
          <LuxeSkeleton width="48%" height={36} radius={4} />
          <LuxeSkeleton width="62%" height={14} radius={3} />
        </div>

        {/* Filter rail */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <LuxeSkeleton width={92} height={32} radius={2} />
          <LuxeSkeleton width={108} height={32} radius={2} />
          <LuxeSkeleton width={84} height={32} radius={2} />
        </div>

        {/* Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <HotelCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
