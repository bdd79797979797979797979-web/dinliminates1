# Recovery Checkpoint — CP392 — Unified Restaurant Search Semantic QA Ready — 2026-09-30

Added/updated validation:
- Shared taxonomy smoke:
  - category search classification for Pizza, Mexican, Seafood/Fish, Burgers, Breakfast, American, Fast Food
  - named restaurant classification for McDonald's
  - provider alias coverage for Mexican/Taco, Seafood/Fish, Burger/Hamburger
  - shared classifier for McDonald's, Taco Bell, Thirsty Goat, and weak-menu false-positive protection
- Browser six-point certification:
  - true burger restaurant fixture uses cuisine=burger
  - incidental one-burger American restaurant remains non-Burger
  - added semantic searches: fish, pizza restaurant, breakfast restaurant
- Static QA:
  - shared taxonomy loaded before app.js
  - browser and API both consume shared taxonomy
  - API exposes quickCutTags/quickCutEvidence

Production behavior is implemented; release/cache rotation remains pending validation.
