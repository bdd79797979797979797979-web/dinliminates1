# CP812 Family Mode Timing — Recovery Checkpoint
Date: 2026-10-03

Baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

CP812 completed
- Initial Family stage gets a server-side deadline derived automatically from the Dinner by target.
- The timing plan is stored in the frozen round snapshot.
- Family stage advances early when all included members submit.
- Family stage also advances when its deadline expires.
- Missing submissions never block the Family after the deadline.
- The client shows a subtle local countdown and deadline clock.
- Polling continues while Family is on the swipe screen so deadline progression is noticed.

Next
- CP813: Family Finalists calculation, capped finalist list, support threshold, and strongest-support fallback.
