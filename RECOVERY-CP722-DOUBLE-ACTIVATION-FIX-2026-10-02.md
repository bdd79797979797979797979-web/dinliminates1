# CP722 Recovery — Prevent Double Cut/Maybe Activation — 2026-10-02

Root cause of the reported `3 choices -> 1 left` behavior:
- `bindCardButton` listened to both `pointerup` and `click`.
- The first event triggered the action and caused a redraw/rebind.
- The browser's follow-up `click` then hit the newly rebound handler, whose local activation timestamp had been reset.
- One physical tap could therefore execute Cut or Maybe twice.

Fix:
- Activation timestamp is now stored on the button element as `__dinliminateLastActivation`, so it survives redraw/rebinds.
- The existing 450ms duplicate-event guard now remains effective across the rebind.
- Applies to meal and restaurant card action buttons using `bindCardButton`.

Verification:
- Executed the actual branch `bindCardButton` source in a synthetic event sequence.
- Pointerup followed by click after redraw/rebind: PASS — one activation.
- Click after guard window: PASS — activation allowed.
- JavaScript source remains parseable.
- Default meal catalog has 116 meals with 116 unique IDs; Banana Split and Ice Cream have unique IDs.

Build:
- CP722 / build 722
- Service worker cache v722
- Asset cache-bust v722

Branch: `cp715-restaurant-maybe-home-winner`
