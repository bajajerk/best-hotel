import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://134.122.41.91:5000";

/** GET /api/hotels/:id — fetch full hotel detail from backend */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate id is a positive integer
  if (!/^\d+$/.test(id)) {
    return NextResponse.json(
      { error: "Invalid hotel ID. Must be a positive integer." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/hotels/${id}`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (res.status === 404) {
      return NextResponse.json(
        { error: "Hotel not found" },
        { status: 404 }
      );
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
    return NextResponse.json(
      { error: "Backend unavailable" },
      { status: 502 }
    );
  }
}
