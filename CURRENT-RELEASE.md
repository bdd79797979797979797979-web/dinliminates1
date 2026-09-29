# Dinliminate Current Release

## Source of truth
- Runtime target: Vercel
- Working/release branch: `release-hardening-2026-09-29`
- Current app build: 1.0 / 117
- CP237 is the preserved pre-hardening recovery point.
- CP239 is the current decision-flow hardening line.
- Netlify is legacy/backup; its current preview smoke is green for the latest release commit.
- Vercel production verification is still blocked by the connected Vercel account build-rate limit; no code-level Vercel deployment failure has been observed.

## Current verification gates
- Static QA: PASS
- Real restaurant provider smoke: PASS
- Route adapter smoke: PASS
- Restaurant classification smoke: PASS
- Restaurant dedupe smoke: PASS
- Food image smoke: PASS
- Image-source governance audit: PASS
- Provider failure smoke: PASS
- Browser smoke: PASS on latest fully green CP238 candidate; CP239 recycle-flow browser run is being rechecked after the test-sequencing fixes.
- Accessibility smoke: PASS on the last fully green CP238 candidate.
- Performance budget: PASS on the last fully green CP238 candidate after app-shell/catalog reduction.
- Visual regression: PASS on the last fully green CP238 candidate.
- Hosted Netlify smoke: PASS on CP239.
- Vercel hosted verification: BLOCKED by external build-rate limit.
- Manual iPhone/Safari certification: NOT YET EXECUTED.

## CP239 behavior change
- Food and Restaurant remain Tinder-style narrowing decks.
- Left swipe / Cut permanently removes the current choice.
- Right swipe / Maybe means Keep for this pass and sends the choice into a recycle queue.
- When the first pass is exhausted, kept Maybe choices return for a second narrowing pass.
- Back restores the last decision without losing the recycle state.

## Recovery points
- CP237 source: `83c222921a6fcc23d1f878941d4af51fe747820e`
- CP238-A: `a22147127d370fdd9f71731d42c45152d85d1f8f`
- CP238-H: `263abb63a21b17197d6232eec60cecbcf941cae3`
- CP238-I: `6f0e6c86feba0185038e9fc05c8151182a3b4f46`
- CP239-A: `c5d4f16a5a9dc61ff457fd99aa414c5f76a43714`
- CP239-D: `69b8231578bf3fe905a3e217f1cb5b163f153ad9`
- CP239-E: `b12cb7af553a1e991d8ef33848d489816a927e3b`
- CP239-B: `4e1abb7398e03fd4a1d7f4c002f5f8f516f88f5b`
- CP239-C: `d7f839c24d54e4b19ca077a1fcbfd256a2ac3527`

## Release rule
Do not promote to Vercel production until the current exact release commit passes the full launch gate and the deployed Vercel URL is verified against that commit.
