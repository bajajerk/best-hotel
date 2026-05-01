# KNOWLEDGE — best-hotel (voyagr.club)

High-context handoff. Architecture, decisions, and recent rebuild notes — for setup/deploy/curl see `README.md`.

## Three-repo architecture

| Repo | Hosting | What |
|------|---------|------|
| `travel-app-backend` (`/home/mayank/travel-app-backend`) | DO droplet `134.122.41.91:5000` | Flask API |
| `voyagr-admin` (`/home/mayank/voyagr-admin`) | Vercel | Internal CRM |
| `best-hotel` (this) | Vercel | Customer site at https://voyagr.club |

All three share one Postgres on the droplet (Postgres `:54322`, PostgREST `:3000`, Nginx `:54321`, Flask `:5000`). The customer site has no DB of its own — it's a Flask client.

## Pricing model (load-bearing)

- **Agoda** B2C price = MRP, used as strikethrough only.
- **TripJack** B2B price (with `commercial.commission` already baked in) = what we sell.
- A hotel must have a `hotel_provider_links` row for `provider='tripjack'` to be bookable (was: `hotel_provider_mapping`, dropped in backend mig 025). **Hotels without a TripJack link are hidden.** No fake fallback prices anywhere. The Agoda link is optional and only used for the MRP strikethrough.

## Live pricing — wired up everywhere now

Implemented in commit `5a0add7`:

```
/hotel/[id]                  GET /api/hotels/:id/rates?checkin=&checkout=&adults=
/                            POST /api/hotels/rates/batch  (home featured shelves)
/city/[slug]                 POST /api/hotels/rates/batch
/search, /results            POST /api/hotels/rates/batch
```

Backend: TripJack Listing → TripJack Pricing (returns ALL rate plans, 5–26 per hotel) + Agoda for MRP, in parallel. **No cache** — rates are fetched live every time (P0 rule, see `travel-app-backend/KNOWLEDGE.md`). Cold-cache TripJack latency is 30–45s for the first call, 3–5s warm.

Hotels missing a TripJack mapping are dropped silently in batch responses — list pages show fewer hotels rather than fake prices.

Files:

- `src/lib/api.ts` — `getHotelRates()`, `getBatchRates()`, types
- `src/app/hotel/[id]/page.tsx` — detail page with date picker
- `src/app/HomePageClient.tsx` — home featured shelves (batch)
- `src/app/city/[slug]/`, `src/app/search/`, `src/app/results/` — list pages

## Booking flow (rebuilt — was 100% mock theater)

Commit `c52f72f` replaced the entire fake booking flow with real-data screens:

```
/hotel/[id]              Select dates + room   →
/book/review             Confirm + price       →
/book/guest-details      Name, email, requests →
/book/payment            "Pay now" (DISABLED)  +  "Confirm with concierge" (PRIMARY)
                         Concierge CTA: opens WhatsApp prefilled + POST /api/bookings (status: pending)
/book/confirmation       Shows VG-XXXXX reference + WhatsApp CTA
```

**Deleted in the rebuild** (do not resurrect):

- `src/app/book/page.tsx` — old fake landing
- `src/app/book/rooms/page.tsx` — fake `MOCK_ROOMS`, `USD_TO_INR=83`, `PUBLIC_MULTIPLIER=1.3`
- `src/app/book/mockData.ts` — synthetic rooms, fake prices

**Why concierge over Pay-now**: payment gateway integration is pending. Until then, "Pay now" is intentionally disabled and "Confirm with concierge" is the primary CTA. It does two things atomically:

1. `POST /api/bookings` with `status: "pending"`, `guest_name`, `guest_email`, `special_requests` (backend default is now also `pending` — see `migrations/017_bookings_guest_fields.sql` in the backend repo).
2. Opens WhatsApp at `https://wa.me/<number>?text=<prefilled>` with the full booking message.

Concierge WhatsApp number: `+91 98335 34627`.

