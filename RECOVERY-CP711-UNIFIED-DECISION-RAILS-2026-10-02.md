# Recovery CP711 — Unified Decision Rails

Date: 2026-10-02
Repository: bdd79797979797979797979-web/dinliminates1
Branch: cp711-unified-decision-rails
Baseline: CP710 final (dda6d197ff0c3a0309bcc06470779a0f2be8227d)

## What changed
- Meals and Restaurants use the same shared decision-rail geometry.
- Removed the Restaurant-only CP684 rail override that could change positioning and press behavior.
- Changed decision-button feedback from vertical translation to a centered scale-only animation.
- Back, Cut, and Maybe now share the same active-state scale behavior across both screens.
- No restaurant-photo resolver logic was changed.

## Commit trail
- Functional CSS change: 200dc2dfd5db6c411cbe001c0315cabd67e71e34
- Build metadata update: ade900aa091c89b1a320bd5688703ccd62eadb25
- Recovery document creation: 819d21e1b738924ff3a939cca0993d92ccd592db
- This document correction commit: see the next commit on this branch.

## Recovery
Continue from branch `cp711-unified-decision-rails` if disconnected.
Earlier protected checkpoints remain intact: CP705, CP709, CP710.

## Verification target
Compare Meals vs Restaurants at an iPhone-width viewport:
1. Tap Back, Cut, and Maybe.
2. Confirm controls do not translate vertically or jump.
3. Confirm button centers, sizes, and gaps match.
4. Swipe the card and confirm the rail remains anchored identically on both screens.
