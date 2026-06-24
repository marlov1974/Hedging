# P0040 Design

## Interpretation

P0040 is a UI/reporting cleanup package. It should reduce raw component exposure in normal user-facing views while preserving canonical source-of-truth rows and projections.

## Implementation Structure

- Remove `position` from the visible feature list.
- Normalize legacy `position` route/state to `position-report`.
- Replace raw component Position Report rows with perspective-specific monthly rows.
- Keep lower-level monthly component calculation as a helper for tests and internal reuse.
- Extend Baseloads calloff rows with `synthetic_derivative_name` and `mw`.
- Update derivative naming to produce public-market-style synthetic names.
- Add concise documentation for Position Report and Baseloads Calloff List.

## Deliberate Non-Changes

- Do not change canonical transactions.
- Do not alter Classic or Modern projection formulas.
- Do not change Data Viewer P0039 grouping.
- Do not add real exchange codes, real trade IDs or real market prices.

## Test Strategy

- Update feature menu tests to ensure only `Position Report` is visible.
- Verify legacy `position` request renders Position Report.
- Add Baseloads, Classic and Modern Position Report row-shape tests.
- Verify allocation/raw canonical component names are absent from normal Position Report HTML.
- Update Baseloads calloff list tests for SYS/EPAD rows, MW and synthetic derivative names.

## Risks

- Existing tests that expected raw component rows must be rewritten around the new report contract.
- Classic/Modern reports rely on current projection helpers, so warnings and edge cases stay with those helpers.
