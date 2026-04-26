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
- A hotel must have a `hotel_provider_mapping` row to be bookable. **Hotels without a mapping are hidden.** No fake fallback prices anywhere.

## Live pricing — wired up everywhere now

Implemented in commit `5a0add7`:

```
/hotel/[id]                  GET /api/hotels/:id/rates?checkin=&checkout=&adults=
/                            POST /api/hotels/rates/batch  (home featured shelves)
/city/[slug]                 POST /api/hotels/rates/batch
/search, /results            POST /api/hotels/rates/batch
```

Backend: TripJack Listing → TripJack Pricing (returns ALL rate plans, 5–26 per hotel) + Agoda for MRP, in parallel, 10-min in-memory cache.

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
| Rates seem stale | 10-min in-memory cache on backend | Bounce Flask on the droplet |
| Vercel build fails on TS error | Type drift between `src/lib/api.ts` and pages | `npm run build` locally first, fix, then push |
| WhatsApp CTA opens wrong number | `NEXT_PUBLIC_CONCIERGE_WHATSAPP` not set on Vercel | Set to `919833534627` |

## See also

- `README.md` — setup, env, deploy
- `travel-app-backend/KNOWLEDGE.md` — backend side (rates, bookings, audit log)
- `voyagr-admin/KNOWLEDGE.md` — CRM side
