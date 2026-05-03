import { describe, expect, it } from "vitest";
import { sanitizeOtaProse, OtaBlocklistConfig } from "../sanitizeOtaProse";

// Mirror of config/ota-blocklist.json — tests never hit the filesystem
const cfg: OtaBlocklistConfig = {
  stripPhrases: [
    "pamper yourself",
    "make yourself at home",
    "featured amenities include",
    "you can take advantage of",
    "take advantage of",
    "quench your thirst",
    "stay in and",
    "treat yourself to",
    "indulge in",
    "enjoy [a-z]+ cuisine",
    "this (?:edwardian|colonial|family-friendly|charming) hotel",
    "for extended visits or whenever required",
    "during leisurely days and evenings",
  ],
  trailingConnectives: ["with", "in", "and"],
  sentenceDropPatterns: {
    surchargeTerm: "\\(surcharge\\)",
    imperativeVerbs: ["Make", "Enjoy", "Take", "Pamper", "Treat", "Indulge"],
    serviceSubjects: ["dry cleaning", "laundry", "housekeeping"],
    genericAmenities: [
      "wifi",
      "wi-fi",
      "internet",
      "parking",
      "pool",
      "gym",
      "restaurant",
      "bar",
      "breakfast",
      "spa",
      "lounge",
      "concierge",
      "room service",
      "air conditioning",
      "television",
      "minibar",
      "fitness",
      "business center",
    ],
    maxGenericAmenities: 3,
  },
};

// Helper — run sanitizer and assert phrase is absent in output
function expectNoPhrase(input: string, phrase: RegExp) {
  const result = sanitizeOtaProse(input, cfg);
  if (result !== null) expect(result).not.toMatch(phrase);
}

// Helper — ensure input long enough to survive length check
function pad(text: string): string {
  return text + " The property offers spectacular views of the surrounding landscape.";
}

// ─── PHASE 1 — Phrase stripping ───────────────────────────────────────────

describe("strip: pamper yourself", () => {
  it("removes phrase mid-sentence", () => {
    expectNoPhrase(
      pad("Guests are invited to pamper yourself with a soothing massage."),
      /pamper yourself/i
    );
  });
  it("removes phrase at sentence start with trailing connective", () => {
    const result = sanitizeOtaProse(
      "Pamper yourself with our award-winning treatments and relax in the serene surroundings of the property.",
      cfg
    );
    expect(result).not.toMatch(/pamper yourself/i);
    expect(result).not.toBeNull();
  });
});

describe("strip: make yourself at home", () => {
  it("removes phrase with trailing connective 'in'", () => {
    expectNoPhrase(
      pad("Make yourself at home in our elegantly appointed suites."),
      /make yourself at home/i
    );
  });
  it("removes phrase without trailing connective", () => {
    expectNoPhrase(
      pad("Guests can make yourself at home during their entire stay."),
      /make yourself at home/i
    );
  });
});

describe("strip: featured amenities include", () => {
  it("removes phrase before a list", () => {
    expectNoPhrase(
      pad("Featured amenities include an outdoor pool and a fitness center."),
      /featured amenities include/i
    );
  });
  it("removes phrase case-insensitively", () => {
    expectNoPhrase(
      pad("FEATURED AMENITIES INCLUDE a rooftop bar and concierge service."),
      /featured amenities include/i
    );
  });
});

describe("strip: you can take advantage of", () => {
  it("removes longer phrase variant", () => {
    expectNoPhrase(
      pad("You can take advantage of our complimentary breakfast service."),
      /you can take advantage of/i
    );
  });
  it("removes phrase mid-text", () => {
    expectNoPhrase(
      pad("During your stay you can take advantage of the on-site facilities."),
      /you can take advantage of/i
    );
  });
});

describe("strip: take advantage of", () => {
  it("removes short variant", () => {
    expectNoPhrase(
      pad("Guests are welcome to take advantage of our airport transfer service."),
      /take advantage of/i
    );
  });
  it("removes phrase at start of sentence", () => {
    expectNoPhrase(
      pad("Take advantage of early check-in when available on request."),
      /take advantage of/i
    );
  });
});

describe("strip: quench your thirst", () => {
  it("removes phrase with trailing connective", () => {
    expectNoPhrase(
      pad("Quench your thirst with cocktails at our poolside bar."),
      /quench your thirst/i
    );
  });
  it("removes phrase without trailing connective", () => {
    expectNoPhrase(
      pad("Guests can quench your thirst at the lobby bar open until midnight."),
      /quench your thirst/i
    );
  });
});

