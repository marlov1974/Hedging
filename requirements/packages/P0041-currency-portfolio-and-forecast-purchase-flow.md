# P0041 - Currency portfolio and forecast purchase flow

## Purpose

Build support for portfolio currency and a separate currency component in the Peaks purchase/calloff flows.

The package should implement the normalized currency model documented in:

```text
docs/hedging/currency_component_model.md
```

Core model decision:

```text
All power transactions are EUR-denominated.
Currency is stored as a separate component transaction.
A SEK commercial calloff is normalized into a EUR power leg and an EUR/SEK currency leg.
```

## Background

The PoC currently models power components such as:

```text
base.sys
base.epad
peak.sys
peak.epad
```

These should remain power components with EUR-denominated prices.

The new model adds a currency component:

```text
currency.eursek
```

The currency component carries the actual EUR amount covered by the currency leg and the SEK-per-EUR rate.

It is not an MWh/MW component.

## Safety boundary

Keep all work public-safe and generic.

Do not add:

- real customer names,
- real company names,
- real internal product names,
- real system names,
- real prices,
- real forecasts,
- real contract terms,
- copied internal documents.

Use only synthetic examples and neutral terms.

## Required inspection

Review at least:

```text
src/database/schema.ts
src/database/types.ts
src/database/repository.ts
src/database/pocSeedData.ts
src/database/fixtures.ts
src/database/canonicalComponents.ts
src/database/validation.ts
src/hedging/forecastFeature.ts
src/hedging/forecastHedge.ts
src/hedging/modernProjection.ts
src/hedging/classicProjection.ts
src/hedging/peaksCalloffTransactionList.ts
src/hedging/calloffList.ts
src/hedging/positionReport.ts
src/hedging/dataViewer.ts
src/hedging/financialSettlement.ts
tests/database/
tests/hedging/
```

Do not assume every listed file must change. Inspect first and change only where useful.

## 1. Portfolio currency

Add a portfolio currency field to the portfolio data model.

Required behavior:

```text
portfolio.currency = SEK | EUR | other supported ISO currency code later
```

For the shared/demo portfolio, set:

```text
currency = SEK
```

Rules:

- The portfolio currency is the customer-facing/reporting/settlement perspective.
- It does not change the rule that all power transactions are stored as EUR-denominated power economics.
- If portfolio currency is missing in old fixtures, default safely to EUR or SEK only if the existing PoC requires compatibility. Document the chosen compatibility behavior.

## 2. Generic normalized transaction fields

Move transaction thinking toward the generic normalized shape:

```text
component_code
period
quantity
quantity_type
price
price_type
factor
factor_type
```

This package does not have to rename every existing column if that would be too large. However, the implementation should support the semantics:

```text
quantity = stored absolute quantity for the component
price    = component rate/price
factor   = optional value transformation factor
```

Do not store derived MWh or value as source-of-truth transaction fields if they can be calculated deterministically.

If the existing schema still uses `mw`, it may be retained as a compatibility field for power rows in this package, but the package should introduce or document the target generic shape.

## 3. Power transaction semantics

For power components:

```text
component_code in base.sys, base.epad, peak.sys, peak.epad
quantity or mw = MW
quantity_type  = MW
price          = EUR/MWh
price_type     = EUR_PER_MWH
factor         = q-factor
factor_type    = Q_FACTOR
```

Derived values:

```text
hours = resolved_hours(component.hour_basis, period)
mwh = quantity * hours
raw_value_eur = mwh * price
q_value_eur = raw_value_eur * factor
```

Rules:

- Power component transactions are always EUR-denominated.
- Power rows must not store SEK values.
- Q-factor belongs on the power row as a value transformation factor.
- MWh and value should be derived in projections/reports, not stored as source-of-truth transaction values.

## 4. Currency component

Add/support the currency component:

```text
component_code     = currency.eursek
component_category = currency
quantity_type      = EUR
price_type         = SEK_PER_EUR
factor_type        = null
```

Currency row semantics:

```text
quantity = actual EUR amount covered by the currency leg
price    = SEK per EUR rate
```

Derived:

```text
currency_value_sek = quantity * price
```

Rules:

- `currency.eursek` must not be treated as MW or MWh.
- `currency.eursek` must not be included as power exposure in market power projections.
- `currency.eursek` may be shown in raw/internal and customer-facing SEK views.
- The currency leg may cover less than, equal to, or more than the derived EUR power value.
- Do not assume 100 percent FX coverage.

## 5. Normalize SEK commercial calloffs into power and currency legs

If a purchase/calloff is entered or represented as a SEK commercial calloff, normalize it into:

```text
1. EUR power component rows
2. currency.eursek row
```

Example input:

```text
Bought 1200 MWh base.sys for 100000 SEK.
```

With:

```text
period = 202701
total_h = 744
fx_rate = 11.25 SEK_PER_EUR
q_factor = 1
```

Derived and stored power row:

```text
component_code = base.sys
period         = 202701
quantity       = 1.6129
quantity_type  = MW
price          = 7.4074
price_type     = EUR_PER_MWH
factor         = 1
factor_type    = Q_FACTOR
```

