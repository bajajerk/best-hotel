import Header from "@/components/Header";
import { LuxeLoader } from "@/components/loaders";

/**
 * Route-transition loader for /booking-history.
 * Header stays mounted, LuxeLoader fills the rest with one of five
 * cinematic full-page variants chosen at random per mount.
 */
export default function BookingHistoryLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--luxe-black)" }}>
      <Header />
      <LuxeLoader />
    </div>
  );
}
