# CP726 Recovery — First-Entry Swipe Hint — 2026-10-02

Moved the existing first-entry Cut/Maybe gesture hint to a compact bottom-right instructional bubble.

Behavior:
- Shows only once via the existing localStorage gate.
- Appears when entering Meals and Restaurants.
- Sits above the bottom decision controls so it does not cover Cut/Maybe.
- Uses the existing directional wording: “← Cut · Swipe · Maybe →”.
- Compact premium treatment with translucent dark background and subtle border/shadow.

QA:
- JavaScript syntax: PASS.
- One-time gating: PASS.
- Meals invocation: PASS.
- Restaurants invocation: PASS.
- Bottom-right positioning: PASS.
- Above-controls positioning: PASS.
- Compact bubble styling: PASS.
- Build 726 / checkpoint CP726 / service-worker v726 / asset cache v726 verified.

Branch: `cp715-restaurant-maybe-home-winner`
