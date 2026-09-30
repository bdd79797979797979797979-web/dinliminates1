# Recovery Checkpoint — CP383 — Restaurant Quick Cut Classifier Redesign Applied — 2026-09-30

CP382 baseline:
- Deep audit identified identity-vs-menu evidence weakness.
- Quick Cut labels remain: Fast Food, Burgers, Pizza, Mexican, American, Italian, Asian, BBQ, Seafood, Breakfast.

Changes applied:
- Replaced the old single giant keyword field classifier in app.js.
- Added known restaurant identity profiles for stable national/local identities and the Thirsty Goat correction.
- Added provider category/cuisine as higher-priority primary evidence.
- Added stronger restaurant-name identity signals.
- Menu evidence now only corroborates cuisine-type tags and requires at least two distinct signals.
- Fast Food remains an independent tag.
- Added restaurantCuisineEvidence() to the QA test hook for explainability.
- Expanded six-point browser certification with a 16-case association matrix and a weak-menu regression.

Commits:
- Code: 69d76a55065795579f38ea7204ba9ecd57b329de
- QA: cc4348f22cf767a0009e2a2c29b611ce2bb68400
