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
