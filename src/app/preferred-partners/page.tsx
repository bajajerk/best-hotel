"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trackCtaClicked } from "@/lib/analytics";
import {
  PREFERRED_PARTNERS,
  getPartnersByType,
  type PreferredPartner,
} from "@/lib/preferredPartners";
import posthog from "posthog-js";

// ── Editorial-luxe palette ────────────────────────────────────────────────
const TEXT_PRIMARY = "var(--luxe-soft-white)";
const TEXT_MUTED = "rgba(247, 245, 242, 0.65)";
const TEXT_SOFT = "rgba(247, 245, 242, 0.45)";
const GOLD = "var(--luxe-champagne)";
const HAIRLINE = "var(--luxe-hairline, rgba(255,255,255,0.08))";

// ── Editorial copy for each partner ──────────────────────────────────────
// One-line, factual, editorial. Falls back to a generic line when a partner
// isn't in this table — keeps the page robust if `preferredPartners.ts` grows.
const PARTNER_BLURBS: Record<string, string> = {
  // Alliances & programs
  "Virtuoso":
    "The travel-advisor consortium behind most members-only hotel perks.",
  "Marriott STARS & Luminous":
    "Marriott Luxury Collection &amp; St. Regis preferred-partner rates.",
  "Hilton Impresario":
    "Hilton&rsquo;s luxury &amp; lifestyle preferred-partner programme.",
  "Hyatt Privé":
    "Hyatt&rsquo;s by-invitation luxury advisor programme.",
  "Four Seasons Preferred Partner":
    "Direct Four Seasons partner inventory with breakfast &amp; upgrades.",
  "Belmond Bellini Club":
    "Belmond&rsquo;s amenity programme across trains, river cruises &amp; hotels.",
  "Rosewood Elite":
    "Rosewood&rsquo;s preferred-partner programme — upgrades &amp; F&amp;B credit.",
  "Raffles Stars":
    "Raffles&rsquo; preferred-partner programme for advisor bookings.",
  "Accor STEP":
    "Accor Travel Elite Programme — preferred rates across the group.",
  "IHG Luxury & Lifestyle":
    "Six Senses, Regent, InterContinental and Kimpton perks under one roof.",
  "Mandarin Oriental Fan Club":
    "Mandarin Oriental&rsquo;s preferred-partner amenities programme.",
  "Peninsula PenClub":
    "Peninsula&rsquo;s preferred-partner programme — Pen Pals included.",
  "Dorchester Diamond Club":
    "Dorchester Collection&rsquo;s direct partner programme.",
  "Shangri-La Luxury Circle":
    "Shangri-La&rsquo;s luxury-advisor amenity programme.",
  "LHW":
    "The Leading Hotels of the World — 400+ independent luxury properties.",
  "Preferred Hotels & Resorts":
    "Global collection of 650+ independent luxury hotels.",
  "Design Hotels":
    "Marriott&rsquo;s collection of design-led independent hotels.",
  "SLH":
    "Small Luxury Hotels of the World — 560+ boutique properties.",
  "Relais & Châteaux":
    "The grande-table collection — 580 hotels &amp; restaurants.",
  "Tablet Plus":
    "MICHELIN Tablet&rsquo;s curated boutique-hotel programme.",
  // Brands & groups
  "Four Seasons":
    "The benchmark — 130 hotels &amp; residences across 47 countries.",
  "Aman":
    "Quiet, remote, exacting. 35 hotels with a near-cult guest base.",
  "Rosewood":
    "Property-specific luxury — A Sense of Place in 30+ cities.",
  "Belmond":
    "Iconic hotels, trains and cruises owned by LVMH.",
  "Six Senses":
    "Wellness-led luxury resorts now under IHG.",
  "One&Only":
    "Kerzner&rsquo;s ultra-luxury resort portfolio across 13 properties.",
  "Banyan Tree":
    "Asian-rooted wellness resorts in 23+ countries.",
  "Raffles":
    "Accor&rsquo;s flagship luxury brand — 19 properties globally.",
  "Fairmont":
    "Grand-dame hotels in landmark cities under Accor.",
  "Sofitel":
    "French art-de-vivre luxury — 120+ hotels worldwide.",
  "Ritz-Carlton":
    "Marriott&rsquo;s flagship luxury brand — 110+ hotels.",
  "St. Regis":
    "Butler-service luxury under Marriott Luxury Collection.",
  "W Hotels":
    "Marriott&rsquo;s design-forward lifestyle brand.",
  "JW Marriott":
    "Marriott&rsquo;s upper-luxury core — 130+ hotels.",
  "Luxury Collection":
    "Marriott&rsquo;s curated collection of landmark independent hotels.",
  "EDITION":
    "Ian Schrager&rsquo;s lifestyle brand under Marriott.",
  "Park Hyatt":
    "Hyatt&rsquo;s flagship luxury brand — small, refined, urban.",
  "Andaz":
    "Hyatt&rsquo;s lifestyle brand — design-led, locally rooted.",
  "Alila":
    "Hyatt&rsquo;s design-led resort brand, Asia-rooted.",
  "Waldorf Astoria":
    "Hilton&rsquo;s flagship luxury brand — 35 hotels globally.",
  "Conrad":
    "Hilton&rsquo;s contemporary-luxury brand — 45+ hotels.",
  "LXR":
    "Hilton&rsquo;s collection of independent luxury hotels.",
  "Regent":
    "IHG&rsquo;s ultra-luxury revival brand led by InterContinental Group.",
  "InterContinental":
    "IHG&rsquo;s upper-upscale flagship — 200+ hotels.",
  "Kimpton":
    "IHG&rsquo;s boutique-lifestyle brand — 70+ hotels.",
  "Shangri-La":
    "Hong Kong-headquartered Asian-luxury group — 100+ hotels.",
  "Mandarin Oriental":
    "Asian-rooted urban-luxury brand — 36 hotels.",
  "Peninsula":
    "Hongkong &amp; Shanghai Hotels&rsquo; flagship — 10 grande-dame properties.",
  "Dorchester Collection":
    "Nine landmark hotels owned by the Brunei Investment Agency.",
  "Langham":
    "Hong Kong-headquartered luxury group — 30+ hotels.",
  "Oberoi":
    "India&rsquo;s most decorated luxury group — 30+ hotels and Nile cruisers.",
  "Taj (Taj/SeleQtions/Vivanta)":
    "Tata&rsquo;s flagship hospitality group — India&rsquo;s grandes dames.",
  "Jumeirah":
    "Dubai-headquartered luxury group — 25+ hotels globally.",
  "COMO":
    "Christina Ong&rsquo;s wellness-luxury collection — 18 properties.",
  "Capella":
    "Singapore-rooted ultra-luxury — 10 hotels with personal-assistant service.",
  "Rocco Forte":
    "Sir Rocco Forte&rsquo;s European-luxury collection — 14 hotels.",
  "Auberge":
    "North-American resort-luxury group — 25 properties.",
  "Roseate":
    "Bird Group&rsquo;s boutique-luxury brand — UK &amp; India.",
  "Minor Hotels":
    "Bangkok-listed parent of Anantara, Avani, Tivoli &amp; NH Hotels.",
  "Anantara":
    "Minor&rsquo;s flagship luxury resort brand — 50+ hotels.",
  "The Set Collection":
    "Independent five-star city hotels — Café Royal, Conservatorium, Mamilla.",
  "Oetker Collection":
    "Family-owned grandes dames — Le Bristol, Eden Roc, Brenners.",
  "Soneva":
    "Maldives-rooted barefoot-luxury — three properties, no shoes required.",
  "Viceroy":
    "Highgate&rsquo;s lifestyle-luxury collection.",
  "Montage":
    "North-American luxury resorts &amp; residences — 8 properties.",
  "Pendry":
    "Montage&rsquo;s younger urban-luxury sibling.",
  "Thompson":
    "Hyatt&rsquo;s lifestyle-luxury brand — design-led, urban.",
  "Nobu":
    "Robert De Niro &amp; Nobu Matsuhisa&rsquo;s hotel arm — 40+ properties.",
  "Kempinski":
    "Europe&rsquo;s oldest luxury hotel group — 80+ hotels.",
  "NH Collection":
    "Minor Hotels&rsquo; premium European city-hotel brand.",
  "Rosewood Residences":
    "Rosewood&rsquo;s branded-residence arm — long-stay luxury.",
  "Accor Premium Portfolio":
    "Sofitel Legend, MGallery and Emblems under one umbrella.",
};

