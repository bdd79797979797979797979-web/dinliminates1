# Recovery CP712 — Full Meal Editing

Date: 2026-10-02
Branch: cp712-full-meal-editing
Audit branch: cp712-audit-full-meal-editing
Baseline: CP711 unified decision rails

## Delivered
- Every built-in meal in the 116-meal catalog now has an Edit action beside Hide/Restore in Manage Meals.
- Built-in edits use local override records keyed to the original meal ID, so the catalog does not duplicate entries.
- Name, cuisine/Quick Cuts, nutrition, description, ingredients, recipe, and photo can be changed through the same editor used by Add Meal.
- Device-uploaded replacement photos use the existing IndexedDB photo storage and survive reload through the existing hydration path.
- Custom-only meals keep Edit + Hide/Restore + Delete behavior.

## Verification
Focused QA: qa/cp712-meal-editing.cjs
Focused workflow: .github/workflows/cp712-meal-editing-qa.yml

Earlier protected checkpoints remain intact: CP705, CP709, CP710, CP711.

## Audit trigger
Focused QA target includes built-in Edit beside Hide, stable IDs, 116-meal no-duplicate merge, and IndexedDB photo replacement path.
