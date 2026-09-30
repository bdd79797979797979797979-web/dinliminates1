# Recovery Checkpoint CP452 — Contact Enrichment Merge
Date: 2026-09-30

Starting point:
- CP451 / Build 156: `cp451-photo-priority-hours-details-2026-09-30`
- Recovery branch: `recovery-cp451-before-contact-enrichment-2026-09-30`

Completed:
- Google contact enrichment now tags each enrichment result with its target restaurant row ID.
- Enrichment is merged back into that existing row instead of being appended as another restaurant result.
- Phone, website, address, Google Place ID, opening state, and enrichment state are copied onto the existing row when available.
- Added a focused regression smoke and wired it into Clean QA.
- Updated release metadata to Build 157 / CP452.

Verification:
- Existing row identity is preserved by the new patch helper.
- Regression test explicitly verifies no extra restaurant row is created by contact enrichment.

Recovery:
- Return to `recovery-cp451-before-contact-enrichment-2026-09-30` to discard CP452.
