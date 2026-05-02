import Header from "@/components/Header";
import { LuxeLoader } from "@/components/loaders";

/**
 * Root route-transition loader.
 * Mounts the standard Header so the chrome doesn't disappear during a
 * navigation, then renders one of five cinematic luxe loaders below.
 */
export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--luxe-black)" }}>
      <Header />
      <LuxeLoader />
    </div>
  );
}
