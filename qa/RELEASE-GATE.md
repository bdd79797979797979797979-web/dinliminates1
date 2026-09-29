# Dinliminate Release QA Gate

Current source branch: release-hardening-2026-09-29
Current release candidate: PR #40 (draft)
Current build: 1.0 / 115

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
