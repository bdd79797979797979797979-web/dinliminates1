# Recovery Checkpoint CP465 — Unified Add Meal Categories + Food Photo Strategy
Date: 2026-09-30

Starting point:
- CP464 / Build 169
- Recovery: `recovery-cp464-before-add-meal-taxonomy-photo-plan-2026-09-30`

Implemented:
- Removed the separate Cuisine selector from Add/Edit Meal.
- Add/Edit Meal now has one shared `Cuisine & Quick Cuts` checkbox field containing the existing 11 categories plus Other.
- The selected categories directly become the meal's Quick Cut associations.
- The primary stored meal category is derived from the selected list; when editing an existing meal, its current category is preserved as primary when still selected.
- Prevents saving a custom meal with no category/Quick Cut selected.
- Updated browser and static QA contracts to expect one shared selector.
- Build 170 / CP465; app cache-busting v465.

Choose-a-Meal photo strategy review:
1. Preserve the existing food identity, ingredients, nutrition, and recipe data; photo changes should not alter meal classification.
2. Use a single visual standard for the 116-photo deck: appetizing real food, close enough to read instantly, natural restaurant/home-lighting, clean backgrounds, and no text/watermarks/packaging unless the item specifically calls for a branded product image.
3. Prioritize the visually weakest/highest-frequency meals first rather than replacing all 116 at once.
4. Prefer one stable canonical image URL per meal, with the existing image proxy/fallback pipeline.
5. Keep food-photo crops consistent with the Tinder card aspect ratio so important food remains centered and not clipped.
6. For custom meals, continue using the dedicated default food image when no photo is supplied.
