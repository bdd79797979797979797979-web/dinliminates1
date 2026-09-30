# Recovery Checkpoint CP466 — Restaurant Identity, Dedupe, and Cuisine Classification
Date: 2026-09-30

Starting point:
- CP465 / Build 170
- Recovery: `recovery-cp465-before-restaurant-identity-final-2026-09-30`

Completed:
1. Restaurant dedupe now collapses same-name venues on the same canonical street when the displayed search distance matches closely, including partial vs full street addresses.
2. Same-name same-street venues with materially different displayed distances remain separate.
3. Provider category/type metadata is preserved from Google Places, ArcGIS, Photon, and OpenStreetMap for classification.
4. Restaurant taxonomy broadened to recognize chain identities, provider cuisine/type names, restaurant-name cues, and menu corroboration.
5. Generic provider labels such as “Restaurant” no longer override a more useful cuisine/category classification.
6. Restaurant card category selection now includes Fast Food and uses taxonomy/provider/name fallback signals.
7. App Diagnosis now reports Restaurant cuisine-classification coverage.
8. Build 172 / CP466; cache-busting v466.
9. Added targeted regression coverage for the reported Wendy’s case and representative cuisine/chain classification.

Verification:
- API, taxonomy, app, dedupe QA, search-reliability QA, and static QA parse successfully.
- Same-street/same-distance Wendy fixture dedupes to one.
- Same-street/materially-different-distance fixture remains two.
- Subway → Fast Food.
- McDonald’s → Fast Food + Burgers.
- Taco Bell → Fast Food + Mexican.
- Olive Garden → Italian.
- Red Lobster → Seafood.
- Waffle House → American + Breakfast.
- Provider-type Japanese/Burger/Barbecue/Mexican/Italian/Seafood fixtures classify into useful Quick Cut tags.
- Card display category tests return useful labels rather than generic Restaurant for these fixtures.
