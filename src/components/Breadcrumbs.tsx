"use client";

import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 60,
        left: 0,
        right: 0,
        zIndex: 99,
        background: "rgba(253, 250, 245, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--cream-border)",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          height: 36,
          gap: 6,
          fontSize: 12,
          fontFamily: "var(--font-body)",
          color: "var(--ink-light)",
        }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && (
                <span style={{ color: "var(--cream-border)", userSelect: "none" }}>
                  /
                </span>
              )}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  style={{
                    color: "var(--ink-mid)",
                    textDecoration: "none",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--gold)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--ink-mid)";
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <span style={{ color: isLast ? "var(--ink)" : "var(--ink-light)" }}>
                  {item.label}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
