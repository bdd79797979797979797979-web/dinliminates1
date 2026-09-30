# Recovery Checkpoint — CP397 — Shared Search Taxonomy Collision Found — 2026-09-30

Deep validation found a real semantic edge case:
- "pizzeria" is an alias for both Pizza and Italian.
- The shared alias map previously allowed the later Italian entry to overwrite Pizza.
- This could make Search classify "pizzeria" as Italian instead of Pizza.

Fix planned:
- Preserve first/high-priority alias ownership in ALIAS_TO_TAG; Restaurant Quick Cut taxonomy order places Pizza before Italian.
- Align API fastFoodCount and returned fastFood boolean with the shared classifier tags after merging provider records, so identity exclusions such as Thirsty Goat are reflected consistently.

No other production behavior changes planned in this checkpoint.
