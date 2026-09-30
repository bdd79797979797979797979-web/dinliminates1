# Recovery Checkpoint CP453 — Final Restaurant Cleanup + Touch Targets
Date: 2026-09-30

Cumulative source line:
- CP449 compact Radius/Search row
- CP450 query-aware Restaurant search freshness + QA synchronization
- CP451 verified Google photo priority + normalized Hours in Details
- CP452 Google contact enrichment merges into existing rows
- CP453 dead hours-control cleanup + consolidated Restaurant CSS + larger invisible/compact touch targets

Recovery branches:
- recovery-cp449-before-restaurant-deep-hardening-2026-09-30
- recovery-cp450-before-photo-hours-2026-09-30
- recovery-cp451-before-contact-enrichment-2026-09-30
- recovery-cp452-before-final-restaurant-cleanup-2026-09-30

CP453 completed:
- Removed obsolete no-op Restaurant hours runtime function/calls.
- Removed obsolete hours-toggle styling.
- Consolidated CP443/CP444 Restaurant-specific styling into one current CP453 canonical block.
- Kept the premium Find/My Location palette and red/green decision controls.
- Increased Restaurant card utility touch targets while retaining compact icon visuals.
- Updated app cache-busting to app.js?v=453.
- Updated release metadata to Build 158 / CP453.
- Updated QA to current r20/build 158 and added current cleanup contracts.

Verification performed:
- app.js, api/restaurants.js, data/restaurant-taxonomy.js, qa/clean-static-qa.js and targeted QA sources parse with the JavaScript parser.
- Restaurant API test exports load successfully in an isolated harness.
- 50-mile discovery plan returns 7 overlapping 50-mile coverage circles.
- Google contact enrichment patch updates the existing target row without creating a second restaurant.
- Google Place photo priority returns Google hydration as the primary source with provider image as fallback.
- Current HTML contains no hoursToggle and no restaurant-tools element.
- Current app contains no dead renderHours or setRestaurantHoursMode runtime code.
- Remaining r19 references were removed from Restaurant QA.

Deployment:
- CP453 PR is the cumulative launch-hardening line.
- Netlify preview URL will be verified from the PR deployment notification before being reported.