```
NEXT_PUBLIC_CONCIERGE_WHATSAPP=919833534627
```

Used in `src/app/book/payment/page.tsx:110` and `src/app/book/confirmation/page.tsx:11`. Updated in commit `4a9e5c0`.

## Killed fakery (do not regress)

Tracked in commits `5b6 e7c4`, `56df766`, `5b6 4753`. If you see any of these patterns reappear, that is a regression:

| Fake thing | What it was | Status |
|---|---|---|
| `× 1.25` and `× 1.3` MRP / "public rate" multipliers (4 files) | Synthetic strikethrough price | **Deleted** — now real Agoda rate or hidden entirely |
| `MOCK_ROOMS`, `USD_TO_INR=83`, `PUBLIC_MULTIPLIER=1.3` | Whole `/book/rooms` page | **Page deleted** |
| `PriceProof.tsx` competitor prices | Hardcoded fake competitor cards | **Deleted** |
| `Math.random()` savings %, hotel_count fallbacks | Random numbers in UI | **Removed** |
| Hardcoded "Save up to 23%" hero badge | Lied about MRP | Now shows "Preferred Rate" when no Agoda MRP |

Acceptable `Math.random()` usage that survived: booking-reference ID generators only (`/api/lead/route.ts`, `/api/concierge/request/route.ts`, `BookingModal.tsx`).

## Unified destination search

Commit `1bf5753`. The hero search input now matches **both cities and hotels** in a single grouped dropdown:

- 5 cities + 8 hotels max, grouped
- 300 ms debounce
- Implementation: `src/components/DestinationSearch.tsx` + `searchHotelsByName()` in `src/lib/api.ts:169`

## Default booking dates

When the user lands on the home page without picking dates, pricing defaults to **tonight + 1 night, 2 adults, 0 children**. See `defaultBookingDates()` in `src/lib/api.ts:697`.

## Default sort on listings

Was "Saving: Highest" — depended on Agoda MRP being available, which we don't always have. Changed default to **"Highest Rated"** so the page never looks empty.

## Auth (Firebase)

- `Firebase` web SDK handles sign-in (phone OTP for India / Google / email)
- On success, frontend gets a Firebase ID token
- Sends `Authorization: Bearer <id_token>` to backend for any auth-required endpoint
- Backend `verify_firebase_token()` checks signature against the service account
- `_ensure_user_row()` upserts a row in `users` table on first sight

Phone OTP is **business-critical** for the India market — co-founder requirement.

## Hotel ID migration (Phases 1 → D, last 7 days)

The customer site went through a 3-phase rewrite of how hotels are identified, mirroring the backend's master-hotel migration.

### Phase 1 — Agoda → TripJack (commit `7ed218d`)

Backend Phase 1 (travel-app-backend `dd98f9b`) moved curation tables to `tj_hotel_id`. Admin-side patch threaded the new id through the customer site:

- Types — `HomeFeaturedHotel`, `PreferredHotel`, `CuratedHotel`, `RatesResponse`, `BatchRatesResponse`, `NoMatchError`, `CreateBookingBody` carry `tj_hotel_id: string`. Legacy `hotel_id: number` removed.
- `/hotel/[id]` route — `params.id` is a TripJack TEXT id; `HotelPageClient` falls back to the rates response for hotel meta when the legacy `/api/hotels/{id}` fetch 404s.
- Booking flow — URL param renamed `hotelId` → `tjHotelId`; legacy `hotelId` honoured as a fallback for cached / external links.
- `BookingFlowContext` — `hotelId: number | null` → `tjHotelId: string | null`.
- `CompareContext` + `compare` page — keyed on `tj_hotel_id`.
- `next.config.ts` — added `i.travelapi.com` to `images.remotePatterns` (commit `aa81f82`) since photos now come from the TripJack CDN. `pix*.agoda.net` retained for legacy Agoda photos + MRP cross-ref hotels still on `agoda.net`.

