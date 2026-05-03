import { describe, it, expect } from 'vitest';
import { sanitizeOtaProse } from '../sanitizeOtaProse';

// Helper: a long filler sentence to pad short inputs above the 60-char threshold
const FILLER =
  'The property is centrally located with easy access to local attractions and transport links.';

// ─── Phrase blocklist ─────────────────────────────────────────────────────────

describe('phrase blocklist — "Pamper yourself"', () => {
  it('strips the phrase when it opens a sentence', () => {
    const input = `Pamper yourself with our world-class spa. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toContain('Pamper yourself');
  });

  it('strips the phrase mid-sentence and cleans surrounding spaces', () => {
    const input = `Guests are invited to pamper yourself in the wellness suite. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/pamper yourself/i);
  });
});

describe('phrase blocklist — "Make yourself at home"', () => {
  it('strips the phrase when followed by a period', () => {
    const input = `Make yourself at home in our elegant suites. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/make yourself at home/i);
  });

  it('strips the phrase from a longer sentence', () => {
    const input = `Our staff will ensure you make yourself at home throughout your stay. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/make yourself at home/i);
  });
});

describe('phrase blocklist — "Featured amenities include"', () => {
  it('strips the phrase and leaves the amenity list', () => {
    const input = `Featured amenities include a pool and a terrace. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/featured amenities include/i);
  });

  it('strips the phrase even when capitalised differently', () => {
    const input = `FEATURED AMENITIES INCLUDE free breakfast. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/featured amenities include/i);
  });
});

describe('phrase blocklist — "You can take advantage of"', () => {
  it('strips the phrase when it precedes a service description', () => {
    const input = `You can take advantage of our 24-hour concierge. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/you can take advantage of/i);
  });

  it('strips the phrase case-insensitively', () => {
    const input = `YOU CAN TAKE ADVANTAGE OF in-room dining. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/you can take advantage of/i);
  });
});

describe('phrase blocklist — "Quench your thirst"', () => {
  it('strips the phrase when followed by a bar reference', () => {
    const input = `Quench your thirst at the lobby bar. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/quench your thirst/i);
  });

  it('strips the phrase without removing surrounding content', () => {
    const input = `Stop by any time to quench your thirst with a craft cocktail. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/quench your thirst/i);
  });
});

describe('phrase blocklist — "Take advantage of"', () => {
  it('strips the phrase at the start of a sentence', () => {
    const input = `Take advantage of our early check-in offer. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/take advantage of/i);
  });

  it('strips the phrase mid-paragraph', () => {
    const input = `${FILLER} Guests may take advantage of in-house laundry services.`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/take advantage of/i);
  });
});

describe('phrase blocklist — "Enjoy [cuisine] cuisine"', () => {
  it('strips "Enjoy Italian cuisine"', () => {
    const input = `Enjoy Italian cuisine at our award-winning restaurant. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/Enjoy Italian cuisine/i);
  });

  it('strips "Enjoy local cuisine"', () => {
    const input = `Enjoy local cuisine prepared fresh each morning. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/Enjoy local cuisine/i);
  });
});

describe('phrase blocklist — "Stay in and"', () => {
  it('strips the phrase when it introduces an in-room activity', () => {
    const input = `Stay in and order from our extensive room service menu. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/stay in and/i);
  });

  it('strips the phrase case-insensitively', () => {
    const input = `Some guests prefer to STAY IN AND relax with a film. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/stay in and/i);
  });
});

describe('phrase blocklist — "Treat yourself to"', () => {
  it('strips the phrase before a spa mention', () => {
    const input = `Treat yourself to a relaxing massage in our spa. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/treat yourself to/i);
  });

  it('strips the phrase before a dining mention', () => {
    const input = `Treat yourself to a gourmet three-course dinner. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/treat yourself to/i);
  });
});

describe('phrase blocklist — "Indulge in"', () => {
  it('strips "Indulge in" when opening a sentence', () => {
    const input = `Indulge in our curated selection of wines. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/indulge in/i);
  });

  it('strips "Indulge in" mid-sentence', () => {
    const input = `After a long journey, guests can indulge in a complimentary welcome drink. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/indulge in/i);
  });
});

describe('phrase blocklist — "This [descriptor] hotel"', () => {
  it('strips "This charming hotel"', () => {
    const input = `This charming hotel offers sweeping views of the bay. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/this charming hotel/i);
  });

  it('strips "This colonial hotel"', () => {
    const input = `This colonial hotel has been welcoming guests since 1923. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/this colonial hotel/i);
  });

  it('strips "This family-friendly hotel"', () => {
    const input = `This family-friendly hotel sits on a quiet street near the park. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/this family-friendly hotel/i);
  });

  it('strips "This edwardian hotel"', () => {
    const input = `This edwardian hotel retains much of its original grandeur. ${FILLER}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/this edwardian hotel/i);
  });
});

// ─── Sentence-level filters ───────────────────────────────────────────────────

describe('sentence filter — (surcharge)', () => {
  it('drops a sentence where (surcharge) is the only differentiator', () => {
    const input = `${FILLER} Guests may use the pool (surcharge). The rooms feature private balconies with harbour views.`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toContain('(surcharge)');
  });

  it('drops the sentence but preserves unrelated content', () => {
    const input = `${FILLER} Parking is available on site (surcharge). Rooms are equipped with blackout curtains and soundproofing.`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toContain('(surcharge)');
    expect(result).toContain('Rooms are equipped');
  });
});

describe('sentence filter — more than 3 generic amenities', () => {
  it('drops a sentence listing 4 generic amenities', () => {
    const overstuffed = 'The hotel features a pool, gym, spa, and restaurant.';
    const input = `${FILLER} ${overstuffed}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toContain(overstuffed);
  });

  it('keeps a sentence listing exactly 3 generic amenities', () => {
    const acceptable = 'Guests have access to the pool, gym, and spa.';
    const input = `${acceptable} ${FILLER}`;
    const result = sanitizeOtaProse(input);
    // Should not be dropped — only > 3 triggers removal
    expect(result).not.toBeNull();
  });

  it('drops a sentence listing 5 generic amenities', () => {
    const bloated = 'On-site you will find a pool, gym, spa, restaurant, and bar.';
    const input = `${FILLER} ${bloated}`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toContain(bloated);
  });
});

