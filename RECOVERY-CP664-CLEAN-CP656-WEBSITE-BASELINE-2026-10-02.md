# RECOVERY-CP664-CLEAN-CP656-WEBSITE-BASELINE-2026-10-02

CP664 starts from the confirmed-working CP656 / Preview 128 commit.

Purpose: keep the CP656 current-location implementation intact while continuing only the restaurant website work.

Website changes:
- expanded deterministic domain candidates
- 10-minute negative website cache
- resolver refresh bypass
- bounded Jina Reader fallback for candidate pages
- controlled client website hydration retry

Location implementation was not changed from CP656.
