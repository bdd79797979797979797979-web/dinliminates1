# RECOVERY-CP641-OFFICIAL-SITE-FIRST-RESTAURANT-PHOTOS-2026-10-01

Branch: cp641-official-site-first-photos
Build: 641

Photo policy:
1. Restaurant-owned website is checked first.
2. It is accepted only when the page is tied to the exact restaurant address and the image itself is a venue image.
3. Exact OpenStreetMap POI photos may be used next when explicitly supplied by that exact POI.
4. Exact pre-verified public venue photos are fallback only.
5. Generic chain, cuisine, stock, logo, menu, food, and unrelated photos are rejected.

Verification:
- Syntax and architecture checks: PASS.
- Official website precedence checks: PASS for:
  - The Thirsty Goat — official page first
  - Ruby Tuesday — official page first
  - Chipotle Mexican Grill — official location page first
- Live photo smoke test: PASS for McDonald's, The Thirsty Goat, Ruby Tuesday, and Chipotle.
- The four live fixtures returned actual image bytes.
- The live source headers showed public exact-venue fallback for these fixtures because no suitable exact-location photo was exposed by the official pages.
- No Google API credential was added.

This preserves CP640/current-main restaurant and search/UI work while correcting the photo-source order.