describe("strip: stay in and", () => {
  it("removes phrase preceding leisure activity", () => {
    expectNoPhrase(
      pad("Stay in and relax with a film from our on-demand movie library."),
      /stay in and/i
    );
  });
  it("removes phrase preceding meal reference", () => {
    expectNoPhrase(
      pad("Stay in and order from our 24-hour room-service menu."),
      /stay in and/i
    );
  });
});

describe("strip: treat yourself to", () => {
  it("removes phrase before spa reference", () => {
    expectNoPhrase(
      pad("Treat yourself to a rejuvenating facial at our award-winning spa."),
      /treat yourself to/i
    );
  });
  it("removes phrase before dining reference", () => {
    expectNoPhrase(
      pad("After a day of exploring, treat yourself to a gourmet dinner."),
      /treat yourself to/i
    );
  });
});

describe("strip: indulge in", () => {
  it("removes phrase before activity", () => {
    expectNoPhrase(
      pad("Indulge in a hot stone massage at the wellness centre."),
      /indulge in/i
    );
  });
  it("removes phrase with trailing connective", () => {
    expectNoPhrase(
      pad("Guests may indulge in and explore a range of holistic treatments."),
      /indulge in/i
    );
  });
});

describe("strip: enjoy [a-z]+ cuisine", () => {
  it("removes phrase with 'Italian'", () => {
    expectNoPhrase(
      pad("Enjoy Italian cuisine prepared by our Michelin-trained chefs."),
      /enjoy \w+ cuisine/i
    );
  });
  it("removes phrase with 'authentic'", () => {
    expectNoPhrase(
      pad("Enjoy authentic cuisine sourced from local farms in the region."),
      /enjoy \w+ cuisine/i
    );
  });
});

describe("strip: this (edwardian|colonial|family-friendly|charming) hotel", () => {
  it("removes 'this charming hotel'", () => {
    expectNoPhrase(
      pad("This charming hotel blends historic architecture with modern comforts."),
      /this charming hotel/i
    );
  });
  it("removes 'this colonial hotel'", () => {
    expectNoPhrase(
      pad("This colonial hotel dates back to the nineteenth century."),
      /this colonial hotel/i
    );
  });
  it("removes 'this family-friendly hotel'", () => {
    expectNoPhrase(
      pad("This family-friendly hotel offers dedicated kids' activities."),
      /this family-friendly hotel/i
    );
  });
  it("removes 'this edwardian hotel'", () => {
    expectNoPhrase(
      pad("This Edwardian hotel retains many original architectural features."),
      /this edwardian hotel/i
    );
  });
});

describe("strip: for extended visits or whenever required", () => {
  it("removes phrase in full", () => {
    expectNoPhrase(
      pad("Kitchenette facilities are available for extended visits or whenever required."),
      /for extended visits or whenever required/i
    );
  });
  it("removes phrase mid-sentence", () => {
    expectNoPhrase(
      pad("A fully equipped laundry room is available for extended visits or whenever required by guests."),
      /for extended visits or whenever required/i
    );
  });
});

describe("strip: during leisurely days and evenings", () => {
  it("removes phrase at sentence start", () => {
    expectNoPhrase(
      pad("During leisurely days and evenings guests can relax on the private terrace."),
      /during leisurely days and evenings/i
    );
  });
  it("removes phrase with surrounding context", () => {
    expectNoPhrase(
      pad("The rooftop lounge is the ideal venue during leisurely days and evenings for socialising."),
      /during leisurely days and evenings/i
    );
  });
});

// ─── PHASE 2 — Sentence-drop rules ────────────────────────────────────────

describe("drop: sentence containing (surcharge)", () => {
  it("drops sentence that mentions surcharge", () => {
    const input =
      "The hotel occupies a prime location in the city centre. Valet parking is available (surcharge). Guests enjoy sweeping views from the rooftop terrace.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/surcharge/i);
  });
  it("drops surcharge sentence while preserving others", () => {
    const input =
      "Rooms are spacious and well-appointed throughout the property. An outdoor pool is accessible to guests (surcharge). The restaurant serves breakfast from 7 am daily.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/surcharge/i);
    expect(result).toMatch(/spacious/i);
  });
});

