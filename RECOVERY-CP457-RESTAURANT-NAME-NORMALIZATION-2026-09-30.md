# Recovery Checkpoint CP457 — Restaurant Name-Form Normalization
Date: 2026-09-30

Starting point:
- CP456 / Build 161
- Recovery branch: `recovery-cp456-before-name-normalizer-fix-2026-09-30`

Problem:
- Provider results can spell the same venue as "Wendy's", "Wendys", or "WENDY'S".
- The previous dedupe rules could treat those strings as different names even at the same address.

Change:
- Added a shared API-side Restaurant name key that normalizes apostrophe-s forms to the same plain form before identity comparison.
- Updated browser-side Restaurant name-family normalization to do the same.
- Kept exact-address merging and the tight nearby same-name threshold.
- Added regression coverage for Wendy's / Wendys / WENDY'S from multiple providers.
- Build 162 / CP457.

Recovery:
- `recovery-cp456-before-name-normalizer-fix-2026-09-30`
