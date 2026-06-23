# P0029 Review

## Consistency Result

PASS.

The updated package is consistent with the P0028 canonical component model. Existing `legacyCalloffList` logic already computes a Classic Peak/Offpeak projection, but its UI shape is row-based by block and it does not implement the Modern Base/Peak projection. P0029 is therefore a controlled projection refactor and feature addition.

## Evidence

- `src/hedging/legacyCalloffList.ts` reads canonical rows and preserves value for Classic projection.
- `src/hedging/applicationConfig.ts` has a Classic-only `legacy-calloff-list` feature and no Modern calloff transaction list.
- `src/hedging/HedgingToolView.ts` renders Classic projection as block rows with extra MWh/Value columns instead of the required calloff-level columns.
- P0028 seed data writes `allocation.peak.sys`, `allocation.peak.epad`, `base.sys`, `base.epad`, `peak.sys` and `peak.epad`.

## Assumptions

- The existing `legacy-calloff-list` feature id can be retained for Peaks.Classic while the visible feature becomes the required transaction list projection.
- Peaks.Modern gets a new feature id for its Base/Peak transaction list.
- Compatibility aliases remain read-only and are handled by projection input selection.
