# P0043 consistency review

Status: PASS

P0043 aligns with the current repository state. The code already has a canonical monthly Peaks projection and Data Viewer projected rows, but the projected row contract is partly private to Data Viewer and Position Report still consumes monthly projection fields directly. The package is implementable as a controlled refactor by exposing Classic/Modern projected model rows from the shared Peaks projection module and making reports consume those rows.

Key assumptions:

- `projectPeaksCalloffMonth` remains the deterministic canonical-to-month projection core.
- Projected model transaction rows are read-only output rows and are not persisted as canonical transactions.
- Currency rows stay `currency.eursek` in projected model output and are not treated as MW/MWh.

No sensitive or non-synthetic data is required.
