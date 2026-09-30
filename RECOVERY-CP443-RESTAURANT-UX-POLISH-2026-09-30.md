# Recovery Checkpoint — CP443 — Restaurant UX Polish — 2026-09-30

Parent/source: CP442 on `cp348-search-six-point-certification-2026-09-30`
Working branch: `cp443-restaurant-polish-2026-09-30`
Pre-change recovery: `recovery-cp442-before-restaurant-polish-2026-09-30`

Completed:
- Restaurant Details button gets an explicit pointer boundary and protected touch interaction.
- Restaurant Details accessibility label is normalized to “Details”.
- Restaurant hours control is now three explicit controls: Search, Open + Unknown, All.
- Open + Unknown remains the default and excludes explicitly closed restaurants.
- All includes open, unknown, and closed restaurants.
- Restaurant Find/Refresh and filter controls use the premium dark/gold visual language instead of the orange Food action styling.
- Wide restaurant radius discovery now runs concurrently with primary providers, preventing the 50/100-mile discovery phase from losing its remaining search budget.
- 50-mile discovery is split across multiple provider groups instead of one large Overpass request.
- Release identity advanced to Build 148 / CP443.

Known limitation:
- This environment cannot directly drive the Netlify UI/browser, so hosted visual interaction must be checked from the resulting Netlify preview.
