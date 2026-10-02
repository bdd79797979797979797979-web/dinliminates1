# RECOVERY CP670 — LOCATION-FIRST RESTAURANT DEDUPE

Date: 2026-10-01

Parent control:
- CP669 / Preview 141
- Protected user baseline: Preview 139 remains untouched.

Purpose:
Reduce provider duplicates by treating physical location as the primary identity signal.

Rules:
- Same or equivalent address + similar restaurant name => merge.
- Same street/number + similar restaurant name => merge.
- Near-identical coordinates + similar restaurant name => merge.
- Same address by itself does NOT merge unrelated restaurant names.
- Same restaurant name at clearly different addresses remains separate.
- Existing phone/website/known-identity safeguards remain.

Focused regression results:
- Excell BBQ + Excell Market Bar-B-Q: PASS — one result.
- Strippers Chicken + Chicken Strippers: PASS — one result.
- Equivalent Ashland City Road address normalization: PASS.
- Same address / unrelated names: PASS — two results.
- Same name / clearly different addresses: PASS — two results.
- Heads BBQ variant: PASS.
- Chris Pizza variant: PASS.
- Larsons Enterprise exclusion: PASS.
- Actual restaurant remains eligible: PASS.

This branch changes restaurant dedupe/data filtering only. No photo pipeline, UI layout, search controls, radius controls, or swipe behavior were intentionally changed.
