# Recovery — CP708 Full Audit Final Hardening

Date: 2026-10-02
Build: 708
Checkpoint: CP708
Branch: `cp708-full-audit-final-hardening`
Clean baseline: `clean-cp704-2026-10-02`

## Protected product choices
- Home: **Dine In — Reveal Your Meal**
- Home: **Dine Out — Reveal Your Restaurant**
- Home tagline: **Beautifully swipe until it’s revealed.**
- Restaurant Search UI: intentionally hidden
- Restaurant Open/All UI: intentionally hidden

## CP708 hardening
- Synchronized release metadata to Build 708 / CP708.
- Updated app fallback build to 708.
- Advanced index asset queries to v675.
- Advanced service-worker shell cache to v676.
- Service worker now uses `cache.match(req,{ignoreSearch:true})` for shell assets so versioned requests can use cached unversioned shell entries offline.
- Removed obsolete `#iphoneHelp` CSS.
- Preserved per-entry History calendar X deletion.
- Preserved per-note Meal/Restaurant Add/Edit/× controls.
- Restaurant card utility controls use 44px hit areas.
- Active QA contracts are current; obsolete historical GitHub Actions workflows were removed.
- Visual QA now includes Home, Meal, Winner, Settings, and Restaurant-start surface smoke in addition to the Restaurant visual baseline.
- Restaurant photo/website fetch layers retain validated redirect handling.

## Audit conclusion at CP708
The main remaining launch gates are external/runtime certification:
- hosted `dinliminate22` certification,
- physical iPhone Safari/PWA certification,
- final third-party image rights/source review.

CP704 remains the protected clean copy for rollback.