### Phase D — URL contract → `/hotel/<slug>-<short_id>` (commit `7764db8`)

Backend Phase A introduced `hotels_master` (UUID) + `hotel_provider_links`. The customer URL contract moved to a stable, supplier-agnostic, SEO-friendly form:

```
/hotel/park-hyatt-paris-vendome-3a7f9c1b
        └─ slug ─┘                └ short_id (first 8 hex of master UUID)
```

- New `src/lib/urls.ts` — `hotelUrl({ slug, short_id, master_id, id })` builds the canonical pretty URL with fallback chain (slug+short_id → short_id → master UUID → empty).
- Booking-flow URL param renamed `tjHotelId` → `hotelMasterId`. The legacy `hotelId` param was removed in this phase (no back-compat).
- `BookingFlowContext` — `tjHotelId: string | null` → `hotelMasterId: string | null` (`src/context/BookingFlowContext.tsx:58`).
- `POST /api/bookings` body sends `hotel_master_id` (`src/app/book/payment/page.tsx:96`).
- All 21 customer-site files touched in one shot — see commit `7764db8` stat list.

### Phase D-fix — re-add `master_id` alias (commit `5d5490b`)

Phase B on the backend dropped `master_id` and replaced it with `id`. Several FE files still read `.master_id` — sitemap, results, hotel page analytics, and (most painfully) the `/city/[slug]` dedup Map keyed on `master_id`. With `master_id` undefined, all 26 Bangkok curated hotels collapsed into ONE Map entry — the page rendered just 1 hotel.

Backend re-added `master_id` as an alias (df0d99e). FE patch `5d5490b` aligned typings:

- `CuratedHotel` — drop legacy `id: number` (row PK), `id: string` is now the master UUID; `row_id?: number` carries the curated_hotels PK
- `HotelDetail` (HotelPageClient), `RatesResponse.hotel`, `MapHotel` — rename `master_id` → `id` with `master_id` typed as alias for any straggler
- `urls.ts:hotelUrl()` preserves the fallback chain (`master_id || id`)

### Proxy compatibility fixes

- `bdb408b` — `/api/hotels/[id]` proxy was rejecting non-numeric ids with HTTP 400 (leftover from before the migration). Every hotel page using the new URL formats was 500ing at the FE-proxy layer before the request reached Flask. Backend already handles all 4 id shapes via `_resolve_master_from_path_id`; the proxy now just forwards.
- `c70c61c` — `/api/hotels/search` was being captured by `/api/hotels/[id]` (Next.js treated "search" as a hotel id). Added a dedicated static `app/api/hotels/search/route.ts` so it takes precedence over the dynamic `[id]` slot.

## LuxeDatePicker — unified calendar component (commits `1b2cf8c`, `008b521`, `82c205c`)

Replaced every native `<input type="date">` across the site with one consistent component.

`src/components/LuxeDatePicker.tsx` (1042 lines, shipped in `1b2cf8c`):

- Two-month dark-luxe range picker
- Charcoal glass panel + champagne range fill
- Italic Playfair month names, mono caps day-of-week headers
- Dimmed past dates, gold dot for today
- Hover-range preview, two-step check-in → check-out selection
- `prefers-reduced-motion` respected
- Two variants: `light` (cream pages) and `dark` (`.luxe`-scope pages)

Wired into:

- `flights/page.tsx` — departure + return as one range (`1b2cf8c`)
- `HomePageClient.tsx` — hero search bar collapses two native inputs into one range picker (`008b521`)
- `city/[slug]/CityPageClient.tsx`, `match-my-rates/page.tsx`, `DateBar.tsx`, `Tab1Search.tsx`, `Tab3BeatPrice.tsx` (`008b521`)

`useBooking()` context shape unchanged — picker reads/writes via the same setters everything else uses. `/book/*` URL params (checkIn / checkOut ISO format) preserved.

