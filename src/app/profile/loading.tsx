import Header from "@/components/Header";
import { LuxeSkeleton } from "@/components/skeletons";

/**
 * Route-transition loader for /profile (luxe scope).
 * Uses the dark-variant skeleton because the profile page lives inside
 * the `.luxe` charcoal theme.
 */
export default function ProfileLoading() {
  return (
    <div className="luxe" style={{ minHeight: "100vh" }}>
      <Header />
      <main
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "88px 24px 80px",
        }}
      >
        {/* Hero card */}
        <div
          aria-busy="true"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: 32,
            marginBottom: 24,
            display: "flex",
            gap: 24,
            alignItems: "center",
          }}
        >
          <LuxeSkeleton variant="dark" width={80} height={80} radius={999} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <LuxeSkeleton variant="dark" width="40%" height={22} radius={4} />
            <LuxeSkeleton variant="dark" width="55%" height={13} radius={3} />
            <LuxeSkeleton variant="dark" width="30%" height={11} radius={3} />
          </div>
        </div>

        {/* Detail rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <LuxeSkeleton key={i} variant="dark" width="100%" height={64} radius={4} />
          ))}
        </div>

        <span className="sr-only">Loading profile…</span>
      </main>
    </div>
  );
}
