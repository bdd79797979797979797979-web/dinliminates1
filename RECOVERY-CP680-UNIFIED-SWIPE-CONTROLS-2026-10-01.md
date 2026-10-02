# Recovery Checkpoint — CP680 Unified Swipe Controls
Date: 2026-10-01
Base: CP679 / cp679-tourism-publication-photo-discovery
Branch: cp680-unified-swipe-controls

## Requested interaction
Meals and Restaurants now share the same bottom decision rail:
Back | CUT | MAYBE | Show/Maybe

CUT and MAYBE are the two larger middle controls. The four-button group is centered as one unit.

## Card/details changes
- Removed Add Meal from the Meal bottom controls.
- Removed Hide from the Meal bottom controls.
- Removed Hide from the Restaurant bottom controls.
- Hide is available only in Details:
  - Hide this meal
  - Hide this restaurant
- Both Details hide actions use the hide icon.
- Existing card Details/Choose controls remain untouched.

## Wiring
- Meal bottom IDs: foodBack, foodCut, foodMaybe, foodMaybeDeck.
- Restaurant dynamic bottom IDs: restBack, restCut, restMaybe, restaurantMaybeDeck.
- Stale startup bindings for removed Meal Hide/Add controls removed.
- Restaurant Hide card binding removed.
- Restaurant Details hide is wired to restaurantHide(item).
- Meal Details hide remains wired to foodHideItem(item).

## QA
qa/cp680-unified-swipe-controls.cjs checks control order, stale bindings, Details-only hide, and centered/larger-middle-button styling.

No restaurant search/photo/location logic changed.
