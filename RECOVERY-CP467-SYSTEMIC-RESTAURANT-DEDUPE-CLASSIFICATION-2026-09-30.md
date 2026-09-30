# Recovery CP467 — Systemic Restaurant Dedupe + Cuisine Classification

Date: 2026-09-30
Working branch: `cp466-restaurant-identity-final-2026-09-30`
Build: 173

## Recovery baseline
Restore branch: `recovery-cp466-before-systemic-restaurant-dedupe-classification-2026-09-30`
Baseline commit: `bc267e6051b2ec9a1394c9fbc5b5cac57fd26187`

## Changes
- Restaurant dedupe now treats same-name/same-venue provider variants consistently across API and browser pooling.
- Same-street + matching displayed search distance can merge a name variant when it is a partial/full address presentation of the same venue.
- Distinct format/location names such as `Heads BBQ Express` are protected from variant merging.
- Exact duplicate provider records such as repeated Excell BBQ and McDonalds Sango rows collapse to one result when they represent the same venue.
- Restaurant cuisine tags are re-derived from current provider/name/menu evidence instead of trusting stale persisted Quick Cut arrays.
- The server now writes a canonical primary restaurant category so useful categories do not remain displayed as generic `Restaurant`.
- Explicit and regression coverage verifies The Thirsty Goat = Pizza, Heads BBQ = BBQ, and Excell BBQ = BBQ.
- Build/cache metadata advanced to Build 173 / CP467.

## Regression examples covered
- Heads BBQ + Robert Heads BBQ → one venue when identity evidence matches.
- Excell BBQ provider duplicates → one venue.
- McDonalds Sango provider duplicates → one venue.
- Heads BBQ Express remains a distinct venue.
- The Thirsty Goat classifies as Pizza.
