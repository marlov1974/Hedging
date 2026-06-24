# P0042 - Value unit views and SEK reporting

## Purpose

Update Data Viewer, Classic/Modern projected views, Calloff Lists and Position Report to follow the normalized value/unit model introduced in P0041.

This package focuses on making the new currency/component model visible and useful in views and reports.

Core changes:

1. Data Viewer should show all relevant normalized transaction fields correctly.
2. Classic and Modern projected views should include currency transactions.
3. Views should follow the new generic value fields and unit fields.
4. Classic/Modern Calloff List and Position Report should convert EUR power economics to SEK when the selected portfolio currency is SEK, based on the traded `currency.eursek` row and its FX rate.

## Background

P0041 introduced the normalized currency model:

```text
All power transactions are EUR-denominated.
Currency is stored as a separate component transaction.
A SEK commercial calloff is normalized into a EUR power leg and an EUR/SEK currency leg.
```

The target normalized transaction shape is:

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

Derived values such as MWh and value should be calculated in views/projections/reports, not treated as source-of-truth transaction fields.

Currency component:

```text
component_code = currency.eursek
quantity       = actual EUR amount covered by the currency leg
quantity_type  = EUR
price          = SEK per EUR
price_type     = SEK_PER_EUR
factor         = null
factor_type    = null
```

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
- real FX rates,
- copied internal documents.

Use only synthetic examples and neutral terms.

## Required inspection

Review at least:

```text
docs/hedging/currency_component_model.md
docs/hedging/data_viewer.md
docs/hedging/position_report.md
docs/hedging/peaks_classic_calloff_transaction_list.md
docs/hedging/peaks_modern_calloff_transaction_list.md
src/database/types.ts
src/database/schema.ts
src/database/repository.ts
src/database/pocSeedData.ts
src/database/canonicalComponents.ts
src/hedging/dataViewer.ts
src/hedging/classicProjection.ts
src/hedging/modernProjection.ts
src/hedging/peaksCalloffTransactionList.ts
src/hedging/calloffList.ts
src/hedging/positionReport.ts
src/hedging/financialSettlement.ts
src/hedging/marketProjection.ts
tests/database/
tests/hedging/dataViewer.test.ts
tests/hedging/classicProjection.test.ts
tests/hedging/peaksCalloffTransactionList.test.ts
tests/hedging/positionReport.test.ts
tests/hedging/financialSettlement.test.ts
```

Do not assume every file must change. Inspect first and change only where useful.

## 1. Standard view field model

Views that expose transaction/projection rows should use the generic field standard where applicable:

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

Derived fields may be included in views/reports, but they must be clearly derived and must carry explicit units.

Recommended derived field names:

```text
hours
mwh
value_eur
value_sek
fx_rate
coverage_pct
```

Rules:

- Raw/source views should show stored fields first.
- Derived/calculated fields should be visibly separate where practical.
- Do not label a derived value as stored/source-of-truth.
- Do not show MWh for currency rows.
- Do not show MW for currency rows.
- Do not show `currency.eursek` as power exposure.

## 2. Data Viewer update

Update Data Viewer so normalized transaction rows are inspectable without losing important columns.

Minimum raw/canonical columns:

```text
component_code
component_category
period
quantity
quantity_type
price
price_type
factor
factor_type
```

For power rows, derived columns may include:

```text
hours
mwh
value_eur
q_value_eur
```

For currency rows, derived columns may include:

```text
value_sek
coverage_pct
```

Rules:

- Data Viewer must show `currency.eursek` rows when present.
- Data Viewer must not hide `quantity_type`, `price_type` or `factor_type`.
- Data Viewer must not convert all rows into a power-shaped schema.
- Data Viewer should make it obvious when a row is power vs currency.
- Raw/canonical Data Viewer should use source/stored fields plus optional derived fields, not customer-facing SEK-only values.

## 3. Classic and Modern projected views include currency rows

Classic and Modern projected views should include currency transactions where they belong to the same calloff or transaction group.

Rules:

- Classic projected views should include the relevant `currency.eursek` row when the underlying calloff has one.
- Modern projected views should include the relevant `currency.eursek` row when the underlying calloff has one.
- The currency row must retain currency semantics:

```text
quantity_type = EUR
price_type = SEK_PER_EUR
```

- The currency row must not be projected into `classic.*` or `modern.*` power component names.
- The currency row should remain `currency.eursek`.
- The currency row should not contribute to projected MWh.

## 4. SEK conversion for Classic/Modern Calloff List

Classic and Modern Calloff List should convert EUR power economics to SEK when:

```text
portfolio.currency = SEK
```

The conversion must be based on the traded currency transaction and its FX rate:

```text
component_code = currency.eursek
price_type     = SEK_PER_EUR
```

Rules:

- Use the `currency.eursek.price` from the matching calloff/transaction group as FX rate.
- Do not use a generic global settlement quote if a traded currency transaction exists.
- If multiple currency rows exist for the same calloff/period, define deterministic aggregation or fail clearly. Prefer weighted-average SEK_PER_EUR by EUR quantity if multiple rows are intentionally supported.
- If portfolio currency is EUR, Calloff List remains EUR.
- If portfolio currency is SEK and no matching currency row exists, show a clear warning/status rather than silently using 1.0 or hiding the issue.
- The output should identify the display currency.

