# RECOVERY-CP690-SMOOTH-SWIPES-2026-10-01

Checkpoint: CP690
Branch: cp690-smooth-swipes
Base: CP689 / 308ecf113026a5800333c63887b50dae3de8f018

## Purpose
Smooth the Meal and Restaurant card swipe interaction, with special attention to the Restaurant swipe becoming blurry/shaky farther into the drag and the Restaurant green Maybe button occasionally feeling sticky or failing to activate.

## Changes
- Swipe tracking now disables CSS transform transitions while the pointer is moving.
- Pointer movement is coalesced through requestAnimationFrame.
- Swipe translation uses compositor-friendly translate3d without integer rounding.
- Card opacity stays at 100% during the drag.
- Swipe cancel uses a short smooth return animation.
- Committed swipe exit timing matches the visual transition duration.
- Active swipe is marked with data-swipe-active.
- Restaurant photo hydration will not replace the active card image during an active swipe.
- Decision buttons use pointer activation plus a guarded click fallback, clear pressed state on release/cancel, capture their pointer when possible, and blur after activation to avoid sticky touch states.
- Unified decision rail is explicitly pointer-enabled and layered above surrounding content.
- JS/CSS cache versions and service-worker shell cache were advanced.
- No restaurant-photo catalog additions were made.

## Files
- app.js
- styles.css
- index.html
- sw.js
- app-release.json

## Expected behavior
- Meal and Restaurant cards follow the finger directly with no transition-induced lag.
- Restaurant photos remain visually stable while dragging.
- A swipe below threshold returns smoothly to center.
- A committed swipe exits decisively, then the next card renders.
- Restaurant Maybe button should respond on the first touch and release its pressed state reliably.

## QA
Static checks should include JavaScript syntax, CSS integrity, swipe handler wiring, Restaurant Maybe handler wiring, photo hydration guard, cache version alignment, and Netlify Deploy Preview status.
