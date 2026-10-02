# CP717 Recovery — Add Note to Manage Meals Editor — 2026-10-02

Added a private **Add a note** field to the **Edit Meal** screen reached from Manage Meals.

Implementation:
- Appears only when editing an existing meal.
- Existing meal note is loaded into the field.
- Note uses the existing `itemNote` / `setItemNote` storage system.
- Notes remain private to the device and use the existing 1200-character limit.
- Existing custom-meal ID renaming logic continues to migrate notes.
- Add Meal form remains unchanged.

QA:
- app.js contains the edit-only `editFoodNote` field.
- Existing note prefill is wired.
- Save path writes through `setItemNote`.
- Dedicated note styling is present.
- JavaScript parses successfully.
- Build metadata is CP717 / 717.
- Service-worker cache is v717.

Branch:
`cp715-restaurant-maybe-home-winner`
