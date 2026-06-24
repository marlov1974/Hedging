# P0041 - Currency portfolio and forecast purchase flow

## Purpose

Build support for portfolio currency and a separate currency component in Peaks purchase/calloff flows.

The normalized currency model is:

```text
All power transactions are EUR-denominated.
Currency is stored as a separate component transaction.
A SEK commercial calloff is normalized into a EUR power leg and an EUR/SEK currency leg.
```

## Required behavior

1. Add portfolio currency. The shared/demo portfolio should use `SEK`.
2. Support generic normalized transaction semantics:
   - `quantity`
   - `quantity_type`
   - `price`
   - `price_type`
   - `factor`
   - `factor_type`
3. Existing `mw` may remain as compatibility for power rows.
4. Power rows use:
   - quantity/MW
   - price/EUR_PER_MWH
   - factor/Q_FACTOR
5. Add currency component:
   - `currency.eursek`
   - category `currency`
   - quantity type `EUR`
   - price type `SEK_PER_EUR`
6. `currency.eursek` must not be treated as MW/MWh or market power exposure.
7. A SEK commercial calloff should normalize into EUR power rows and a currency row.
8. Classic/Modern hedge purchase flows should support explicit purchased quantities, not only percentage of forecast.
9. Reports/projections must avoid summing currency rows as MWh/MW.

## Documentation

Update or link from:

```text
docs/hedging/component_catalog.md
docs/hedging/currency_component_model.md
docs/hedging/peaks_classic_hedge_forecast_flow.md
docs/hedging/peaks_modern_hedge_forecast_flow.md
docs/hedging/position_report.md
docs/hedging/financial_settlement.md
```

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

Update `REPOSITORY_FILES.md` when tracked files are added.
