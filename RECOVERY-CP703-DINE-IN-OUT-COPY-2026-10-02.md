# Recovery — CP703 Dine In / Dine Out Copy

Date: 2026-10-02
Build: 703
Checkpoint: CP703
Branch: `cp703-dine-in-out-copy`
Parent: `cp702-note-actions-per-note`

## Change
The Home screen's two primary entry cards now use:

- **Dine In**
  - **Reveal Your Meal**
- **Dine Out**
  - **Reveal Your Restaurant**

The existing `#foodStart` and `#restStart` IDs were preserved, so the existing navigation and decision flows remain wired to the same controls.

## Release alignment
- `app-release.json`: Build 703 / CP703
- `release-manifest.json`: Build 703 / CP703
- `CURRENT-RELEASE.md`: Build 703 / CP703
- `README.md`: current build 703
- `index.html`: app.js cache query advanced to v672
- `app.js`: fallback APP_BUILD advanced to 703

## Verification
Source review confirms the exact Home labels and preserved entry IDs. This checkpoint has not been certified against a deployed Netlify runtime or physical iPhone.
