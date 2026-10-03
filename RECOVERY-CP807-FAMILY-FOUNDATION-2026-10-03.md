# CP807 — Family Foundation Recovery

Date: 2026-10-03

This checkpoint establishes the isolated Family Mode backend foundation on top of the current repository baseline.

## Included

- Server-side Postgres-compatible Family Mode persistence via `@neondatabase/serverless`.
- Persistent Family records with reusable 6-character join codes.
- Private participant tokens stored only as SHA-256 hashes.
- Participant limit of 8.
- Round records with immutable pool/host-exclusion snapshots, dinner target, lifecycle stage, schema version, optimistic version field, and 24-hour expiry.
- Per-round participant records for independent progress.
- Idempotent per-item vote records keyed by round + participant + stage + item.
- Family API actions for create, join, state, start-round, vote, complete-stage, end-round, and regenerate-code.
- Lightweight join-attempt rate limiting.
- No changes to the existing personal Dinliminate `S.*` or local-storage state model.

## Database configuration

The runtime accepts a server-side Postgres connection from one of:
`FAMILY_DATABASE_URL`, `DATABASE_URL`, `POSTGRES_URL`, or `NEON_DATABASE_URL`.

When no connection is configured, the Family API intentionally returns HTTP 503 with a clear configuration error instead of falling back to non-persistent in-memory state.

## Recovery branch

`family-mode-cp807-foundation`

Next checkpoint: CP808 — Create / Join / Lobby.