// ── Editorial groupings ──────────────────────────────────────────────────
// Within "Brands & Groups", split into Independent Luxury vs Global Groups
// for a more readable typographic list. Allocation by editorial judgement.
const INDEPENDENT_BRANDS = new Set<string>([
  "Aman",
  "Rosewood",
  "Belmond",
  "Six Senses",
  "One&Only",
  "Banyan Tree",
  "COMO",
  "Capella",
  "Rocco Forte",
  "Soneva",
  "Auberge",
  "Roseate",
  "The Set Collection",
  "Oetker Collection",
  "Oberoi",
  "Taj (Taj/SeleQtions/Vivanta)",
  "Jumeirah",
  "Peninsula",
  "Mandarin Oriental",
  "Shangri-La",
  "Dorchester Collection",
  "Kempinski",
  "Langham",
  "Montage",
  "Pendry",
  "Nobu",
  "Viceroy",
  "Anantara",
]);

function blurbFor(name: string): string {
  return (
    PARTNER_BLURBS[name] ??
    "Direct partner — preferred-rate inventory available to Voyagr members."
  );
}

// Hero image — soft brass-on-marble vibe to evoke "the network" rather than
// a single property.
const HERO_IMAGE =
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=2400&q=85&auto=format&fit=crop";

export default function PreferredPartnersPage() {
  useEffect(() => {
    posthog.capture("preferred_partners_page_viewed");
  }, []);

  const alliances = getPartnersByType("alliance");
  const brands = getPartnersByType("brand");
  const independents = brands.filter((b) => INDEPENDENT_BRANDS.has(b.name));
  const groups = brands.filter((b) => !INDEPENDENT_BRANDS.has(b.name));

  return (
    <div className="luxe">
      <Header />
      <main style={{ minHeight: "100vh", paddingBottom: 120 }}>
        {/* ── Cinematic hero ───────────────────────────────────────────── */}
        <section
          style={{
            position: "relative",
            width: "100%",
            height: "min(72vh, 680px)",
            minHeight: 480,
            overflow: "hidden",
            background: "#0a0a0a",
          }}
        >
          <Image
            src={HERO_IMAGE}
            alt="Brass and marble — emblematic of the partner network."
            fill
            sizes="100vw"
            priority
            style={{ objectFit: "cover", opacity: 0.55 }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.35) 40%, rgba(10,10,10,0.88) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "0 24px 88px",
            }}
          >
            <div
              style={{
                maxWidth: 880,
                margin: "0 auto",
                width: "100%",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily:
                    "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.4em",
                  textTransform: "uppercase",
                  color: GOLD,
                  marginBottom: 22,
                }}
              >
                The Network
              </div>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(40px, 6vw, 76px)",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: TEXT_PRIMARY,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.02,
                  margin: "0 0 28px",
                }}
              >
                Partners we trust by name.
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 17,
                  fontWeight: 300,
                  color: TEXT_MUTED,
                  lineHeight: 1.75,
                  maxWidth: 620,
                  margin: "0 auto",
                }}
              >
                We negotiate directly with the hotel — no GDS middlemen, no
                OTA markup. These are the groups our members fly to.
              </p>
            </div>
          </div>
        </section>

        {/* ── Stat strip ──────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "72px 24px 0",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${HAIRLINE}`,
              paddingBottom: 32,
              textAlign: "center",
              fontFamily:
                "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: GOLD,
            }}
          >
            {PREFERRED_PARTNERS.length} partners · {alliances.length}{" "}
            alliances · {brands.length} brands
          </div>
        </section>

        {/* ── Group: Alliances & Programmes ────────────────────────────── */}
        <PartnerGroup
          index={1}
          eyebrow="Programmes"
          title="Alliances &amp; consortia"
          intro="The advisor consortia and brand-direct programmes that make breakfast, upgrades and late checkout contractual rather than goodwill."
          partners={alliances}
        />

        {/* ── Group: Independent Luxury ───────────────────────────────── */}
        <PartnerGroup
          index={2}
          eyebrow="Brand families"
          title="Independent luxury"
          intro="Owner-operated and family-controlled groups — the ones where the brand promise survives every property."
          partners={independents}
        />

        {/* ── Group: Global Hotel Groups ──────────────────────────────── */}
        <PartnerGroup
          index={3}
          eyebrow="Brand families"
          title="Global hotel groups"
          intro="The major-group flagships and lifestyle labels we book most often — Marriott Luxury Collection, Hilton, Hyatt, IHG, Accor and Minor."
          partners={groups}
        />

        {/* ── Closing CTA ─────────────────────────────────────────────── */}
        <section
          style={{
            maxWidth: 720,
            margin: "120px auto 0",
            padding: "120px 24px 0",
            textAlign: "center",
            borderTop: `1px solid ${HAIRLINE}`,
          }}
        >
          <div
            style={{
              fontFamily:
                "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 18,
            }}
          >
            Found a better rate?
          </div>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px, 3.4vw, 36px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: TEXT_PRIMARY,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              margin: "0 0 36px",
            }}
          >
            We&rsquo;ll match it — at any of these partners.
          </p>
          <Link
            href="/match-my-rates"
            className="luxe-btn-gold"
            onClick={() =>
              trackCtaClicked({
                cta_name: "match_my_rate",
                cta_location: "preferred_partners_closing",
                destination_url: "/match-my-rates",
              })
            }
            style={{ minHeight: 44 }}
          >
            Match my rate
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}

