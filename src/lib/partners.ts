// ---------------------------------------------------------------------------
// Preferred Partners — dynamic, data-driven partner directory
// ---------------------------------------------------------------------------

export type PartnerType = "Alliance" | "Brand" | "Property";

export interface Partner {
  name: string;
  type: PartnerType;
  logo_url: string;
  website_url: string;
  location?: string; // City, Country — only for properties
  priority_rank: number;
  is_active: boolean;
  has_perks: boolean;
}

// ---------------------------------------------------------------------------
// Partner entries — add / remove / reorder here to update the directory
// ---------------------------------------------------------------------------

export const PARTNERS: Partner[] = [
  // ── Alliances / Programs ──────────────────────────────────────────────
  {
    name: "Virtuoso",
    type: "Alliance",
    logo_url: "https://logo.clearbit.com/virtuoso.com",
    website_url: "https://www.virtuoso.com",
    priority_rank: 1,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Preferred Hotels & Resorts",
    type: "Alliance",
    logo_url: "https://logo.clearbit.com/preferredhotels.com",
    website_url: "https://www.preferredhotels.com",
    priority_rank: 2,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Leading Hotels of the World",
    type: "Alliance",
    logo_url: "https://logo.clearbit.com/lhw.com",
    website_url: "https://www.lhw.com",
    priority_rank: 3,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Small Luxury Hotels (SLH)",
    type: "Alliance",
    logo_url: "https://logo.clearbit.com/slh.com",
    website_url: "https://www.slh.com",
    priority_rank: 4,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Relais & Châteaux",
    type: "Alliance",
    logo_url: "https://logo.clearbit.com/relaischateaux.com",
    website_url: "https://www.relaischateaux.com",
    priority_rank: 5,
    is_active: true,
    has_perks: false,
  },
  {
    name: "GHA Discovery",
    type: "Alliance",
    logo_url: "https://logo.clearbit.com/gha.com",
    website_url: "https://www.gha.com",
    priority_rank: 6,
    is_active: true,
    has_perks: false,
  },

  // ── Hotel Brands / Groups ─────────────────────────────────────────────
  {
    name: "Four Seasons",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/fourseasons.com",
    website_url: "https://www.fourseasons.com",
    priority_rank: 1,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Mandarin Oriental",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/mandarinoriental.com",
    website_url: "https://www.mandarinoriental.com",
    priority_rank: 2,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Aman Resorts",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/aman.com",
    website_url: "https://www.aman.com",
    priority_rank: 3,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Rosewood Hotels",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/rosewoodhotels.com",
    website_url: "https://www.rosewoodhotels.com",
    priority_rank: 4,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Taj Hotels",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/tajhotels.com",
    website_url: "https://www.tajhotels.com",
    priority_rank: 5,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Marriott Bonvoy",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/marriott.com",
    website_url: "https://www.marriott.com",
    priority_rank: 6,
    is_active: true,
    has_perks: false,
  },
  {
    name: "Hilton Hotels",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/hilton.com",
    website_url: "https://www.hilton.com",
    priority_rank: 7,
    is_active: true,
    has_perks: false,
  },
  {
    name: "Hyatt Hotels",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/hyatt.com",
    website_url: "https://www.hyatt.com",
    priority_rank: 8,
    is_active: true,
    has_perks: false,
  },
  {
    name: "IHG Hotels",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/ihg.com",
    website_url: "https://www.ihg.com",
    priority_rank: 9,
    is_active: true,
    has_perks: false,
  },
  {
    name: "Accor",
    type: "Brand",
    logo_url: "https://logo.clearbit.com/accor.com",
    website_url: "https://www.accor.com",
    priority_rank: 10,
    is_active: true,
    has_perks: false,
  },

  // ── Iconic Properties ─────────────────────────────────────────────────
  {
    name: "The Ritz Paris",
    type: "Property",
    logo_url: "https://logo.clearbit.com/ritzparis.com",
    website_url: "https://www.ritzparis.com",
    location: "Paris, France",
    priority_rank: 1,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Claridge's",
    type: "Property",
    logo_url: "https://logo.clearbit.com/claridges.co.uk",
    website_url: "https://www.claridges.co.uk",
    location: "London, United Kingdom",
    priority_rank: 2,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Burj Al Arab",
    type: "Property",
    logo_url: "https://logo.clearbit.com/jumeirah.com",
    website_url: "https://www.jumeirah.com/burj-al-arab",
    location: "Dubai, UAE",
    priority_rank: 3,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Aman Tokyo",
    type: "Property",
    logo_url: "https://logo.clearbit.com/aman.com",
    website_url: "https://www.aman.com/hotels/aman-tokyo",
    location: "Tokyo, Japan",
    priority_rank: 4,
    is_active: true,
    has_perks: true,
  },
  {
    name: "The Peninsula Hong Kong",
    type: "Property",
    logo_url: "https://logo.clearbit.com/peninsula.com",
    website_url: "https://www.peninsula.com/hong-kong",
    location: "Hong Kong, China",
    priority_rank: 5,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Raffles Singapore",
    type: "Property",
    logo_url: "https://logo.clearbit.com/raffles.com",
    website_url: "https://www.raffles.com/singapore",
    location: "Singapore",
    priority_rank: 6,
    is_active: true,
    has_perks: true,
  },
  {
    name: "Soneva Fushi",
    type: "Property",
    logo_url: "https://logo.clearbit.com/soneva.com",
    website_url: "https://www.soneva.com/soneva-fushi",
    location: "Maldives",
    priority_rank: 7,
    is_active: true,
    has_perks: false,
  },
  {
    name: "Belmond Hotel Caruso",
    type: "Property",
    logo_url: "https://logo.clearbit.com/belmond.com",
    website_url: "https://www.belmond.com/hotel-caruso-amalfi-coast",
    location: "Amalfi Coast, Italy",
    priority_rank: 8,
    is_active: true,
    has_perks: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns only active partners, sorted by priority_rank */
export function getActivePartners(): Partner[] {
  return PARTNERS.filter((p) => p.is_active).sort(
    (a, b) => a.priority_rank - b.priority_rank,
  );
}

/** Returns active partners grouped by type */
export function getPartnersByType(): Record<PartnerType, Partner[]> {
  const active = getActivePartners();
  return {
    Alliance: active.filter((p) => p.type === "Alliance"),
    Brand: active.filter((p) => p.type === "Brand"),
    Property: active.filter((p) => p.type === "Property"),
  };
}
