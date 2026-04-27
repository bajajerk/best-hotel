"use client";

/**
 * LoaderMarquee — Vertical infinite marquee of italic Playfair city names,
 * sliding upward, with a single city in clear focus at centre.
 *
 * Visual signature:
 *   • A tall column of city names rendered in oversized italic Playfair —
 *     ~64px on desktop, scales down on mobile — sliding upward at a slow,
 *     deliberate pace (one name per ~1.6s).
 *   • The centre line of the column is at full opacity & full champagne
 *     colour. Names above & below fade out via a CSS mask so the effect
 *     feels like reading a guest book through a slit of light.
 *   • Champagne dot dividers between cities.
 *   • To the lower right, a small italic "Voyagr" wordmark + tracking-
 *     wide mono eyebrow "ON THE WAY" — a quiet brand stamp.
 *
 * Implementation: pure CSS keyframes — the city list is duplicated so the
 * `translateY(-50%)` loop is seamless. No JS needed beyond the component.
 */

const CITIES = [
  "Bangkok",
  "Tokyo",
  "Paris",
  "Dubai",
  "Singapore",
  "London",
  "Bali",
  "Kyoto",
  "Marrakech",
  "Maldives",
  "Reykjavík",
  "Istanbul",
  "New York",
  "Lisbon",
];

export default function LoaderMarquee() {
  // Duplicate so the upward translate can loop seamlessly
  const ROLL = [...CITIES, ...CITIES];

  return (
    <div className="luxe-loader luxe-loader--marquee">
      <div className="luxe-loader__radial" aria-hidden />
      <div className="luxe-loader__grain" aria-hidden />

      <div className="luxe-loader__stage">
        {/* Centre rule — anchors the eye to the focal name */}
        <div className="luxe-marquee__rule luxe-marquee__rule--top" aria-hidden />
        <div className="luxe-marquee__rule luxe-marquee__rule--bottom" aria-hidden />

        <div className="luxe-marquee">
          <ul className="luxe-marquee__track">
            {ROLL.map((city, i) => (
              <li key={`${city}-${i}`} className="luxe-marquee__item">
                <span className="luxe-marquee__city">{city}</span>
                <span className="luxe-marquee__dot" aria-hidden>
                  ·
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="luxe-marquee__stamp">
          <div className="luxe-loader__eyebrow">On the way</div>
          <div className="luxe-marquee__brand">Voyagr</div>
        </div>
      </div>
    </div>
  );
}
