# RECOVERY — CP701 APP DIAGNOSIS REFRESH — 2026-10-02

## Branch
- `cp701-app-diagnosis-refresh`

## Change
- Rebuilt App Diagnosis for the current Dinliminate application state.
- Removed stale UI-ID checks and replaced them with current Home, Meal, Restaurant, iPhone/PWA, and release checks.
- Added current CP700 Home Add to Phone / Share verification.
- Added 1/3/5/10/25/50/100-mile, Restaurant search/location/Quick Cut/Open-All/photo/API checks.
- Added current iPhone install/share/Safari/GPS protections.
- Synchronized Build 701 / CP701 metadata and bumped app.js cache query to v670.

## Parent recovery
- `cp700-premium-home-actions`

## Status
- Candidate branch; not production.

Final source review:
- Removed all runtime references to the old source-text audit variable.
- App Diagnosis now uses live function/DOM contracts instead of inspecting an unavailable source string.
- Added a direct Choose-this placement check.
