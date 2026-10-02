# CP724 Recovery — Navigation + Restaurant Card Cleanup — 2026-10-02

Changes:
- Winner/Hungry now hide the global Home app topbar, eliminating the duplicate Dinliminate header.
- Winner/Hungry use one 43px navigation row with Back at left and the gold Dinliminate wordmark immediately to its right.
- Meal and Restaurant Back actions no longer fall through to Home when there is no previous action.
- Meal and Restaurant Back buttons are disabled at the initial/first-item state.
- Restaurant front card now shows only its cuisine/category and Details icon; Website/Search Website is Details-only.
- Restaurant front-card website hydration was removed.
- Meal and Restaurant bottom decision rails use the same four-control layout: Back, Cut, Maybe, Choose.
- All/Maybe filter remains in the Quick Cuts/count row and uses compact green text, matching the row scale.
- Restaurant Details actions remain Website, Call, Directions in a balanced three-button grid.
- Meal and Restaurant Hide controls share the same premium treatment.

QA:
- JavaScript parse: PASS.
- Winner single-nav/header logic: PASS.
- Winner Back/brand placement and gold styling: PASS.
- Meal first-item Back behavior: PASS.
- Restaurant first-item Back behavior: PASS.
- Meal/Restaurant Back disabled state: PASS.
- Restaurant front-card Details present: PASS.
- Restaurant front-card Website utility and hydration absent: PASS.
- Restaurant Details Website/Call/Directions present: PASS.
- Shared Hide styling present: PASS.
- Meal/Restaurant four-control rails present and unified: PASS.
- Green All/Maybe + choice count styling present: PASS.
- Build/cache/checkpoint metadata: CP724 / build 724 / SW v724.

Note: the current CI/Vercel environment does not expose a live browser run, so no browser-run PASS is claimed.

Branch: `cp715-restaurant-maybe-home-winner`
