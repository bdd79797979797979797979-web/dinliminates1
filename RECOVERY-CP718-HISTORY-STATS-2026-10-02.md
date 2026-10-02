# CP718 Recovery — History Stats — 2026-10-02

Added a compact **Your Stats** panel to History.

Stats shown:
- Meals chosen
- Restaurants chosen
- Total decisions
- Current streak (consecutive days ending today)
- Most-used meal Quick Cut

Behavior:
- History calendar remains the primary view.
- **Your Stats** toggles the panel open/closed without leaving History.
- All calculations use the existing local History records.
- Meal Quick Cuts are now stored with new history entries so the Quick Cut statistic can be accurate going forward.
- Existing history entries without quickCuts fall back to their recorded category/cuisine.
- Clearing or deleting history re-renders History and therefore recalculates the stats.

QA:
- app.js parses successfully.
- Stats button, panel, calculations, toggle wiring, and Quick Cut history storage verified.
- CP718 build/checkpoint metadata and service-worker cache are updated.

Branch: `cp715-restaurant-maybe-home-winner`
