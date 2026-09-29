# Dinliminate Current Release

## Source of truth
- Runtime: Vercel
- Working branch: release-hardening-2026-09-29
- Current hardening PR: #40 (draft)
- Current app build: 1.0 / 116
- Main remains untouched until the final release gate is green.
- Netlify is legacy/backup and is not the current runtime.

## Recovery points
- checkpoint-build114-pre-complete-hardening-2026-09-29
- checkpoint-cp113-pre-next-batch-2026-09-29
- checkpoint-cp116-api-hardening-2026-09-29

## Current verification
- Static QA: required
- Real restaurant provider smoke: required
- Route adapter smoke: required
- Browser smoke: required
- Vercel hosted verification: required
- iPhone/Safari certification: final manual gate

## Release rule
Do not promote this branch to Vercel production until the full launch gate is green.
