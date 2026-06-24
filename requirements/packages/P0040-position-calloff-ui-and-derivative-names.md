# P0040 - Position, calloff UI and derivative naming fixes

## Purpose

Clean up duplicated position features, simplify the Position Report output, and add synthetic derivative names to Baseloads calloff rows using public market-style derivative terminology.

## Required changes

1. Remove `Position` as a separate feature. Keep `Position Report`; legacy `position` requests should map to `position-report`.
2. Position Report should return one aggregated row per month for the selected perspective.
3. Baseloads Position Report columns:
   - `month`
   - `base_sys_mwh`
   - `base_epad_mwh`
   - `base_sys_price`
   - `base_epad_price`
4. Classic Position Report columns:
   - `month`
   - `offpeak_mwh`
   - `peak_epad_mwh`
   - `offpeak_price`
   - `peak_price`
5. Modern Position Report columns:
   - `month`
   - `base_mwh`
   - `peak_epad_mwh`
   - `base_price`
   - `peak_price`
6. Normal Position Report must not show raw canonical component rows or allocation rows.
7. Baseloads Calloff List should show two rows per calloff: SYS and EPAD.
8. Baseloads Calloff List columns:
   - `date`
   - `synthetic_derivative_name`
   - `mwh`
   - `mw`
   - `price`
9. Add deterministic synthetic derivative naming based on public Nordic power derivative terminology:
   - system/base-load row: Nordic Electricity Base Load Future
   - EPAD row: Nordic Electricity EPAD with price area when available
   - period type Month / Quarter / Year when derivable
10. Keep all data synthetic and generic. Do not use real exchange product codes unless verified from public sources.

## Documentation

Update:

```text
docs/hedging/position_report.md
docs/hedging/baseloads_calloff_list.md
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` when tracked files are added.
