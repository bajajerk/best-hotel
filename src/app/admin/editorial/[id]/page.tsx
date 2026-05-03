"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const FIELDS = [
  {
    key: "editorial_headline" as const,
    label: "Headline",
    max: 60,
    rows: 2,
    placeholder: "A property our concierge keeps revisiting",
  },
  {
    key: "editorial_intro" as const,
    label: "Introduction",
    max: 280,
    rows: 5,
    placeholder:
      "A brief editorial introduction that sets the tone for this property's coverage…",
  },
  {
    key: "neighbourhood" as const,
    label: "Neighbourhood",
    max: 40,
    rows: 2,
    placeholder: "Marais, Paris · steps from the Pompidou",
  },
  {
    key: "concierge_note" as const,
    label: "Concierge Note",
    max: 200,
    rows: 4,
    placeholder:
      "Ask for the upper courtyard rooms — quieter and flooded with morning light.",
  },
] as const;

type FieldKey = (typeof FIELDS)[number]["key"];
type EditorialState = Record<FieldKey, string>;

interface HotelMeta {
  hotel_name: string;
  city: string;
  country: string;
}

const EMPTY: EditorialState = {
  editorial_headline: "",
  editorial_intro: "",
  neighbourhood: "",
  concierge_note: "",
};

export default function EditorialEditPage() {
  const { id } = useParams<{ id: string }>();

  const [meta, setMeta] = useState<HotelMeta | null>(null);
  const [fields, setFields] = useState<EditorialState>(EMPTY);
  const [panelOpen, setPanelOpen] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/hotels/${id}`);
        if (!res.ok) throw new Error("Hotel not found");
        const data = await res.json();
        setMeta({
          hotel_name: data.hotel_name,
          city: data.city,
          country: data.country,
        });
        setFields({
          editorial_headline: data.editorial_headline ?? "",
          editorial_intro: data.editorial_intro ?? "",
          neighbourhood: data.neighbourhood ?? "",
          concierge_note: data.concierge_note ?? "",
        });
      } catch {
        setLoadError("Failed to load hotel data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function overLimit(key: FieldKey) {
    const limit = FIELDS.find((f) => f.key === key)!.max;
    return fields[key].length > limit;
  }

  const hasErrors = FIELDS.some((f) => overLimit(f.key));

  async function handleSave() {
    if (hasErrors || saving) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const body: Record<string, string | null> = {};
      for (const f of FIELDS) {
        body[f.key] = fields[f.key].trim() || null;
      }
      const res = await fetch(`/api/hotels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Save failed (${res.status})`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--cream)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--ink-light)", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--cream)",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <Link
            href="/admin/editorial"
            style={{
              fontSize: 13,
              color: "var(--ink-light)",
              textDecoration: "none",
            }}
          >
            ← Editorial
          </Link>
          <p
            style={{
              marginTop: 24,
              color: "var(--error)",
              fontSize: 14,
            }}
          >
            {loadError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--cream)",
        padding: "40px 24px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Breadcrumb */}
        <nav
          style={{
            fontSize: 13,
            color: "var(--ink-light)",
            marginBottom: 28,
          }}
        >
          <Link
            href="/admin/editorial"
            style={{ color: "var(--ink-light)", textDecoration: "none" }}
          >
            Editorial
          </Link>
          <span style={{ margin: "0 6px" }}>›</span>
          <span style={{ color: "var(--ink)" }}>
            {meta?.hotel_name ?? id}
          </span>
        </nav>

        {/* Hotel header */}
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 600,
              color: "var(--ink)",
              marginBottom: 4,
            }}
          >
            {meta?.hotel_name ?? id}
          </h1>
          {meta && (
            <p style={{ color: "var(--ink-light)", fontSize: 14 }}>
              {meta.city}, {meta.country}
            </p>
          )}
        </div>

        {/* Collapsible Editorial panel */}
        <div
          style={{
            border: "1px solid var(--cream-border)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <button
            onClick={() => setPanelOpen((o) => !o)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              background: "var(--white)",
              border: "none",
              borderBottom: panelOpen
                ? "1px solid var(--cream-border)"
                : "none",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Editorial
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                transform: panelOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.18s",
                flexShrink: 0,
                color: "var(--ink-light)",
              }}
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {panelOpen && (
            <div
              style={{
                padding: "20px 20px 24px",
                background: "var(--white)",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              {FIELDS.map((f) => {
                const len = fields[f.key].length;
                const over = len > f.max;
                const nearLimit = !over && len > f.max * 0.85;
                return (
                  <div key={f.key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <label
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--ink)",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {f.label}
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            fontWeight: 400,
                            color: "var(--ink-light)",
                          }}
                        >
                          (optional, max {f.max})
                        </span>
                      </label>
                      <span
                        style={{
                          fontSize: 12,
                          fontVariantNumeric: "tabular-nums",
                          color: over
                            ? "var(--error)"
                            : nearLimit
                            ? "var(--market-rate)"
                            : "var(--ink-light)",
                          fontWeight: over ? 600 : 400,
                        }}
                      >
                        {len} / {f.max}
                      </span>
                    </div>
                    <textarea
                      rows={f.rows}
                      placeholder={f.placeholder}
                      value={fields[f.key]}
                      onChange={(e) =>
                        setFields((prev) => ({
                          ...prev,
                          [f.key]: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        border: `1px solid ${
                          over ? "var(--error)" : "var(--cream-border)"
                        }`,
                        borderRadius: 8,
                        background: "var(--cream)",
                        color: "var(--ink)",
                        fontSize: 14,
                        lineHeight: 1.55,
                        resize: "vertical",
                        outline: "none",
                        fontFamily: "inherit",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => {
                        if (!over)
                          e.currentTarget.style.borderColor =
                            "var(--gold)";
                      }}
                      onBlur={(e) => {
                        if (!over)
                          e.currentTarget.style.borderColor =
                            "var(--cream-border)";
                      }}
                    />
                    {over && (
                      <p
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: "var(--error)",
                        }}
                      >
                        Exceeds {f.max}-character limit by {len - f.max}.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save row */}
        {saveError && (
          <div
            style={{
              marginBottom: 14,
              padding: "10px 14px",
              background: "var(--red-soft)",
              border: "1px solid var(--red-border)",
              borderRadius: 8,
              color: "var(--error)",
              fontSize: 14,
            }}
          >
            {saveError}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={handleSave}
            disabled={saving || hasErrors}
            style={{
              padding: "12px 32px",
              background: hasErrors
                ? "var(--cream-border)"
                : saving
                ? "var(--ink-mid)"
                : "var(--ink)",
              color: hasErrors ? "var(--ink-light)" : "var(--cream)",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: hasErrors || saving ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: "var(--success)" }}>
              Saved ✓
            </span>
          )}
          {hasErrors && (
            <span style={{ fontSize: 13, color: "var(--error)" }}>
              Fix character limit errors before saving.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
