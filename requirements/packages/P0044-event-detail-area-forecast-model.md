# P0044 - Event/detail area forecast model

## Purpose

Replace the current calloff/transaction-centric terminology and forecast structure with a more generic event and event detail model.

This package introduces:

1. generic `event` and `event_detail` concepts,
2. forecast stored as canonical forecast events with event details,
3. explicit price-area components replacing generic EPAD components,
4. price area carried on event details/transactions, including SYS purchases,
5. updated Forecast and Hedge Forecast features built on canonical events and projected Classic/Modern views,
6. forecast power quantities stored as MW, with MWh derived in projections and reports,
7. mandatory price-area selection when buying a percentage of forecast in this version.

This is a larger model refactor package. It should preserve public-safe synthetic data only.

## Background

Earlier packages clarified that:

- canonical model is source of truth,
- Classic and Modern are projected models,
- reports should be built from projected models,
- currency is a separate component,
- normalized rows use generic fields such as `quantity`, `quantity_type`, `price`, `price_type`, `factor`, `factor_type`.

The next design step is to generalize the source-of-truth data structure:

```text
Event
EventDetail
Component
```

A forecast is then not a special standalone forecast table and not an initial purchase/calloff. It is an event of type `FORECAST` with component-shaped event details.

Purchases/hedges are also events, but with different event type and usually price/factor fields populated.

Power forecast event details should follow the same canonical quantity principle as other power rows: store MW and derive MWh from the component hour basis and period calendar.

## Safety boundary

Keep all work public-safe and generic.

Do not add:

- real customer names,
- real company names,
- real internal product names,
- real system names,
- real prices,
- real forecasts,
- real FX rates,
- real contract terms,
- copied internal documents.

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

## 1. Rename/source model direction: event and event detail

Introduce or begin migrating toward these canonical concepts:

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

Existing names such as calloff/transaction may remain as compatibility aliases or UI labels where changing all code at once is too large, but the package should establish `event` and `event_detail` as the conceptual source-of-truth vocabulary.

### Event types

Support at least:

```text
FORECAST
PURCHASE
```

Future/reserved event types may include:

```text
ADJUSTMENT
CORRECTION
CANCELLATION
SETTLEMENT
```

Do not implement all future types unless needed.

## 2. Forecast becomes event model

Move forecast source-of-truth into event/event_detail form.

Forecast event:

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

For power forecast event details, the canonical stored quantity must be MW:

```text
quantity_type = MW
```

Forecast rows normally do not need:

```text
price
price_type
factor
factor_type
```

unless the existing PoC requires defaults for compatibility. If compatibility fields are required, keep them null or explicit safe defaults and document the behavior.

Forecast is not a purchase event.

Forecast is not an initial calloff.

Forecast is a source-of-truth exposure estimate event.

## 3. Forecast MW storage and MWh derivation

Forecast power quantities must be stored as MW in canonical event details.

MWh must be derived in Classic/Modern forecast projections, reports, coverage calculations and UI displays.

Canonical rule:

```text
forecast_mwh = forecast_mw * resolved_hours(component.hour_basis, period)
```

Examples:

```text
event_type     = FORECAST
component_code = base.sto
period         = 202701
price_area     = STO
quantity       = 12.5
quantity_type  = MW
```

```text
base_sto_forecast_mwh = 12.5 * total_hours(202701)
```

For peak components:

```text
event_type     = FORECAST
component_code = peak.sto
period         = 202701
price_area     = STO
quantity       = 7.0
quantity_type  = MW
```

```text
peak_sto_forecast_mwh = 7.0 * peak_hours(202701)
```

UI inputs may continue to show or accept MWh if that is clearer for the user. When saving, the UI must convert MWh to MW using the correct hour basis:

```text
stored_mw = input_mwh / resolved_hours(component.hour_basis, period)
```

The source-of-truth event detail should not store forecast MWh for power components unless a compatibility layer is temporarily required. If compatibility is required, it must be documented as derived/legacy and must not become the canonical persisted model.

## 4. Split EPAD into explicit price-area components

Replace generic EPAD components with explicit price-area components.

Target area component names:

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

Current generic names such as:

```text
base.epad
peak.epad
allocation.peak.epad
```

should be treated as deprecated compatibility names or removed from new seed data where safe.

Do not remove compatibility support aggressively if existing tests/fixtures still require it. Prefer explicit aliases or migration notes.

## 5. Component semantics

### Base area components

```text
base.sto
base.mal
base.lul
base.sun
```

Mean:

```text
base area-allocated volume component for the relevant price area
```

They carry total/base MW for the price area.

### Peak area components

```text
peak.sto
peak.mal
peak.lul
peak.sun
```

Mean:

```text
peak area-allocated volume component for the relevant price area
```

They carry peak MW for the price area.

### SYS components

SYS remains the system/portfolio layer:

```text
base.sys
peak.sys
```

