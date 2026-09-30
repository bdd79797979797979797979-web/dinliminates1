# CHECKPOINT 76 — Clean release candidate

Branch: `clean-rebuild`
Release candidate: `clean-release-candidate`
Stable commit: `eb5baa737ce4ac80258e66f718e103aa88546f77`

Verified in GitHub Actions:
- Static QA passes on the exact event SHA.
- Live restaurant provider smoke passes with 50 restaurants including 44 fast-food results at the Clarksville, TN smoke point.
- Address suggestion and resolve paths pass.
- 1-mile and 100-mile radius contracts pass.
- Browser smoke passes on a 393×852 iPhone-sized viewport with no page or console errors.
- Food catalog loads with 31 defaults.
- Food Potato Quick Cut only removes Potato-primary choices and is reversible.
- Food and Restaurant Cut / Maybe / Back behavior is covered.
- Food and Restaurant swipe handlers are covered; left = Cut and right = Maybe.
- Pass Around Cut / Back is covered.
- Restaurant Fast Food Quick Cut, derived category search, and Open/Unknown Hours / Closed behavior are covered.
- Restaurant Hide confirmation persists and Settings Restore clears the hidden registry.
- Custom Food photo and recipe persistence is covered.
- Winner window is black; winner Details is covered.
- About and iPhone installation help are covered.

Recent fixes carried by this checkpoint:
- Restaurant fast-food discovery uses Photon named-chain fallback plus Overpass fallback when generic provider results miss fast food.
- GitHub Actions checks out the workflow event SHA so each run tests the exact triggering commit.
- Successful Add Food closes its modal instead of leaving a blocking backdrop over the Food round.
- Food swipe behavior now matches Restaurant swipe behavior.

Deployment status:
- `main` remains untouched.
- The latest green clean candidate has not been verified as a current Vercel deployment; the latest listed clean-rebuild deployment predates this checkpoint.

RECOVERY RULE: Return to stable commit `eb5baa737ce4ac80258e66f718e103aa88546f77` if a later milestone becomes unstable.

## CP96 — Original-scope cleanup
Source branch: `clean-feature-release-2026-09-28`
Source recovery: CP95 `40a43b147e198f9243a18688a6fbc2504beb737f`

Changed:
- Removed the non-original Food All Cut control from the UI and application logic.
- Removed All Cut-specific browser/static QA assertions.
- Kept the hungry/no-choice screen because it is still the correct end state when normal elimination leaves no choices.
- Preserved the premium Tinder-style swipe behavior for BOTH Food and Restaurant: live drag/tilt/stamp, left = Cut, right = Maybe, plus matching buttons.
- CP95 already contained the previously requested custom photo upload, custom Food editing, built-in delete/restore, Food detail notes, restaurant photo fallbacks, provider menu metadata, compact My Location, address selection/search, Pass Around, and swipe parity.

Verification:
- QA-only PR #23 is open; no merge requested.
- Netlify deploy-preview-23 status: success.
- Vercel status for this branch is currently blocked by the account build-rate-limit status, not an application test failure.
- CP95 remains the immediate recovery point; CP96 also has a dedicated savepoint branch.

## CP96 — Original-scope cleanup final
Final code/QA commit: `aa8e3f256e732e12e6e0fe721ba55da77b5c9303`

- Removed the non-original Food All Cut control, application function, and all related QA assertions.
- Hungry/no-choice state remains intact for the legitimate case where normal elimination leaves zero choices.
- Food and Restaurant remain full Tinder-style decks: horizontal drag/tilt/stamp, swipe-out, left = Cut, right = Maybe, plus matching buttons.
- CP95 already contained the previously requested custom photo upload, custom Food editing, built-in delete/restore, Food details/notes, restaurant photo fallbacks, provider menu metadata, compact My Location, address suggestions/selection, Pass Around, and Food/Restaurant swipe parity.
- QA-only PR #23 remains unmerged.
- Netlify deploy-preview status was green for the earlier CP96 commit; the latest QA commit is currently pending Netlify completion.
- Vercel checks are currently blocked by the account build-rate-limit status.

