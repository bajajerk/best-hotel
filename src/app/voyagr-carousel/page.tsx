import type { Metadata } from "next";
import VoyagrHotelCarousel from "@/components/VoyagrHotelCarousel";

export const metadata: Metadata = {
  title: "Voyagr Club — Preferred Hotels",
  description:
    "A smooth, GPU-accelerated carousel of stays we'd book ourselves.",
};

export default function VoyagrCarouselPage() {
  return (
    <main style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <VoyagrHotelCarousel />
    </main>
  );
}
