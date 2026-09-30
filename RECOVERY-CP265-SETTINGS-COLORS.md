# CP265 — Settings action color separation

Date: 2026-09-30

Recovery before change:
- `cp264-recovery-diagnosis-single-modal-2026-09-30`
- Commit: `d296d91fde40e5aed12d0168d192018a2f9da71f`

Change:
- App Diagnosis uses a distinct blue treatment.
- System Restore uses a distinct orange/gold treatment.
- Final CSS overrides were added after prior styling layers so the actions cannot collapse back to the same color.

Implementation commit: `7c4d2dabad8f61aaf83a605ab5f77e1e20aba57a`
Recovery branch: `cp266-recovery-settings-colors-2026-09-30`
