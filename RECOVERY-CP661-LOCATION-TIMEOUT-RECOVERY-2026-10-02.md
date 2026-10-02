# Recovery Checkpoint — CP661 — Location Timeout Recovery — 2026-10-02

Parent: CP660 current-location fallback.

## What was found

The previous browser-location request used a 6-second low-accuracy timeout. That is unnecessarily aggressive for a location request and makes a working location flow vulnerable to temporary browser/device location latency.

## CP661 change

- Give the normal browser location request up to 15 seconds using the lower-power location provider and allow a five-minute cached position.
- If that attempt times out/fails, immediately retry once with high accuracy for up to 20 seconds.
- Only after both browser attempts fail does the CP660 approximate network-location fallback run.
- The rest of the Restaurant search flow is unchanged.
- Frontend/service-worker cache markers are bumped to CP661.

This restores the patient browser-location behavior while retaining the fallback protection.
