import Header from "@/components/Header";
import { LuxeLoader } from "@/components/loaders";

/**
 * Route-transition loader for /profile.
 * Profile is already a dark-themed (.luxe) scope, so the cinematic
 * LuxeLoader sits perfectly. Header stays mounted.
 */
export default function ProfileLoading() {
  return (
    <div className="luxe" style={{ minHeight: "100vh", background: "var(--luxe-black)" }}>
      <Header />
      <LuxeLoader />
    </div>
  );
}
