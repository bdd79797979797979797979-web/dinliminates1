# Recovery — CP708 Stunning Home Food Photos

Date: 2026-10-02
Build: 708
Checkpoint: CP708
Branch: `cp708-stunning-home-food-photos`
Parent: `cp707-audit-fixes-except-hidden-restaurant-controls`
Clean rollback baseline: `clean-cp704-2026-10-02`

## Home photography
- Dine In: Pexels photo 30736865 — elegant overhead table setting with diverse gourmet dishes.
- Dine Out: Pexels photo 27643020 — wide 3:2 composition of grilled steak with fresh vegetables.
- Existing labels remain Dine In / Reveal Your Meal and Dine Out / Reveal Your Restaurant.
- Existing `foodStart` and `restStart` behavior is unchanged.
- No Google image/API credentials were added.

## Release
- Build 708 / CP708
- app.js cache query v675
- Restaurant Search and Open/All remain intentionally hidden.
- This checkpoint remains a candidate and is not production-certified.
