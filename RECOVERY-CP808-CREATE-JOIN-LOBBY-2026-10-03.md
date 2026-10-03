# CP808 — Create / Join / Lobby Recovery

Date: 2026-10-03

## Included
- Family Mode entry from the hamburger menu.
- Simple Create / Join choices inside Family Mode.
- Create form with optional family name.
- Join form with forgiving 6-character code formatting.
- Private per-device Family session token persisted separately from normal Dinliminate state.
- Family code sharing/copy.
- Persistent lobby shell with member list and host/waiting state.
- Lightweight lobby polling.
- Leave Family flow.
- Family Mode uses its own state object and storage key; normal Meals/Restaurants state is not modified.

## Verification
- app.js, api/family-store.js, and api/family.js pass JavaScript syntax parsing.
- Family UI anchors are present in index.html.
- Vercel preview is generated from the Family Mode branch.

## Known prerequisite
The API requires a server-side Postgres connection for real multi-device persistence. It intentionally does not fall back to in-memory state.

Next: CP809 — Host Setup + Dinner Clock + frozen round snapshot.
