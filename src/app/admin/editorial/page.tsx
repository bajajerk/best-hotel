"use client";
import { useState, useCallback } from "react";
import Link from "next/link";

interface HotelRow {
  master_id?: string;
  short_id?: string;
  hotel_name: string;
  city: string;
  country: string;
  editorial_headline: string | null;
  editorial_intro: string | null;
  neighbourhood: string | null;
  concierge_note: string | null;
}

function Dot({ filled }: { filled: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: filled ? "var(--success)" : "var(--cream-border)",
        flexShrink: 0,
      }}
    />
  );
}

function missingAll(h: HotelRow) {
  return (
    !h.editorial_headline &&
    !h.editorial_intro &&
    !h.neighbourhood &&
    !h.concierge_note
  );
}

function hotelPathId(h: HotelRow) {
  return h.short_id ?? h.master_id ?? "";
}

export default function EditorialAdminPage() {
  const [query, setQuery] = useState("");
  const [hotels, setHotels] = useState<HotelRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
  const [searched, setSearched] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string, onlyMissing: boolean) => {
    setLoading(true);
    setSearched(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ q, limit: "50" });
      if (onlyMissing) params.set("missing_editorial", "1");
      const res = await fetch(`/api/hotels/search?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      let results: HotelRow[] = Array.isArray(data)
        ? data
        : data.results ?? [];
      if (onlyMissing) results = results.filter(missingAll);
      setHotels(results);
    } catch {
      setFetchError("Search failed. Check that the backend is reachable.");
      setHotels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query, missingOnly);
  }

  const flagged = hotels.filter(missingAll);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 600,
            color: "var(--ink)",
            marginBottom: 6,
          }}
        >
          Editorial Management
        </h1>
        <p
          style={{
            color: "var(--ink-light)",
            fontSize: 14,
            marginBottom: 32,
          }}
        >
          Search hotels and manage editorial overlay fields.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hotel name or city…"
            style={{
              flex: 1,
              minWidth: 220,
              padding: "10px 14px",
              border: "1px solid var(--cream-border)",
              borderRadius: 8,
              background: "var(--white)",
              color: "var(--ink)",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "10px 24px",
              background: "var(--ink)",
              color: "var(--cream)",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 28,
            cursor: "pointer",
            userSelect: "none",
            fontSize: 14,
            color: "var(--ink-mid)",
          }}
        >
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={(e) => setMissingOnly(e.target.checked)}
            style={{ accentColor: "var(--gold)", width: 15, height: 15 }}
          />
          Show only hotels missing all editorial fields
        </label>

        {fetchError && (
          <p
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: "var(--red-soft)",
              border: "1px solid var(--red-border)",
              borderRadius: 8,
              color: "var(--error)",
              fontSize: 14,
            }}
          >
            {fetchError}
          </p>
        )}

        {loading && (
          <p style={{ color: "var(--ink-light)", fontSize: 14 }}>
            Searching…
          </p>
        )}

        {!loading && searched && !fetchError && hotels.length === 0 && (
          <p style={{ color: "var(--ink-light)", fontSize: 14 }}>
            No hotels found.
          </p>
        )}

        {hotels.length > 0 && (
          <>
            {flagged.length > 0 && (
              <p
                style={{
                  marginBottom: 12,
                  fontSize: 13,
                  color: "var(--error)",
                }}
              >
                ⚑ {flagged.length} hotel{flagged.length !== 1 ? "s" : ""}{" "}
                missing all editorial content
              </p>
            )}

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid var(--cream-border)",
                    }}
                  >
                    {["Hotel", "City", "Headline", "Intro", "Nbhd", "Note", ""].map(
                      (h, i) => (
                        <th
                          key={i}
                          style={{
                            textAlign: i >= 2 && i <= 5 ? "center" : i === 6 ? "right" : "left",
                            padding: "8px 12px",
                            color: "var(--ink-light)",
                            fontWeight: 500,
                            fontSize: 12,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {hotels.map((h, i) => {
                    const pid = hotelPathId(h);
                    const noContent = missingAll(h);
                    return (
                      <tr
                        key={pid || i}
                        style={{
                          borderBottom: "1px solid var(--cream-deep)",
                          background: noContent
                            ? "rgba(139,58,58,0.04)"
                            : undefined,
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "var(--ink)",
                            fontWeight: 500,
                          }}
                        >
                          {noContent && (
                            <span
                              title="Missing all editorial fields"
                              style={{
                                color: "var(--error)",
                                marginRight: 6,
                                fontSize: 13,
                              }}
                            >
                              ⚑
                            </span>
                          )}
                          {h.hotel_name}
                        </td>
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "var(--ink-mid)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h.city}, {h.country}
                        </td>
                        <td style={{ textAlign: "center", padding: "10px 12px" }}>
                          <Dot filled={!!h.editorial_headline} />
                        </td>
                        <td style={{ textAlign: "center", padding: "10px 12px" }}>
                          <Dot filled={!!h.editorial_intro} />
                        </td>
                        <td style={{ textAlign: "center", padding: "10px 12px" }}>
                          <Dot filled={!!h.neighbourhood} />
                        </td>
                        <td style={{ textAlign: "center", padding: "10px 12px" }}>
                          <Dot filled={!!h.concierge_note} />
                        </td>
                        <td style={{ textAlign: "right", padding: "10px 12px" }}>
                          {pid && (
                            <Link
                              href={`/admin/editorial/${pid}`}
                              style={{
                                color: "var(--gold)",
                                fontSize: 13,
                                fontWeight: 600,
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Edit →
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "var(--ink-light)",
                }}
              >
                Nbhd = Neighbourhood · ⚑ = missing all 4 editorial fields
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
