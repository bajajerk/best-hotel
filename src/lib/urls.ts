// =============================================================================
//  URL builders
//
//  Phase D migration — backend now exposes hotels as `/hotel/<slug>-<short_id>`
//  and accepts `<short_id>`, full master UUID, or the legacy `tj_hotel_id`. We
//  always emit the canonical pretty form so SEO + share links carry intent.
//
//  Backend public endpoints return `master_id` / `short_id` / `slug` per hotel
//  (see GET /api/curations/* + /api/hotels/{id}/rates). The shape callers feed
//  in is whatever's available — this helper picks the best URL it can build.
// =============================================================================

/**
 * Build the canonical pretty URL for a hotel.
 *
 * Prefers `<slug>-<short_id>` when both fields are present. Falls back to the
 * raw master id (UUID) so the route still resolves via the backend's
 * `_resolve_tj_from_path_id` helper.
 */
export function hotelUrl(
  h:
    | { slug?: string | null; short_id?: string | null; master_id?: string | null; id?: string | null }
    | { slug?: string | null; short_id?: string | null; master_id?: string | null }
    | { slug?: string | null; short_id?: string | null; id?: string | null }
): string {
  const slug = (h as { slug?: string | null }).slug ?? null;
  const shortId = (h as { short_id?: string | null }).short_id ?? null;
  if (slug && shortId) return `/hotel/${slug}-${shortId}`;
  if (shortId) return `/hotel/${shortId}`;
  const masterId =
    (h as { master_id?: string | null }).master_id ??
    (h as { id?: string | null }).id ??
    null;
  if (masterId) return `/hotel/${masterId}`;
  // Last-resort placeholder — should never trigger in production data.
  return `/hotel/`;
}