RECOVERY: `savepoint-cp96-original-scope-final2-2026-09-28` / commit `aa8e3f256e732e12e6e0fe721ba55da77b5c9303`.


## CP120 — Release hardening continuation
- Branch: release-hardening-2026-09-29
- Recovery: checkpoint-cp113-pre-next-batch-2026-09-29
- Additional recovery: checkpoint-cp116-api-hardening-2026-09-29
- Build 115 hardening includes durable custom-photo migration, branded confirmation dialogs, restaurant phone/Website card actions, resilient search/retry states, timezone-aware hour support, PWA shell, and Vercel security headers.
- Main remains untouched pending the complete release gate.


## CP146 — Build 116 release metadata
- Working branch: release-hardening-2026-09-29
- Build: 1.0 / 116
- Release metadata is sourced from release.json and verified by Static QA.
- Recovery: checkpoint-cp145-https-links-2026-09-29.


## CP157 — Accessibility search-control hardening
- Added accessible names to Restaurant address and radius controls.
- Static QA now protects those labels.
- Recovery: checkpoint-cp156-accessible-search-controls-2026-09-29.


## CP257 — Food catalog/photo/UI cleanup
Working branch: `cp257-food-catalog-refresh-2026-09-29`
Current head: `0630cfbaae64d3d285b1936142b384a963822795`
Starting recovery: `recovery-cp256-user-request-before-food-refresh-2026-09-29`
Pre-QA recovery: `checkpoint-cp257-catalog-and-details-2026-09-29` at `e4bab69f493a7eb42045ff829d37cda9594b8882`
QA-synced recovery: `checkpoint-cp257-qa-synced-2026-09-29` at `aabc513c84448b7f2b7d08ff4ec6ed65739dbd23`
Release-doc recovery: `checkpoint-cp257-release-docs-2026-09-29`

Changes:
- Food catalog expanded from 65 to 67.
- Added Italian Food Quick Cut.
- Pizza, Meatball Sub, and Sausage & Peppers are Italian; Pork Quick Cut removed.
- Biscuits & Gravy is Breakfast.
- Pork Chops and Pork Tenderloin are Southern.
- Added Pork Tenderloin and White Fish with complete photo/detail data.
- Refreshed Beef Stroganoff, Stuffed Peppers, Pizza, Buttermilk & Cornbread, Salmon, BBQ Pulled Pork, Meatball Sub, and Sausage & Peppers imagery.
- Mashed Potatoes is plain, without gravy.
- Details sheet begins below the decision header/menu.
- Food Delete controls and Settings Food Choices section removed; Food management is Hide/Restore.

Verification:
- JavaScript syntax parse: PASS.
- Catalog/data contract assertions: PASS.
- Exact hosted QA is still blocked on Vercel's account deployment limit; Netlify hosted preview is not yet confirmed for CP257.

Recovery rule: return to `checkpoint-cp257-catalog-and-details-2026-09-29` if a later change becomes unstable.


## CP258 — Expanded Food catalog and Quick Cut cleanup
Working branch: `cp258-food-catalog-expansion-2026-09-30`
Build: 1.0 / 132
CI trigger: CP258 is included in the full clean-qa push trigger.

Recovery points:
- Pre-edit: `recovery-cp258-before-new-foods-2026-09-30`
- Core: `checkpoint-cp258-catalog-core-2026-09-30`
- QA: `checkpoint-cp258-qa-2026-09-30`

Completed:
- Food catalog increased from 67 to 90.
- Added the 23 requested foods with complete photo/detail/Quick Cut data.
- Fajitas replaces Mexican Stir Fry.
- Greek remains available in Food and Restaurant Quick Cuts; Pasta remains available in Food; Pork remains removed; Gyro is Greek.
- Snack now contains sweet/snack additions.
- Food QA expectations raised to 90 and new mappings are explicitly checked.

Deployment:
- CP258 Netlify Deploy Preview is expected on PR #45 once created/updated; exact Netlify confirmation remains pending.
- Vercel remains account-rate-limited.


