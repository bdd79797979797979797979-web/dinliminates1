# Recovery — CP704 Home Hero Food Photos

Date: 2026-10-02
Build: 704
Checkpoint: CP704
Branch: `cp704-hero-food-photos`
Parent: `cp703-dine-in-out-copy`

## Change
Refreshed the two Home hero images while preserving CP703 copy:

- **Dine In — Reveal Your Meal:** vibrant overhead dinner spread, Pexels photo 29732918.
- **Dine Out — Reveal Your Restaurant:** close-up grilled steak with colorful vegetables, Pexels photo 29101362.

Both source pages identify the images as free to use under Pexels' terms. No Google image/API credentials were added. citeturn878205view1turn687847view0

## Behavior
The existing `#foodStart` and `#restStart` IDs are unchanged, so the entry flows are unchanged.

## Release alignment
- Build 704 / CP704
- app.js cache query v673
- Baseline: CP703
- Hosted test target: dinliminate22
- Candidate only; not production

## Verification
Source-level verification confirms the exact new image URLs are present in `index.html` and the CP704 release metadata is synchronized. Deployed runtime and physical iPhone rendering still require direct testing.
