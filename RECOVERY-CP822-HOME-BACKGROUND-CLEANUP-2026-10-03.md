# CP822 — Home Background Cleanup
Date: 2026-10-03

Purpose
Remove competing legacy full-page Home background definitions so the wrong background cannot reappear.

Canonical Home background
- `./home-background.jpg` is the only Home background image asset.
- `app.js` binds `HOME_DOOR_IMAGE='./home-background.jpg'`.
- The persistent Home background layer forces that same asset.

Removed
- Legacy CP776 Pexels Home background variable and URL (photo 8417853).
- Legacy CP780 full-page reference to `var(--cp776-home-photo)`.
- Legacy CP797 embedded dining-table JPEG background.

Preserved
- At Home and Restaurant card photography.
- Existing Home layout, typography, menu, and card composition.
- Full-screen Home behavior.

Audit
- 10/10 focused checks passed.
- Root image assets confirm only one Home/background-named image remains: `home-background.jpg`.
- Old Pexels URL: removed.
- Old CP776 variable/reference: removed.
- Embedded legacy Home image: removed.
- Canonical door binding: present.
- CSS v822 and service-worker shell v822: present.

Deployment
- Correct Vercel target remains `dinliminates1`.
- Do not deploy this branch to `dinliminates2`.