## CP259 — Requested food catalog additions
- Built-in Food catalog: **116 foods**.
- Added 26 unique requested foods; Gumbo was already present and was not duplicated.
- Roast Beef Sandwich + Chips appears once despite the request listing it twice.
- Fish Sticks was moved to the final built-in catalog position.
- Build updated from 127 to **128**.
- Recovery points: `checkpoint-cp259-food-catalog-added-2026-09-30`, `checkpoint-cp259-qa-ready-2026-09-30`.
- Netlify preview: https://deploy-preview-45--diliminate.netlify.app

## CP260 — Quick Cut / Hungry cleanup
- Liver & Onions: Southern + Healthy.
- Food Quick Cut order: American, Southern, Mexican, Italian, Pasta, Asian, Breakfast, Soup/Stew, Healthy, Potato, Snack.
- Hungry winner: small “Fish Sticks?” prompt; Details has no Hide button.
- Build 129.
- Recovery: `checkpoint-cp260-pre-hungry-quickcuts-2026-09-30`, `checkpoint-cp260-product-changes-2026-09-30`.


## CP260 — Pass Around rebuild
- Build 130.
- Liver & Onions uses Southern + Healthy Quick Cuts.
- Hungry Details omits Hide; Hungry winner shows small “Fish Sticks?” text.
- Restaurant Details icon is positioned immediately to the right of cuisine.
- App Diagnosis is green.
- Quick Pass is the default; Full Pass is the optional original mode.
- Recovery point: `checkpoint-cp260-pass-around-tested-2026-09-30` and final CP260 commit below.

- **Final verified CP260 commit:** `1b6c2f19e23ccb6cbd2ab341cdf795a6bb504d31`.
- **Final recovery branch:** `checkpoint-cp260-final-verified-2026-09-30`.


## CP261 — Pass Around fairness finish
- Build 131.
- Quick Pass remains the default; Full Pass remains optional.
- Starting voter rotates between Pass Around sessions.
- Final verified source commit before this note: `51579fe6318d73813db9a3b3956457affc35a0ed`.


## CP260 — Final verified state
- Build: **1.0 / 132**.
- Final Food Quick Cut order: American → Southern → Mexican → Italian → Asian → Pasta → Soup/Stew → Healthy → Breakfast → Potato → Snack.
- Liver & Onions: Southern + Healthy.
- Spaghetti, Pasta Alfredo, Lasagna, Chicken Parmesan: Pasta + Italian.
- Custom Food “Other” is optional and only appears globally when a custom food uses it.
- Hungry: black Hungry window, small “Fish Sticks?” prompt, no Hide in Hungry Details.
- Restaurant Details icon sits to the right of cuisine.
- App Diagnosis button is green.
- Swipe engine uses pointer capture; Pass Around Quick Pass is default and Full Pass remains optional; Back/Undo and safe Cancel are covered.
- Recovery: `checkpoint-cp260-final-code-verified-2026-09-30`.
- Netlify preview: https://deploy-preview-45--diliminate.netlify.app


## Netlify sync marker — CP261
- Triggered from current branch head `270d136df9b8db3b6fdc5f3c691bf87c21afdf86` so the PR preview redeploys the exact current state.


## CP262 — Current recovery point
- Build: **1.0 / 133**.
- 116-food catalog retained.
- Food Quick Cut order: American, Southern, Mexican, Italian, Asian, Pasta, Breakfast, Soup/Stew, Healthy, Potato, Snack.
- Liver & Onions: Southern + Healthy.
- Spaghetti, Pasta Alfredo, Lasagna, Chicken Parmesan: Pasta + Italian.
- Hungry Details has no Hide and shows `Fish Sticks?`.
- App Diagnosis opens at full size and uses teal; Settings is closed before Diagnosis opens.
- Tinder swipe surface suppresses image dragging for phone reliability.
- Quick Pass is default; Full Pass is optional original round-robin.
- Vercel image proxy is active in source; latest Vercel Git deployment is currently blocked by the account deployment-rate limit.
- Recovery branches include `checkpoint-cp262-image-diagnosis-pre-fix-2026-09-30` and `checkpoint-cp262-final-teal-swipe-2026-09-30`.
CP334 hardening QA trigger — website/phone syntax repair.
