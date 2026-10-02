
## CP758 All/Maybe placement — 2026-10-02
- Fixed Meals and Restaurants so the All/Maybe control is placed between **Quick Cuts** and the green **Choices** count.
- Replaced the old pill/A/heart visual with a flat **ALL · MAYBE** text control.
- Active mode uses a subtle green emphasis and underline; inactive mode stays muted.
- The control remains disabled when no Maybe choices exist.
- No decision semantics changed: All shows the normal deck; Maybe shows only the user-kept Maybe choices.
- Quick Cuts remains collapsed by default.
- Build/cache bumped to CP758 / v758.

## CP757 Home reference refinement — 2026-10-02
- Softened the Dine In/Dine Out transition so the two full-bleed sections read as one cinematic composition.
- Restored the requested one-time **Swipe until it’s revealed.** cue as a very small, low-contrast editorial line above the footer.
- Kept the hero logo, Menu position, Meal Decisions Simplified headline, reveal copy, and transparent bottom utilities from CP756.
- Home remains full-bleed with no rounded card UI or arrow affordances.
- Build/cache bumped to CP757 / v757.

## CP757 QA note
Static/source verification is required before considering this the final Home checkpoint. Existing application decision logic was not intentionally modified.

## CP756 editorial Home finish — 2026-10-02
- Matched the supplied Home reference more closely.
- Large centered gold Dinliminate wordmark at the top; Menu remains top-right.
- Removed the extra Home eyebrow and swipe slogan from the landing page.
- Meal Decisions Simplified is now a centered editorial subhead with gold rules.
- Dine In and Dine Out are full-bleed photo sections rather than rounded app cards.
- Added centered gold editorial rules around DINE IN / DINE OUT labels.
- Added the exact requested reveal copy under each selection.
- Bottom Add to Phone / Share App controls are transparent and separated by a fine gold rule.
- Preserved click/tap behavior and the existing press feedback.
- Home onboarding cue is suppressed on the landing screen because the page itself now carries the reveal language.
- Bumped Home/service-worker asset version to v756.

## CP756 QA note
This is a Home-only visual pass on CP755. Decision logic, restaurant search/radius, Quick Cuts, winner/Hungry behavior and Details logic were not intentionally changed.
# CURRENT RELEASE — BUILD 755 / CP755

Date: 2026-10-02

Current candidate branch: `cp755-premium-micro-polish`
Recovery baseline: `cp754-quickcuts-closed-default`
Hosted test target: `dinliminate22`
Status: candidate — not production

## CP755 premium micro-polish
- Added a subtle sheen to the plain **Quick Cuts** text control without bringing back the circle or arrow.
- Removed the stubborn floating swipe-instruction treatment entirely.
- Replaced it with a compact **in-card** first-use coach: **← Cut · Swipe · Maybe → · ×**.
- The in-card coach is dismissible and disappears automatically with the first meaningful swipe or decision.
- Added tactile press feedback to decision buttons and Home Dine In / Dine Out cards.
- Added a subtle animated transition when live Choice counts change.
- Added a restrained soft glow around Maybe controls.
- Improved modal/details opening with a fast premium rise/fade and earlier image reveal.
- Added a very subtle slow ambient-light animation to the Home cinematic background.
- Added a one-time Home onboarding cue: **Swipe until it’s revealed.**
- Kept Quick Cuts collapsed by default from CP754 and preserved saved user open/closed preferences.
- Bumped app asset and service-worker cache versions to v755.

## CP755 verification targets
- Meals and Restaurants share the new in-card swipe coach.
- No `#swipeHint` implementation remains in app or CSS.
- Quick Cuts remains a plain text control.
- Existing swipe thresholds, decision semantics, restaurant search/location/radius logic, winner/Hungry flow, and photo systems remain unchanged.

# CURRENT RELEASE — BUILD 754 / CP754

Date: 2026-10-02

Current candidate branch: `cp754-quickcuts-closed-default`
Recovery baseline: `cp753-swipe-hint-fix`
Hosted test target: `dinliminate22`
Status: candidate — not production

