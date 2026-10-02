# Recovery Checkpoint — CP682 Unified Card Layout
Date: 2026-10-01
Base: CP681 / cp681-restaurant-refresh-control
Branch: cp682-unified-card-layout

## Scope
Unify the Meal and Restaurant card anatomy while preserving restaurant-only metadata.

## Changes
- Meal cuisine category is now text-only: no pill/circle background.
- Meal card action order is Choose, Details.
- Restaurant card action order is Choose, Details, Website.
- Restaurant actions now sit immediately to the right of cuisine type rather than at the far right.
- Restaurant address and distance are combined into one compact metadata line: address • miles away.
- Card utility sizing/spacing is aligned between Meal and Restaurant cards.
- No bottom swipe controls, search, location, radius, restaurant photos, or decision logic changed.

## QA
- app.js parse PASS
- Meal action order PASS
- Restaurant action order PASS
- Unified restaurant address/distance markup PASS
- Meal cuisine text-only CSS PASS
- Restaurant inline utility placement PASS
- Compact metadata PASS
- Shared utility spacing PASS

No Google API credentials added.
