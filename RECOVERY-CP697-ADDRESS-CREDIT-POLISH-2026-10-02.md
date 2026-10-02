# RECOVERY — CP697 Address + Creator Credit Polish — 2026-10-02

## Baseline
- Previous checkpoint: CP696 / `cp696-auto-restaurant-location`
- Current checkpoint: CP697
- Branch: `cp697-address-credit-polish`
- Build: 697
- Production: no

## Changes
1. About creator credit
   - `Made by Brian Dunn for Devona Dunn` uses satin blue `#72b7dc`.
   - Both stylesheet rules affecting `.about-credit` use the same blue so cascade order does not override the requested color.

2. Restaurant address input
   - On focus, a populated address/location label is cleared.
   - The saved restaurant location and search origin are cleared at the same time.
   - The status prompts the user to enter a new address.
   - The existing address autocomplete flow continues from the now-empty field.

## Cache safety
- `index.html` asset query bumped from v665 to v666.

## Verification scope
Source-level verification only. No live browser/iPhone visual test was available through the connected tools.
