# P0023 implementation design

## Package interpretation

Add a read-only `Data Viewer` feature that lets a user inspect raw calloffs and transactions for the selected portfolio and year.

## Implementation structure

- Add `src/hedging/dataViewer.ts` for scoped raw data selection.
- Add `tests/hedging/dataViewer.test.ts` for table/year behavior and portfolio isolation.
- Update `src/hedging/applicationConfig.ts` to expose Data Viewer in Baseloads and PeaksModern.
- Update `src/hedging/HedgingToolView.ts` to render table/year controls and raw tables.
- Update `src/hedging/server.ts` state parsing for Data Viewer query parameters.
- Add `docs/hedging/data_viewer.md`.
- Update `REPOSITORY_FILES.md` because tracked files are added.

## Portfolio scoping

Calloffs are filtered by:

```text
calloff.portfolio_id = selected portfolio_id
```

Transactions are filtered by:

```text
transaction.calloff_id -> calloff.calloff_id
calloff.portfolio_id = selected portfolio_id
```

No transaction row is returned unless its calloff belongs to the selected portfolio.

## UI behavior

The feature renders table and year selectors. The calloffs table shows raw calloff IDs and core fields. The transactions table shows raw transaction IDs and core fields plus component/product context where available.

## Test strategy

Tests cover feature availability, controls, calloff filtering, transaction filtering, raw columns, empty state, portfolio switching and no cross-portfolio leakage.

## Risks and uncertainties

There are no seed calloffs by default. Tests create synthetic calloffs/transactions in memory before invoking Data Viewer functions or the UI.
