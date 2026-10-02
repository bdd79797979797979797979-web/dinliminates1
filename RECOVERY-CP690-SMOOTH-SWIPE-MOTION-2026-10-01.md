# CP690 — Smooth Direct Swipe Motion
Date: 2026-10-01

## Base
CP689 / PR #161
Base commit: 308ecf113026a5800333c63887b50dae3de8f018

## Change
Focused swipe-smoothness pass for both Meal and Restaurant cards.

- Disable the card's CSS transform transition while the finger is actively dragging.
- Follow pointer movement directly with unrounded translate3d values.
- Keep card opacity at 100% during the drag so food/restaurant photos do not progressively soften.
- Reduce drag rotation to a gentler capped angle.
- Use a short cubic-bezier exit animation only after the swipe commits.
- Use a short cubic-bezier settle-back animation for sub-threshold releases.
- Add a swipe-active compositing layer/backface rule for both card stacks.
- Preserve the existing 90px commit threshold, Cut/Maybe behavior, haptics, card layout, controls, restaurant photo system, and search/location system.
- Bump browser asset/cache versions.

## Files
- app.js
- styles.css
- index.html
- sw.js
- app-release.json
- release-manifest.json

## Intended QA
1. Slow Meal swipe left/right: card should track the finger without visible stepping.
2. Slow Restaurant swipe left/right: card should remain sharp and stable while moving.
3. Long swipe: no opacity fade or increasing blur during drag.
4. Release before threshold: card should smoothly settle back.
5. Commit at threshold: card should smoothly exit and then perform the existing action.
6. Confirm Cut/Maybe/Back/Choose/Details remain wired.
7. Confirm restaurant search/location/radius and photo hydration remain unchanged.

## Recovery
To restore CP689 exactly, reset/checkout:
308ecf113026a5800333c63887b50dae3de8f018