## CP754 Quick Cuts default
- Quick Cuts now start **collapsed by default** for both Meals and Restaurants when no saved preference exists.
- Existing user preferences are preserved; opening or closing Quick Cuts continues to be remembered.
- Tapping the Quick Cuts label remains the only action needed to show or hide the categories.
- No Quick Cut filtering logic was changed.
- Build metadata updated to CP754.

# CURRENT RELEASE — BUILD 753 / CP753

Date: 2026-10-02

Current candidate branch: `cp753-swipe-hint-fix`
Recovery baseline: `cp752-home-cinematic`
Hosted test target: `dinliminate22`
Status: candidate — not production

## CP753 Swipe hint repair
- Fixed the first-use Cut / Swipe / Maybe coach mark so it can receive taps.
- Replaced the non-interactive overlay behavior with a real touch/click target.
- Added a visible **×** dismissal affordance.
- Positioned the hint at the bottom-right so it does not cover the central card.
- Uses a new local-storage key so users who previously saw the broken v2 hint can see the repaired hint once.
- Preserved Meal and Restaurant swipe behavior.
- Bumped the service-worker shell cache and build metadata to 753.

# CURRENT RELEASE — BUILD 752 / CP752

Date: 2026-10-02

Current candidate branch: `cp752-home-cinematic`
Recovery baseline: `cp751-plain-quickcuts-preview`
Hosted test target: `dinliminate22`
Status: candidate — not production

## CP752 cinematic Home
- Preserved the Tinder-style meal/restaurant chooser flow and existing home actions.
- Added a full-screen, dark candlelit dining background using a Pexels photo.
- Refined the top Dinliminate wordmark treatment and kept the Menu control fixed at the top right.
- Changed the Home headline to **Meal Decisions Simplified**.
- Changed Dine In helper copy to **Tap to reveal your meal**.
- Changed Dine Out helper copy to **Tap to reveal your restaurant**.
- Reduced DINE IN / DINE OUT typography from the oversized treatment used in the concept while keeping it prominent.
- Converted the two Home choices into larger cinematic photo panels with centered editorial typography.
- Kept Add to Phone and Share App as subtle lower controls.
- Bumped the service-worker shell cache and Home asset query to v752.

## CP752 recovery
This branch is a clean continuation of CP751. No restaurant-search, radius, Quick Cuts, swipe, winner, or Hungry-mode behavior was intentionally changed.

Deployment trigger: CP752-home-cinematic-final-preview

# CURRENT RELEASE — BUILD 709 / CP709

Date: 2026-10-02

Current candidate branch: `cp709-unified-decision-button-jump`
Clean recovery baseline: `clean-cp704-2026-10-02`
Prior audit checkpoints: CP705 / CP706 / CP707 / CP708
Hosted test target: `dinliminate22`
Status: candidate — not production

## CP709 decision-button motion
- Meal and Restaurant Back / Cut / Maybe share the same explicit tap “jump” animation.
- The animation is triggered once per activation and respects `prefers-reduced-motion`.
- CP708 Home hero photography is preserved: vibrant Dine In spread and gourmet steak Dine Out image.
- Restaurant Search and Open/All remain intentionally hidden.
- Synchronized release identity to Build 709 / CP709.

## CP709 verification
- Shared `bindCardButton` triggers the decision-button jump for Meal and Restaurant round actions.
- Existing duplicate-activation suppression remains in place.
- CP704 remains the protected clean rollback baseline.

---


# CURRENT RELEASE — BUILD 704 / CP704

Date: 2026-10-02

Current candidate branch: `cp704-hero-food-photos`
Recovery baseline: `cp703-dine-in-out-copy`
Hosted test target: `dinliminate22`
Status: candidate — not production

## CP704 Home hero photography
- Replaced the Dine In hero photo with a vibrant overhead dinner spread featuring multiple colorful dishes.
- Replaced the Dine Out hero photo with a close-up grilled steak with colorful vegetables and garnish.
- Kept the existing Dine In / Reveal Your Meal and Dine Out / Reveal Your Restaurant copy.
- Preserved the existing `foodStart` and `restStart` IDs and behavior.
- Advanced the app.js cache query from v672 to v673.
- Synchronized release identity to Build 704 / CP704.

