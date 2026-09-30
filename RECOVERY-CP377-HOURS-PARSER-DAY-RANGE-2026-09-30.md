# Recovery Checkpoint — CP377 — Hours Parser Day-Range Fix — 2026-09-30

CP376 follow-up after focused QA exposed:
- Server hours model smoke failed scheduled-hours classification because serverDayMatches used full three-letter names (mon/tue/...) while the OSM-style parser emits two-letter abbreviations (Mo/Tu/...).
- Browser six-point certification stopped before hours at a timing-sensitive typed restaurant-query assertion.

Fixes planned:
1. Align server weekday matching with Mo/Tu/We/Th/Fr/Sa/Su abbreviations.
2. Give the browser debounce/provider-request assertion a longer deterministic settle window while keeping the provider-query requirement.
3. Re-run focused hours model and browser certification.
