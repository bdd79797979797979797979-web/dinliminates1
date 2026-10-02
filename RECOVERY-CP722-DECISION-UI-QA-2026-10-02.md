# CP722 Recovery — Decision UI Layout QA — 2026-10-02

Verified the current Meal and Restaurant decision layout requested by the user.

Layout:
- All/Maybe filter is in the top Quick Cuts row, immediately before the choices count, for both Meals and Restaurants.
- All/Maybe is compact (22px tall) and green.
- Choices count is green and shares the same compact row treatment.
- All/Maybe is not present in the bottom decision rail.
- Bottom decision rail is Back, Cut, Maybe, Choose for both Meals and Restaurants.
- Choose is not on the card.
- Meal card has only the Details icon next to the cuisine/category.
- Restaurant card has Details next to cuisine/category plus the Website utility; Choose is not on the card.

Wiring:
- Meal All/Maybe uses the shared `setMaybeDeck('food', ...)` / `bindMaybeDeckToggle('food')` path.
- Restaurant All/Maybe uses the shared `setMaybeDeck('restaurant', ...)` / `bindMaybeDeckToggle('restaurant')` path.
- Meal Choose is wired to `winner(item)`.
- Restaurant Choose is wired to `winner(current)`.
- Meal Details opens the existing meal details sheet.
- Restaurant Details opens the restaurant details sheet.
- Restaurant Website remains the in-card external website action.

QA:
- JavaScript parse: PASS.
- Meal top-row filter/count order: PASS.
- Restaurant top-row filter/count order: PASS.
- Bottom rail IDs/order: PASS for both.
- Old bottom All/Maybe removed: PASS for both.
- Choose absent from cards: PASS for both.
- Details placement: PASS for both.
- Restaurant Details + Website card utilities: PASS.
- Green All/Maybe styling: PASS.
- Green choice-count styling: PASS.
- Compact 22px filter height: PASS.
- Choose wiring: PASS for both.
- Waffle House Hungry line and Mystery Pick wiring remain present.

A dedicated Playwright browser test exists at `qa/cp722-decision-ui-user-test.cjs`. The environment did not expose a runnable GitHub Actions result for the branch, so no browser-run PASS is claimed.

Branch: `cp715-restaurant-maybe-home-winner`
Checkpoint: CP722 / build 722
