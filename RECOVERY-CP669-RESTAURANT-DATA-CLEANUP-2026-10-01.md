# RECOVERY CP669 — RESTAURANT DATA CLEANUP

Date: 2026-10-01

Parent control:
- CP668 / Preview 140 photo repair
- Protected user baseline: Preview 139 / CP667 remains untouched

Changes:
- Canonicalize BBQ naming variants such as BBQ / Bar-B-Q / Barbecue before restaurant dedupe.
- Strengthen same-restaurant matching across provider variants using canonical names, street, address, contact, and close coordinates.
- Expand non-dining detection for food providers/suppliers/distributors and similar businesses.
- Explicitly exclude the reported Larsons Enterprise false positive.
- Added regression cases for Excell BBQ, Chicken Strippers, Larsons Enterprise, Heads BBQ, Robert Heads BBQ, and Chris Pizza variants.

Focused code-level regression result:
- Excell BBQ variants: PASS — merged to one result.
- Chicken Strippers / Strippers Chicken: PASS — merged to one result.
- Larsons Enterprise: PASS — excluded.
- Actual dining venue: PASS — remains eligible.
- BBQ / Bar-B-Q canonicalization: PASS.
- Heads BBQ / Robert Heads BBQ: PASS — merge at same location; distinct location remains separate.
- Chris Pizza variants: PASS — merged to one result.

Latest correction commit:
- 5030350498e15653bf5409b178058765c9ef746b

Preview 141 remains a separate working preview; Preview 139 is untouched.
