import type { Metadata } from "next";
import VoyagrSeasonsCalendar from "@/components/VoyagrSeasonsCalendar";

export const metadata: Metadata = {
  title: "Voyagr Club — Travel Calendar",
  description:
    "Four seasons. Twelve destinations. One concierge to book them all.",
};

export default function VoyagrSeasonsPage() {
  return <VoyagrSeasonsCalendar />;
}
