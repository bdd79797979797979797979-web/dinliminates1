# Recovery Checkpoint CP456 — Wendy's Duplicate Hardening
Date: 2026-09-30

Starting point:
- CP455 / Build 160
- Recovery branch: `recovery-cp455-before-wendys-fix-2026-09-30`

Problem observed:
- Searching "wendys" on the Restaurant screen produced the same Wendy's location multiple times.

Change:
- Tightened same-name restaurant dedupe from 0.35 mi to 0.08 mi when there is no conflicting address.
- Kept exact same normalized address as the stronger merge signal.
- Kept same-contact merges with a 0.12 mi threshold.
- Kept name-variant + same-brand merges at 0.12 mi.
- Applied the tighter same-venue threshold to the browser-side dedupe as well.
- Added a regression fixture representing Wendy's / Wendys results from Google, Photon, and ArcGIS that must collapse to one restaurant.
- Preserved the earlier protection that distinct nearby same-name restaurants with conflicting addresses stay separate.
- Bumped Build 161 / CP456 and updated QA/cache version.

Verification:
- The targeted dedupe fixture must collapse the same Wendy's venue to one result.
- Distinct nearby same-name locations remain separate.
