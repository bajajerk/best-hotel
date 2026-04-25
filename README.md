# best-hotel (voyagr.club)

Customer-facing Voyagr storefront. Live at **https://voyagr.club**.

## Stack

- Next.js 16 (App Router, Turbopack)
- Tailwind CSS 4 + framer-motion
- TypeScript
- Firebase Auth (phone OTP + Google + email)
- Custom components (no shadcn) under `src/components/`

## Backend (where the data comes from)

Same Flask backend that powers the admin CRM:

| Env | URL | Notes |
|-----|-----|-------|
| Local dev | `NEXT_PUBLIC_API_BASE=http://134.122.41.91:5000` | direct HTTP |
| Vercel prod | Routed via `src/app/api/[...path]/route.ts` (proxy) | Next.js → Flask |

Backend stack (on a single DO droplet at `134.122.41.91`):

| Component | Port | Purpose |
|-----------|------|---------|
| Flask app | 5000 | Endpoints + business logic |
| Postgres 15 (Docker) | 54322 | DB — `postgres/postgres` |
| PostgREST (Docker) | 3000 (internal) | Auto-REST over Postgres |
| Nginx (Docker) | 54321 | URL rewrite for the SDK |

See `travel-app-backend/README.md` for backend ops + DB connection details.

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Home — featured hotels (4 tabs), curated cities, hero, testimonials |
| `/city/[slug]` | City landing — list of curated hotels with live rates |
| `/hotel/[id]` | Hotel detail with date picker → live rates from `/api/hotels/:id/rates` |
| `/search` | Hotel search (rates also live via batch endpoint) |
| `/results` | Search results page |
| `/compare` | Multi-provider price compare |
| `/match-my-rates` | Screenshot upload → Gemini OCR → Agoda comparison |
| `/profile`, `/login`, `/onboarding` | Account flows (Firebase auth) |
| `/business-class-flights`, `/flights`, `/flights/results` | Flight booking (separate flow, in-progress) |

## Live pricing — how it works now

```
[ /hotel/43883 ]
  ↓ booking context (checkIn, checkOut, adults)
GET /api/hotels/43883/rates?checkin=2026-07-01&checkout=2026-07-02&adults=2
  ↓ Backend: TripJack (sell price) + Agoda (MRP) in parallel, 10-min cache
{
  hotel: {...},
  mrp:   { agoda_rate: 15455 },         ← strikethrough
  rates: [{ room_name, total_price: 14330, refundable, ... }],
  savings_pct: 7
}
```

For list pages (home / city / search), one `POST /api/hotels/rates/batch` with all visible hotel IDs. Hotels without a TripJack mapping get filtered out. No fake fallback prices.

## Default booking dates

When the user hasn't picked dates yet (landing on the home page), pricing defaults to **tonight + 1 night, 2 adults, 0 children** — see `defaultBookingDates()` in `src/lib/api.ts`.

## Running locally

```bash
cp .env.local.example .env.local         # if exists, else create:
echo "NEXT_PUBLIC_API_BASE=http://134.122.41.91:5000" > .env.local
echo "BACKEND_URL=http://134.122.41.91:5000" >> .env.local
echo "NEXT_PUBLIC_FIREBASE_API_KEY=..." >> .env.local
echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=..." >> .env.local
echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=..." >> .env.local
echo "NEXT_PUBLIC_FIREBASE_APP_ID=..." >> .env.local

npm install
npm run dev                              # localhost:3000
```

Build before pushing (Vercel auto-deploys on `main`):

```bash
npm run build       # MUST pass with exit 0
git push origin main
```

## File structure

```
src/
├── app/
│   ├── page.tsx                    # home
│   ├── HomePageClient.tsx          # home logic (featured hotels, batch rates)
│   ├── city/[slug]/                # city landing pages
│   ├── hotel/[id]/                 # hotel detail with live rates
│   ├── search/, results/           # search
│   ├── compare/                    # multi-provider compare
│   ├── match-my-rates/             # screenshot OCR
│   ├── profile/, login/, onboarding/ # account flows
│   ├── flights/, business-class-flights/ # flight booking
│   ├── api/[...path]/              # Next → Flask proxy (HTTPS→HTTP bridge)
│   └── api/hotels/featured/        # featured hotels aggregator (server)
├── components/                     # custom UI primitives
├── context/
│   ├── BookingContext.tsx          # dates + room + guest counts (used everywhere)
│   └── AuthContext.tsx             # Firebase user
└── lib/
    ├── api.ts                      # ALL backend fetch functions + types
    ├── constants.ts                # city images, sample fallbacks (decorative only)
    └── ranking.ts                  # client-side hotel ranking strategies
```

## Auth flow

- `Firebase` (web) handles sign-in (phone OTP / Google / email)
- On sign-in success, frontend gets a Firebase ID token
- Sends it to backend as `Authorization: Bearer <token>` for any auth-required endpoint
- Backend's `verify_firebase_token()` checks signature against the service account
- Optional: `_ensure_user_row()` upserts a row in `users` table if first time

## Common issues

| Symptom | Cause | Fix |
|---|---|---|
| Hotels load but no prices | Backend `/api/hotels/rates/batch` returning empty | Check Flask logs on the droplet (`/tmp/flask.log`); usually PostgREST auth desync — see backend README |
| "0 hotels in [city]" | Curated_hotels empty for that city OR PostgREST 502 | Check backend; fix is `ALTER USER postgres WITH PASSWORD 'postgres'; docker compose restart postgrest` on the droplet |
| Login button does nothing | Firebase env vars missing in `.env.local` | Check all `NEXT_PUBLIC_FIREBASE_*` are set |
| Rates show but seem stale | 10-min in-memory cache on backend | Bounce Flask: `pkill -f python3; nohup python3 -c "from app import app; app.run(host='0.0.0.0', port=5000)" > /tmp/flask.log 2>&1 &` |
| Vercel build fails on TS error | Type mismatch between `src/lib/api.ts` and pages | Run `npm run build` locally first, fix, then push |

## Production

- **URL**: https://voyagr.club, https://www.voyagr.club, https://voyagrclub.com
- **Hosting**: Vercel
- **Branch**: `main` → production
- **CI**: Vercel auto-deploys on push to `main`
- **Env vars**: set on Vercel project (Firebase keys + `NEXT_PUBLIC_API_BASE` + `BACKEND_URL`)

## Related repos

- **`travel-app-backend`** — Flask backend (this app's API)
- **`voyagr-admin`** — admin CRM (separate Next.js app on Vercel at `admin.voyagr.club`)
