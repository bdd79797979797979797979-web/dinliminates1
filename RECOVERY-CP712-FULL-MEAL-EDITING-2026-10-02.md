# Recovery CP712 — Full Meal Editing

Date: 2026-10-02
Branch: cp712-full-meal-editing
Baseline: CP711 unified decision rails

## Delivered
- Every built-in meal in the 116-meal catalog now has an Edit action beside Hide/Restore in Manage Meals.
- Built-in edits are local overrides keyed to the original meal ID, preventing duplicate meals.
- The shared Add Meal editor is reused for built-in meals.
- Editable fields include meal name, cuisine/Quick Cuts, nutrition, description, ingredients, recipe, and photo.
- Device-uploaded replacement photos use the existing IndexedDB photo storage and the existing hydration path.
- Custom-only meals keep Edit + Hide/Restore + Delete behavior.
- Offline build metadata and the service-worker shell cache are bumped to CP712.

## QA
- Focused QA script: qa/cp712-meal-editing.cjs
- Focused workflow: .github/workflows/cp712-meal-editing-qa.yml
- Audit branch: cp712-audit-full-meal-editing

Earlier protected checkpoints remain intact: CP705, CP709, CP710, CP711.
