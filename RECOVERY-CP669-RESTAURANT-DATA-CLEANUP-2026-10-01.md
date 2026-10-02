# RECOVERY CP669 — RESTAURANT DATA CLEANUP

Date: 2026-10-01

Parent control:
- CP668 / Preview 140 photo repair
- Protected user baseline: Preview 139 / CP667 remains untouched

Changes:
- Canonicalize BBQ naming variants such as BBQ / Bar-B-Q / Barbecue before restaurant dedupe.
- Strengthen same-restaurant matching across provider variants using canonical names, street, address, contact, and close coordinates.
- Expand non-dining detection for food providers/suppliers/distributors and similar businesses.
- Add a specific guard for the reported Larsons Enterprise false positive when a provider labels it weakly as a restaurant.
- Add regression tests for Excell BBQ, Chicken Strippers, Larsons Enterprise, Heads BBQ, Robert Heads BBQ, Chris Pizza variants, suppliers, distributors, and warehouses.

Test contract:
- Excell BBQ: one result when multiple provider records represent the same venue.
- Chicken Strippers: one result when name word order differs across providers.
- Larsons Enterprise: zero restaurant results.
- Known real restaurants remain eligible.
