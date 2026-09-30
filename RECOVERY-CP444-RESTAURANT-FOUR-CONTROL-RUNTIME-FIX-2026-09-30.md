# Recovery Checkpoint CP444 — Restaurant Four-Control Runtime Fix — 2026-09-30

## Parent / recovery
- Parent source: CP443
- Parent commit: bfd4d04ee7b172695a80bbea94d09f0be3279458
- Recovery branch: recovery-cp443-before-four-failures-2026-09-30
- Working branch: cp444-fix-four-restaurant-controls-2026-09-30

## User-reported failures investigated
1. Restaurant Details icon did not open Details.
2. Orange remained on restaurant Search/Refresh controls.
3. Restaurant card swipe did not work.
4. Restaurant bottom decision buttons did not work.

## Root cause
CP443 restaurant rendering called `bindCardButton()`, but that helper was absent from app.js. The resulting ReferenceError stopped execution of `drawRestaurants()` after the restaurant HTML was inserted but before button bindings and restaurant swipe binding completed. This explains the cluster of non-working Details, bottom controls, and swipe behavior.

The CP443 restaurant CSS was also scoped to `.restaurant`, while the restaurant section in index.html did not carry the `.restaurant` class. As a result, the premium neutral restaurant overrides did not apply and the generic orange `.find` / `.cut` styling remained visible.

## CP444 fixes
- Restored a shared `bindCardButton(id, handler)` helper with guarded click handling.
- Rebound Restaurant Details through the shared helper.
- Preserved Restaurant swipe binding after all control bindings.
- Added the missing `.restaurant` class to the restaurant decision section.
- Added hard `#restaurant` styling for Search, Find/Refresh, location, and red/green decision circles so restaurant controls do not inherit the Food orange palette.
- Bumped app.js query to `?v=444` to prevent stale cached JavaScript from masking the fix.
- Bumped release identity to Build 149 / CP444.
- Added static QA assertions for the missing helper, Details binding, restaurant scope class, cache-busting query, and explicit restaurant control styling.

## Verification status
- Source-level root cause: verified.
- Source-level fix: applied.
- Static JavaScript syntax is covered by existing QA `vm.Script` checks.
- Live hosted browser interaction remains environment-dependent until the new Netlify preview is available; the next verification target is the CP444 Netlify preview.

## Resume instruction
Continue from CP444 after deployment/browser verification. Do not revert to CP442 or closed PR #73.
