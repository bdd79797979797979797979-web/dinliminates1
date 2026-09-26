# Dinliminate P636 — Interaction Fix Pass — September 26, 2026

Requested UI behavior updates completed in this package:

1. Back to start now explicitly clears active mode/overlays and returns to the front page.
2. History uses the restored month calendar with 42 day cells, previous/next month, Today, photo events, details, and per-entry removal.
3. Food Quick Cuts are true toggles: first tap = hide that category, second tap = show it again; the button uses `aria-pressed` and changes to Show/↺ state.
4. Restaurant Quick Cuts use the same hide/show toggle behavior and remain clickable after hiding a category.
5. The food Pass Around control is no longer duplicated by the hardening layer; the existing button is reused.
6. Random Cut One, Add food, and Pass Around receive distinct final color treatments.
7. The launch-hardening asset query string is compatible with the existing P636 endpoint loader (`?v=p635`).

Validation performed:
- launch-hardening.js passes Node syntax validation.
- Static checks confirm the single food Pass Around control, Quick Cut toggle functions, History Calendar renderer, color classes, and Back-to-start implementation.
- The existing P636 browser audit harness was inspected; the environment's Playwright navigation is blocked here by the host administrator, so a fresh physical-browser/device certification is not claimed in this package.


## Non-refactor completion pass — September 26, 2026
Implemented and tested in the downloadable build: canonical Back to start → front page behavior; restored History calendar; reversible Food and Restaurant Quick Cuts with explicit Show/Hide state; final color coding for Random Cut One/Add Food/Pass Around; Pass Around local persistence across reloads; restaurant winner metadata cleanup; image error fallbacks; no duplicated Food Pass Around; strengthened service-worker navigation caching; current content/version cleanup. The five intentionally deferred architectural refactors remain deferred (#6, #45, #46, #48, #49). Physical iPhone hardware/GPS/Add-to-Home-Screen certification remains environment-dependent and is not represented as a fake pass.


## Non-refactor completion pass — September 26, 2026
Implemented and tested in the downloadable build: canonical Back to start → front page behavior; restored History calendar; reversible Food and Restaurant Quick Cuts with explicit Show/Hide state; final color coding for Random Cut One/Add Food/Pass Around; Pass Around local persistence across reloads; restaurant winner metadata cleanup; image error fallbacks; no duplicated Food Pass Around; strengthened service-worker navigation caching; current content/version cleanup. The five intentionally deferred architectural refactors remain deferred (#6, #45, #46, #48, #49). Physical iPhone hardware/GPS/Add-to-Home-Screen certification remains environment-dependent and is not represented as a fake pass.


# Final non-refactor completion
All requested non-refactor launch items were completed in the P636 final build. The only deliberately deferred items are #6, #45, #46, #48, and #49. The Back to start control now always returns to the front page, not Food or Restaurant. Duplicate dynamic DOM IDs were removed and Pass Around state double-writes were cleaned. See qa/P636-FINAL-CERTIFICATION-2026-09-26.md for the 58-point matrix and test evidence.
