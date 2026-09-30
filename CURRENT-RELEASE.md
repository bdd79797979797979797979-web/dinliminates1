# Dinliminate Current Release

## Source of truth
- Runtime target: Vercel
- Working/release branch: `cp258-food-catalog-expansion-2026-09-30`
- Candidate promotion target: `release-hardening-2026-09-29`
- Current app build: Version 1.0 / Build 129
- CP258 is the current food-catalog expansion candidate.
- Production remains intentionally unpromoted until the exact candidate passes the full launch gate.
- Netlify is legacy/backup and remains a hosted smoke target.

## CP258/CP259 changes
- Expanded the built-in Food catalog from 67 to 90 choices in CP258, then to 116 choices in CP259.
- Added Pot Pie, BLT, Reuben, Hot Dog, Corn Dog, Nachos, Orange Chicken, Chicken Teriyaki, Sushi, Pancakes, Omelet, Oatmeal, Shrimp, Crab Cakes, Gumbo, Chicken Nuggets, Ramen, Pimento Cheese Sandwich, Ice Cream, Protein Bar, Candy Bar, Banana, and Apple.
- Renamed Mexican Stir Fry to Fajitas and kept it on the Mexican Quick Cut.
- Removed the Food Greek Quick Cut and moved Gyro to Healthy only.
- Added the requested 1–2 Quick Cut mappings for all new foods; sweets are included in Snack.
- Updated Food editor/static/browser/image QA for the 116-food catalog.
- Build metadata is now Version 1.0 / Build 128.

## CP258 release gates
- Static/data contract: updated; automated run pending.
- Food image smoke: updated for 116 foods.
- Browser smoke: updated for the 116-food catalog and requested Quick Cut mappings.
- Hosted Netlify preview: current PR #45 deployment is active; Vercel remains blocked by the account deployment-rate limit.
- Vercel preview: still subject to the account deployment-rate limit.
- iPhone Safari certification: still required.
- Third-party image rights review: still required.

## CP257 changes
- Expanded the built-in Food catalog from 65 to 67 choices with Pork Tenderloin and White Fish.
- Added an Italian Food Quick Cut and moved Pizza, Meatball Sub, and Sausage & Peppers to Italian; removed the Food Pork Quick Cut.
- Changed Biscuits & Gravy to Breakfast, Pork Chops to Southern, and added Southern Pork Tenderloin.
- Refreshed the requested food imagery, including Beef Stroganoff, Stuffed Peppers, Pizza, Buttermilk & Cornbread, Salmon, BBQ Pulled Pork, and related sandwich imagery.
- Changed Mashed Potatoes to a plain version without gravy.
- Raised the Food Details sheet so its top begins just below the decision header/menu.
- Removed Food Delete controls from Manage Foods and removed Food Choices from Settings; foods are managed with Hide/Restore.

## CP254 changes
- Removed Stouffer’s Frozen Dinner.
- Renamed Cheerios Cereal to Cereal.
- Added Vegetable Lasagna, Salisbury Steak, Stuffed Peppers, and Health Shake.
- Verified Quick Cut associations for the new foods.
- Refreshed Tacos, Mexican Stir Fry, Meatloaf & Mashed Potatoes, Buttermilk & Cornbread, Potato Soup, Stuffed Peppers, Beef Stroganoff, and Health Shake photo mappings.
- Details is a compact crisp document icon rather than the old white circle and is sized to leave breathing room from card text.
- App Diagnosis has an explicit launcher color plus visible running/completed Run Again state.

## CP257 release gates
- Runtime syntax/data contract: verified on CP257.
- Static QA and image smoke: updated for the 67-food catalog and new imagery; hosted execution pending.
- Browser smoke: updated for CP257 Quick Cuts, Details, and Hide-only Settings.
- Hosted Netlify smoke: pending exact CP257 preview.
- Vercel preview: currently account build-rate-limited.
- iPhone Safari certification: still required.
- Third-party image rights review: still required.

## Release gates
- Static QA: PASS on CP254.
- Food image smoke: PASS on CP254.
- Browser smoke: PASS on CP254.
- Hosted Netlify smoke: PASS on CP254.
- iPhone Safari certification: still required.
- Third-party image rights review: still required.

## Recovery points
- CP240 green: `902ab3fed65b6132f05473349c51eb8867d10d09`
- CP254 pre-catalog: `330da22feedd4b47fb123feb5dbcbe4646a53ae2` — `recovery-cp243-before-food-catalog-polish`
- CP254 after catalog restoration: `2929187164cf86e2401f1198bb932de2b377c0db` — `recovery-cp243-after-food-catalog-restoration`
- CP254 after Diagnosis/image contract: `dece5be50562f3d1be231fcc98b572df3b56970a` — `recovery-cp243-after-diagnosis-image-contract`

## Release rule
Do not promote this candidate to Vercel production until the exact release commit passes the full automated gate and deployed-runtime verification.


## CP259 — requested food additions
- Catalog: **116 built-in foods**.
- Added 26 unique foods from the requested list.
- Gumbo was already present, so it was retained once with Southern + Soup/Stew.
- Roast Beef Sandwich + Chips was listed twice in the request but is present once.
- Fish Sticks is the final built-in food.
- Build: **128**.
- Netlify preview: https://deploy-preview-45--diliminate.netlify.app
- Recovery points: `checkpoint-cp259-food-catalog-added-2026-09-30` and `checkpoint-cp259-qa-ready-2026-09-30`.


## CP260 — Quick Cut and Hungry cleanup
- Liver & Onions now belongs to **Southern + Healthy**.
- Food Quick Cuts were reordered for a clearer grouping: American, Southern, Mexican, Italian, Pasta, Asian, Breakfast, Soup/Stew, Healthy, Potato, Snack.
- Hungry winner keeps the black Hungry state, shows **Fish Sticks?** in small text, and its Details view has no Hide action.
- Build: **129**.
- Recovery point before QA: `checkpoint-cp260-product-changes-2026-09-30`.
