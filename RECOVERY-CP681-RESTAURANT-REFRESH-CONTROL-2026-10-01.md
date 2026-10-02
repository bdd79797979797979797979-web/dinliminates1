# Recovery Checkpoint — CP681 Restaurant Refresh Control
Date: 2026-10-01
Base: CP680 / cp680-unified-swipe-controls
Branch: cp681-restaurant-refresh-control

## Scope
Restyle the Restaurant top-right Find/Refresh control only.

## Requested result
- Same 36px footprint as the Current Location and Restaurant Search circular controls.
- Black circular background.
- Gold outline.
- Gold refresh icon while idle.
- Gold spinner while searching/loading.

## Wiring
- Existing refresh/find state logic in renderFindButton and setFindBusy remains intact.
- Existing click handler still calls searchRestaurants().
- No restaurant search/radius/location behavior was changed.

## QA
qa/cp681-restaurant-refresh-control.cjs checks exact size, circle shape, colors, icon/spinner styling, and refresh/search wiring.

No Google API credentials added.