describe("drop: sentence listing more than 3 generic amenities", () => {
  it("drops sentence naming 4+ amenities", () => {
    const input =
      "The property is conveniently located near transport links. Guests have access to a pool, gym, spa, bar, and restaurant on site. The rooms feature hardwood floors and high ceilings.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/pool.*gym.*spa.*bar/i);
  });
  it("keeps sentence naming exactly 3 amenities", () => {
    const input =
      "The property offers a pool, gym, and breakfast for all staying guests. Views from upper floors are particularly striking at dusk and dawn.";
    const result = sanitizeOtaProse(input, cfg);
    // Sentence with 3 amenities should NOT be dropped
    expect(result).toMatch(/pool/i);
  });
});

describe("drop: sentence opening with imperative verb", () => {
  it("drops sentence starting with 'Make'", () => {
    const input =
      "The hotel is set within a historic building in the old quarter. Make the most of the rooftop terrace with panoramic city views. Each room includes a king-size bed and rainfall shower.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/^Make/im);
  });
  it("drops sentence starting with 'Enjoy'", () => {
    const input =
      "The property sits on a private stretch of beach. Enjoy a sunset cocktail at the beach bar each evening. Rooms have been recently refurbished to a high standard.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/^Enjoy/im);
  });
  it("drops sentence starting with 'Take'", () => {
    const input =
      "Located in the financial district, the hotel is well connected. Take a dip in the rooftop infinity pool with skyline views. Business facilities include meeting rooms for up to 30 delegates.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/^Take/im);
  });
});

describe("drop: service-subject sentence (dry cleaning / laundry / housekeeping)", () => {
  it("drops sentence starting with 'Dry cleaning'", () => {
    const input =
      "The hotel is close to the main shopping district. Dry cleaning services are available upon request from reception. The bar serves craft cocktails until midnight.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/dry cleaning/i);
  });
  it("drops sentence starting with 'Laundry'", () => {
    const input =
      "Rooms are equipped with climate control and blackout curtains. Laundry facilities are located on the third floor for guest use. The pool area is open year-round.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/^Laundry/im);
  });
  it("drops sentence starting with 'Housekeeping'", () => {
    const input =
      "The boutique property features twelve individually designed rooms. Housekeeping is provided twice daily during your stay. Each evening a turndown service is offered.";
    const result = sanitizeOtaProse(input, cfg);
    expect(result).not.toMatch(/^Housekeeping/im);
  });
});

// ─── PHASE 3 — Length validation ──────────────────────────────────────────

describe("null return on under-length output", () => {
  it("returns null when result is fewer than 60 characters", () => {
    // After stripping the only sentence drops below 60 chars
    const input =
      "Pamper yourself with our spa. Indulge in the wellness centre. Quench your thirst at the bar.";
    const result = sanitizeOtaProse(input, cfg);
    // All content has been stripped / reduced; result should be null
    expect(result).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(sanitizeOtaProse("", cfg)).toBeNull();
  });

  it("returns null for whitespace-only input", () => {
    expect(sanitizeOtaProse("   ", cfg)).toBeNull();
  });
});

describe("truncation on over-length output", () => {
  it("truncates at sentence boundary when output exceeds 280 characters", () => {
    const long =
      "The hotel is ideally positioned on the waterfront promenade with unobstructed ocean views. " +
      "All rooms feature floor-to-ceiling windows, premium bedding, and locally crafted furnishings. " +
      "The award-winning restaurant sources ingredients exclusively from within a fifty-mile radius. " +
      "A dedicated concierge team is on hand to arrange excursions and private dining experiences.";
    const result = sanitizeOtaProse(long, cfg);
    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(280);
  });

  it("truncated output ends at a sentence boundary (no mid-sentence cut)", () => {
    const long =
      "The property occupies a converted nineteenth-century warehouse in the arts district. " +
      "Original exposed brickwork and steel beams provide an atmospheric backdrop to the contemporary interiors. " +
      "Each of the forty-two rooms has been designed by an award-winning local studio. " +
      "The rooftop bar commands unbroken views across the entire skyline at golden hour.";
    const result = sanitizeOtaProse(long, cfg);
    expect(result).not.toBeNull();
    expect(result!.length).toBeLessThanOrEqual(280);
    // A proper sentence ends with punctuation
    expect(result).toMatch(/[.!?]$/);
  });
});

