# Dinliminate Current Release

## Source of truth
- Runtime target: Vercel
- Working/release branch: `release-hardening-2026-09-29`
- Current app build: Version 1.0 / Build 123
- CP243 is the current food-catalog and UI polish line.
- Production remains intentionally unpromoted until the exact candidate passes the full launch gate.
- Netlify is legacy/backup and remains a hosted smoke target.

## CP243 changes
- Removed Stouffer’s Frozen Dinner.
- Renamed Cheerios Cereal to Cereal.
- Added Vegetable Lasagna, Salisbury Steak, Stuffed Peppers, and Health Shake.
- Verified Quick Cut associations for the new foods.
- Refreshed Tacos, Mexican Stir Fry, Meatloaf & Mashed Potatoes, Buttermilk & Cornbread, Potato Soup, Stuffed Peppers, Beef Stroganoff, and Health Shake photo mappings.
- Details is a compact crisp document icon rather than the old white circle and is sized to leave breathing room from card text.
- App Diagnosis has an explicit launcher color plus visible running/completed Run Again state.

## Release gates
- Static QA: pending after CP243 catalog updates.
- Food image smoke: pending after CP243 photo updates.
- Browser smoke: pending after CP243 UI/catalog updates.
- Hosted Netlify smoke: pending.
- iPhone Safari certification: still required.
- Third-party image rights review: still required.

## Recovery points
- CP240 green: `902ab3fed65b6132f05473349c51eb8867d10d09`
- CP243 pre-catalog: `330da22feedd4b47fb123feb5dbcbe4646a53ae2` — `recovery-cp243-before-food-catalog-polish`
- CP243 after catalog restoration: `2929187164cf86e2401f1198bb932de2b377c0db` — `recovery-cp243-after-food-catalog-restoration`
- CP243 after Diagnosis/image contract: `dece5be50562f3d1be231fcc98b572df3b56970a` — `recovery-cp243-after-diagnosis-image-contract`

## Release rule
Do not promote this candidate to Vercel production until the exact release commit passes the full automated gate and deployed-runtime verification.