Recommended Calloff List derived fields:

```text
value_eur
fx_rate
value_sek
display_currency
display_value
display_price
```

For SEK portfolios:

```text
display_currency = SEK
display_value = value_sek
display_price = SEK/MWh-equivalent where applicable
```

For EUR portfolios:

```text
display_currency = EUR
display_value = value_eur
display_price = EUR/MWh
```

## 5. SEK conversion for Classic/Modern Position Report

Classic and Modern Position Report should convert to SEK when:

```text
portfolio.currency = SEK
```

Use the traded `currency.eursek` transaction for the relevant period/calloff scope.

Rules:

- Position Report must still aggregate to one row per month per P0040.
- For SEK portfolios, displayed prices/values should be SEK-based.
- For EUR portfolios, displayed prices/values should remain EUR-based.
- The report should include or expose the FX rate used, at least in a field or detail column if practical.
- If partial FX coverage exists, do not pretend the full power exposure was covered.
- Position Report should distinguish:

```text
power_value_eur
currency_covered_eur
currency_value_sek
uncovered_value_eur
coverage_pct
```

where relevant and practical.

Minimum behavior for partial coverage:

- calculate coverage from `currency.eursek.quantity / power_q_value_eur`,
- show coverage or warning when coverage is not 100 percent,
- convert only the covered EUR amount to SEK using the traded FX rate if the report is meant to reflect traded currency coverage,
- do not silently convert uncovered EUR exposure using the traded rate unless explicitly documented as a display-only approximation.

If a simpler v1 is needed, implement strict behavior:

```text
If portfolio currency is SEK and currency coverage is not 100 percent, show EUR exposure, covered SEK value and coverage warning rather than a single misleading SEK total.
```

## 6. General calculation rules

For power rows:

```text
hours = resolved_hours(component.hour_basis, period)
mwh = quantity * hours
value_eur = mwh * price
q_value_eur = value_eur * factor
```

For currency rows:

```text
currency_value_sek = quantity * price
```

For coverage:

```text
coverage_pct = currency.quantity_eur / scoped_power_q_value_eur
```

Where `factor` is null for power rows, use existing q-factor defaults only if already supported by model; otherwise require explicit factor for power rows.

Where currency row factor is null, do not apply q-factor.

## 7. Data quality and warnings

Add explicit warning/status fields where useful:

```text
missing_currency_row
partial_currency_coverage
multiple_currency_rows
unsupported_currency
```

Warnings should appear in views/reports as data state, not as thrown exceptions, unless the operation cannot be completed safely.

## 8. Documentation updates

Update or cross-link relevant documentation:

```text
docs/hedging/currency_component_model.md
docs/hedging/data_viewer.md
docs/hedging/position_report.md
docs/hedging/peaks_classic_calloff_transaction_list.md
docs/hedging/peaks_modern_calloff_transaction_list.md
docs/hedging/financial_settlement.md
```

Do not duplicate the full currency model in every document.

## Required tests / validation

Add or update tests to validate at least:

1. Data Viewer shows normalized fields: `quantity`, `quantity_type`, `price`, `price_type`, `factor`, `factor_type`.
2. Data Viewer shows `currency.eursek` rows when present.
3. Data Viewer does not show currency rows as MWh/MW power rows.
4. Classic projected view includes relevant `currency.eursek` rows without renaming them to `classic.*`.
5. Modern projected view includes relevant `currency.eursek` rows without renaming them to `modern.*`.
6. Classic Calloff List converts to SEK for SEK portfolio using the matching `currency.eursek.price`.
7. Modern Calloff List converts to SEK for SEK portfolio using the matching `currency.eursek.price`.
8. Classic Position Report converts or reports SEK currency coverage for SEK portfolio.
9. Modern Position Report converts or reports SEK currency coverage for SEK portfolio.
10. EUR portfolio reports remain EUR without requiring currency rows.
11. Partial currency coverage is surfaced explicitly and is not silently treated as 100 percent coverage.
12. Market power projection excludes `currency.eursek`.
13. Existing P0037-P0041 tests still pass.

Prefer focused function/model tests over brittle full HTML snapshots.

## Non-goals

Do not implement real FX sourcing.

Do not introduce real FX rates, real market data, real customers, real counterparties or real trade IDs.

Do not redesign the entire schema if compatibility fields are still needed.

Do not remove the normalized currency model from P0041.

Do not convert currency rows into power rows.

## Expected result

After this package:

- Data Viewer shows all relevant normalized transaction columns correctly.
- Classic and Modern views include currency transactions where relevant.
- Views follow the general value/unit field model.
- Classic/Modern Calloff Lists convert to SEK for SEK portfolios based on traded `currency.eursek` rows.
- Classic/Modern Position Reports convert or clearly report SEK currency coverage for SEK portfolios based on traded currency rows.
- Partial coverage is visible and not hidden.

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
- Data Viewer normalized column behavior,
- Classic/Modern projected currency-row behavior,
- Calloff List SEK conversion behavior,
- Position Report SEK conversion/coverage behavior,
- partial coverage behavior,
- tests added/updated,
- `npm test` result,
- `git diff --check` result,
- `REPOSITORY_FILES.md` status.