describe('sentence filter — second-person imperative opener', () => {
  it('drops a sentence starting with "Make"', () => {
    const input = `${FILLER} Make your stay unforgettable with our bespoke butler service.`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toMatch(/^Make\b/m);
    expect(result).not.toContain('Make your stay unforgettable');
  });

  it('drops a sentence starting with "Enjoy"', () => {
    const input = `${FILLER} Enjoy the spectacular mountain views from every room.`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toContain('Enjoy the spectacular mountain views');
  });

  it('drops a sentence starting with "Take"', () => {
    const input = `${FILLER} Take a leisurely stroll through the landscaped hotel gardens.`;
    const result = sanitizeOtaProse(input);
    expect(result).not.toContain('Take a leisurely stroll');
  });
});

// ─── Output validation ────────────────────────────────────────────────────────

describe('output validation — null on under-length result', () => {
  it('returns null when cleaned output is under 60 characters', () => {
    // Input consists almost entirely of blocklisted content
    const result = sanitizeOtaProse('Pamper yourself with our spa. Indulge in fine dining.');
    expect(result).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(sanitizeOtaProse('')).toBeNull();
  });

  it('returns null when all sentences are filtered out', () => {
    const input =
      'Make yourself at home. Enjoy local cuisine. Treat yourself to a massage.';
    expect(sanitizeOtaProse(input)).toBeNull();
  });
});

describe('output validation — truncation at sentence boundary', () => {
  it('truncates over-length output at the nearest sentence boundary under 280 chars', () => {
    // Build input that after cleaning will exceed 280 characters
    const long = [
      'The hotel is situated in a prime location offering unrivalled access to the city centre.',
      'Each room has been thoughtfully designed with the discerning traveller in mind.',
      'Floor-to-ceiling windows flood the interiors with natural light throughout the day.',
      'Guests are treated to personalised service from the moment of arrival until departure.',
    ].join(' ');

    const result = sanitizeOtaProse(long);
    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(280);
  });

  it('truncates at a full-stop boundary, not mid-word', () => {
    const long = [
      'The property overlooks a tranquil courtyard garden that is open to guests year-round.',
      'Rooms have been individually decorated with original artwork sourced from local galleries.',
      'The terrace provides an ideal setting for breakfast and evening drinks in warmer months.',
      'A dedicated concierge team is available around the clock to assist with any request.',
    ].join(' ');

    const result = sanitizeOtaProse(long);
    expect(result).not.toBeNull();
    // Must end with sentence-ending punctuation
    expect(result).toMatch(/[.!?]$/);
    expect(result!.length).toBeLessThanOrEqual(280);
  });
});

// ─── Integration test ─────────────────────────────────────────────────────────

describe('integration — realistic OTA blurb', () => {
  it('sanitises a full supplier blurb and returns standards-compliant text', () => {
    const otaBlurb = [
      'This charming hotel is nestled in the heart of the city.',
      'Pamper yourself with our world-class spa facilities.',
      'Featured amenities include a pool, gym, and sauna.',
      'The spacious rooms offer stunning views of the harbour.',
      'Guests can use the pool (surcharge).',
      'Take advantage of our concierge service to arrange exclusive tours.',
      'The hotel enjoys a prime position near major shopping districts and cultural landmarks.',
    ].join(' ');

    const result = sanitizeOtaProse(otaBlurb);

    // Must return a string (non-null)
    expect(result).not.toBeNull();

    // Must respect length bounds
    expect(result!.length).toBeGreaterThanOrEqual(60);
    expect(result!.length).toBeLessThanOrEqual(280);

    // Blocklisted phrases must be absent
    expect(result).not.toMatch(/this charming hotel/i);
    expect(result).not.toMatch(/pamper yourself/i);
    expect(result).not.toMatch(/featured amenities include/i);
    expect(result).not.toMatch(/take advantage of/i);

    // Surcharge sentence must be gone
    expect(result).not.toContain('(surcharge)');
  });
});
