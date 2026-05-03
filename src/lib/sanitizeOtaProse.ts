// Server-side only — never import this in a client component.
// Raw OTA prose from supplier APIs (TBO, Hotelbeds, Expedia Affiliate) must
// pass through this function before reaching any page.
import blocklist from './ota-blocklist.json';

interface BlocklistConfig {
  phraseBlocklist: string[];
  genericAmenities: string[];
  sentenceImperatives: string[];
}

const config = blocklist as BlocklistConfig;

// Build phrase patterns once at module load (avoids recompiling on every call).
// Each pattern strips the blocklisted phrase plus an optional trailing connective.
const phrasePatterns: RegExp[] = config.phraseBlocklist.map(
  (phrase) => new RegExp(`${phrase}(?:\\s+(?:with|in|and))?`, 'gi'),
);

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countGenericAmenities(sentence: string, amenities: string[]): number {
  // Sort longer entries first to avoid sub-string double-counting.
  const sorted = [...amenities].sort((a, b) => b.length - a.length);
  let remaining = sentence.toLowerCase();
  let count = 0;
  for (const amenity of sorted) {
    const lc = amenity.toLowerCase();
    if (remaining.includes(lc)) {
      count++;
      remaining = remaining.replace(lc, '');
    }
  }
  return count;
}

function shouldDropSentence(sentence: string, cfg: BlocklistConfig): boolean {
  // Drop sentences that reference a surcharge as their only differentiator.
  if (sentence.includes('(surcharge)')) return true;

  // Drop sentences listing more than 3 generic amenities.
  if (countGenericAmenities(sentence, cfg.genericAmenities) > 3) return true;

  // Drop sentences that open with a second-person imperative.
  const trimmed = sentence.trimStart();
  for (const verb of cfg.sentenceImperatives) {
    if (new RegExp(`^${verb}\\b`).test(trimmed)) return true;
  }

  return false;
}

function truncateAtSentenceBoundary(text: string, maxLength: number): string {
  const sentences = splitSentences(text);
  let result = '';
  for (const sentence of sentences) {
    const next = result ? `${result} ${sentence}` : sentence;
    if (next.length > maxLength) break;
    result = next;
  }
  // Fall back to hard truncation only if no sentence fits at all.
  return result || text.slice(0, maxLength);
}

export function sanitizeOtaProse(input: string): string | null {
  let text = input.trim();

  // Phase 1: Strip blocklisted phrases (+ optional trailing connective).
  for (const pattern of phrasePatterns) {
    pattern.lastIndex = 0;
    text = text.replace(pattern, '');
  }
  text = text.replace(/\s{2,}/g, ' ').trim();

  // Phase 2: Drop filtered sentences.
  const sentences = splitSentences(text);
  const kept = sentences.filter((s) => !shouldDropSentence(s, config));
  text = kept.join(' ').trim();

  // Phase 3: Length validation.
  if (text.length < 60) return null;
  if (text.length > 280) text = truncateAtSentenceBoundary(text, 280);

  return text || null;
}
