# P0032 Design

## Package Interpretation

Replace the loose P0031 Modern projections with a formal Modern projected logical model.

The Data Viewer will expose:

```text
Modern Projected Calloffs
Modern Projected Transactions
```

## Implementation Structure

1. Rename projection table ids to `modern-projected-calloffs` and `modern-projected-transactions`.
2. Create per-month Modern projected transaction rows per dimension:
   - `modern.base.sys`
   - `modern.base.epad`
   - `modern.peak.sys`
   - `modern.peak.epad`
3. Preserve canonical sys and epad values per dimension.
4. Aggregate projected transactions to calloff summary rows without double-counting sys and epad physical volume.
5. Render required columns in Data Viewer.
6. Update docs and tests.

## Calculation Strategy

Use canonical input rows directly for each dimension.

For each month and dimension:

```text
modern_base_mw = (B * H - A * Hp) / Ho
modern_peak_mw = A - modern_base_mw
```

Base price is canonical base price for the dimension. Peak price is residual and value-preserving for the dimension.

## Test Strategy

- Table ids and labels.
- Projected transaction column shape and component names.
- Projected MW values are not copied from canonical base/peak rows.
- Per-dimension value preservation.
- Negative peak MW.
- Zero denominator behavior.
- Modern calloff aggregation from projected rows without double-counting sys/epad.
- Raw Data Viewer remains canonical.
