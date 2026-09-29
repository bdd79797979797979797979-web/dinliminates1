# Dinliminate P900 — Launch Complete Candidate

This repository contains the Dinliminate iPhone-focused dinner decision app.

## Current release
- Release: p900-launch-complete-2026-09-29
- Working branch: launch-complete-2026-09-29
- Recovery branch: recovery-pre-launch-audit-2026-09-29
- Restaurant search cap: 100 miles
- Restaurant search contract: combined restaurant + fast food
- Quick Cuts: reversible hide/show with primary-food protection
- Restaurant swipe: same Tinder-style left/right interaction as Food
- Maybe: held choices return for a review round
- Pass Around: persistent, resumable group elimination
- History: calendar with photos, details and X removal
- Settings: hidden choices, delete custom food, export/import, restore defaults
- PWA: versioned network-first service worker
- Netlify: static publish + serverless restaurant-function routing included in netlify.toml

## Recovery
Use recovery-pre-launch-audit-2026-09-29 to return to the exact pre-audit state.

After a disconnect, continue from launch-complete-2026-09-29 at its latest commit. See RECOVERY-P900-2026-09-29.md.

## QA
The repository includes existing P730/P781 regression suites plus qa/p900-launch-complete.spec.mjs. Production contract tests run on main after deployment.

## Deployment
Vercel remains the primary connected deployment. Netlify compatibility is included so the same source can be connected to a Netlify site without changing the restaurant API contract.
