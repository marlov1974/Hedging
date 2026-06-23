# P0032 Review

## Consistency Result

PASS.

## Evidence

- P0031 added Data Viewer projection ids named `modern-calloffs` and `modern-transactions`.
- P0031 projected transactions currently collapse sys and epad into two rows, `base` and `peak`.
- P0032 requires explicit Modern projected logical views and four projected component rows:
  - `modern.base.sys`
  - `modern.base.epad`
  - `modern.peak.sys`
  - `modern.peak.epad`
- Existing canonical data has the required inputs after P0028: `allocation.peak.sys/epad`, `base.sys/epad`, `peak.sys/epad`.

## Assumptions

- P0031 views should be corrected/superseded in place using clearer ids and labels rather than keeping duplicate old names.
- Existing raw `Calloffs` and `Transactions` views remain unchanged.
- The projected model is derived on demand and not persisted.