But SYS purchase events may still be marked with price area on event details for allocation/reconciliation reasons.

## 6. Price area on event details / transactions

Add or support a `price_area` field on event details/purchase rows.

Reason:

Even if the component is `base.sys`, a SYS purchase may be performed per price area. If a customer buys SYS for all of Sweden, the model should create four SYS purchase details, one per price area, rather than one unallocated SYS row:

```text
base.sys price_area = STO
base.sys price_area = MAL
base.sys price_area = LUL
base.sys price_area = SUN
```

This is needed so the model later knows how SYS should be distributed at settlement/reconciliation.

Reserve the possibility of unmarked SYS rows in the future, but do not make that the default for this package.

Rules:

- `price_area` is required for area components.
- `price_area` should be set for SYS purchase details in this package.
- A future design may allow `price_area = null` for truly unallocated SYS events.
- Reports should distinguish marked SYS rows from unallocated SYS rows if both exist later.

## 7. Price-area forecast model

Forecast should have one event detail per price area and component.

Example Forecast event details:

```text
base.sto period=202701 price_area=STO quantity=<total/base MW> quantity_type=MW
base.mal period=202701 price_area=MAL quantity=<total/base MW> quantity_type=MW
base.lul period=202701 price_area=LUL quantity=<total/base MW> quantity_type=MW
base.sun period=202701 price_area=SUN quantity=<total/base MW> quantity_type=MW

peak.sto period=202701 price_area=STO quantity=<peak MW> quantity_type=MW
peak.mal period=202701 price_area=MAL quantity=<peak MW> quantity_type=MW
peak.lul period=202701 price_area=LUL quantity=<peak MW> quantity_type=MW
peak.sun period=202701 price_area=SUN quantity=<peak MW> quantity_type=MW
```

SYS forecast should be derived as aggregation of area forecast details:

```text
base.sys forecast_mw = sum(base.<area> forecast_mw)
peak.sys forecast_mw = sum(peak.<area> forecast_mw)
```

SYS forecast MWh should be derived from the aggregated MW and the relevant hour basis:

```text
base.sys forecast_mwh = base.sys forecast_mw * total_h
peak.sys forecast_mwh = peak.sys forecast_mw * peak_h
```

Do not store duplicate SYS forecast source rows unless required for compatibility. If stored temporarily, mark them as derived/compatibility and ensure they reconcile to area rows.

## 8. Forecast feature behavior

Update Forecast feature so it shows Classic/Modern views but stores canonical forecast events.

Rules:

- User may view/edit forecast in Classic or Modern perspective.
- Stored source-of-truth forecast is a canonical `FORECAST` event with event details.
- Stored power forecast event details use `quantity_type = MW`.
- Classic forecast view projects canonical forecast event details into Classic structure.
- Modern forecast view projects canonical forecast event details into Modern structure.
- Classic/Modern views may display MWh, but MWh is derived from MW and hours.
- Saving Classic/Modern MWh inputs must convert to canonical MW before storing.
- Switching perspective must not create separate source-of-truth forecasts.
- Data Viewer should be able to show canonical forecast event details and projected Classic/Modern forecast views.

## 9. Hedge Forecast behavior

Update Hedge Forecast to use the new event-based forecast.

Rules:

- Hedge Forecast should read forecast from canonical `FORECAST` events.
- Hedge Forecast should interpret forecast power quantities as MW and derive MWh using the applicable hour basis when needed.
- Hedge/purchase creation should create `PURCHASE` events with event details.
- Buying SYS should occur per price area. Buying SYS for all supported areas should create one `base.sys` or `peak.sys` detail per price area.
- Area purchases should create `base.sto`, `base.mal`, `base.lul`, `base.sun` and/or `peak.*` area details.
- Currency details should continue to use `currency.eursek` where applicable from P0041/P0042.
- Different hedge percentages for SYS and area components must be supported.
- It must be possible to buy 80 percent SYS and 50 percent area components, then later add more area hedges closer to delivery.

## 10. Mandatory price-area selection for percent-of-forecast purchases

In this version, when the user buys a percentage of forecast, the user must choose price area explicitly.

This applies to both Modern and Classic.

This applies to both SYS and area components.

Rules:

- Percent-of-forecast purchase requires `price_area` input.
- The UI must not allow a percent-of-forecast purchase without selected price area.
- The rule applies in both the Modern Hedge Forecast flow and the Classic Hedge Forecast flow.
- The purchase calculation uses the selected price area's forecast event details as the basis.
- For SYS purchases, the created detail uses `component_code = base.sys` or `peak.sys`, but still carries the selected `price_area`.
- For area purchases, the created detail uses the selected area's area component, e.g. `base.sto`, `base.mal`, `peak.sto`, or `peak.mal`.
- Buying a percentage of forecast for several price areas requires one explicit selection/action per price area, or an explicit multi-area UI action that still expands into one purchase detail per selected price area.
- No implicit all-area allocation is allowed in this version.

