import Header from "@/components/Header";
import SearchResultsSkeleton from "@/components/skeletons/SearchResultsSkeleton";
import { LuxeSkeleton } from "@/components/skeletons";

/**
 * Route-transition loader for /search.
 * Mounts the standard <Header /> so the chrome doesn't disappear during the
 * navigation, then renders a luxe skeleton stand-in for the search panel.
 */
export default function SearchLoading() {
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
        {/* Search bar shell */}
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--cream-border)",
            padding: 20,
            display: "flex",
            gap: 12,
            alignItems: "center",
            marginBottom: 28,
          }}
        >
          <LuxeSkeleton width="32%" height={48} radius={4} />
          <LuxeSkeleton width="22%" height={48} radius={4} />
          <LuxeSkeleton width="22%" height={48} radius={4} />
          <LuxeSkeleton width="14%" height={48} radius={4} />
        </div>

        {/* Filter rail eyebrow */}
        <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
          <LuxeSkeleton width={88} height={28} radius={2} />
          <LuxeSkeleton width={70} height={28} radius={2} />
          <LuxeSkeleton width={104} height={28} radius={2} />
          <LuxeSkeleton width={62} height={28} radius={2} />
        </div>

        <SearchResultsSkeleton count={6} />
      </div>
    </div>
  );
}
