# CP721 Recovery — Winner/Hungry Top Navigation — 2026-10-02

Aligned the Winner and Hungry screens with the Meals/Restaurants top navigation.

Changes:
- Added a shared 43px `winner-nav` row.
- Back to Start is top-left inside that row.
- Back control matches Meals/Restaurants at 42px wide x 40px high.
- Centered `Dinliminate` uses the same 20px brand sizing/vertical rhythm as the decision screens.
- Hungry wheel content now begins below the same navigation row.
- Existing `winnerBackTop` behavior remains wired to return to Home.

QA:
- JavaScript parse: PASS.
- Winner nav wrapper: PASS.
- Back placement/size: PASS.
- Centered Dinliminate brand: PASS.
- 43px nav height: PASS.
- Back action wiring: PASS.
- CP721 build/checkpoint/cache metadata: PASS.

Branch: `cp715-restaurant-maybe-home-winner`