Reason:

The model must know which price area's forecast was used as the basis for the percent calculation. This is required both for later reconciliation and to avoid creating SYS or area purchase details that cannot be tied back to the selected price-area forecast.

## 11. SYS purchase rule

Default rule for this package:

```text
A SYS purchase is recorded per price area using component_code = base.sys or peak.sys and price_area set to the relevant area.
```

Example:

```text
component_code = base.sys
price_area = STO
quantity = <STO share of SYS purchase>
```

```text
component_code = base.sys
price_area = MAL
quantity = <MAL share of SYS purchase>
```

Why:

```text
The system must know how SYS purchase volume belongs to price areas for later settlement/reconciliation.
```

Open design reservation:

```text
The model may later support unmarked/unallocated SYS rows, but that is not the default in this package.
```

## 12. Projections and reports

Classic and Modern projected models should carry the new event/event_detail and price-area structure.

Projected models should support:

```text
Classic view of forecast events
Modern view of forecast events
Classic view of purchase events
Modern view of purchase events
```

Reports should not lose price-area detail.

Position and coverage reports should be able to show:

```text
SYS forecast MW and MWh by area
SYS hedge MW and MWh by area
area forecast MW and MWh by area
area hedge MW and MWh by area
SYS coverage percent
area coverage percent
remaining/unhedged area exposure
```

## 13. Documentation updates

Update or create concise documentation, likely:

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

Do not duplicate the entire model in every document. Cross-link the main event detail model doc where useful.

## Required tests / validation

Add or update tests to validate at least:

1. event and event_detail structures exist or are represented through compatibility wrappers.
2. forecast is stored as `FORECAST` event with event details.
3. forecast event details support `price_area`.
4. forecast power event details store `quantity_type = MW`.
5. forecast MWh is derived from stored MW and resolved hours.
6. saving Classic/Modern forecast MWh inputs converts to canonical MW.
7. area components `base.sto`, `base.mal`, `base.lul`, `base.sun`, `peak.sto`, `peak.mal`, `peak.lul`, `peak.sun` are recognized.
8. generic EPAD components are no longer used for new forecast seed data.
9. Forecast feature can show Classic view while storing canonical forecast events.
10. Forecast feature can show Modern view while storing canonical forecast events.
11. Hedge Forecast reads canonical forecast events.
12. Hedge Forecast creates purchase events/event details.
13. Percent-of-forecast purchase requires selected price area.
14. The price-area selection rule applies to both Classic and Modern Hedge Forecast flows.
15. SYS purchase for all supported areas creates one SYS detail per price area.
16. SYS details carry `price_area`.
17. Area purchases create area component details.
18. Different SYS and area hedge percentages are allowed.
19. Currency details still work with `currency.eursek`.
20. Classic/Modern projected models carry price-area detail.
21. Existing P0037-P0043 tests still pass or are deliberately updated.

Prefer focused model/function tests over brittle full UI snapshots.

## Non-goals

Do not implement real market data.

Do not introduce real forecasts, customers, counterparties, prices or FX rates.

Do not remove all calloff/transaction compatibility naming if doing so would make the package too large.

Do not implement unallocated SYS rows as default behavior in this package.

Do not redesign currency semantics from P0041/P0042.

Do not keep MWh as the canonical stored power forecast quantity, except as temporary documented compatibility.

Do not allow implicit all-area percent-of-forecast purchases in this package.

## Expected result

After this package:

- source-of-truth data uses or clearly moves toward event/event_detail terminology,
- forecast is represented as canonical forecast events with event details,
- forecast power quantities are stored as MW,
- forecast MWh is derived in Classic/Modern views and reports,
- EPAD generic components are replaced by explicit price-area components,
- forecast is modeled per price area,
- SYS forecast can be derived from area forecast,
- Forecast feature projects canonical events into Classic/Modern views,
- Hedge Forecast creates purchase events from canonical forecast events,
- percent-of-forecast purchases require selected price area in both Classic and Modern,
- SYS purchases are marked per price area,
- the model supports different SYS and area hedge percentages.

## Verification

Run:

```bash
npm test
git status --short
git diff --check
```

If tracked files are added, removed or moved, update `REPOSITORY_FILES.md` to match `git ls-files`.

## Completion report

Report:

- files inspected,
- files changed,
- event/event_detail implementation approach,
- forecast event implementation,
- forecast MW storage and MWh derivation behavior,
- area component implementation,
- EPAD compatibility behavior,
- Forecast feature Classic/Modern projection behavior,
- Hedge Forecast behavior,
- percent-of-forecast price-area selection behavior,
- SYS purchase per price area behavior,
- currency behavior retained/changed,
- tests added/updated,
- `npm test` result,
- `git diff --check` result,
- `REPOSITORY_FILES.md` status.
