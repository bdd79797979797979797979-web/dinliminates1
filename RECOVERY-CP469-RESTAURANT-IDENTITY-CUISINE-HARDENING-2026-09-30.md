# Recovery Checkpoint CP469 — Restaurant Identity + Cuisine Hardening
Date: 2026-09-30

Starting point:
- CP465 / Build 170: unified Add Meal categories
- Recovery preserved: `recovery-cp465-before-restaurant-identity-taxonomy-2026-09-30`
- Additional safety point: `recovery-cp466-before-restaurant-identity-taxonomy-final-2026-09-30`
- `recovery-cp467-before-final-cuisine-dedupe-2026-09-30`
- `recovery-cp468-before-restaurant-final-correction-2026-09-30`

Changes:
1. Restaurant dedupe now compares a normalized business name on the same street and the same origin distance, in addition to exact address/Place ID/phone/website signals.
2. Common provider name variants are normalized, including Wendy's/Wendys and McDonald's/McDonalds and location suffixes such as Sango.
3. Same-street partial-address variants remain mergeable, while separately numbered or materially different-distance locations remain distinct.
4. Restaurant classification now consumes provider primary types, provider type arrays, and normalized cuisine values such as pizza_restaurant, barbecue_restaurant, seafood_restaurant, thai_restaurant, fast_food_restaurant, burger/hamburger signals.
5. API results now persist an inferred primary cuisine and quickCutTags, rather than leaving the primary category as generic Restaurant whenever classification evidence exists.
6. Browser dedupe preserves quickCutTags/quickCutEvidence returned by the API.
7. Added regression coverage for Wendy, Heads BBQ, Excell BBQ, McDonalds Sango and provider-type/cuisine classification.
8. Build 175 / CP469; app cache version 469.
