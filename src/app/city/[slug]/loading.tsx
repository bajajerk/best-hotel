import Header from "@/components/Header";
import { LuxeLoader } from "@/components/loaders";

/**
 * Route-transition loader for /city/[slug].
 * Header stays mounted, LuxeLoader fills the rest with one of five
 * cinematic full-page variants (compass / ink / quote / constellation
 * / marquee), chosen at random per mount.
 */
export default function CityLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#0c0b0a" }}>
      <Header />
      <LuxeLoader />
    </div>
  );
}
