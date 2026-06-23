# P0031 Findings

## Result

Implemented.

## Notes

- Added `Modern Calloffs` and `Modern Transactions` table options to Data Viewer.
- Existing raw `Calloffs` and `Transactions` views are unchanged.
- `Modern Calloffs` shows Peaks calloffs with `projected_product_package = Peaks.Modern` and value-preservation columns.
- `Modern Transactions` shows projected `base` and `peak` rows with MWh, price and value.
- Projection views use delivery start year filtering.
- Raw canonical transaction MW remains available in the original `Transactions` view.

## Verification

```text
npm test
222 tests, 20 suites, 222 pass, 0 fail
```
