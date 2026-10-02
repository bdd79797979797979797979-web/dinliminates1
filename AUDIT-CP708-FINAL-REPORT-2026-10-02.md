# Dinliminate Full App Audit — CP708 Final Report

Date: 2026-10-02

## Protected baseline
- Clean copy: `clean-cp704-2026-10-02`
- Latest hardening candidate: `cp708-full-audit-final-hardening`
- Build: 708
- Checkpoint: CP708
- Restaurant API: r25

## Product state verified in source
### Home
- **Dinner Decisions Simplified**
- **Beautifully swipe until it’s revealed.**
- **Dine In — Reveal Your Meal**
- **Dine Out — Reveal Your Restaurant**
- Vibrant Dine In hero image and steak Dine Out hero image retained.
- Add-to-phone and Share are separate icon controls with 44px hit areas.

### Meals
- 116 built-in meals.
- No duplicate meal names or IDs.
- Required meal Details data is present.
- Food Quick Cut taxonomy/order remains current.
- Pork Quick Cut remains removed.
- Stouffer/frozen-dinner legacy display entries remain removed.
- Cut / Maybe / Choose / Details remain wired.
- Stabilized swipe engine uses pointer capture and requestAnimationFrame motion.
- Notes support Add / Edit / × delete.
- Manage Meals supports Add / Edit / Hide / Restore / custom Delete.
- Pass Around remains absent from the active UI/runtime.

### Restaurants
- Use My Location, address entry/autocomplete, Find/Refresh, and 1/3/5/10/25/50/100-mile radius controls remain wired.
- Restaurant Quick Cuts include Fast Food and current category taxonomy.
- Active result pool is rebuilt from fresh search responses and deduplicated.
- Restaurant cards use stabilized swipe motion and 44px card utility hit areas.
- Restaurant Details includes category/cuisine/location/distance/status/hours/contact/Website/Call/Directions/Notes/Hide.
- Restaurant photo pipeline includes venue-specific sourcing and safe fallbacks.
- No Google image/API credential is required by the client photo path.
- **Restaurant Search UI remains intentionally hidden.**
- **Restaurant Open/All UI remains intentionally hidden.**

### Persistence / utilities
- Notes remain device-local.
- History supports calendar browsing, individual entry X deletion, Details, and Clear All.
- Reset App Data clears local state, Notes/history, and stored custom photos.
- System Restore preserves custom meals/history while resetting built-in round state.
- Share and Add-to-phone fallback flows remain wired.
- PDF export remains wired.

### PWA / iPhone
- Safe-area viewport is present.
- Restaurant editable fields use Safari-safe 16px sizing.
- Location actions and restaurant card utility controls use comfortable touch areas.
- Service-worker shell cache is now v676.
- Service worker uses `ignoreSearch:true` when looking up cached shell assets, allowing versioned `?v=` requests to reuse unversioned cached files offline.

## Security hardening
- Restaurant website/photo external fetches validate redirect hops before following them.
- Image proxy uses explicit host allowlisting.
- No repository search found exposed live/API/private-key patterns in the audited source.

## QA / CI hardening
- Active static/browser/iPhone/hosted smoke contracts are synchronized to Build 708 / CP708 and API r25.
- Hidden Search and Open/All are explicitly protected by QA.
- History individual-entry deletion is covered by browser smoke.
- Visual regression still checks the Restaurant start baseline and now supports surface smoke for Home, Meal, Winner, and Settings.
- Obsolete historical GitHub Actions workflows tied to CP643/648/650/652/654/655/656 and the old hours test have been removed from the active workflow directory.
- Current active workflows are the clean QA, fast browser, manual hosted Netlify, manual hosted Vercel, and manual Netlify-live smoke paths.

## Hosting / runtime evidence
- CP708 has **not** produced a new Vercel deployment at the time of this report.
- GitHub Actions reports no workflow run for the latest CP708 commit.
- Current Vercel commit status is failing because of the connected account's build-rate limit, not because of a CP708 build error.
- The latest accessible hosted Vercel preview before CP708 remains an older deployment; it cannot certify the CP708 fixes.
- The requested Netlify target `dinliminate22` has not been certified from the connected tooling.

Historical Vercel runtime telemetry for the project showed 22 timeout errors across restaurant/photo APIs and 447 Node `url.parse()` deprecation warnings in the prior 7-day window. Those events belong to earlier deployments and are not evidence that CP708 currently reproduces them.

## Final launch gates
1. Live hosted certification of CP708 at `dinliminate22` or the authoritative hosted target.
2. Physical iPhone Safari/PWA verification of install, GPS permission, swipe behavior, touch controls, and Share/Add-to-Home-Screen.
3. Final third-party food/restaurant image rights and redistribution review.

## Recovery
For a clean rollback, use `clean-cp704-2026-10-02`.
For the completed full-audit hardening state, use `cp708-full-audit-final-hardening`.
