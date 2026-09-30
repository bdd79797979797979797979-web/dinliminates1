# Recovery Checkpoint CP445 — 50-Mile Radius / Hours Toggle / Quick Cut Flicker — 2026-09-30

## Parent / recovery
- Parent: CP444 / Build 149
- CP444 source commit: 1d8ef48268418a231d00f2e32cd89df06cd7557c
- Recovery branch before CP445: recovery-cp444-before-radius-toggle-asian-fix-2026-09-30
- Working branch: cp445-radius50-toggle-asian-flicker-2026-09-30

## Product changes
### Restaurant radius
- Maximum restaurant radius is now 50 miles.
- Removed the 100-mile option from the Restaurant radius selector.
- API `MAX_RADIUS` is now 50, and the health response reports that maximum.
- 1, 3, 5, 10, 25, and 50 miles remain.

### Restaurant hours
- Restored one toggle button instead of separate controls.
- Button id: `hoursToggle`
- Visible states:
  - `Open/Unknown`: closed restaurants hidden.
  - `All`: open, unknown, and closed restaurants shown.
- Existing persisted `hoursMode` state remains compatible.

### Quick Cut image stability
- Food and Restaurant Quick Cut rendering no longer recreates image DOM nodes when the label set has not changed.
- Clicking a Quick Cut now updates its selected/cut class in place, avoiding unnecessary image reloads and visible flicker.
- This specifically addresses the reported Asian Quick Cut image flicker while also improving all Quick Cut image stability.

## Release
- Build: 150
- Checkpoint: CP445
- Release branch: cp445-radius50-toggle-asian-flicker-2026-09-30

## Verification
- Source changes applied to the exact CP444 Dinliminates1 lineage.
- Obsolete 100-mile QA expectations removed.
- Browser smoke updated for one hours toggle and 50-mile maximum.
- Six-point certification updated for one hours toggle and 50-mile maximum.
- Netlify preview will be the next live verification target.

## Resume
Continue from CP445. Do not switch to CP442 or closed PR #73.
