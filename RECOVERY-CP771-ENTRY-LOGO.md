# CP771 Recovery Checkpoint — Entry + Logo Fix

Date: 2026-10-02
Base: CP769 launch-fix branch.

Changes:
- Fixed a literal escape sequence accidentally inserted into app.js around the swipe coach source.
- Made DINE IN and DINE OUT Home entry routing deterministic through one guarded capture handler, with touch/pen pointer fallback and duplicate-trigger protection.
- Forces Quick Cuts closed when entering Meals or Restaurants.
- Bumped asset query refs to v771 to prevent the browser/service-worker from reusing the v768 JS/CSS.
- Existing CP769 floating menu, centered utility/details geometry, flat ALL · MAYBES, text-only Quick Cuts, restaurant Website action, and wide-radius search changes are retained.

Dedicated restaurant-name search remains deferred.

Recovery branch: cp771-entry-logo-fix