**Variant-must-match-page-theme gotcha** (commit `82c205c`): `/search` wraps everything in `<div className="luxe">` which remaps `--cream` to `#0c0b0a` (dark). Passing `variant="light"` to `DateBar` made `LuxeDatePicker` render light-on-light over a dark page. Always pick the variant that matches the page's `.luxe` scope.

`src/app/flights/passengers/page.tsx` was deliberately left on its existing form — a partial DobField ref wouldn't compile during the migration. Flagged as a follow-up.

Tuning fixes in `009b0e3`:
- LuxeDatePicker range fill bumped to 0.18 with `z-index: 0`, day-number pill `z-index: 1` so numbers always win the stack
- range-hover tint 0.28
- panel bg raised to 0.96 opacity so calendar is readable over hero backgrounds

## Hotel detail page redesign (commit `6467ece`)

Restyle of `/hotel/[id]` to match the dark-luxe editorial language of the homepage and `/city/[slug]`. **All booking-flow logic preserved verbatim** — `fetchHotelRates`, `proceedToBooking` → `/book/review` querystring, login gate, `UnlockRateModal`, save-hotel + heart, lightbox, scroll-spy, sticky bottom bar all intact.

New section order:

1. Full-bleed cinematic hero — clamp(40px,6.4vw,84px) italic Playfair name, champagne mono-caps city/country eyebrow, star + rating + chain pills, "See member rates ↓" + "Ask Concierge" CTAs, save-heart, gallery counter
2. Champagne trust strip — Free cancellation · No payment now · Concierge confirmation · Member rates · live pricing
3. Sticky luxe-tab bar — Rates / The Stay / Gallery / Reviews with date summary on the right
4. Rate cards / room selector
5. Member benefits + location map

## /search page redesign (commit `009b0e3`)

`/search` page got a major UX overhaul:

- DestinationSearch dropdown — solid dark glass (`rgba(20,18,15,0.96)` + 24px blur), champagne hairline border, 14px soft-white text, champagne section caps, active row gets champagne tint + champagne left border
- Search flow — drop the "Matching Destinations" intermediate; hotels open directly with filters + sort. Curated cities relocated to a "Curated favourites in {city}" horizontal scroller below the results.
- HotelResultCard (inline on /search) — rebuilt as compact horizontal card: 200px image left, name/stars/location/badges center, price + "View rates →" CTA right rail; ~152px tall, "Member · X% off" gold ribbon when applicable
- Hero search + /search capsule — focus-within champagne ring (3px @ 0.25) on the active field, 0.55 opacity dim on peers — defines the "Editing" state

## next.config.ts image hosts

`src/next.config.ts:11-25`. Required entries:

| Host | Why |
|------|-----|
| `i.travelapi.com` | TripJack CDN — primary photo source post-tj_hotel_id migration (commit `aa81f82`) |
| `pix1.agoda.net` … `pix5.agoda.net` | Agoda legacy photos + MRP cross-ref hotels still on `agoda.net` |
| `images.unsplash.com` | Decorative city imagery + placeholders |
| `photos.hotelbeds.com` | Reserved for future Hotelbeds inventory |
| `i.pravatar.cc` | Avatar placeholder (testimonials, profile) |

If a hotel photo 404s in `<Image>` and you see a `next/image: hostname not configured` console error, the host is missing from `remotePatterns`.

## Booking flow URL params (Phase D)

After Phase D (`7764db8`), the booking-flow contract is:

| Param | Value | Notes |
|-------|-------|-------|
| `hotelMasterId` | hotel master UUID | Canonical (Phase D rename of `tjHotelId`) |
| `optionId` | TripJack option id | from rates response |
| `checkIn` / `checkOut` | ISO date | preserved from pre-migration |
| `adults` / `children` / `rooms` | int | preserved |

The legacy `hotelId` (Agoda numeric) param **was removed** in Phase D — no back-compat. `tjHotelId` was honoured for one phase as a fallback but is now also gone.

