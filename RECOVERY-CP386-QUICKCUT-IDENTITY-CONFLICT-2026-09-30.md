# Recovery Checkpoint — CP386 — Quick Cut Provider-Identity Conflict Found — 2026-09-30

After CP385, the new architecture exposed one real contradiction:
- Thirsty Goat is represented by the centralized identity profile as Pizza.
- A provider fixture can still send fastFood:true / category Fast Food.
- restaurantIsFastFood() was still allowing that raw provider flag to override the centralized negative identity.
- restaurantCuisineTags() also independently added Fast Food from the raw category text.

Fix:
- Add an identity-level blockFastFood property for known identity corrections.
- restaurantIsFastFood() checks the identity profile before provider fallback.
- restaurantCuisineTags() adds Fast Food only from the normalized fast-food classifier, so a contradictory raw category cannot re-add it.
