# Recovery Checkpoint — CP379 — Remove Undefined Hours Instrumentation — 2026-09-30

Important production diagnosis:
- The hours model smoke is green.
- Browser All/Open-Unknown logic was correct enough to load the expected pool.
- The browser count showed 0 because updateRestaurantStatus() still contained leftover QA instrumentation:
  el.dataset.hoursVisible=String(visible.length);
- The function no longer defines visible, so this throws ReferenceError during drawRestaurants().
- That aborts the rest of drawRestaurants(), leaving #restaurantCount stale at 0.
- This directly explains why All appeared not to work in the browser even though the underlying pool changed.

Fix:
- Remove all four QA-only dataset instrumentation lines from updateRestaurantStatus().
- Keep production status text and restaurant count behavior unchanged otherwise.
- Re-run focused hours browser/model QA.
