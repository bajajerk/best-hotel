# Flight Booking — Manual Test Guide

**URL:** https://best-hotel-five.vercel.app/flights
**Devices:** iPhone Safari (or Android Chrome) **and** Desktop Chrome — prioritise mobile.
**Important:** Connected to TripJack's **sandbox**. No real money, no real flights, even on "Booking Confirmed".

## 1. Setup
- Fresh incognito/private window.
- No sign-in required (dev-mode user is auto-applied on the backend).
- DevTools → Network + Console open during testing.

## 2. Happy path

**Step 1 — Search.** Pick **BOM → DEL** (or BOM → DXB), date **at least 2 days out**, 1 adult, Economy, Search.
- ✅ Lands on `/flights/results` and real flight cards appear within ~10s.
- ❌ If you see **"No flights found"** for a major route on a near-future date, capture Network → `/api/flights/search` response and report.
- ❌ If you see **"Couldn't load flights"**, capture the same.

  *(Note: the previous demo fallback — IndiGo/Air India/Emirates/SpiceJet at ₹8,400/₹9,200/₹14,100/₹8,850 — has been removed. If you ever see those exact prices, it's a stale build.)*

**Step 2 — Select a flight.** Try the four sort tabs (Cheapest / Stops / Depart / Price). Tap a card.
- ✅ Card gets gold border + "Selected ✓". Bottom sticky bar shows airline · times · price + gold **Continue →** button.
- ✅ **Mobile**: Continue button must be fully visible — not cut off, not hidden by anything else.

**Step 3 — Choose fare.** Click **Continue →**.
- ✅ `/flights/fare-select` shows flight summary + 2-4 fare cards (PUBLISHED / SMART / FLEX with baggage, meal, refundable). Cheapest is pre-selected with a gold "CHEAPEST" badge. Tap a different fare → selection switches; sticky-bar price updates.
- ❌ If you see `errCode 1091` or "Failed to load fare details", screenshot + Network response.

**Step 4 — Continue to passengers.** Click Continue →.
- ✅ Brief "Locking…" → lands on `/flights/passengers`.

**Step 5 — Fill details.** For each adult: Title / First name / **unique** Last name / DOB. ⚠️ **Always use a fresh last name per test run** (e.g. add 3 random letters). Sandbox blocks duplicates with errCode 2502. Add email + 10-digit phone.
- ✅ Submitting with an empty field shows a red error.

**Step 6 — Confirm & Pay.** Click Confirm & Pay →.
- ✅ "Booking…" → green ✓ "Booking Confirmed" with TripJack booking ID (starts with `TJS`), status BOOKED, route, date.
- ❌ errCode 2502 → reused name; retry. errCode 1091 → flow regression, escalate. 5xx → backend issue.

## 3. Mobile-specific (iPhone SE 375×667)

| Page | Check |
|---|---|
| `/flights/results` | After selecting flight, **Continue →** fully visible. Long airline names ellipsis, don't push button off-screen. |
| `/flights/fare-select` | Fare cards stack cleanly. Continue button visible after selection. |
| `/flights/passengers` | Inputs tappable, native date picker opens, Confirm & Pay button visible. |
| All flight pages | The green "Sign in to see member rates" banner should **NOT** appear (hidden by design on `/flights/*`). |

## 4. Edge cases

1. **Empty results:** obscure route/date → expect explicit "No flights found" page (no fake demo cards).
2. **API failure:** if the backend is down, expect "Couldn't load flights" with an Edit search link — never a list of flights.
3. **Direct URL load on `/flights/fare-select`:** opening the URL in a new tab (no sessionStorage) should still load **at least one** fare option (fallback mode). If it errors, screenshot.
4. **Browser back:** going back from passengers → fare-select → results should not lose state mid-flow.
5. **Refresh:** safe on results (re-searches). On fare-select / passengers, may show empty/error — that's acceptable as long as it doesn't crash.
6. **Multiple adults:** search with 2 adults → passengers page renders 2 forms.

## 5. Known limitations

- **Payment is fake.** "Confirm & Pay" charges a TripJack agent wallet — no card form, no real money.
- **Sandbox always succeeds** (or errCode 2502 for duplicate name) — no "card declined" path to test yet.
- **One-way only**, no round-trip / multi-city in UI.
- **No refunds / cancellations** UI yet.
- **Sign-in is bypassed**; don't expect a working "Sign in" experience for the flight flow.
