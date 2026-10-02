# CP720 Recovery — Hungry Dinner Wheel — 2026-10-02

Hungry mode is redesigned as a second-chance dinner wheel.

User-facing flow:
- Message: “You eliminated everything. It’s either this or Fish Sticks.”
- A visual wheel contains every currently available meal from the same app catalog.
- Hidden meals are excluded; deleted meals are already absent from `allFoods()`.
- Wheel spins forward through multiple full rotations.
- After stopping, a result card shows the selected meal name and photo.
- **Choose This** turns the wheel choice into the normal Dinliminate winner flow.
- **Spin Again** repeats the wheel without reversing the animation.
- Existing **Share** and **Start over** actions remain.
- Existing winner Back button remains available.

Engineering:
- SVG wheel segments are generated dynamically from `allFoods()`.
- Current available meal count is shown on the Hungry panel.
- Cumulative rotation prevents reverse/jump behavior on repeated spins.
- Spin-token guard prevents stale animation callbacks after leaving/resetting Hungry mode.
- QA-only wheel index hook is included for deterministic automated testing.

Verification:
- JavaScript syntax check: PASS.
- Built-in food data evaluation: PASS — 116 meals, unique IDs.
- Wheel geometry: PASS — 116 distinct slice centers.
- Dynamic sector generation: PASS.
- Current active pool filtering: PASS.
- Forced deterministic test selection: PASS.
- Cumulative forward rotation logic: PASS.
- Hungry message / wheel / Choose This / stale-spin guard: PASS.
- Playwright browser test script and GitHub Actions workflow were added.
- A temporary draft QA PR (#166) was created to obtain a CI browser run; no workflow run was exposed by the current GitHub integration, so no browser-run PASS is claimed. The PR was closed and not merged.
- Current Vercel checks remain rate-limited and do not provide a live CP720 preview.

Build:
- CP720 / build 720
- Service worker cache v720
- Page asset cache-bust v720

Branch: `cp715-restaurant-maybe-home-winner`