Code refs:
- `src/context/BookingFlowContext.tsx:58` — `hotelMasterId: string | null`
- `src/app/book/review/page.tsx:55` — reads `?hotelMasterId=` from search params
- `src/app/book/payment/page.tsx:96` — POST body `hotel_master_id: flow.hotelMasterId`

## Routes (high-level)

| Route | Purpose |
|-------|---------|
| `/` | Home — featured hotels (4 tabs), curated cities, hero, testimonials |
| `/city/[slug]` | City landing |
| `/hotel/[id]` | Hotel detail with date picker → live rates |
| `/search`, `/results` | Hotel search |
| `/compare` | Multi-provider price compare |
| `/match-my-rates` | Screenshot upload → Gemini OCR → Agoda comparison |
| `/book/review`, `/guest-details`, `/payment`, `/confirmation` | Real booking flow (rebuilt) |
| `/profile`, `/login`, `/onboarding` | Account flows (Firebase auth) |
| `/business-class-flights`, `/flights`, `/flights/results` | Flight booking — separate flow, in-progress |

## File map (what matters)

```
src/
├── app/
│   ├── page.tsx                    home shell
│   ├── HomePageClient.tsx          home logic (featured hotels, batch rates)
│   ├── city/[slug]/                city landing
│   ├── hotel/[id]/                 hotel detail + live rates
│   ├── search/, results/           list pages
│   ├── book/
│   │   ├── review/                 confirm + price
│   │   ├── guest-details/          name + email + requests
│   │   ├── payment/                Pay-now disabled, concierge CTA primary
│   │   ├── confirmation/           VG-XXXXX + WhatsApp CTA
│   │   └── layout.tsx              (page.tsx + rooms/ + mockData.ts deleted)
│   ├── match-my-rates/             OCR
│   ├── api/[...path]/              Next → Flask proxy (HTTPS→HTTP bridge)
│   └── api/hotels/featured/        server-side aggregator
├── components/
│   ├── DestinationSearch.tsx       unified city + hotel search (grouped)
│   ├── HotelCard.tsx, HotelResultCard.tsx
│   └── ...                         custom UI (no shadcn)
├── context/
│   ├── BookingContext.tsx          dates + rooms + guest counts (used everywhere)
│   └── AuthContext.tsx             Firebase user
└── lib/
    ├── api.ts                      ALL backend fetch + types + searchHotelsByName + defaultBookingDates
    ├── constants.ts                city images (decorative only — no synthetic prices)
    └── ranking.ts                  client-side ranking strategies
```

## Build / deploy

- Vercel auto-deploys on push to `main`.
- `npm run build` MUST pass with exit 0 before pushing — Vercel will fail otherwise.
- Required env on Vercel: `NEXT_PUBLIC_API_BASE`, `BACKEND_URL`, `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_CONCIERGE_WHATSAPP`.

## Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Hotels load but no prices | `/api/hotels/rates/batch` returning empty | PostgREST auth desync on droplet — see `travel-app-backend/KNOWLEDGE.md` |
| "0 hotels in [city]" | `curated_hotels` empty for that city, OR PostgREST 502 | Same droplet fix |
| Login button does nothing | Firebase env vars missing | All `NEXT_PUBLIC_FIREBASE_*` must be set |
| Rates seem stale | Should be impossible — backend never caches rates (P0 rule) | If observed, check `_build_rates_response` in `travel-app-backend/app.py` for re-introduced `rates_cache.get/set` |
| Vercel build fails on TS error | Type drift between `src/lib/api.ts` and pages | `npm run build` locally first, fix, then push |
| WhatsApp CTA opens wrong number | `NEXT_PUBLIC_CONCIERGE_WHATSAPP` not set on Vercel | Set to `919833534627` |

## See also

- `README.md` — setup, env, deploy
- `travel-app-backend/KNOWLEDGE.md` — backend side (rates, bookings, audit log)
- `voyagr-admin/KNOWLEDGE.md` — CRM side
