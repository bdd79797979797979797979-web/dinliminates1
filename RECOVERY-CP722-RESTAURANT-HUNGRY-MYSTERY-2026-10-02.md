# CP722 Recovery — Restaurant Hungry Mystery Pick — 2026-10-02

Restaurant Hungry mode now uses a **Mystery Pick** instead of the meal Dinner Wheel.

Exact message:
“You eliminated everything. It’s either this or Waffle House.”

Behavior:
- Restaurant Hungry mode shows the Mystery Pick panel.
- It never invents Waffle House; Waffle House appears only in the humorous message.
- The mystery candidate comes from the already-loaded restaurant pool.
- Current restaurant search/query is respected.
- Hidden restaurants are excluded.
- Active restaurant Quick Cut categories are respected.
- Individual restaurant cuts can still serve as a last-chance mystery pool because the user has already exhausted the normal deck.
- Restaurant results are de-duplicated before selection.
- The mystery card shows a blurred restaurant image until Reveal.
- Reveal displays the actual restaurant name, category, and distance/address context.
- Try Another selects a different restaurant when at least two candidates exist and disables itself when only one exists.
- Choose This enters the normal Restaurant Winner flow and records the actual restaurant choice in History.
- No new restaurant search/API call is required.

Previous meal Hungry wheel remains unchanged and is shown only for food Hungry mode.

QA:
- app.js syntax parse: PASS.
- Exact Waffle House message: PASS.
- Restaurant Hungry detection: PASS.
- Mystery Pick panel and actions: PASS.
- Current search pool usage: PASS.
- Hidden restaurant filtering: PASS.
- Quick Cut filtering: PASS.
- Actual restaurant photo resolver: PASS.
- Choose This winner flow: PASS.
- Try Another wiring: PASS.
- One-option Try Another disable: PASS.
- Meal wheel remains separate: PASS.
- Live Chromium test was attempted but the container could not resolve github.com, so no live browser PASS is claimed.

Build:
- CP722 / build 722
- Service worker cache v722
- Asset cache-bust v722

Branch: `cp715-restaurant-maybe-home-winner`
