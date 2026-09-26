# Dinliminate P636 — Launch Candidate

This package preserves the uploaded P636 interface and adds the launch-hardening layer for food/restaurant elimination, persistence, address search, radius control, iPhone layout, history/settings, and service-worker cache versioning.

## Launch fixes in this candidate
- Restaurant radius ceiling is 100 miles.
- Restaurant address search uses ArcGIS/Census/Photon fallbacks, with address-specific ArcGIS candidate lookup for autocomplete.
- City/location results are separated from arbitrary POI matches by address scoring.
- Restaurant search keeps restaurants and fast food in one combined pool.
- Stable restaurant IDs are generated from OSM identities or deterministic fallbacks.
- Duplicate restaurant search/pass controls are removed at runtime.
- Open-now filter control is removed from the launch UI.
- Legacy “/ Order” wording is normalized.
- Apple touch icon and PWA manifest include PNG icons.
- Service worker cache key is bumped for the launch build.
- Prior P633/P634 saved-round state remains readable.

## QA
`qa/p636-local-audit.py` and `qa/p636-full-audit-run.py` are included as regression harnesses.

## Important
Restaurant provider availability depends on network/provider response and should be smoke-tested after deployment from the production domain.
