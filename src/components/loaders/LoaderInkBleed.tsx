"use client";

/**
 * LoaderInkBleed — A champagne ink mark that bleeds outward from a single
 * point, like watercolour blooming on rag paper.
 *
 * Visual signature:
 *   • Charcoal canvas with a single vignette spotlight.
 *   • A "VC" monogram + a calligraphic Voyagr wordmark in italic Playfair.
 *   • A turbulent ink halo created with feTurbulence + feDisplacementMap,
 *     scaling/fading on a slow loop. Behind the mark, a second softer bloom
 *     pulses out of phase. The two together feel like ink blooming through
 *     fibrous paper — never mechanical.
 *   • Editorial line below: "Your concierge is curating, quietly."
 *   • Three-dot champagne pulse to keep the eye certain that work continues.
 *
 * Accessibility: all motion is pure CSS keyframes; reduced-motion users
 * see a static, perfectly composed wordmark with no bleed animation.
 */

export default function LoaderInkBleed() {
  return (
    <div className="luxe-loader luxe-loader--ink">
      <div className="luxe-loader__radial luxe-loader__radial--soft" aria-hidden />
      <div className="luxe-loader__grain" aria-hidden />

      <div className="luxe-loader__stage">
        <svg
          className="luxe-ink"
          viewBox="0 0 480 320"
          width="480"
          height="320"
          aria-hidden
        >
          <defs>
            {/* Watercolour bleed via turbulence + displacement */}
            <filter id="ink-bleed" x="-25%" y="-25%" width="150%" height="150%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.012 0.018"
                numOctaves="2"
                seed="7"
                result="noise"
              >
                <animate
                  attributeName="baseFrequency"
                  dur="9s"
                  values="0.012 0.018; 0.020 0.014; 0.012 0.018"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="14"
                xChannelSelector="R"
                yChannelSelector="G"
              />
              <feGaussianBlur stdDeviation="0.4" />
            </filter>

            <radialGradient id="ink-bloom" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d9c08d" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#c8aa76" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#c8aa76" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="ink-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e6cf99" />
              <stop offset="100%" stopColor="#9b7f4f" />
            </linearGradient>
          </defs>

          {/* Soft outer bloom — slow scale */}
          <g className="luxe-ink__bloom">
            <circle cx="240" cy="160" r="160" fill="url(#ink-bloom)" />
          </g>

          {/* Inner ink mark — turbulent bleed */}
          <g
            className="luxe-ink__mark"
            filter="url(#ink-bleed)"
            fill="url(#ink-stroke)"
          >
            {/* Monogram circle hairline */}
            <circle
              cx="240"
              cy="138"
              r="56"
              fill="none"
              stroke="#c8aa76"
              strokeOpacity="0.7"
              strokeWidth="1"
            />
            {/* "V" + "C" monogram drawn as paths so the displacement filter has rich edges to work with */}
            <text
              x="240"
              y="158"
              textAnchor="middle"
              fontFamily="'Playfair Display', serif"
              fontStyle="italic"
              fontWeight="500"
              fontSize="58"
              fill="#e6cf99"
            >
              VC
            </text>
          </g>

          {/* Crisp wordmark below — NOT filtered, anchors the eye */}
          <text
            x="240"
            y="232"
            textAnchor="middle"
            fontFamily="'Playfair Display', serif"
            fontStyle="italic"
            fontWeight="400"
            fontSize="22"
            fill="#f5f0e8"
            opacity="0.82"
            letterSpacing="2"
          >
            Voyagr
          </text>

          {/* Tiny rule line under the wordmark */}
          <line
            x1="220"
            y1="248"
            x2="260"
            y2="248"
            stroke="#c8aa76"
            strokeOpacity="0.55"
            strokeWidth="0.7"
          />
        </svg>

        <div className="luxe-loader__copy">
          <p className="luxe-loader__editorial">
            Your concierge is curating,
            <span className="luxe-loader__editorial-italic"> quietly.</span>
          </p>
          <div className="luxe-loader__dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
