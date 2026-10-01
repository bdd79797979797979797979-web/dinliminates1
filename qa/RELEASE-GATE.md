# Dinliminate Launch QA Gate — Build 197 / CP487–CP488

Date: 2026-10-01

## Current launch candidate
- Recovery baseline: `recovery-cp487-build197-pre-launch-pass-2026-09-30`
- Current working branch: `cp487-launch-candidate-full-pass-2026-10-01`
- Current release metadata: Version 1.0 / Build 197 / CP487
- Source branch recorded by release metadata: `cp466-restaurant-identity-final-2026-09-30`
- Current Netlify hosted preview: https://deploy-preview-92--diliminate.netlify.app
- Current API contract: r22
- Restaurant radius contract: 1, 3, 5, 10, 25, 50, 100 miles
- Vercel production deployment is currently blocked by the account deployment-rate limit; this is a hosting-account condition, not a code QA result.

## Completed in the CP487–CP488 launch pass
- Restored the missing Smoothie entry to return the built-in catalog to 116 unique meals.
- Verified food IDs, names, and image URLs are unique.
- Synchronized static Restaurant QA from r20/50-mile assumptions to r22/100-mile behavior.
- Added 100-mile coverage assertions to live API smoke.
- Updated hosted/Netlify smoke defaults to the Build 197 preview.
- Added a full hosted Netlify smoke covering release identity, restaurant health, PWA shell, Home, Meal Tinder controls, Restaurant controls, and 393×852 overflow.
- Aligned all current food image hosts across client proxy, server proxy allowlist, service-worker cache allowlist, and static QA.
- Preserved recovery branches before the food repair, QA synchronization, and image-host alignment.

## Automated launch gates
1. Static/data contract and JavaScript syntax
2. Restaurant provider/routing/classification/dedupe/reliability smoke
3. Full 1/3/5/10/25/50/100-mile radius API smoke
4. Browser smoke and accessibility smoke
5. Hosted Netlify preview smoke
6. Food image and image-source governance audits
7. PWA shell/icon/manifest checks
8. iPhone-size visual checks

## Device-only final gate
Real iPhone Safari/PWA installation and GPS permission behavior still require the physical iPhone. Desktop/Chromium automation must not be treated as a substitute for that certification.

## Recovery chain
- `recovery-cp487-build197-pre-launch-pass-2026-09-30` — exact Build 197 baseline
- `checkpoint-cp487-pre-launch-qa-sync-2026-10-01` — before QA synchronization
- `checkpoint-cp487-pre-food-catalog-repair-2026-10-01` — before restoring Smoothie
- `checkpoint-cp488-pre-launch-qa-update-2026-10-01` — before launch QA edits
- `checkpoint-cp488-pre-photo-host-alignment-2026-10-01` — before image host alignment
- `checkpoint-cp488-photo-hosts-verified-2026-10-01` — after image host alignment

## Release rule
Do not promote Vercel production from this candidate until hosted/runtime identity is verified on the intended production target and the physical iPhone Safari/PWA gate is completed.
