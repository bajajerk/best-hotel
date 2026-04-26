/**
 * Curated hero imagery for the redesign-v2 home hero.
 *
 * Replaces the redesign repo's Gemini AI runtime generation with a static
 * mood image. Pre-loaded via <link rel="preload"> in the Home component so
 * first paint is instant.
 *
 * To swap to a local optimized asset:
 *   1. Drop the .webp at /public/hero/voyagr-luxury-blue-hour.webp
 *   2. Change HERO_IMAGE_URL to "/hero/voyagr-luxury-blue-hour.webp"
 *
 * The mood we're matching (from voyagr-club-redesign HeroVibe prompt):
 *   "Ultra-luxury private resort at blue hour, sleek minimalist architecture
 *    with obsidian stone and gold accents, glowing infinity pool reflecting a
 *    starry sky, cinematic wide angle, photorealistic, 8k resolution,
 *    editorial travel photography."
 */
export const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=2400&q=85&auto=format&fit=crop";

/**
 * Secondary mood candidates — rotate via `Math.floor(Math.random() * arr.length)`
 * if you want gentle variation per visit. Currently unused but kept for the
 * Home hero rotation phase.
 */
export const HERO_IMAGE_CANDIDATES = [
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=2400&q=85&auto=format&fit=crop", // overwater villa, blue hour
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=2400&q=85&auto=format&fit=crop", // tokyo skyline luxury suite
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=2400&q=85&auto=format&fit=crop", // current best-hotel hero — keeps continuity
] as const;
