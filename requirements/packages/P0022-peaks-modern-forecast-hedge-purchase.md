# P0022 - PeaksModern forecast-based hedge purchase

## Purpose

Add a PeaksModern feature where the user creates a hedge profile based on a percentage of forecast.

The user selects a start month, end month and percentage. The interface generates an editable hedge profile. The user can then accept the hedge profile, creating a calloff and monthly transactions.

This is a coding package.

## Context

P0021 adds the PeaksModern application page and Forecast feature.

This package adds the next PeaksModern feature: purchase/hedge based on a percentage of forecast.

## Feature name

Add a PeaksModern feature called:

```text
Hedge Forecast
```

or, if the current UI uses shorter labels:

```text
Hedge % of Forecast
```

Use the clearer label in the UI.

## Availability

This feature is available for PeaksModern portfolios only.

It should not be shown for Baseloads portfolios unless later explicitly made shared.

## User flow

1. User selects a PeaksModern portfolio.
2. User opens the Hedge Forecast feature.
3. User selects:

```text
start_month
end_month
percentage
```

4. The application reads forecast rows for the selected portfolio and month range.
5. The application generates a hedge profile.
6. The user can edit the generated monthly hedge profile.
7. The user accepts the hedge profile.
8. The application creates one Calloff and monthly Transaction rows.

## Input fields

```text
start_month
end_month
percentage
```

Rules:

- `start_month` and `end_month` use `YYYY-MM`.
- `end_month` must be greater than or equal to `start_month`.
- `percentage` is a number.
- `percentage` should be displayed as percent, for example `50%`.
- Store/calculate as decimal if that is the existing convention, for example `0.50`.
- Accept percentage values from 0 to 100.
- Reject negative values and values above 100.

## Hedge profile generation

For each month in the selected range:

```text
forecast_mwh = CustomerForecast.mwh
hedge_mwh = forecast_mwh * percentage
```

If percentage is displayed as 50, use 0.50 in calculation.

Convert hedge MWh to monthly average MW using calendar total hours:

```text
hedge_mw = hedge_mwh / calendar.total_h
```

The generated profile rows should include:

```text
month
forecast_mwh
percentage
hedge_mwh
hedge_mw
```

## Editable hedge profile

After generation, show an editable table.

Minimum columns:

```text
Month
Forecast MWh
Hedge %
Hedge MWh
Hedge MW
```

The user must be able to edit at least:

```text
Hedge MWh
```

If simple, also allow editing:

```text
Hedge MW
Hedge %
```

Edits must keep values internally consistent. Choose one editing model and document it.

Recommended simple editing model:

- User edits Hedge MWh.
- Hedge MW recalculates from Hedge MWh / total_h.
- Hedge % recalculates from Hedge MWh / Forecast MWh.

## Accept behavior

When the user accepts the hedge profile, create exactly one Calloff:

```text
calloff_id
product_id
portfolio_id
date
```

Rules:

- `product_id` points to PeaksModern.
- `portfolio_id` is the selected PeaksModern portfolio.
- `date` is current date or deterministic injected date in tests.

Then create monthly Transaction rows.

## Product components to transact

For PeaksModern, the product components are expected to include:

```text
base.sys
base.epad
peak.modern.sys
peak.modern.epad
```

This feature should create hedge transactions for the base components first:

```text
base.sys
base.epad
```

If the existing design can also derive peak.modern component transactions from peak_pct and q-factor, include them only if this is already clear and tested. Otherwise leave peak.modern transactions for a later package.

For this package, prioritize a correct base hedge profile from forecast percentage.

## Transaction creation

For each month and each transacted component, create:

```text
transaction_id
calloff_id
month
productcomponent_id
mw
q_factor
```

`mw` should be the edited hedge MW for that month.

`q_factor` should be read from the PortfolioProductComponent/QFactorSet/QFactorValue for the selected portfolio, product component and month.

For base.sys/base.epad, expected q_factor is 1.0.

## Optional preview values

The UI may show indicative prices if current price API/static derivative prices are easy to use.

Do not block the core flow on price preview.

Core requirement is generating and accepting a hedge profile that creates calloff and transactions.

## Validation rules

Reject:

- non-PeaksModern portfolio,
- missing start month,
- missing end month,
- invalid month format,
- end month before start month,
- missing percentage,
- non-numeric percentage,
- percentage below 0,
- percentage above 100,
- missing forecast row for any selected month,
- missing calendar row for any selected month,
- edited Hedge MWh below 0,
- missing product component for base.sys or base.epad,
- missing q-factor value for any transaction month/component.

## Required implementation

Use existing TypeScript and UI conventions.

Suggested modules, adapt to current structure:

```text
src/hedging/forecastHedge.ts
src/hedging/ForecastHedgeView.*
tests/hedging/forecastHedge.test.ts
```

## Required functions

Add business logic functions separate from UI where practical:

```text
getForecastHedgeMonthRange
buildForecastHedgeProfile
updateForecastHedgeProfileRow
acceptForecastHedgeProfile
createForecastHedgeCalloff
createForecastHedgeTransactions
```

## Tests

Add tests for:

1. PeaksModern feature list includes Hedge Forecast,
2. Baseloads feature list does not include Hedge Forecast,
3. start/end/percentage form renders,
4. generating profile for a 3-month range creates 3 rows,
5. hedge_mwh equals forecast_mwh * percentage,
6. hedge_mw equals hedge_mwh / calendar.total_h,
7. editing Hedge MWh recalculates Hedge MW and Hedge %,
8. accept creates exactly one Calloff,
9. accept creates two transactions per month for base.sys and base.epad,
10. q_factor is read from q-factor values,
11. missing forecast row is rejected,
12. missing calendar row is rejected,
13. invalid percentage is rejected,
14. non-PeaksModern portfolio is rejected.

## Documentation

Create or update:

```text
docs/hedging/peaks_modern_forecast_hedge.md
```

Document:

```text
feature purpose
input fields
forecast-to-hedge formula
editable hedge profile behavior
accept/calloff behavior
transaction creation
q-factor usage
known PoC limitations
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files changed,
- feature availability behavior,
- hedge profile generation logic,
- editable profile behavior,
- calloff/transaction creation behavior,
- tests added or updated,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
