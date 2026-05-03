import blocklist from "../../config/ota-blocklist.json";

export interface OtaBlocklistConfig {
  stripPhrases: string[];
  trailingConnectives: string[];
  sentenceDropPatterns: {
    surchargeTerm: string;
    imperativeVerbs: string[];
    serviceSubjects: string[];
    genericAmenities: string[];
    maxGenericAmenities: number;
  };
}

export function loadBlocklist(): OtaBlocklistConfig {
  return blocklist as OtaBlocklistConfig;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Splits on sentence-ending punctuation followed by whitespace + capital/quote
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function applyPhraseStripping(
  text: string,
  phrases: string[],
  connectives: string[]
): string {
  let result = text;
  // Escape only the connectives (literals); phrases are stored as regex patterns
  const connPat = connectives.map(escapeRegex).join("|");

  for (const phrase of phrases) {
    const pattern = new RegExp(
      `\\b${phrase}(?:\\s+(?:${connPat})(?=\\s|$|[^a-zA-Z]))?`,
      "gi"
    );
    result = result.replace(pattern, "");
  }

  return result
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

function shouldDropSentence(
  sentence: string,
  patterns: OtaBlocklistConfig["sentenceDropPatterns"]
): boolean {
  const s = sentence.trim();

  // Contains "(surcharge)"
  if (new RegExp(patterns.surchargeTerm, "i").test(s)) return true;

  // Lists more than N generic amenities
  const amenityHits = patterns.genericAmenities.filter((amenity) =>
    new RegExp(`\\b${escapeRegex(amenity)}\\b`, "i").test(s)
  );
  if (amenityHits.length > patterns.maxGenericAmenities) return true;

  // Opens with an imperative verb
  const imperativeRe = new RegExp(
    `^(?:${patterns.imperativeVerbs.map(escapeRegex).join("|")})\\b`,
    "i"
  );
  if (imperativeRe.test(s)) return true;

  // Dry cleaning / laundry / housekeeping as primary subject (sentence opener,
  // optionally preceded by a/an/the)
  const serviceRe = new RegExp(
    `^(?:a |an |the )?(?:${patterns.serviceSubjects
      .map((t) => t.replace(/\s+/g, "\\s+"))
      .join("|")})\\b`,
    "i"
  );
  if (serviceRe.test(s)) return true;

  return false;
}

function truncateAtSentenceBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const sentences = splitIntoSentences(text);
  let result = "";

  for (const sentence of sentences) {
    const candidate = result.length > 0 ? `${result} ${sentence}` : sentence;
    if (candidate.length > maxLength) break;
    result = candidate;
  }

  // Fallback: hard-truncate at char boundary if no complete sentence fits
  return result.length > 0 ? result : text.slice(0, maxLength).trimEnd();
}

export function sanitizeOtaProse(
  input: string,
  config?: OtaBlocklistConfig
): string | null {
  if (!input || !input.trim()) return null;

  const cfg = config ?? loadBlocklist();

  // Phase 1: Strip blocklisted phrases (with trailing connective removal)
  let text = applyPhraseStripping(
    input,
    cfg.stripPhrases,
    cfg.trailingConnectives
  );

  // Phase 2: Drop disqualified sentences
  const sentences = splitIntoSentences(text);
  const kept = sentences.filter(
    (s) => !shouldDropSentence(s, cfg.sentenceDropPatterns)
  );
  text = kept.join(" ").trim();

  // Phase 3: Validate length
  if (text.length < 60) return null;
  if (text.length > 280) text = truncateAtSentenceBoundary(text, 280);

  return text || null;
}
