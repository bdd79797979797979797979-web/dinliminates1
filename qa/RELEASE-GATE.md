# Clean Release QA Gate

Current source branch: clean-rebuild
Current release-candidate branch: clean-release-candidate

This file is a release/QA marker only. It does not participate in runtime behavior.

Required gates before production:
- Static JS syntax checks
- Structural DOM-ID audit
- Chromium browser smoke
- Real restaurant API smoke from a hosted environment
- iPhone-sized visual check
- Final Vercel deployment verification
