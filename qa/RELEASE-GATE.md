# Dinliminate Launch QA Gate — Build 197 / CP487–CP488

Date: 2026-10-01

## Current candidate
- Working branch: `cp487-launch-candidate-full-pass-2026-10-01`
- Recovery baseline: `recovery-cp487-build197-pre-launch-pass-2026-09-30`
- Release: Version 1.0 / Build 197 / CP487
- Recorded source branch: `cp466-restaurant-identity-final-2026-09-30`
- Restaurant API: r22
- Radius tiers: 1 / 3 / 5 / 10 / 25 / 50 / 100 miles
- Netlify preview: https://deploy-preview-92--diliminate.netlify.app
- Vercel deployment is currently account-rate-limited.

## CP487–CP488 completed
- Restored the missing Smoothie entry; built-in meal catalog is 116 unique meals.
- Synchronized stale Restaurant QA from r20/50-mile assumptions to r22/100-mile behavior.
- Added 100-mile coverage to live API smoke.
- Refreshed hosted Netlify smoke for Build 197.
- Aligned current food-image hosts across client proxy, server proxy, service worker, and QA.
- Preserved recovery branches before the major repair stages.

## Launch gates
1. Static/data and syntax QA
2. Restaurant route/provider/search/classification/dedupe/reliability QA
3. 1/3/5/10/25/50/100-mile API QA
4. Browser and accessibility QA
5. Hosted Netlify QA
6. Food-image/source QA
7. PWA manifest/service-worker QA
8. 393×852 iPhone-size checks

## Physical-device gate
Real iPhone Safari/PWA installation, GPS permission, touch/swipe behavior, and Add to Home Screen behavior still require the physical iPhone and are not claimed as certified by desktop automation.

## Recovery chain
- `recovery-cp487-build197-pre-launch-pass-2026-09-30`
- `checkpoint-cp487-pre-launch-qa-sync-2026-10-01`
- `checkpoint-cp487-pre-food-catalog-repair-2026-10-01`
- `checkpoint-cp488-pre-launch-qa-update-2026-10-01`
- `checkpoint-cp488-pre-photo-host-alignment-2026-10-01`
- `checkpoint-cp488-photo-hosts-verified-2026-10-01`

## Release rule
Keep this candidate unpromoted until hosted/runtime identity and the physical iPhone Safari/PWA checks are complete.
