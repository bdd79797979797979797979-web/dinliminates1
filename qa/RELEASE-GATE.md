# Dinliminate Launch QA Gate — Build 698 / CP698

Date: 2026-10-02

## Current candidate
- Working branch: `cp698-iphone-usage-pass`
- Recovery baseline: `cp697-address-credit-polish`
- Release: Version 1.0 / Build 698 / CP698
- Restaurant API: r25
- Radius tiers: 1 / 3 / 5 / 10 / 25 / 50 / 100 miles
- Hosted test target: `dinliminate22`
- Candidate status: not production

## CP698 completed
- iPhone Safari-safe editable-field sizing and Search keyboard hints.
- Manual address entry now invalidates pending automatic GPS so typed addresses are not overwritten.
- Restaurant location action hit areas are 44px on standard phone widths, with a tighter 40px layout below 360px.
- Release identity is synchronized across the app release file, release manifest, release API, and current documentation.

## Remaining launch gates
1. Hosted runtime verification on the exact CP698 candidate
2. Restaurant location/search/radius/Open/All/Quick Cut runtime pass
3. Restaurant photo runtime verification
4. Physical iPhone Safari/PWA install and touch/swipe certification
5. Final third-party photo/source rights review

## Historical QA
Older build references remain below in the repository history; they are retained as historical records and are not the current candidate identity.

---

## Recovery chain
- `recovery-cp487-build197-pre-launch-pass-2026-09-30`
- `checkpoint-cp487-pre-launch-qa-sync-2026-10-01`
- `checkpoint-cp487-pre-food-catalog-repair-2026-10-01`
- `checkpoint-cp488-pre-launch-qa-update-2026-10-01`
- `checkpoint-cp488-pre-photo-host-alignment-2026-10-01`
- `checkpoint-cp488-photo-hosts-verified-2026-10-01`

## Release rule
Keep this candidate unpromoted until hosted/runtime identity and the physical iPhone Safari/PWA checks are complete.
