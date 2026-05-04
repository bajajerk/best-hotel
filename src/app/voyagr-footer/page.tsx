import type { Metadata } from "next";
import VoyagrFooterSeasons from "@/components/VoyagrFooterSeasons";

export const metadata: Metadata = {
  title: "Voyagr Club — Members & Concierge",
  description:
    "Rotating member quotes, club stats, and a dark accordion footer for Voyagr Club.",
};

export default function VoyagrFooterPage() {
  return <VoyagrFooterSeasons />;
}
