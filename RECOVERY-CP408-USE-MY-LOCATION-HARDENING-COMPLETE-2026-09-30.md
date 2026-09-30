# Recovery Checkpoint — CP408 — Use My Location Hardening Complete — 2026-09-30

Branch: cp348-search-six-point-certification-2026-09-30
Parent: CP407

Implemented:
- Added one-at-a-time location acquisition guard.
- Added disabled/busy/ARIA state for Use My Location while acquisition is active.
- Added location request sequence protection.
- Accepts an initial recent GPS fix quickly to start restaurant search.
- Starts a fresh high-accuracy GPS request with maximumAge=0.
- Only triggers a second restaurant search when the fresh fix differs by at least 0.1 mile.
- Reverse geocoding now has a 5-second client timeout and falls back to raw coordinates.
- If the fresh fix materially changes, it is reverse-geocoded separately so its address label matches the refreshed coordinates.
- Persisted device coordinates are reopened as last-used / "Last used location" until Use My Location is pressed again.
- Added and persisted locationFreshAt; address selections clear the device freshness timestamp.
- Reset flows clear the location freshness timestamp.
- App cache query bumped to app.js?v=348.
- Static QA and browser certification contracts were extended for location busy state, stale persisted-location labeling, bounded reverse geocoding, fresh-fix behavior, and movement threshold.

Validation:
- app.js syntax: PASS.
- clean-static-qa.js syntax: PASS.
- Fresh-coordinate reverse-geocode correction is included in this checkpoint.
- Live browser certification of this newest commit remains deployment-dependent; Netlify was still rebuilding when this checkpoint was recorded, while Vercel remains affected by the existing build-rate-limit condition.