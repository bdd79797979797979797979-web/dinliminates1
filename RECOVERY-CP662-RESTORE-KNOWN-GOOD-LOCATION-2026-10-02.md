# Recovery Checkpoint — CP662 — Restore Known-Good Current Location — 2026-10-02

Parent: CP659 app-entry fix.

## Why this checkpoint exists

The current-location behavior was reported to work before the most recent website/location changes. CP662 removes the newer location fallback/timing modifications and restores the exact Restaurant location-control code from CP650, the last known-good location implementation in this change sequence.

## CP662 change

- Restored the exact CP650 `renderLocationSource`, `setLocation`, browser `geolocation`, reverse-label, `useLocation`, and automatic refresh flow.
- Removed the CP660/CP661 network-location fallback and extended retry logic from the active client flow.
- Kept the CP659 app-startup fix and restaurant website resolver fixes intact.
- Bumped browser/service-worker cache markers to CP662.

## Expected behavior

Use My Location should behave as it did in the known-good CP650 implementation rather than introducing a new location mechanism.
