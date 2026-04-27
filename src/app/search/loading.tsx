import Header from "@/components/Header";
import { LuxeLoader } from "@/components/loaders";

/**
 * Route-transition loader for /search.
 * The chrome (Header) stays mounted; the LuxeLoader fills the viewport
 * below and randomly picks one of five cinematic full-page variants.
 */
export default function SearchLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#0c0b0a" }}>
      <Header />
      <LuxeLoader />
    </div>
  );
}