## CP704 verification
- Source confirms the Dine In card points to Pexels photo 29732918, described by Pexels as a colorful dinner table with various foods and drinks.
- Source confirms the Dine Out card points to Pexels photo 29101362, described by Pexels as a close-up grilled steak with colorful vegetables and garnish.
- Both source pages identify the images as free to use. citeturn878205view1turn687847view0
- No Google image/API credentials were added.

---



# CURRENT RELEASE — BUILD 698 / CP698

Date: 2026-10-02

Current candidate branch: `cp698-iphone-usage-pass`
Recovery baseline: `cp697-address-credit-polish`
Hosted test target: `dinliminate22`
Status: candidate — not production

## CP698 iPhone usage pass
- Restored Safari-safe **16px text sizing** for editable Restaurant address and restaurant-search fields so iPhone Safari does not zoom the page when those fields receive focus.
- Added **Search** keyboard return hints to the Restaurant address and restaurant search fields.
- When manual address editing begins while the automatic GPS request is still pending, the pending GPS result is invalidated so it cannot overwrite the address the user is entering.
- Increased the compact Restaurant location action hit areas on phones to **44px** on standard iPhone widths, with a tighter 40px layout for very narrow screens.
- Preserved the existing compact visual hierarchy, restaurant search behavior, radius tiers, Quick Cuts, photos, swipe mechanics, and navigation.

## CP698 verification
- Source confirms pending-location cancellation on both address focus and address input.
- Source confirms Restaurant address/search fields use iPhone Search return hints.
- Final mobile CSS restores 16px editable-field sizing after later compact Restaurant rules.
- Restaurant location action hit areas are 44px at max-width 430px and 40px below 360px.
- App asset query advanced from v666 to v667.
- Release metadata is synchronized to Build 698 / CP698.

# CURRENT RELEASE — BUILD 197 / CP487–CP488

Date: 2026-10-01

Current candidate branch: `cp487-launch-candidate-full-pass-2026-10-01`
Recovery baseline: `recovery-cp487-build197-pre-launch-pass-2026-09-30`
Recorded release source branch: `cp466-restaurant-identity-final-2026-09-30`
Hosted Netlify preview: https://deploy-preview-92--diliminate.netlify.app
Restaurant API: r22
Restaurant radius tiers: 1, 3, 5, 10, 25, 50, 100 miles

CP488 verified repair:
- Restored Smoothie; built-in meal catalog is 116 unique meals.
- Synchronized stale QA contracts to Build 197 / r22 / 100-mile behavior.
- Refreshed hosted Netlify smoke for the current preview.
- Aligned current food-image hosts across client proxy, server proxy, service worker, and QA.

The candidate is not promoted to production. Physical iPhone Safari/PWA certification remains a device-only gate.

---

# CURRENT RELEASE — LAUNCH CANDIDATE

**Build 197 / CP487–CP488 — 2026-10-01**

## Source of truth
- Launch-candidate branch: `cp487-launch-candidate-full-pass-2026-10-01`
- Recovery baseline: `recovery-cp487-build197-pre-launch-pass-2026-09-30`
- Release source branch: `cp466-restaurant-identity-final-2026-09-30`
- Current app release: Version 1.0 / **Build 197** / **CP487**
- Restaurant API: **r22**
- Restaurant radius tiers: **1 / 3 / 5 / 10 / 25 / 50 / 100 miles**
- Hosted test target: **https://deploy-preview-92--diliminate.netlify.app**
- Netlify is the current hosted iPhone-testing target; Vercel production deployment is currently account-rate-limited.
- The candidate remains unpromoted until hosted identity and physical iPhone Safari/PWA checks are complete.

## CP487–CP488 launch-pass changes
- Restored the missing **Smoothie** entry; the built-in catalog is again **116 unique foods**.
- Synchronized stale Restaurant QA contracts from r20/50-mile assumptions to r22/100-mile behavior.
- Extended API smoke to exercise 100-mile radius behavior.
- Rebuilt the hosted Netlify smoke to verify Build 197, PWA shell, Home, Meal Tinder controls, Restaurant controls, and mobile overflow.
- Aligned the client image proxy, server image proxy, service worker, and static QA for all current food-photo hosts.
- Preserved recovery branches at each significant stage.

