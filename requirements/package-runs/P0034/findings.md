# P0034 Findings

## Result

Implemented universal perspective navigation for the Hedging PoC.

## Notes

- The selected portfolio is preserved while switching Baseloads, Classic and Modern perspectives.
- Feature visibility is perspective-driven for the demo layer.
- Canonical calloffs and transactions remain source of truth.
- Baseloads, Classic and Modern Data Viewer options are projected views and are not inserted as raw transactions.
- Classic projected Data Viewer is currently a calloff projection view, not separate projected transaction rows.

## Verification

- `npm test` passed: 235 tests, 20 suites.
