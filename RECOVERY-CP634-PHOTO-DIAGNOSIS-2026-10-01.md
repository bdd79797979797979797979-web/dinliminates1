# Recovery Checkpoint — CP634 — Restaurant Photo Diagnosis — 2026-10-01

Purpose:
- Diagnose why the current user-facing build appears to have no restaurant photos.
- Known cause from CP633: unverified provider photos were deliberately removed from card rendering.
- Current card fallback now remains neutral until /api/restaurant-photo successfully verifies an exact restaurant photo.
- Therefore a 404/503 from the photo resolver produces no restaurant photo instead of an unrelated one.
- Production was previously confirmed stale at CP592; the corrected photo resolver was only verified on Netlify preview builds.
