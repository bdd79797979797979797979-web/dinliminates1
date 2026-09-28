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