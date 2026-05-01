import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://134.122.41.91:5000";

/** GET /api/hotels/search — typeahead/search proxy.
 *
 * Without this dedicated route, /api/hotels/search would match the dynamic
 * /api/hotels/[id] route and 502 with "Failed to fetch hotel details" — the
 * dynamic route assumes [id] is a hotel id and forwards to /api/hotels/<id>
 * which doesn't exist for the literal string "search".
 *
 * This forwarder forwards the entire query string to the backend's
 * /api/hotels/search endpoint and returns the JSON response unchanged.
 */
export async function GET(request: NextRequest) {
  const search = request.nextUrl.search; // includes leading '?'
  const url = `${BACKEND_URL}/api/hotels/search${search}`;

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      // Live data — caller decides cache; no s-maxage here.
      cache: "no-store",
    });

    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
