# Dinliminate Release QA Gate

Current source branch: release-hardening-2026-09-29
Current release candidate: PR #40 (draft)
Current build: 1.0 / 116

Required gates before production:
- Static JS syntax and DOM contract checks
- Real restaurant provider smoke
- Restaurant route adapter smoke
- Chromium browser smoke
- iPhone-size visual checks at 320, 375, 393, and 430 widths
- Hosted Vercel verification
- PWA install/icon verification
- Final Safari/iPhone device certification

Current recovery:
- checkpoint-build114-pre-complete-hardening-2026-09-29

## Latest recovery chain
- checkpoint-cp157-accessibility-2026-09-29
- checkpoint-cp156-accessible-search-controls-2026-09-29
- checkpoint-cp155-qa-contract-cleanup-2026-09-29
- checkpoint-cp153-accessibility-smoke-2026-09-29
- checkpoint-cp149-ci-concurrency-2026-09-29

### Hosted verification
- Run Hosted Vercel Smoke with the exact Vercel preview URL after deployment is available.
- Required checks: restaurant health endpoint, release endpoint, Home render, console/page errors, and Build 116.
