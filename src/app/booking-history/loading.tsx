import Header from "@/components/Header";
import { LuxeSkeleton } from "@/components/skeletons";

/**
 * Route-transition loader for /booking-history.
 * The page renders a stack of cream-themed booking cards; the skeleton
 * mimics that stack while bookings hydrate from localStorage.
 */
export default function BookingHistoryLoading() {
  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <Header />
      <main
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "88px 24px 80px",
        }}
      >
        {/* Page heading */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          <LuxeSkeleton width={140} height={11} radius={2} />
          <LuxeSkeleton width="42%" height={32} radius={4} />
        </div>

        {/* Booking cards */}
        <div
          aria-busy="true"
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                background: "var(--white)",
                border: "1px solid var(--cream-border)",
                overflow: "hidden",
              }}
            >
              <div style={{ background: "#3d3a2e", padding: "18px 24px" }}>
                <LuxeSkeleton variant="dark" width="44%" height={20} radius={4} />
                <div style={{ height: 8 }} />
                <LuxeSkeleton variant="dark" width="28%" height={12} radius={3} />
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
                <LuxeSkeleton width="65%" height={14} radius={3} />
                <LuxeSkeleton width="38%" height={12} radius={3} />
                <LuxeSkeleton width="22%" height={28} radius={3} />
              </div>
            </div>
          ))}
        </div>

        <span className="sr-only">Loading bookings…</span>
      </main>
    </div>
  );
}
