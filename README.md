# Dinliminate

Dinliminate is a phone-first dinner decision app built around fast food and restaurant elimination.

Current build: Version 1.0, Build 703.

The deployable app lives at the repository root.

Milestones:
1. Home + Food decision engine
2. Live restaurant location/search pipeline
3. Restaurant elimination + details
4. History/settings
5. Pass Around
6. Launch QA


## CP703 front-page naming
- Home entry cards now read **Dine In — Reveal Your Meal** and **Dine Out — Reveal Your Restaurant**.
- Existing entry-button IDs and behavior are preserved.

## Current release hardening
- Working branch: cp703-dine-in-out-copy
- Base recovery: cp702-note-actions-per-note
- Current release candidate stays off main until the exact release commit is fully verified.
- Vercel is the official runtime for the release candidate; Netlify remains legacy/backup. Vercel deployment is currently blocked by the connected account build-rate limit.
