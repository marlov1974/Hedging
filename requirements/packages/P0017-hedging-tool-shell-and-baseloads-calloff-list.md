# P0017 - Hedging tool shell and Baseloads calloff list

## Purpose

Create the first version of a hedging tool UI.

The tool starts with portfolio selection and feature navigation. Each feature works against the selected portfolio.

This is a coding package.

## Context

P0016 created or specified a Baseloads purchase flow. This package wraps that flow inside a broader hedging tool and adds a Baseloads calloff list feature.

## Scope

Build a simple but professional hedging tool web interface with:

```text
portfolio selector
feature menu/navigation
Baseloads purchase feature
Baseloads calloff list feature
```

The tool should be a PoC UI, not production-grade workflow software.

## Portfolio selection

The user first selects a portfolio.

The selected portfolio becomes the active context for all features.

The UI should show at least:

```text
portfolio name
customer name or customer number
price area
product configuration name if available
```

If no portfolio is selected, feature panels should ask the user to select a portfolio first.

## Feature navigation

Create a feature menu with at least two features:

```text
Buy Baseloads
Baseloads Calloff List
```

### Feature 1: Buy Baseloads

Reuse the P0016 Baseloads purchase flow.

The feature should be available only when the selected portfolio is linked to a Baseloads product/customer setup.

If the selected portfolio is not Baseloads, show a clear message rather than failing silently.

### Feature 2: Baseloads Calloff List

Create a calloff list for Baseloads customers.

The list should show all calloffs for the selected portfolio where product configuration is Baseloads.

The list should be split into rows per component.

For Baseloads, one calloff normally contains transactions for:

```text
base.sys
base.epad
```

## Calloff list columns

The calloff list must show these columns:

```text
Datum
Derivatnamn
Component
MWh
Pris
```

Column semantics:

```text
Datum = Calloff.date
Derivatnamn = market-style derivative name for the period/component
Component = product component code, e.g. base.sys or base.epad
MWh = sum of transaction MW converted to MWh for that component
Pris = volume-weighted average price for that component
```

## Derivatnamn / market-style instrument name

The displayed derivative name should look like a Nasdaq/EEX-style derivative name.

Create a deterministic instrument-name helper for this PoC.

The helper should infer period from transaction months:

```text
1 month -> monthly instrument name
3 contiguous months matching a quarter -> quarterly instrument name
12 contiguous months matching a year -> yearly instrument name
```

The helper should include enough information to distinguish:

```text
component
period
price area when relevant
```

If exact public market naming cannot be implemented safely or confidently, implement a clearly documented market-style naming convention and isolate it behind a helper so it can be replaced later.

Do not scatter string formatting across the UI.

Suggested helper:

```text
formatDerivativeName(component, months, priceArea)
```

## MWh calculation

For each calloff and component:

```text
MWh = sum(transaction.mw * calendar.total_h for each transaction month)
```

For Baseloads, use total monthly hours because Baseloads components cover all hours.

If calendar data is missing for a transaction month, return a clear error or display a warning state.

## Price calculation

Pris should be volume-weighted average price for the component.

Preferred source:

```text
transaction price if transaction price exists
otherwise linked Price Component price
otherwise Price API result if already integrated
```

If the current database model does not yet store transaction price, use the linked Price Component price and document the limitation.

Formula:

```text
weighted_price = sum(mwh_i * price_i) / sum(mwh_i)
```

## Required implementation

Use the existing UI and TypeScript conventions.

Suggested modules, adapt to existing structure:

```text
src/hedging/HedgingToolView.*
src/hedging/features.ts
src/hedging/calloffList.ts
src/hedging/derivativeNames.ts
tests/hedging/hedgingTool.test.ts
tests/hedging/baseloadsCalloffList.test.ts
```

## Required functions

Add business logic functions separate from UI where practical:

```text
getPortfolioOptions
getAvailableFeaturesForPortfolio
getBaseloadsCalloffListRows
formatDerivativeName
calculateComponentMwh
calculateWeightedAveragePrice
```

## Validation and behavior

- No portfolio selected: feature area asks user to select portfolio.
- Non-Baseloads portfolio in Baseloads features: show clear not-available message.
- Baseloads portfolio with no calloffs: show empty state.
- Baseloads portfolio with calloffs: show component-split rows.
- Quarter Baseloads calloff from P0016 should render two rows: one for `base.sys`, one for `base.epad`.
- The underlying quarter calloff still has six transactions.

## Tests

Add tests for:

1. hedging tool renders portfolio selector,
2. selecting a portfolio exposes feature navigation,
3. Buy Baseloads feature is available for Baseloads portfolio,
4. Buy Baseloads feature is unavailable for non-Baseloads portfolio,
5. Baseloads Calloff List feature is available for Baseloads portfolio,
6. empty calloff list renders an empty state,
7. quarter calloff renders one row per component,
8. quarter calloff rows aggregate 3 monthly transactions per component,
9. MWh uses transaction MW times calendar total hours,
10. price is volume-weighted average,
11. derivative name helper returns monthly, quarterly and yearly names,
12. UI shows columns Datum, Derivatnamn, Component, MWh and Pris.

## Documentation

Create:

```text
docs/hedging/hedging_tool_shell.md
docs/hedging/baseloads_calloff_list.md
```

Document:

```text
portfolio context
feature navigation
Baseloads purchase feature
Baseloads calloff list feature
component-split rows
MWh aggregation
weighted average price
market-style derivative naming helper
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
- UI entry point,
- features implemented,
- calloff list aggregation rules,
- derivative naming approach,
- tests added,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
