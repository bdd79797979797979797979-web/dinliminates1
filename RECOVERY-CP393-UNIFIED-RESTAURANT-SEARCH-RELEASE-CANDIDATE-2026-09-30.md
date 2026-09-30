# Recovery Checkpoint — CP393 — Unified Restaurant Search Release Candidate — 2026-09-30

Implemented:
- Shared restaurant taxonomy is now authoritative in data/restaurant-taxonomy.js.
- Browser and API use the same normalization, category/type search classification, identity profiles, Quick Cut tags, and classification evidence.
- Named restaurant queries are kept as name/brand/operator searches.
- Category/type queries map to canonical Restaurant Quick Cut associations.
- Recognized category/type queries expand provider discovery with bounded aliases.
- API results carry quickCutTags and quickCutEvidence from the shared classifier.
- Google category/type query variants are parallelized.
- Browser certification adds fish, pizza restaurant, and breakfast restaurant semantic searches.
- Burger search test distinguishes a true burger restaurant from an American restaurant with only one incidental burger menu item.
- Service worker shell now includes the shared taxonomy and cache v376.
- App/release build is 145.

Pending:
- Full CI validation of the release candidate.
- Final deploy-preview verification after CI.
