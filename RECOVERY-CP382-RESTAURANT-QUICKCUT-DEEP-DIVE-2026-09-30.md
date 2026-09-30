# Recovery Checkpoint — CP382 — Restaurant Quick Cut Association Deep Dive — 2026-09-30

Baseline:
- Latest working branch: cp348-search-six-point-certification-2026-09-30
- Previous final fix sequence: CP374–CP381.
- Hours model focused QA is green.
- Netlify PR preview is deployed for the current branch.
- User requested a deep dive into Restaurant Quick Cuts and their associations with restaurant results.

Scope of this checkpoint:
- Audit all Restaurant Quick Cut labels and rendering.
- Audit restaurantCuisineTags()/restaurantQuickMatches()/restaurantCategory()/restaurantIsFastFood().
- Audit associations against provider category, cuisine, name, brand, operator, and menuItems.
- Identify false positives, false negatives, overlapping labels, and provider-dependent behavior.
- Review existing QA coverage and propose/fix gaps only after evidence is collected.
