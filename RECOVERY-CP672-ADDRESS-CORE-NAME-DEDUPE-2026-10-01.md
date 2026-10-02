# RECOVERY CP672 — ADDRESS + CORE NAME DEDUPE

Date: 2026-10-01

Problem:
- CP671 still allowed the user-reported Excell duplicate to appear.
- The exact case was "Excell Market & BBQ" and "Excell Bar-B-Q" at the same address.

Root cause:
- Frontend dedupe relied too heavily on broad name similarity.
- Restaurant modifiers such as market/bar/BBQ can differ between providers even when the core business name is the same.

Fix:
- Same/equivalent physical address is now the primary anchor.
- When the address matches, a shared distinctive core name token is enough to identify the same restaurant.
- Generic restaurant modifiers (market, bar, bbq, grill, kitchen, etc.) are ignored when determining the core identity.
- Same address alone still does not merge unrelated restaurant names.
- Existing location/coordinate/contact safeguards remain.
- Fresh searches still rebuild from the current provider response rather than retaining stale previous rows.

Exact regression:
- Excell Market & BBQ + Excell Bar-B-Q at same address: PASS — one result.
- Excell BBQ + Excell Market Bar-B-Q: PASS — one result.
- Strippers Chicken + Chicken Strippers: PASS — one result.
- Same address / unrelated names: PASS — remains two.
- Same name / clearly different addresses: PASS — remains two.
- BBQ normalization: PASS.
- Address normalization: PASS.

The exact checks were run against the frontend's actual dedupe implementation in app.js.
