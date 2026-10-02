# CP722 Recovery — Decision Controls Cleanup — 2026-10-02

Unified Meals and Restaurants control hierarchy.

Changes:
- All/Maybe filter moved out of the bottom decision rail into the Quick Cuts header row.
- Header order is Quick Cuts on the left; compact green ALL/MAYBE control immediately before the green choice count on the right.
- All/Maybe uses explicit ALL / MAYBE labels instead of the former A / heart icon.
- Choice count is green to match the filter.
- Bottom rail now contains Back, Cut, Maybe, Choose for both Meals and Restaurants.
- Meal card no longer has Choose; Details remains next to cuisine/category.
- Restaurant card no longer has Choose; Details remains next to cuisine/category and Website remains on the card as the only website control.
- Existing button handlers continue to use the same winner / maybe-deck logic.

QA:
- app.js parse: PASS.
- Meal header All/Maybe: PASS.
- Restaurant header All/Maybe: PASS.
- Meal bottom Choose: PASS.
- Restaurant bottom Choose: PASS.
- Meal card Choose removed: PASS.
- Restaurant card Choose removed: PASS.
- Restaurant Website retained: PASS.
- Details placement next to cuisine/category: PASS.
- Explicit ALL/MAYBE renderer: PASS.
- Green compact styling: PASS.
- Build 722 / CP722 / SW v722: PASS.

Branch: `cp715-restaurant-maybe-home-winner`
