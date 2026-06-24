# P0044 - Event/detail area forecast model

## Purpose

Replace the current calloff/transaction-centric terminology and forecast structure with a more generic event and event detail model.

This package introduces:

1. generic `event` and `event_detail` concepts,
2. forecast stored as canonical forecast events with event details,
3. explicit price-area components replacing generic EPAD components for new forecast event details,
4. price area carried on event details, including SYS purchases,
5. updated Forecast and Hedge Forecast behavior built on canonical events with projected Classic/Modern views.

This is a larger model refactor package. It should preserve public-safe synthetic data only.

## Safety boundary

Keep all work public-safe and generic.

Do not add real customer names, real company names, real internal product names, real system names, real prices, real forecasts, real FX rates, real contract terms, copied internal documents, credentials, cookies, session tokens or data dumps.

Use only synthetic examples and neutral terms.

## Required inspection

Review at least:

```text
docs/hedging/component_catalog.md
docs/hedging/currency_component_model.md
docs/hedging/data_viewer.md
docs/hedging/modern_projected_model.md
docs/hedging/classic_projection_peak_offpeak_rules.md
docs/hedging/peaks_classic_forecast_feature.md
docs/hedging/peaks_modern_forecast_feature.md
docs/hedging/peaks_classic_hedge_forecast_flow.md
docs/hedging/peaks_modern_hedge_forecast_flow.md
docs/hedging/position_report.md
src/database/schema.ts
src/database/types.ts
src/database/repository.ts
src/database/pocSeedData.ts
src/database/fixtures.ts
src/database/canonicalComponents.ts
src/database/validation.ts
src/hedging/forecastFeature.ts
src/hedging/forecastHedge.ts
src/hedging/classicProjection.ts
src/hedging/modernProjection.ts
src/hedging/dataViewer.ts
src/hedging/peaksCalloffTransactionList.ts
src/hedging/positionReport.ts
src/hedging/financialSettlement.ts
tests/database/
tests/hedging/
```

Do not assume every listed file must change. Inspect first and change only where useful.

## Model direction

Introduce or begin migrating toward:

```text
event
event_detail
```

Target event fields:

```text
event_id
portfolio_id
event_type
version
created_at / created_order
source
status
```

Target event detail fields:

```text
event_detail_id
event_id
component_code
period
price_area
quantity
quantity_type
price
price_type
factor
factor_type
```

Support at least:

```text
FORECAST
PURCHASE
```

Future event types may include adjustment, correction, cancellation and settlement.

Existing calloff/transaction names may remain as compatibility aliases where changing all code at once is too large.

## Forecast event model

Forecast is an event:

```text
event_type = FORECAST
```

Forecast event details should use component-shaped rows:

```text
component_code
period
price_area
quantity
quantity_type
```

Forecast is not a purchase event and not an initial calloff.

Forecast power quantities must be stored as `quantity_type = MW`.

Forecast `MWh` is a projected/derived customer quantity:

```text
base.<area> MWh = base.<area> MW * calendar.total_h
peak.<area> MWh = peak.<area> MW * calendar.peak_h
```

Forecast UI features may continue to accept and display MWh, but saving forecast source rows must convert MWh to MW before writing canonical event details.

## Price-area components

Replace generic EPAD forecast details with explicit area components:

```text
base.sto
base.mal
base.lul
base.sun
peak.sto
peak.mal
peak.lul
peak.sun
```

Generic names such as:

```text
base.epad
peak.epad
allocation.peak.epad
```

may remain as deprecated compatibility names where existing purchase/report tests require them.

## Price area on details

`price_area` is required for area components.

SYS purchase details should also carry `price_area` in this package. Buying SYS for all supported areas should create one `base.sys` or `peak.sys` detail per price area.

## Forecast feature behavior

Forecast should show Classic and Modern views but store the source model as canonical `FORECAST` events with event details.

Switching perspective must not create separate source-of-truth forecasts.

Data Viewer should be able to show canonical forecast event details and projected Classic/Modern forecast views.

## Hedge Forecast behavior

Hedge Forecast should read forecast from canonical `FORECAST` events.

Accepting a hedge should create a `PURCHASE` event with event details while keeping compatibility calloff/transaction rows where needed.

Currency details should continue to use `currency.eursek`.

Different SYS and area hedge percentages must be supported at model level, even if the current UI flow still uses one percentage.

## Projections and reports

Classic and Modern projected models should continue to carry enough data for customer-facing reports.

Reports should not lose price-area detail in the raw event/detail model.

## Documentation updates

Update or create concise documentation, especially:

```text
docs/hedging/event_detail_model.md
docs/hedging/component_catalog.md
docs/hedging/data_viewer.md
docs/hedging/peaks_classic_forecast_feature.md
docs/hedging/peaks_modern_forecast_feature.md
docs/hedging/peaks_classic_hedge_forecast_flow.md
docs/hedging/peaks_modern_hedge_forecast_flow.md
docs/hedging/position_report.md
```

## Required tests / validation

Add or update focused tests for:

1. event and event_detail structures,
2. forecast stored as `FORECAST` event with event details,
3. forecast event detail power stored as `MW` with MWh derived from calendar hours,
4. `price_area` on forecast event details,
5. area components recognized,
6. generic EPAD components not used for new forecast seed event details,
7. Forecast Classic/Modern views over canonical events,
8. Hedge Forecast reading canonical forecast events,
9. Hedge Forecast creating purchase events/details,
10. SYS purchase details per price area,
11. area purchase details,
12. currency behavior retained,
13. Classic/Modern projected model compatibility,
14. existing P0037-P0043 tests still passing or deliberately updated.

Prefer focused model/function tests over brittle UI snapshots.

## Non-goals

Do not implement real market data.

Do not introduce real forecasts, customers, counterparties, prices or FX rates.

Do not remove all calloff/transaction compatibility naming if doing so would make the package too large.

Do not implement unallocated SYS rows as default behavior in this package.

Do not redesign currency semantics from P0041/P0042.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

If tracked files are added, removed or moved, update `REPOSITORY_FILES.md` to match `git ls-files`.
