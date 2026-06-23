# P0027 Function Design

## Changed Functions

- `canonicalComponentCode`
  - Adds `peak.premium.*` aliases to `peak.*`.

- `createPocSeedData`
  - Emits `peak.sys` and `peak.epad` for canonical Peaks packages.

- `createForecastHedgeTransactions`
  - Writes `peak.sys` and `peak.epad` transactions for new Peaks.Modern calloffs.

- `transactionMwForComponent`
  - Treats `peak.sys`, `peak.epad` and old aliases as the canonical peak MW row.

- `projectLegacyCalloffMonth`
  - Reads `peak.sys`/`peak.epad` first and keeps old aliases for compatibility.

## New Functions

None.

## Removed Functions

None.
