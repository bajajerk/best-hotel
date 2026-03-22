"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface NavLink {
  label: string;
  href: string;
}

interface MobileNavProps {
  links: NavLink[];
}

export default function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      {/* Hamburger button — visible only on mobile */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          zIndex: 200,
          position: "relative",
        }}
      >
        <div
          style={{
            width: "20px",
            height: "14px",
            position: "relative",
          }}
        >
          {/* Top bar */}
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s ease",
              top: open ? "6px" : "0",
              transform: open ? "rotate(45deg)" : "none",
            }}
          />
          {/* Middle bar */}
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s ease",
              top: "6px",
              opacity: open ? 0 : 1,
            }}
          />
          {/* Bottom bar */}
          <span
            style={{
              display: "block",
              position: "absolute",
              left: 0,
              right: 0,
              height: "1.5px",
              background: "var(--ink)",
              borderRadius: "1px",
              transition: "all 0.3s ease",
              top: open ? "6px" : "12px",
              transform: open ? "rotate(-45deg)" : "none",
            }}
          />
        </div>
      </button>

      {/* Overlay backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 149,
          background: "rgba(26, 23, 16, 0.4)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Slide-down drawer */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          right: 0,
          zIndex: 150,
          background: "rgba(245, 240, 232, 0.98)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--cream-border)",
          transform: open ? "translateY(0)" : "translateY(-100%)",
          opacity: open ? 1 : 0,
          transition: "transform 0.3s ease, opacity 0.25s ease",
          pointerEvents: open ? "auto" : "none",
          padding: "16px 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {links.map((link) => {
          const isExternal =
            link.href.startsWith("http") || link.href.startsWith("tel:");
          const Tag = isExternal ? "a" : Link;
          const extraProps = isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {};

          return (
            <Tag
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              {...(extraProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
              style={{
                display: "block",
                padding: "14px 0",
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink)",
                textDecoration: "none",
                borderBottom: "1px solid var(--cream-border)",
                transition: "color 0.2s",
              }}
            >
              {link.label}
            </Tag>
          );
        })}
      </div>
    </>
  );
}
