import { redirect } from "next/navigation";

// The previous /book/rooms page was a sandbox built on MOCK_ROOMS / MOCK_HOTEL
// with a fabricated USD->INR conversion and a synthetic public-rate multiplier.
// It has been removed. The real per-hotel rate selection happens on the
// hotel detail page (/hotel/[id]); this stub keeps existing internal links
// working by redirecting users to the home page.
export default function BookRoomsRemoved() {
  redirect("/");
}
