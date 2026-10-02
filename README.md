# Dinliminate

Dinliminate is a phone-first dinner decision app built around fast food and restaurant elimination.

Current build: Version 1.0, Build 708.

Clean recovery baseline: `clean-cp704-2026-10-02`.

Current audit checkpoint: CP708 — full-audit hardening with Restaurant Search and Open/All intentionally hidden.

CP707 keeps Restaurant Search and Open/All hidden for now while the rest of the app is hardened.

The deployable app lives at the repository root.

Milestones:
1. Home + Food decision engine
2. Live restaurant location/search pipeline
3. Restaurant elimination + details
4. History/settings
5. Winner, History, Notes & Settings
6. Launch QA


## CP704 Home hero photography
- Dine In now uses a vibrant overhead dinner spread.
- Dine Out now uses a close-up grilled steak with colorful vegetables.
- Existing entry behavior and CP703 copy are preserved.

## CP703 front-page naming
- Home entry cards now read **Dine In — Reveal Your Meal** and **Dine Out — Reveal Your Restaurant**.
- Existing entry-button IDs and behavior are preserved.

## Current release hardening
- Working branch: cp708-full-audit-final-hardening
- Clean recovery baseline: clean-cp704-2026-10-02
- Current release candidate: Build 708 / CP708
- Restaurant Search and Open/All remain intentionally hidden.
- Vercel is the runtime verification target; Netlify `dinliminate22` remains the hosted certification target.


## CP708 full-audit hardening
- Build 708 / CP708 is the current candidate.
- Restaurant Search and Open/All remain intentionally hidden.
- Active QA/CI contracts are synchronized to the current release and stale historical workflows have been removed.
- The protected clean rollback baseline is `clean-cp704-2026-10-02`.
