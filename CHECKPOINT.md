# CURRENT CHECKPOINT - BUILD 735 / CP735

Date: 2026-10-02

Working branch: cp728-hungry-reveal-home-polish
Current checkpoint: CP735

CP735 changes:
- Dine In Home card now uses a stunning family dinner image from Pexels (photo 11368700), chosen for the warm candlelit family-dinner setting. citeturn619440view0
- First-entry swipe directions now sit centered directly above the bottom decision buttons.
- Swipe directions no longer auto-dismiss after a timeout; tapping the directions dismisses them.
- Fireworks remain visible longer, with the winner celebration container extended to 4.6 seconds and longer burst/ray animation durations.
- CP734 wheel lifecycle fix and CP732 plain green choice-count styling remain preserved.

Verification:
- app.js syntax PASS.
- Hint function has no auto-dismiss timeout and is clickable to dismiss.
- Fireworks timeout = 4600ms.
- Dine In image URL verified.
