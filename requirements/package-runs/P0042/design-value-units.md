# P0042 value unit views design

## Interpretation

Expose P0041 normalized transaction fields and make customer-facing Classic/Modern reporting currency-aware for SEK portfolios.

## Implementation structure

- Add a small hedging view-economics module for:
  - resolving transaction component codes and categories,
  - deriving stored normalized fields and power/currency economics,
  - calculating calloff/month currency coverage and display currency values.
- Update Data Viewer raw transactions to include:
  - `component_code`, `component_category`, `period`,
  - stored `quantity`, `quantity_type`, `price`, `price_type`, `factor`, `factor_type`,
  - derived `hours`, `mwh`, `value_eur`, `q_value_eur`, `value_sek`, `coverage_pct`.
- Update Modern projected transaction rows to append `currency.eursek` rows without renaming them to modern projected power components.
- Add Classic projected transaction rows for Data Viewer so Classic projection can also show `currency.eursek` rows without converting them to classic power components.
- Update Classic/Modern calloff transaction lists with display currency fields:
  - `value_eur`, `fx_rate`, `value_sek`, `display_currency`, `display_value`, `display_price`, `coverage_pct`.
- Update Classic/Modern Position Report rows with the same display currency and coverage signals.
- Update HTML tables with the new display currency, value, FX and coverage fields.
- Update docs with short cross-links rather than duplicating the full currency model.

## Deliberate refactoring

Create shared helpers instead of duplicating FX coverage and normalized transaction calculations in Data Viewer, calloff lists and position reports.

## Test strategy

Add focused tests for normalized Data Viewer fields, projected currency-row preservation, SEK conversion, partial coverage warnings, and market projection currency exclusion. Run the full suite because reporting types and HTML tables are shared.

## Out of scope

No real FX source, production FX coverage policy, schema rewrite, or conversion of currency rows into power rows.