Stored currency row:

```text
component_code = currency.eursek
period         = 202701
quantity       = 8888.8889
quantity_type  = EUR
price          = 11.25
price_type     = SEK_PER_EUR
factor         = null
factor_type    = null
```

The actual implementation may use existing field names, but the economic meaning must match this structure.

## 6. Change Classic and Modern purchase flows from forecast percentage

Classic and Modern purchase/hedge flows currently use percentage-of-forecast logic.

Change these flows so they can create normalized calloff/purchase rows using explicit purchased quantities and/or explicit commercial inputs rather than only a percentage of forecast.

Required target behavior:

- Classic purchase flow should support explicit Offpeak/Peak purchase inputs, not only forecast percentage.
- Modern purchase flow should support explicit Base/Peak purchase inputs, not only forecast percentage.
- The flow should still be able to use forecast as a reference/default, but the created purchase/calloff should represent the chosen purchased amount.
- If the selected portfolio currency is SEK, the flow should create or require a currency component row for the EUR/SEK leg.
- If the selected portfolio currency is EUR, no EUR/SEK currency row is required unless the product configuration explicitly includes one.

### Classic flow semantics

Classic inputs should conceptually allow:

```text
offpeak_mwh or offpeak_mw
peak_mwh or peak_mw
prices/rates
q-factor(s)
currency leg when portfolio currency is SEK
```

The stored power rows should still be canonical EUR power components, using the existing Classic-to-canonical conversion rules.

### Modern flow semantics

Modern inputs should conceptually allow:

```text
base_mwh or base_mw
peak_mwh or peak_mw
prices/rates
q-factor(s)
currency leg when portfolio currency is SEK
```

The stored power rows should still be canonical EUR power components, using the existing Modern-to-canonical conversion rules.

## 7. Product configuration

Add `currency.eursek` to the relevant product configuration when the product/portfolio supports SEK-denominated customer settlement or currency purchase separation.

Rules:

- Currency as a component should be configurable.
- Not every product configuration must include currency.
- For the shared demo portfolio configured in SEK, include currency in the relevant Peaks purchase/calloff configuration.

## 8. Reporting and projections

Update projections/reports only as needed to avoid broken behavior.

Minimum expectations:

- Raw/internal views can show `currency.eursek` rows.
- Market power projection excludes `currency.eursek` from power exposure.
- Customer-facing SEK values can be derived from the currency row.
- Position Report and Calloff List should not sum currency rows as MWh or MW.
- Existing P0040 calloff list derivative naming should remain compatible.

## Documentation updates

The package should update or link from:

```text
docs/hedging/component_catalog.md
docs/hedging/currency_component_model.md
docs/hedging/peaks_classic_hedge_forecast_flow.md
docs/hedging/peaks_modern_hedge_forecast_flow.md
docs/hedging/position_report.md
docs/hedging/financial_settlement.md
```

Do not duplicate the full currency model everywhere. Link to `currency_component_model.md` where useful.

## Required tests / validation

Add or update tests to validate at least:

1. portfolio supports a currency field.
2. shared/demo portfolio is configured as SEK.
3. `currency.eursek` is recognized as a currency component.
4. `currency.eursek` stores quantity as EUR amount and price as SEK_PER_EUR.
5. power rows remain EUR-denominated and use MW, EUR_PER_MWH and Q_FACTOR semantics.
6. derived power MWh/value calculations still work without storing MWh/value as source-of-truth.
7. SEK commercial calloff example can be normalized into one power leg and one currency leg.
8. partial currency coverage is allowed and does not fail validation.
9. market power projection excludes currency rows.
10. Classic purchase flow no longer requires percentage-of-forecast as the only purchase mechanism.
11. Modern purchase flow no longer requires percentage-of-forecast as the only purchase mechanism.
12. existing P0037-P0040 tests still pass.

Prefer focused model/function tests over brittle UI snapshots.

## Non-goals

Do not implement real FX sourcing.

Do not introduce real market prices, real FX rates, real customer names, real trade IDs or real counterparty data.

Do not redesign the entire database if a smaller compatibility step can deliver the package.

Do not remove forecast from the UI entirely; forecast may remain as a reference/default. The change is that Classic and Modern purchase flows should create explicit purchased quantities, not only percentage-of-forecast rows.

## Expected result

After this package:

- portfolios can carry a currency field,
- the shared demo portfolio is SEK,
- currency is represented as `currency.eursek`,
- all power transactions remain EUR-normalized,
- SEK commercial purchases can be separated into EUR power and currency legs,
- Classic and Modern purchase flows can create explicit purchases instead of only percent-of-forecast purchases,
- projections do not treat currency as power volume.

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
- portfolio currency implementation,
- currency component implementation,
- Classic purchase flow change,
- Modern purchase flow change,
- SEK commercial calloff normalization behavior,
- tests added/updated,
- `npm test` result,
- `git diff --check` result,
- `REPOSITORY_FILES.md` status.
