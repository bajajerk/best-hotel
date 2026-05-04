import type { Metadata } from "next";
import VoyagrFilterResults from "@/components/VoyagrFilterResults";

export const metadata: Metadata = {
  title: "Voyagr Club — Filter Stays",
  description:
    "Mobile-first hotel search results with structured filter bar and bottom sheet for Voyagr Club.",
};

export default function VoyagrFilterPage() {
  return <VoyagrFilterResults />;
}
