# CP722 Recovery — Restaurant Details + Shared Hide Controls — 2026-10-02

Cleaned up Restaurant Details utility actions and standardized Hide controls.

Restaurant Details:
- Website, Call, and Directions now use one equal three-column action system.
- Each action has an icon plus a visible compact label.
- Removed the prior sr-only label presentation that could create uneven/sloppy button sizing.
- Buttons use fixed equal-height/width grid cells and responsive 390px sizing.
- Existing links and destinations remain unchanged.

Hide controls:
- Meal and Restaurant Details now use the same visual Hide button treatment.
- Both use the same eye-off icon, dimensions, typography, color, border, focus, hover, and press behavior.
- Existing `foodHideItem` and `restaurantHide` wiring remains intact.

QA:
- JavaScript syntax: PASS.
- Meal Hide action present.
- Restaurant Hide action present.
- Shared Hide SVG present in both.
- Website / Call / Directions visible labels present.
- Three-column equal action layout present.
- Shared Hide styling present.
- Build 722 / checkpoint CP722 / SW v722 / cache-bust v722 verified.

Branch: `cp715-restaurant-maybe-home-winner`
