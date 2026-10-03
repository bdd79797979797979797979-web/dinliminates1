# CP820 — Home Door Background Recovery
Date: 2026-10-03

Baseline
- CP819 Gold Translucent Menu.
- Branch: cp819-gold-translucent-menu.
- CP819 head before this branch: eccd178f472a3b6818e37ed16ce8dcf651c739c6.

Problem addressed
- Home had multiple historical background rules.
- The intended Home image is the project's ornate dark wooden door.
- Older/competing Home background rules could allow the wrong dining-table/Pexels image to surface.

Fix
- Make ./home-background.jpg the single authoritative Home background.
- Force the Home background layer visible whenever Home is active.
- Force #home transparent over that layer.
- Disable the app-level Home background image.
- Keep the existing full-screen Home sizing and layout unchanged.

Asset verification
- The existing home-background.jpg is the same Home asset used by the verified CP802 Home screen, which rendered as the ornate dark wooden door.

Focused audit
- 10/10 checks passed:
  canonical door constant
  door binding
  old app background disabled
  transparent Home
  visible door layer
  door image forced
  CSS cache v820
  SW cache v820
  full-screen Home preserved
  legacy CP776 URL not used by final Home override

Deployment
- Target Vercel project: dinliminates1.
- Do not deploy this branch to dinliminates2.
