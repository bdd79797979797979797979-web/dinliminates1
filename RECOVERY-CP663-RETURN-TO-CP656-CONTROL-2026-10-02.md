# RECOVERY CP663 — RETURN TO CP656 CONTROL

Date: 2026-10-02

This recovery branch is based exactly on the confirmed-working CP656 commit c6d3179cfdc32bad8df554d375438aeebb9e7f75.

Purpose: isolate the current-location regression after CP662. No post-CP656 application changes are included here except this checkpoint file.

Known-good control: CP656 / Preview 128.

The main/current work remains preserved separately and is not overwritten by this recovery branch.
