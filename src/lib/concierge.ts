// Voyagr Club concierge contact helpers.
// Single source of truth for the WhatsApp number used across the site so
// city/hotel/CTA pages stay consistent if the number ever changes.

const RAW = (process.env.NEXT_PUBLIC_CONCIERGE_WHATSAPP || "919833534627").replace(/[^0-9]/g, "");

export const CONCIERGE_WHATSAPP_NUMBER = RAW;                  // "919833534627" — for wa.me/<this>
export const CONCIERGE_PHONE_E164 = `+${RAW}`;                  // "+919833534627" — for tel: links

export function conciergeWhatsappLink(message?: string): string {
  const base = `https://wa.me/${RAW}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}
