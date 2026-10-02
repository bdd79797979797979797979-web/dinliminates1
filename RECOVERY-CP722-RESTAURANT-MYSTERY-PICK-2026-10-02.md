# CP722 Recovery — Restaurant Hungry Mystery Pick — 2026-10-02

Restaurant Hungry mode uses the **Mystery Pick** concept.

User-facing copy:
“You eliminated everything. It’s either this or Waffle House.”

Behavior:
- Uses the existing `S.restaurantPool` from the current restaurant search.
- Does not launch a new restaurant search.
- Applies current restaurant search text and Quick Cut filters.
- Removes hidden/hidden-by-settings restaurants.
- De-duplicates provider duplicates with the existing restaurant de-duplication system.
- Allows the final mystery to draw from the original current restaurant set, including restaurants the user cut, because Hungry mode is the explicit last-chance escape hatch.
- Reveal displays the selected restaurant with its real/fallback restaurant photo, category, and distance/address metadata.
- Choose This enters the normal restaurant winner flow with an explicit `restaurant` winner type.
- Try Another excludes the current mystery choice when another eligible restaurant exists.
- Try Another is hidden when fewer than two choices exist.
- Deterministic QA hook `__DINLIMINATE_TEST_MYSTERY_INDEX` was added for repeatable tests.

Testing:
- app.js JavaScript parse: PASS.
- Exact Waffle House string verified in runtime source.
- Mystery panel, Reveal, Try Another, and Choose This bindings: PASS.
- No `searchRestaurants()` call inside the Mystery Pick functions: PASS.
- Existing restaurant de-duplication call: PASS.
- One-choice Try Another handling: PASS.
- Restaurant winner type preservation: PASS.
- Direct function-level simulation: PASS for hidden filtering, query filtering, duplicate collapse, final-chance use of previously cut restaurants, and different repeat selection.
- A live hosted-browser run is not claimed because the current Vercel CI/deployment path is rate-limited and no connected live preview runner was available.

Build:
- CP722 / build 722
- Service-worker cache v722
- Page asset cache-bust v722

Branch: `cp715-restaurant-maybe-home-winner`
