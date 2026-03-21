export default function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-black)" }}
    >
      <div className="text-center">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
          style={{
            borderColor: "var(--gold)",
            borderTopColor: "transparent",
          }}
        />
        <p
          className="text-xs tracking-[0.2em] uppercase"
          style={{ color: "var(--white-30)", fontFamily: "var(--font-mono)" }}
        >
          Loading
        </p>
      </div>
    </div>
  );
}
