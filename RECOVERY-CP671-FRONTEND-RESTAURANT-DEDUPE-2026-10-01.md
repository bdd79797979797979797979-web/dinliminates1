# RECOVERY CP671 — FRONTEND RESTAURANT DEDUPE

Date: 2026-10-01

Problem found after CP670:
- The frontend had a second restaurant dedupe system in app.js.
- Its rules were older than the API dedupe rules, so duplicates could be reintroduced into S.restaurantPool.
- The search flow also retained previousRows on a successful repeat search, allowing stale duplicate/non-restaurant rows to survive.

Changes:
- Frontend restaurant dedupe now uses location-first matching:
  - same/equivalent physical address + similar name => merge
  - same street/number + similar name + close coordinates => merge
  - near-identical coordinates + similar name when address data is incomplete => merge
  - same address alone does not merge unrelated names
  - same name at clearly different addresses remains separate
- Canonicalized BBQ / Bar-B-Q / Barbecue naming in the frontend.
- Removed stale previous restaurant pool carry-forward on successful refresh/search.
- Added frontend regression coverage.

Focused frontend regression:
- Excell BBQ variants: PASS
- Strippers Chicken variants: PASS
- Same address but unrelated names remain separate: PASS
- Same name at different addresses remains separate: PASS
- BBQ normalization: PASS
- Address normalization: PASS
- Stale previousRows disabled: PASS
- Full app.js syntax check: PASS

No restaurant-photo logic was intentionally changed.