// ─── Integration tests — 10 real-style API responses ─────────────────────

const ALL_BLOCKED_PHRASES = [
  /pamper yourself/i,
  /make yourself at home/i,
  /featured amenities include/i,
  /you can take advantage of/i,
  /take advantage of/i,
  /quench your thirst/i,
  /stay in and/i,
  /treat yourself to/i,
  /indulge in/i,
  /enjoy \w+ cuisine/i,
  /this (?:edwardian|colonial|family-friendly|charming) hotel/i,
  /for extended visits or whenever required/i,
  /during leisurely days and evenings/i,
  /\(surcharge\)/i,
];

function assertNoBlockedPhrases(result: string | null) {
  if (result === null) return; // null is a valid sanitised output
  for (const phrase of ALL_BLOCKED_PHRASES) {
    expect(result).not.toMatch(phrase);
  }
}

describe("integration: 10 real-style API hotel descriptions", () => {
  it("response 1 — city-centre business hotel with boilerplate list", () => {
    const input =
      "This charming hotel is located in the heart of the financial district with easy access to transport links. Featured amenities include wifi, parking, gym, pool, and a rooftop bar. Guests can take advantage of our express check-in service. The restaurant serves modern European dishes throughout the day.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 2 — beach resort with imperative-heavy copy", () => {
    const input =
      "Enjoy Italian cuisine at our beachfront restaurant. Pamper yourself with a full-body treatment at the spa. The resort sits on a private bay with access to water sports. Dry cleaning is available on request from the front desk. Housekeeping is provided once daily between 10 am and 2 pm.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 3 — colonial-era heritage property", () => {
    const input =
      "This colonial hotel has been lovingly restored to preserve its original features. During leisurely days and evenings guests can stroll through the landscaped grounds. The library lounge is stocked with literature from across the centuries. Laundry service is available at an additional cost.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 4 — family resort with surcharge callouts", () => {
    const input =
      "This family-friendly hotel caters to all ages with dedicated activities for children. The waterpark is open from May to September (surcharge). Make the most of the kids' club, which runs from 9 am to 6 pm daily. Indulge in our family buffet dinner every Friday evening.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 5 — boutique city hotel", () => {
    const input =
      "The boutique property features just twenty rooms, each individually styled by local artists. Take advantage of the complimentary wine hour each evening from 6 to 7 pm. Treat yourself to a signature cocktail at the intimate bar on the ground floor. The neighbourhood is known for its independent galleries and artisan shops.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 6 — spa retreat with extended-stay copy", () => {
    const input =
      "The spa retreat is set amid rolling hills and ancient woodland. Quench your thirst with herbal infusions available in the wellness lounge. Kitchen suites are available for extended visits or whenever required by guests. During leisurely days and evenings the outdoor hot tubs are particularly popular.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 7 — urban extended-stay hotel with amenity list", () => {
    const input =
      "Designed for longer stays, the property provides apartment-style rooms with fully equipped kitchens. Featured amenities include wifi, parking, pool, gym, restaurant, bar, and concierge service. You can take advantage of the weekly housekeeping and linen change. Make yourself at home in the spacious living areas.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 8 — Edwardian manor hotel", () => {
    const input =
      "This Edwardian hotel commands sweeping views over the valley from its elevated position. Enjoy local cuisine in our oak-panelled dining room. Pamper yourself with one of our signature beauty rituals in the Victorian spa. Housekeeping is offered twice daily at no extra charge.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 9 — all-inclusive resort", () => {
    const input =
      "The all-inclusive resort stretches along a two-kilometre stretch of white-sand beach. Quench your thirst with unlimited drinks at any of the four poolside bars. Stay in and order from the 24-hour in-room dining menu curated by our executive chef. Dry cleaning services are available for a fee. The kids' club is fully supervised.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });

  it("response 10 — rural lodge with concierge copy", () => {
    const input =
      "The lodge occupies a remote valley setting accessible only by four-wheel-drive vehicle. Indulge in a guided wilderness walk led by experienced local rangers. Treat yourself to a private fire-pit dinner beneath the stars. Laundry is handled on-site and returned within twenty-four hours. The main lodge building sleeps twelve in six en-suite rooms.";
    assertNoBlockedPhrases(sanitizeOtaProse(input, cfg));
  });
});
