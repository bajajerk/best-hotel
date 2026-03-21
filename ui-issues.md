## Round 1 — 2026-03-21

### Desktop Issues

#### Home Page
1. **Hero search bar**: The search form fields (destination, check-in, check-out) and button are cramped together — the container needs more internal padding (p-4 → p-6) and the fields need clearer separation
2. **Hero stats row**: The "50+ Cities / 1,500+ Hotels / ₹0 Fees" stats below the search bar are too close to the search — needs more top margin (mt-4 → mt-8)
3. **"Curated stays worldwide" featured grid**: The asymmetric image grid top section has uneven gap between large left card and right column cards — gaps should be consistent (gap-2 → gap-3)
4. **"Why travellers choose Voyagr" section**: The dark section has too little vertical padding — text feels cramped (py-16 → py-24)
5. **"Explore curated stays" destination cards**: Cards have inconsistent bottom padding — tagline text is too close to the bottom edge (pb-3 → pb-5)
6. **Price comparison card**: The "Same hotel, same room" section at bottom — the horizontal result card's image is too close to the text content, needs a wider gap (gap-3 → gap-6)
7. **Testimonial section**: The quote text and attribution are too close together (mt-3 → mt-6 between quote and avatar)
8. **Trust stats row**: Numbers and labels are cramped vertically — need more padding in the stat items (py-6 → py-10)
9. **Footer**: Links and copyright text are too close to the bottom edge — needs more bottom padding (pb-8 → pb-12)

#### City Page
10. **City header**: Breadcrumb is touching the top of the city name — needs more margin-bottom (mb-2 → mb-4)
11. **Category tabs**: Tabs ("For Couples", "For Families", "For Singles") have too little padding — text feels cramped (px-3 py-1 → px-4 py-2)
12. **Hotel cards — image vs content gap**: The 240px image and the hotel details text are too close — needs gap (gap-0 or gap-1 visible → gap-4 at least)
13. **Hotel cards — pricing column**: The "VOYAGR RATE" label, price, and "per night" are too tightly stacked (space-y-0 → space-y-1)
14. **Hotel cards — vertical spacing between cards**: Cards are touching each other or have only 2px gap — needs at least 12px gap between cards
15. **CTA section**: "Preferred rates for Bangkok" — the buttons (Call Us, WhatsApp) are too close together (gap-2 → gap-4)
16. **"Other destinations" pills**: The city name pills have insufficient internal padding (px-3 py-1 → px-4 py-2.5)
17. **Footer**: Too cramped vertically (py-6 → py-10)

#### Hotel Page
18. **Hero overlay text**: Hotel name and star/city line are too close to the bottom edge of the hero image — needs more bottom padding (pb-6 → pb-10)
19. **Tabs bar**: Tab items have insufficient padding between them — feels like a run-on sentence (gap-0 → gap-2 or px increase)
20. **Overview section**: The overview text starts too close to the tab bar below it — needs top margin (mt-4 → mt-8)
21. **Details table**: Row items are too close vertically — needs more cell padding (py-2 → py-3)
22. **Booking sidebar "Request a quote" card**: The heading and body text inside the card are too close — needs spacing (space-y-2 → space-y-4)
23. **Reviews section**: The review cards are too close to each other — needs gap (gap-4 → gap-6)
24. **Review cards**: Reviewer name/avatar and the review text below are too close (gap-2 → gap-4)
25. **Gallery grid**: The 4 thumbnail images have inconsistent gap — some touching, some with 2px gap (should be uniform 4px)
26. **Footer**: Copyright text too close to bottom edge (pb-4 → pb-8)

### Mobile Issues

#### Home Mobile
27. **Hero headline**: Text "The rates hotels don't want you to see" is too close to left/right edges — needs more horizontal padding (px-4 → px-6)
28. **Hero search**: Search form overflows or is too cramped on mobile — needs to stack fields vertically
29. **Featured grid**: Images are stacking but with inconsistent gaps between them
30. **"Why Voyagr" dark section**: Step numbers and text are too close to edges (px-4 → px-6)
31. **Destination cards**: Cards need more gap between them on mobile (gap-3 → gap-4)

#### City Mobile
32. **City name heading**: Too close to left edge (px-4 → px-5)
33. **Hotel cards stacked**: On mobile the horizontal card layout should fully stack — image on top, details below, pricing below that. Currently the details and pricing might be misaligned.
34. **Card internal spacing**: Hotel name too close to image bottom (mt-2 → mt-3)

#### Hotel Mobile
35. **Hero image**: Hotel name overlay text might be hard to read — needs bolder gradient
36. **Booking card section**: On mobile this should have clear vertical spacing from the overview above (mt-6 → mt-8)
37. **Reviews**: Cards are too close together (gap-3 → gap-5)
38. **Fixed bottom bar**: Price and button might be too cramped — needs more internal padding (px-4 py-2 → px-5 py-3)

### No issues found: no
