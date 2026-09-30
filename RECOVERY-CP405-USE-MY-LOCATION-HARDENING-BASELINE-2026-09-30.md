# Recovery Checkpoint — CP405 — Use My Location Hardening Baseline — 2026-09-30

Parent: CP404
Scope: implementation checkpoint before changing Use My Location.

Planned:
- Guard overlapping location acquisition callbacks with a request sequence.
- Add visible/busy state to Use My Location while acquisition is active.
- Accept a recent GPS fix quickly, then request a fresh high-accuracy fix.
- Refresh restaurant results only when the fresh coordinates materially differ.
- Add a timeout around reverse geocoding and fall back to raw GPS coordinates.
- Persist a timestamp for confirmed device location and label restored device coordinates as a last-used location until re-confirmed.
- Expand browser QA for these behaviors.
