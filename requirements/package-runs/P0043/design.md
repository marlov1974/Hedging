# P0043 implementation design

## Interpretation

P0043 makes Classic and Modern projected models explicit report inputs. The canonical model remains source of truth, but customer-facing Classic/Modern reports should consume projected model rows instead of recreating projection logic locally.

## Intended structure

- Extend `src/hedging/peaksCalloffTransactionList.ts` with exported Classic/Modern projected model row contracts.
- Move Data Viewer's Classic/Modern projected transaction construction into that shared module.
- Keep Data Viewer as a consumer of the shared projected model rows.
- Make Classic/Modern Position Report aggregate shared projected model rows.
- Keep Baseloads logic unchanged except for docs where needed.

## Refactoring boundaries

This package does not change canonical formulas, purchase flows, or market projection semantics. The refactor should preserve current user-facing numbers and warnings.

## Test strategy

- Preserve existing P0037-P0042 tests.
- Add tests proving projected model rows contain report-required normalized fields.
- Add tests for Position Report builders consuming projected model rows directly.
- Keep currency row coverage tests for Classic/Modern projected rows.

## Risks

- Currency coverage and display pricing can shift if projected rows lose `currency.eursek` rows.
- Multi-month calloff aggregation must continue to sum MWh and value-weight prices.
- Existing dirty worktree includes prior package changes; edits must stay scoped and avoid reverting them.
