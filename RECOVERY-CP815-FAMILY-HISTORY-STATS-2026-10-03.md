# CP815 Family Mode History + Stats — Recovery Checkpoint
Date: 2026-10-03

Official baseline
- CP806: 35e4ecd30123d42e44b240987573ac16ed609da7

CP815 completed
- Completed Family winners are written through the existing normal recordHistory path.
- Family History entries carry the completed round ID as familyRoundId.
- The local Family saved-round guard prevents the same completed Family round from creating duplicate History entries.
- Because normal Stats are derived from History, the Family winner contributes one normal decision to Stats on that participant device.
- Family Mode does not create a separate Family History or Stats system.

Next
- CP816: recovery from refresh/disconnect, missing members, host transfer, leaving an active decision, and abandoned-round cleanup.
