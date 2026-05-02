import Header from "@/components/Header";
import { LuxeLoader } from "@/components/loaders";

/**
 * Route-transition loader for /hotel/[id].
 * Header stays mounted, LuxeLoader fills the rest with one of five
 * cinematic full-page variants. Once the page hydrates, the in-page
 * RateRowSkeleton / partial skeletons take over for granular loading.
 */
export default function HotelLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--luxe-black)" }}>
      <Header />
      <LuxeLoader />
    </div>
  );
}
