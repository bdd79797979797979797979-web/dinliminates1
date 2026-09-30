# Recovery Checkpoint — CP390 — Unified Restaurant Search Wiring Applied — 2026-09-30

Changes since CP389:
- Added shared data/restaurant-taxonomy.js used by browser and API.
- Shared taxonomy now owns:
  - Restaurant Quick Cut labels.
  - Search aliases.
  - Search classification (named restaurant vs category/type).
  - Identity profiles.
  - Menu corroboration signals.
  - Restaurant classifier and evidence.
  - Search normalization.
- app.js now consumes shared taxonomy for REST_QUICK, normalization, restaurant classification, and category/type search.
- api/restaurants.js now consumes shared taxonomy for normalization, provider query expansion, and quickCutTags/quickCutEvidence returned with restaurant results.
- Photon/ArcGIS/Google/Overpass category searches use bounded taxonomy aliases; named-restaurant searches remain tight.
- Browser search of category terms now uses the same classifier tags as Quick Cuts.

Validation still pending:
- Syntax.
- Shared taxonomy search matrix.
- Browser six-point certification.
- Broader Clean QA.
- Release/cache rotation after validation.
