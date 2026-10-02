# CP715 Recovery — Restaurant Maybe Rail, Home Photos, Winner Back, Menu Copy — 2026-10-02

## Requested changes
1. Restaurant All/Maybes toggle must sit in the same bottom decision row as Meals, immediately to the right of Maybe.
2. Replace Dine In and Dine Out home-card photos with stronger Pexels images.
3. Add the same top-left Back-to-Home control to both winner and hungry/loser states.
4. Change Manage Meals menu subtitle to: "Add, edit, hide, delete, or restore".

## Implementation
- Restaurant decision rail receives higher-specificity static/flex rules so legacy absolute-position rules cannot pull the All/Maybes button upward or sideways.
- Restaurant button press feedback uses centered scale only, matching the unified Meals rail.
- Home Dine In uses Pexels photo 18058361 (plated dinner).
- Home Dine Out uses Pexels photo 17294748 (restaurant interior).
- Winner screen adds #winnerBackTop and wires it to home(); hungry mode uses the same winner screen, so it receives the same Back control.
- Manage Meals drawer subtitle updated exactly as requested.
- Build/cache metadata bumped to CP715 / build 715.

## Source QA
PASS: app.js parses.
PASS: new Dine In photo ID is present; old ID removed.
PASS: new Dine Out photo ID is present; old ID removed.
PASS: winner Back button exists and is wired to home().
PASS: hungry/loser path uses winner().
PASS: Manage Meals subtitle matches requested copy.
PASS: restaurant unified rail has higher-specificity static positioning.
PASS: restaurant rail DOM order is Back -> Cut -> Maybe -> All/Maybes.
PASS: restaurant press transform is centered scale only.
PASS: app-release, release-manifest, and service worker are build 715.

## Deployment
Vercel automatic Git deployment for the latest CP715 commit is currently reporting build-rate-limit failures, so no unverified CP715 live URL is claimed.
The previous CP714 READY deployment remains separate and does not contain these CP715 changes.

## Recovery branch
cp715-restaurant-maybe-home-winner
