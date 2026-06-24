# Data Viewer

For canonical versus projected component-name rules, see [Component Catalog](component_catalog.md).

## Purpose

`Data Viewer` is a read-only PoC transparency feature for inspecting the same portfolio-linked canonical data through raw, projected customer and market/internal views.

Projected rows are model/output rows. They are not persisted source-of-truth transactions.

Related projection documentation:

- [Component Catalog](component_catalog.md)
- [Event Detail Model](event_detail_model.md)
- [Modern Projected Transactions](modern_projected_transactions.md)
- [Modern Projected Calloffs](modern_projected_calloffs.md)
- [Classic Projection Peak/Offpeak Rules](classic_projection_peak_offpeak_rules.md)
- [Component Categories and Projection Listeners](component_categories_and_projection_listeners.md)

The supported table groups are:

```text
Raw canonical
Projected customer models
Market/internal views
```

The supported tables are:

```text
Canonical Raw Calloffs
Canonical Raw Transactions
Canonical Forecast Event Details
Classic Projected Forecast
Modern Projected Forecast
Baseloads Projected Transactions
Classic Projected Calloffs
Classic Projected Transactions
Modern Projected Calloffs
Modern Projected Transactions
Market Projection
```

## Portfolio Scoping

All rows are scoped to the selected portfolio.

Calloffs are included only when:

```text
Calloff.portfolio_id = selected portfolio_id
```

Transactions are included only through selected portfolio calloffs:

```text
Transaction.calloff_id -> Calloff.calloff_id
Calloff.portfolio_id = selected portfolio_id
```

This prevents rows from other portfolios from appearing in the selected portfolio view.

## Table Selector

The table selector supports:

```text
calloffs
transactions
forecast-event-details
classic-projected-forecast
modern-projected-forecast
baseloads-projected-transactions
classic-projected-calloffs
classic-projected-transactions
modern-projected-calloffs
modern-projected-transactions
market-projection
```

Unknown table values are handled as invalid input.

## Year Selector

The year selector is derived from available calendar years and relevant portfolio data. In the current seed data it includes:

```text
2027
2028
2029
```

The year selector is a delivery year selector. Calloffs are filtered by `delivery_start_month` year. Transactions are filtered by transaction `month` year.

Modern projection views are filtered by calloff `delivery_start_month` year.

## Calloffs Raw View

The Calloffs table shows raw IDs and core fields:

```text
calloff_id
product_id
portfolio_id
date
delivery_start_month
delivery_end_month
```

`date` is the call-off creation date. It is visible as raw data but is not used for year filtering.

Default sorting is by delivery start month ascending, delivery end month ascending, then calloff id ascending.

## Transactions Raw View

The Transactions table shows raw IDs and core fields:

```text
transaction_id
calloff_id
month
productcomponent_id
component
component_concept
mw
q_factor
```

The `component_concept` column uses the canonical component code classifier:

```text
canonical
projected
compatibility_alias
reserved
unknown_adjustment
```

Raw canonical rows must not present `modern.*` or `classic.*` component names as persisted source-of-truth rows.

Default sorting is by month ascending, then calloff id ascending, then transaction id ascending.

## Forecast Event Detail Raw View

The Forecast Event Details table shows canonical `FORECAST` event details:

```text
event_id
event_detail_id
event_type
period
component_code
component_concept
price_area
quantity
quantity_type
```

Forecast event details use explicit price-area components such as `base.sto` and `peak.sto`. Generic EPAD forecast details are not written for new seed data.

## Projected Forecast Views

Classic Projected Forecast and Modern Projected Forecast are read-only projections from canonical forecast events.

They do not create separate source-of-truth forecasts.

## Baseloads Projected Transactions View

The Baseloads Projected Transactions table shows derived Baseloads customer rows:

```text
calloff_id
month
component
component_concept
mwh
price
value
source_component
```

`component_concept` is `projected`. The rows are derived from canonical `base.sys` and `base.epad` transactions.

## Classic Projected Calloffs View

The Classic Projected Calloffs table shows Peak/Offpeak customer rows derived from canonical Peaks calloffs.

Allocation rows are inputs to the projection and are not shown as standalone customer rows.

## Modern Projected Calloffs View

The Modern Projected Calloffs table shows Peaks calloffs through the Modern projection lens:

```text
calloff_id
date
period_start
period_end
base_mwh
peak_mwh
base_price
peak_price
base_value
peak_value
total_value
```

`base_mwh` and `peak_mwh` are physical volumes carried by the sys dimension. Sys and epad values are combined into all-in base and peak prices without double-counting physical volume.

## Modern Projected Transactions View

The Modern Projected Transactions table shows projected Base/Peak component rows:

```text
calloff_id
month
component
component_concept
mw
price
value
source_components
warnings
```

The `component` column uses only projected Modern component names:

```text
modern.base.sys
modern.base.epad
modern.peak.sys
modern.peak.epad
```

`component_concept` is `projected`.

The projected rows are derived from canonical Peaks component rows. Allocation rows and canonical component names are not shown as projected component values. They remain visible in the raw Transactions view and may appear in debug-only `source_components`.

## Market Projection View

The Market Projection table uses the market/internal listener semantics:

```text
include base, peak, profile
exclude allocation
```

The table shows:

```text
transaction_id
month
component
component_concept
market_mw
market_mwh
dimension_note
```

If both sys and epad rows are present, they are price dimensions and not additive physical customer volume. The `dimension_note` column states this explicitly.

## Known PoC Limitations

- Data Viewer is read-only.
- It does not export data.
- Empty seed data can show no rows until a purchase or hedge flow creates calloffs and transactions.

## P0042 Normalized Value/Unit Fields

Raw transaction rows expose normalized source fields (`quantity`, `quantity_type`, `price`, `price_type`, `factor`, `factor_type`) plus derived unit fields (`hours`, `mwh`, `value_eur`, `q_value_eur`, `value_sek`, `coverage_pct`).

Classic and Modern projected transaction views keep `currency.eursek` as a currency row. It is not renamed to `classic.*` or `modern.*` and does not contribute to projected MWh.

## P0043 Projected Model Basis

Classic and Modern projected transaction tables are the report basis for their perspectives:

```text
canonical rows -> Classic projected model -> Classic Calloff List / Classic Position Report
canonical rows -> Modern projected model  -> Modern Calloff List / Modern Position Report
```

Reports should consume projected model rows instead of recalculating Classic or Modern quantities directly from raw canonical rows. If a report needs a field that is not available on the projected model, the projected model contract should be extended first.
