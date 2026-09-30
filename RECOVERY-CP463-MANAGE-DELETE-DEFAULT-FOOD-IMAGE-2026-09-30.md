# Recovery Checkpoint CP463 — Manage Meals Delete + Default Food Image
Date: 2026-09-30

Starting point:
- CP462 / Build 167
- Recovery: `recovery-cp462-before-manage-delete-default-food-2026-09-30`

Changes:
1. Added a **Delete** action next to Hide/Restore and Edit for **Custom/added meals only** in Manage Meals.
2. Delete asks for confirmation using the app's existing premium confirmation modal.
3. Confirmed deletion removes the custom meal, clears related hidden/cut/maybe state, and deletes its stored photo from IndexedDB.
4. Built-in meals do not receive a Delete action.
5. Added a dedicated `DEFAULT_FOOD_IMAGE` using `./fallback-food.svg`.
6. A newly added meal without an uploaded photo now stores the default food image.
7. A missing stored custom photo now recovers to the default food image instead of the Hungry artwork.
8. Added premium destructive styling for Delete.
9. Build 168 / CP463 and current QA/cache contracts.

Verification:
- App/QA source contracts were re-read after edits.
- Delete is limited to Custom meals.
- Delete uses confirmation and removes stored photo data.
- Default image constant and save/recovery paths are present.

Browser smoke coverage added:
- Existing custom QA Special must expose a Delete action.
- Built-in popcorn must not expose Delete.
- A custom meal created without a photo must persist `./fallback-food.svg`.
- Deletion must open the existing confirmation modal and remove the custom meal after confirmation.
