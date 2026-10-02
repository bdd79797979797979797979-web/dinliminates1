# RECOVERY — CP698 iPhone Usage Pass — 2026-10-02

## Baseline
- Previous checkpoint: CP697 / `cp697-address-credit-polish`
- Current checkpoint: CP698
- Branch: `cp698-iphone-usage-pass`
- Build: 698
- Production: no

## Changes
- Restaurant address and Restaurant search inputs use 16px text on iPhone widths to avoid Safari automatic page zoom.
- Both fields use `enterkeyhint="search"`; address also keeps `autocomplete="street-address"`.
- Manual address focus/input cancels any still-pending automatic GPS application by invalidating its request sequence.
- Restaurant location buttons are 44px at standard phone widths, with a 40px compact fallback below 360px.
- Existing swipe touch-action and iPhone viewport/safe-area rules were preserved.

## Cache safety
- `index.html` app/style asset query advanced from v666 to v667.

## Verification scope
Source-level verification only. Connected tools do not provide a live iPhone Safari/device session, so physical viewport, keyboard, GPS prompt, and touch-feel certification remain device-level checks.
