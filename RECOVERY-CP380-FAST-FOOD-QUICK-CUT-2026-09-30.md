# Recovery Checkpoint — CP380 — Fast Food Quick Cut Independence — 2026-09-30

Current state:
- Server restaurant hours model smoke: PASS.
- Hours UI All/Open-Unknown assertions: reached and passed in browser certification.
- Browser certification now reaches Quick Cuts.
- Newly exposed real classification issue: restaurantCuisineTags() adds Fast Food only when a restaurant has none of the other cuisine tags.
- This means McDonald's/Taco Bell can have fastFood=true but fail the Fast Food Quick Cut because they also have Burgers/Mexican tags.
- Thirsty Goat remains explicitly excluded from fast food and independently tagged Pizza.

Fix:
- Add Fast Food whenever restaurantIsFastFood(row) is true, independently of other cuisine tags.
- Keep all other cuisine tags so a restaurant can be removed by multiple relevant Quick Cuts.
