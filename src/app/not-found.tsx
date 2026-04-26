import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--cream)", color: "var(--ink)" }}
    >
      <div className="text-center px-6">
        <p
          className="text-xs tracking-[0.3em] uppercase mb-4"
          style={{ color: "var(--gold)", fontFamily: "var(--font-mono)" }}
        >
          404
        </p>
        <h1
          className="text-4xl md:text-5xl mb-4"
          style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}
        >
          Page not found
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--ink-mid)" }}>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-full text-sm font-medium"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
