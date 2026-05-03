import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://134.122.41.91:5000";

/** GET /api/hotels/:id — fetch full hotel detail from backend.
 *
 * The `:id` can be any of:
 *   - tj_hotel_id (legacy numeric like "100000530749")
 *   - hotel_master UUID
 *   - 8-char short_id ("a7988705")
 *   - canonical pretty URL "<slug>-<short_id>"
 *
 * The backend's `_resolve_tj_from_path_id` helper handles all four shapes.
 * This proxy just forwards — no validation. (The previous numeric-only regex
 * was leftover from before the master-hotel migration and 400'd every hotel
 * page that uses the new URL formats.)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length > 256) {
    return NextResponse.json({ error: "Invalid hotel id" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/hotels/${encodeURIComponent(id)}`,
      {
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 3600 },
      }
    );

    if (res.status === 404) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch hotel details" },
        { status: res.status }
      );
    }

    const hotel = await res.json();

    return NextResponse.json(hotel, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
