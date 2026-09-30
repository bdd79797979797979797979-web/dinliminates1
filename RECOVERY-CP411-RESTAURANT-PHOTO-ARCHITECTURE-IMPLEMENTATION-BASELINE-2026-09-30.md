# Recovery Checkpoint — CP411 — Restaurant Photo Architecture Implementation Baseline — 2026-09-30

Parent: CP410

Scope:
- Replace split photo fallback logic with a single server-side photo resolver metadata model.
- Add on-demand Google Places photo retrieval without caching Google photo resource names.
- Carry Google Place IDs (cache-safe) from search rows to the client.
- Preserve premium local/provider photos first, then stable chain/cuisine fallbacks, then final generic fallback.
- Add photo source/generic/confidence metadata and required Google author attribution rendering.
- Add regression tests for provider photos, generic fallback classification, Google photo endpoint behavior, and broken-image fallback.

No production behavior changes are committed at this baseline checkpoint.