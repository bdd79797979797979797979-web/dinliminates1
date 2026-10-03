# CP824 Recovery — Stable Home + Meal Photo Build
Date: 2026-10-03

Recovered after an intermediate multi-photo deployment caused visible regressions.

Final recovery state
- Reverted unfinished multi-photo implementation to the CP823 single-photo meal system.
- Home uses exactly one full-page background: ./home-background.jpg (the ornate door).
- Removed the separate Home background image DOM/JS layer.
- Removed legacy full-page Pexels/embedded Home image definitions.
- Menu button is locked at the end of the CSS cascade to translucent black glass with satin-gold outline and three satin-gold lines.
- Service worker registration bumped to v824 and shell cache bumped to v824.
- Home headline remains "Meal Decisions Simplified".

Verification
- 14/14 recovery checks passed.
- No multi-photo state/functions remain.
- Existing meal photo renderer remains intact.
- No legacy full-page Home background URL remains.
- No separate Home background layer remains.

Deployment
- The prior Vercel preview URL is immutable and may still show the broken intermediate CP824 build.
- This recovered branch must be deployed to Vercel project dinliminates1.
- Do not deploy to dinliminates2.
