// ---------------------------------------------------------------------------
// "Why visit now" — editorial descriptions shown on hotel cards during the
// property's peak-relevance month. Keyed by hotel name (must match API data).
// ---------------------------------------------------------------------------

export type WhyVisitNowEntry = {
  month: number; // 1-based (1 = Jan, 12 = Dec)
  copy: string;
};

const WHY_VISIT_NOW: Record<string, WhyVisitNowEntry> = {
  "Taj Lake Palace": {
    month: 10,
    copy:
      "The lake is full after monsoon and the light turns gold\u2009—\u2009Udaipur\u2019s finest weeks. Members secure shoulder-season rates before winter crowds arrive.",
  },
  "The Leela Goa": {
    month: 12,
    copy:
      "Peak season opens with Goa\u2019s clearest skies and coolest evenings. Club members get guaranteed room allocation during the busiest fortnight.",
  },
  "Wildflower Hall": {
    month: 4,
    copy:
      "Himalayan trails reopen as rhododendrons bloom and the air stays crisp. Members book at pre-summer rates before family-season demand.",
  },
  "COMO Uma Ubud": {
    month: 8,
    copy:
      "Dry season means clear mornings over the rice terraces with no afternoon rain. Members receive a complimentary spa credit per stay.",
  },
  "Soneva Jani": {
    month: 11,
    copy:
      "The calm window between monsoons brings empty sandbars and glass-flat water. Members access a fourth-night-free rate not listed publicly.",
  },
};

/**
 * Returns the "Why visit now" copy for a hotel if the current month matches,
 * or null otherwise. Matches by substring so "Taj Lake Palace, Udaipur" still
 * hits the "Taj Lake Palace" key.
 */
export function getWhyVisitNow(hotelName: string): string | null {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-based

  for (const [key, entry] of Object.entries(WHY_VISIT_NOW)) {
    if (hotelName.includes(key) && entry.month === currentMonth) {
      return entry.copy;
    }
  }
  return null;
}

export default WHY_VISIT_NOW;
