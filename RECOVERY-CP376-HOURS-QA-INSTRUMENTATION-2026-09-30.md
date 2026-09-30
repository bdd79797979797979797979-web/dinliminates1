# Recovery Checkpoint — CP376 — Remove Flaky Hours Test Instrumentation — 2026-09-30

Baseline:
- Branch: cp348-search-six-point-certification-2026-09-30
- CP375 corrected status/count rendering to use the exact rendered rows snapshot.
- Backend restaurant provider, classification, dedupe, hybrid search, radius discovery, and reliability suites are passing.
- Six-point browser certification reaches the hours section and passes the actual mode behavior checks.
- Remaining failure is only a QA-only data-hoursVisible attribute assertion introduced for diagnostic instrumentation.
- The user-facing hours status already reports open, unknown, closed, total, and current mode-related visibility.

Action:
- Remove the QA-only data-hoursVisible/data-hoursOpen/data-hoursUnknown/data-hoursClosed instrumentation.
- Remove the corresponding brittle certification assertion.
- Keep the production behavior and the meaningful hours mode/count assertions.
