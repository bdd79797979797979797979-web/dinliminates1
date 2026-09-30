# Recovery Checkpoint CP449 — Compact Restaurant Radius/Search Row
Date: 2026-09-30

## Starting recovery point
- CP448 branch: `cp448-asian-quickcut-hungry-cleanup-2026-09-30`
- Recovery branch: `recovery-cp448-before-compact-radius-search-2026-09-30` (created after CP448; see branch history)
- CP448 preview: `https://deploy-preview-78--diliminate.netlify.app/`

## Changes
1. Moved Restaurant **Search** into the same compact row as **Radius** inside the Restaurant location controls.
2. Removed the separate full-width Search row so the Tinder card gets more vertical room.
3. Slightly increased the Restaurant Tinder card aspect ratio to use the reclaimed space.
4. Preserved the existing Restaurant Search button ID and JS binding, so search behavior remains unchanged.
5. Updated the app cache-busting query and release metadata to Build 154 / CP449.
6. Added static QA assertions that Search lives in the Radius row and no separate `restaurant-tools` row remains.

## Intended visual result
The Restaurant screen should have:
Address / My Location / Refresh
Radius + radius selector + Search + compact status
Quick Cuts
Larger Restaurant Tinder card

## Recovery
To return to the pre-change source, use branch `recovery-cp448-before-compact-radius-search-2026-09-30`.
