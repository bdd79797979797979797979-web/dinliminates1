# CP811 Family Mode Shared Swiping — Recovery Checkpoint
Date: 2026-10-03

Official baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

CP811 completed
- Added a Family swipe view inside Family Mode.
- Each participant sees the same frozen choice pool and has an independent card position.
- Host exclusions from CP810 are removed before voting begins.
- Saved server-side votes are used to resume after refresh or reconnect.
- Family choices are Cut, Maybe, and Choose.
- Cut is a left swipe; Maybe is a right swipe; Choose is the strong-preference action.
- Completing the initial list submits the participant’s stage and changes the UI to a waiting state.
- Added the host Start deciding control for a setup-locked Family round.
- Family polling continues while the swipe view is active.
- Family vote storage remains separate from normal personal meal/restaurant state.

Next
- CP812: automatic deadline timing, early advance, and no-stuck progression.
