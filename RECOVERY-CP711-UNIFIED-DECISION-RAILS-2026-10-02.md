# Recovery CP711 — Unified Decision Rails

Date: 2026-10-02
Repository: bdd79797979797979797979-web/dinliminates1
Branch: cp711-unified-decision-rails
Baseline: CP710 final (dda6d197ff0c3a0309bcc06470779a0f2be8227d)

## What changed
- Meals and Restaurants now use the same shared decision-rail geometry.
- Removed the Restaurant-only CP684 rail override that could change positioning and press behavior.
- Changed decision-button feedback from a vertical translate animation to a scale-only animation centered on the button.
- Back, Cut, and Maybe now share the same active-state scale behavior across both screens.
- No restaurant-photo resolver logic was changed.

## Recovery
Primary CP711 checkpoint commit: 2f0c9f0c0c5c4fcbf7c8a0f5f7f2d3b8f1a9f3a
Use branch `cp711-unified-decision-rails` to continue this work if disconnected.
Earlier protected checkpoints remain intact: CP705, CP709, CP710.

## Verification target
Compare Meals vs Restaurants on iPhone-width viewport:
1. Tap Back, Cut, Maybe.
2. Confirm controls do not translate vertically or jump.
3. Confirm button centers/sizes/gaps match exactly.
4. Swipe the card and confirm buttons remain anchored in the same rail.
