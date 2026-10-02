# CP689 — Unified Meal + Restaurant Card Geometry Recovery

Date: 2026-10-01

## Purpose
Make Meals and Restaurants use the same card layout/geometry and visual system, with Restaurant-only content additions retained.

## Shared card system
- Same card stack width and aspect-ratio rules.
- Same card max-height rules across responsive breakpoints.
- Same card border radius.
- Same card-copy inset and bottom position.
- Same title font sizing, line-height, letter spacing, and top spacing.
- Same cuisine/category + utility-row anatomy.
- Same 30px desktop/tablet utility footprint and 28px iPhone footprint.
- Same Quick Cuts/choice-count presentation.
- Same unified bottom decision rail.

## Restaurant-only extras preserved
- Current Location/address/Refresh/Miles search row.
- Restaurant Website utility.
- Restaurant address + distance line.
- Restaurant-specific photo hydration and metadata.
- Restaurant swipe-stack isolation/pointer-event protections.

## QA completed
- Food and Restaurant DOM sections both present with shared decision headers.
- Shared Quick Cuts and choice counts present.
- Blue choice-count styling present for both.
- Canonical shared card geometry rule present at end of stylesheet.
- Same card title geometry verified.
- Same utility geometry verified.
- Restaurant address/distance and Website extras verified.
- Same four-button decision rail structure verified by class and button IDs.
- Meal and Restaurant rail handlers remain wired.
- Restaurant location/address/search/radius wiring remains intact.
- Restaurant Quick Cuts and active-pool filtering functions remain intact.
- Restaurant search term matching remains intact.
- JavaScript syntax parse passed.
- CSS brace balance passed.
- Service-worker shell cache bumped to v662.
- Build metadata updated to CP689.

No Google API credentials were added.