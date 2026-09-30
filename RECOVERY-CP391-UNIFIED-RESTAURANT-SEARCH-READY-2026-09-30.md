# Recovery Checkpoint — CP391 — Unified Restaurant Search Implementation Ready for Validation — 2026-09-30

Production changes since CP390:
- Shared taxonomy module is authoritative for Restaurant Quick Cut tags, normalization, search classification, identity profiles, and classification evidence.
- Browser search:
  - Uses shared taxonomy for category/type search.
  - Named restaurant searches remain name/brand/operator text searches.
  - "pizza restaurant", "mexican food", "fish", "burger", etc. resolve to the same category tags used by Quick Cuts.
- API search:
  - Uses the shared taxonomy normalization and query classification.
  - Recognized category/type searches expand into bounded provider aliases.
  - Overpass searches name/brand/operator/cuisine against the same bounded alias set.
  - Photon, ArcGIS, and Google text search use bounded variants; Google variants are parallelized.
  - API results now carry quickCutTags and quickCutEvidence from the shared classifier.
- Restaurant Quick Cuts use API-provided tags when present, with shared-taxonomy fallback for compatibility.

Validation pending:
- Syntax and shared taxonomy smoke.
- Six-point browser certification.
- Broader Clean QA.
- Release/cache rotation after green validation.
