# RECOVERY — CP696 Automatic Restaurant Location — 2026-10-02

## Baseline
- Previous checkpoint: CP695 / `cp695-location-menu`
- Current checkpoint: CP696
- Branch: `cp696-auto-restaurant-location`
- Build: 696
- Production: no

## Change
Restaurants now proactively call the existing `useLocation()` flow on entry when there is no active saved location and the address field is empty.

The entry hook deliberately does not run when:
- a location already exists;
- the user has typed an address;
- the Restaurants screen is no longer active when the deferred callback fires.

## Preserved behavior
- CP695 fresh-first high-accuracy location request and fallback attempts.
- Browser permission-state and secure-context handling.
- Visible location/status messaging.
- Manual address autocomplete and Find flow.
- Restaurant provider/search/radius/Quick Cut/photo/swipe systems.

## Cache safety
- `index.html` asset query bumped from v664 to v665 for the app shell.

## Verification scope
Source-level checks only. No live browser/device GPS permission test was available through the current connected tools, so actual browser permission behavior still needs hosted/device verification.
