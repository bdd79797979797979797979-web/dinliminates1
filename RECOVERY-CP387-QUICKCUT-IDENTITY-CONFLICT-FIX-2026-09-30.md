# Recovery Checkpoint — CP387 — Quick Cut Identity Conflict Fix Applied — 2026-09-30

Fix applied to app.js:
- Centralized Thirsty Goat profile now carries blockFastFood:true.
- restaurantIsFastFood() honors identity-level exclusions before provider flags.
- restaurantCuisineTags() no longer re-adds Fast Food merely because raw category says Fast Food when the classifier says otherwise.

Code commit:
- 8cd6056ab9a78e023358b6d52f687a32f29659dd

Expected regression:
- Thirsty Goat → Pizza YES, Fast Food NO even with provider fastFood:true/category Fast Food.
- Other known fast-food identities remain independently tagged.