## Remaining launch gates
- Automated CI against the launch-candidate branch/PR
- Hosted Netlify runtime verification
- Physical iPhone Safari/PWA install and GPS test
- Final third-party photo/source rights review
- Vercel production deployment after its account deployment limit clears

---

## Source of truth
- Runtime target: Vercel
- Working/release branch: `cp258-food-catalog-expansion-2026-09-30`
- Candidate promotion target: `release-hardening-2026-09-29`
- Current app build: Version 1.0 / Build 133
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
- Build metadata is now Version 1.0 / Build 132.

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
- Food Quick Cuts were reordered for a clearer grouping: American, Southern, Mexican, Italian, Asian, Pasta, Soup/Stew, Healthy, Breakfast, Potato, Snack.
- Hungry winner keeps the black Hungry state, shows **Fish Sticks?** in small text, and its Details view has no Hide action.
- Build: **129**.
- Recovery point before QA: `checkpoint-cp260-product-changes-2026-09-30`.


## CP260 — Pass Around and card polish
- Build: **130**.
- Food Quick Cuts reordered to a more natural flow: American, Southern, Mexican, Italian, Pasta, Asian, Breakfast, Soup/Stew, Healthy, Potato, Snack.
- Restaurant Details icon sits directly to the right of cuisine on the card.
- Settings > App Diagnosis now uses a green action treatment.
- Pass Around now defaults to **Quick Pass**: majority rules and a choice advances as soon as its outcome is mathematically decided.
- **Full Pass** preserves the original unanimous round-robin behavior as the optional mode.
- Quick Pass/Full Pass selection, player count, names, full-card swipe, button controls, Back/Undo, and return to the narrowed Tinder deck are covered by regression tests.
- Quick Pass is designed to preserve Dinliminate's narrowing-down feel while reducing unnecessary votes for choices whose outcome is already settled.

- Final CP260 verified source commit: `1b6c2f19e23ccb6cbd2ab341cdf795a6bb504d31`.

- CP261: rotating starting voter added to Pass Around for fairness; Build 131.


## CP260 — Final phone/Tinder polish
- Build: **132**.
- Food Quick Cuts: American, Southern, Mexican, Italian, Asian, Pasta, Soup/Stew, Healthy, Breakfast, Potato, Snack.
- Custom Food editor adds optional **Other**; the global Other Quick Cut appears only when a custom food actually uses it.
- Spaghetti, Pasta Alfredo, Lasagna, and Chicken Parmesan use **Pasta + Italian**.
- Liver & Onions uses **Southern + Healthy**.
- Hungry winner keeps the black Hungry screen, shows small **“Fish Sticks?”**, and its Details view has no Hide action.
- Restaurant Details icon is inline to the right of the cuisine type.
- App Diagnosis uses the green system action.
- Tinder swipes were hardened to a single pointer-event path with pointer capture for better iPhone reliability.
- Pass Around: Quick Pass is the default faster majority mode; Full Pass is the optional original unanimous mode. Back undoes votes; the full-card swipe is preserved; Cancel exits without altering the main deck; the next completed pass rotates the starting voter.
- Recovery: `checkpoint-cp260-current-pre-new-edits-2026-09-30`, `checkpoint-cp260-final-code-verified-2026-09-30`, `checkpoint-cp260-final-pre-test-2026-09-30`.
- Netlify preview: https://deploy-preview-45--diliminate.netlify.app


## CP262 — UI, swipe, Pass Around, and image reliability
- Food Quick Cuts reordered for the phone flow: American, Southern, Mexican, Italian, Asian, Pasta, Breakfast, Soup/Stew, Healthy, Potato, Snack.
- Liver & Onions: Southern + Healthy.
- Spaghetti, Pasta Alfredo, Lasagna, and Chicken Parmesan: Pasta + Italian.
- Add Food: Other remains optional and only appears as a Quick Cut after a custom food uses it.
- Hungry winner: no Hide action; displays small `Fish Sticks?` text.
- Restaurant Details icon remains inline to the right of cuisine.
- App Diagnosis opens at a fixed final size to remove the small-to-large flash and uses teal styling.
- Tinder card swipe surfaces suppress image dragging on phones.
- Quick Pass remains the default; Full Pass is the optional original round-robin mode.
- Build: **133**.
NaN