// ── Typographic partner-list section ─────────────────────────────────────
function PartnerGroup({
  index,
  eyebrow,
  title,
  intro,
  partners,
}: {
  index: number;
  eyebrow: string;
  title: string;
  intro: string;
  partners: PreferredPartner[];
}) {
  if (partners.length === 0) return null;
  return (
    <section
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "72px 24px 0",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: 24,
          marginBottom: 40,
        }}
      >
        <div>
          <div
            style={{
              fontFamily:
                "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: GOLD,
              marginBottom: 12,
            }}
          >
            {eyebrow} · {String(index).padStart(2, "0")}
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.2vw, 40px)",
              fontWeight: 400,
              fontStyle: "italic",
              color: TEXT_PRIMARY,
              letterSpacing: "-0.015em",
              lineHeight: 1.1,
              margin: "0 0 14px",
            }}
            // Title may contain &amp; entity from the source string above.
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 16,
              fontWeight: 300,
              color: TEXT_MUTED,
              lineHeight: 1.75,
              maxWidth: 640,
              margin: 0,
            }}
          >
            {intro}
          </p>
        </div>
      </div>

      {/* Row list — italic Playfair name, blurb, hairline divider */}
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        {partners.map((p) => (
          <li
            key={p.name}
            style={{
              borderBottom: `1px solid ${HAIRLINE}`,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) auto",
                gap: 24,
                alignItems: "baseline",
                padding: "28px 0",
                minHeight: 44,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(22px, 2.4vw, 28px)",
                    fontWeight: 400,
                    fontStyle: "italic",
                    color: TEXT_PRIMARY,
                    letterSpacing: "-0.012em",
                    lineHeight: 1.2,
                    margin: "0 0 8px",
                  }}
                >
                  {p.name}
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 300,
                    color: TEXT_MUTED,
                    lineHeight: 1.65,
                    margin: 0,
                    maxWidth: 680,
                  }}
                  dangerouslySetInnerHTML={{ __html: blurbFor(p.name) }}
                />
              </div>
              <div
                aria-hidden
                style={{
                  fontFamily:
                    "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: TEXT_SOFT,
                  whiteSpace: "nowrap",
                }}
              >
                {p.type === "alliance" ? "Programme" : "Brand"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
