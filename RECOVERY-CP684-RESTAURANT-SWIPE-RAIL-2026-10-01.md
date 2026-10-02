# Recovery Checkpoint — CP684 Restaurant Swipe Rail
Date: 2026-10-01
Base: CP683 / cp683-restaurant-button-polish
Branch: cp684-fix-restaurant-swipe-rail

## Problem
An older, more-specific #restaurant .swipe-actions rule constrained the Restaurant bottom rail to 255px, causing the All/Maybe A circle to overlap the Cut and Maybe buttons.

## Fix
- Explicitly override that specificity conflict for #restaurant .unified-swipe-actions.
- Restaurant rail is now full-width, centered, non-wrapping.
- Button order remains Back → Cut → Maybe → All/Maybe.
- Back = 44px, Cut = 60px, Maybe = 60px, All/Maybe = 44px.
- All/Maybe stays blue with black A or heart.
- All four controls retain their existing event wiring.

## QA
- app.js syntax PASS
- Back wiring PASS
- Cut wiring PASS
- Maybe wiring PASS
- All/Maybe wiring PASS
- Full-width centered rail PASS
- Button sizing PASS
- Static positioning PASS
- Blue A/heart styling PASS

No restaurant search, location, radius, photo, or data logic changed.
