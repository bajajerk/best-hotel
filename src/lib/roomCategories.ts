import type { RatePlan } from "@/lib/api";

export type RoomCategory = {
  name: string;
  plans: RatePlan[];
  cheapestPrice: number;
  cheapestRefundablePrice: number | null;
  variants: string[];
  currency: string;
};

// Bed-only patterns at the start of a room name — "King Room", "2 Twin Room",
// "Twin Bed Room" — collapse into a single "Classic" category at the bottom of
// the ladder.
const CLASSIC_PATTERN = /^(king|queen|double|2\s*twin|twin|2\s*single|single|standard)(\s*bed)?\s*room$/i;

function parseCategory(roomName: string): { category: string; variant: string } {
  const segments = roomName
    .split(/,\s*/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (segments.length === 0) return { category: "Room", variant: "" };

  const base = segments[0];
  const rest = segments.slice(1).join(" · ");

  if (CLASSIC_PATTERN.test(base)) {
    return { category: "Classic", variant: base };
  }
  return { category: base, variant: rest };
}

export function groupRatePlans(plans: RatePlan[]): RoomCategory[] {
  const map = new Map<string, RoomCategory>();

  for (const plan of plans) {
    const { category, variant } = parseCategory(plan.room_name);
    let entry = map.get(category);
    if (!entry) {
      entry = {
        name: category,
        plans: [],
        cheapestPrice: plan.total_price,
        cheapestRefundablePrice: plan.refundable ? plan.total_price : null,
        variants: [],
        currency: plan.currency || "INR",
      };
      map.set(category, entry);
    }
    entry.plans.push(plan);
    if (plan.total_price < entry.cheapestPrice) entry.cheapestPrice = plan.total_price;
    if (plan.refundable) {
      if (entry.cheapestRefundablePrice === null || plan.total_price < entry.cheapestRefundablePrice) {
        entry.cheapestRefundablePrice = plan.total_price;
      }
    }
    if (variant && !entry.variants.includes(variant)) entry.variants.push(variant);
  }

  return Array.from(map.values()).sort((a, b) => a.cheapestPrice - b.cheapestPrice);
}
