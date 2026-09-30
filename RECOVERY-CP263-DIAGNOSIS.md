# CP263 — App Diagnosis modal rework

Date: 2026-09-30

Recovery point before change:
- Branch: `cp258-food-catalog-expansion-2026-09-30`
- Stable commit: `81857bd157e0b8385d0624a3535eb23e43277170`
- Recovery branch: `cp263-recovery-before-diagnosis-rework-2026-09-30`

Change:
- App Diagnosis now reuses the existing Settings modal shell instead of closing Settings and opening a second modal.
- The intermediate/flash window is removed.
- Diagnosis content has a minimum viewport height so it opens at its final size while checks run.

Resulting commit:
- `94da7720241bf493a74e641e445a904152fd0736`

Recovery rule: return to `cp263-recovery-before-diagnosis-rework-2026-09-30` if a later change destabilizes the flow.
