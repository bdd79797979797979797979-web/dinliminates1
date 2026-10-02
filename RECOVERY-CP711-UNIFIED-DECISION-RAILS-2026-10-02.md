# Recovery CP711 — Unified Decision Rails

Date: 2026-10-02
Repository: bdd79797979797979797979-web/dinliminates1
Branch: cp711-unified-decision-rails
Baseline: CP710 final (dda6d197ff0c3a0309bcc06470779a0f2be8227d)

## What changed
- Meals and Restaurants use the same shared decision-rail geometry.
- Removed the Restaurant-only CP684 rail override that could change positioning and press behavior.
- Removed the timed button-jump animation from decision controls.
- Back, Cut, and Maybe now use the same stable press-only scale feedback on both screens.
- No restaurant-photo resolver logic was changed.

## Commit trail
- Final app interaction change: 5fdc1a4d93d033002a3dcc27d4e3980ae72fa9db
- Final rail CSS change: d879907b57513cb9b5ef6d03df8131c6246a4a98
- CP711 build metadata: ade900aa091c89b1a320bd5688703ccd62eadb25
- Earlier superseded CSS pass: 200dc2dfd5db6c411cbe001c0315cabd67e71e34
- This recovery document was corrected earlier on the branch; this update records the final functional commits.

## Recovery
Continue from branch `cp711-unified-decision-rails` if disconnected.
Earlier protected checkpoints remain intact: CP705, CP709, CP710.

## Verification target
At an iPhone-width viewport, compare Meals and Restaurants:
1. Tap Back, Cut, and Maybe.
2. Confirm none of the controls translate vertically or jump.
3. Confirm button centers, sizes, and gaps match.
4. Swipe the card and confirm the rail remains anchored identically on both screens.
5. Confirm the press feedback is the same scale response on both screens.
