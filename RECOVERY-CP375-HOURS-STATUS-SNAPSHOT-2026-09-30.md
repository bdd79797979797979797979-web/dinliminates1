# Recovery Checkpoint — CP375 — Hours Certification Failure Analysis — 2026-09-30

Baseline before CP375 correction:
- Branch: cp348-search-six-point-certification-2026-09-30
- Previous recovery checkpoint: CP374
- Backend restaurant provider, classification, dedupe, hybrid search, radius discovery, and reliability suites passed.
- Six-point browser certification reached the hours section.
- Failure: QA assertion comparing status data-hoursVisible with restaurantCount.
- Diagnosis: updateRestaurantStatus() recomputes restaurantPoolFiltered() independently, while drawRestaurants() already has a rendered rows snapshot. The two evaluations can drift during dynamic state changes.
- Planned correction: pass the exact rendered rows into updateRestaurantStatus(rows), use that same array for visible-count instrumentation, then rerun the complete certification.
