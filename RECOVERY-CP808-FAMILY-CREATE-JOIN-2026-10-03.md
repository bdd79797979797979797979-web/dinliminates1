# CP808 Family Mode Create / Join — Recovery Checkpoint
Date: 2026-10-03

Baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

Family Mode branch
- family-mode-cp807-from-cp806

CP808 completed
- Family Mode is accessible from the hamburger menu.
- Family screen uses the existing Dinliminate visual shell.
- Entry choices are explicitly Create and Join.
- Create asks only for a display name.
- Join asks for the six-character Family code and display name.
- Family codes display as XXX · XXX.
- A private Family session token is retained only on the participant device.
- Reopening Family Mode restores the saved Family session and refreshes its state.
- Basic persistent lobby shell shows Family code and member list.
- Leave clears this device’s Family session without affecting the Family itself.
- Existing Home, Meals, Restaurants, Winner, History, Settings, and personal state are not replaced by Family Mode state.
- Family Mode uses /api/family and its own local-storage key.

Not yet included
- Host setup controls, dinner target timing UI, and frozen-pool configuration: CP810.
- Shared swipe engine: CP811.
- Automatic timing and progression: CP812.
- Finalists and final decision: CP813–CP814.
