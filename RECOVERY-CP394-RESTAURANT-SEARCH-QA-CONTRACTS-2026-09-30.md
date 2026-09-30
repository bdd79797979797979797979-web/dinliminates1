# Recovery Checkpoint — CP394 — Restaurant Search QA Contracts Updated — 2026-09-30

QA-only corrections after CP393:
- Updated Clean QA Google provider-search assertion from the old literal query expression to the shared taxonomy variant query.
- No production search logic changed in this checkpoint.

Validation target:
- Static QA should pass the shared-taxonomy contracts.
- Focused hours/browser QA should run against the current release candidate.
- Six-point semantic searches and shared classifier matrix remain the primary behavioral gate.
- Existing provider-failure smoke may still be the known unrelated full-suite failure if its expected 502 behavior remains unchanged.
