# P0018 - Hedging tool minimal layout and position report

## Purpose

Refine the hedging tool UI and add a portfolio position report feature.

This is a coding package.

## Context

P0017 created the first hedging tool shell with portfolio selection, Baseloads purchase flow and Baseloads calloff list.

This package makes the shell more compact and adds a monthly position report.

## UI layout changes

Make the UI more minimalist.

Remove the large page title:

```text
Hedging Tool
```

Remove the subtitle directly below it:

```text
Portfolio based hedging workflow prototype.
```

The selected portfolio name may remain visible, but it should not consume excessive vertical space.

## Portfolio Details feature

Move portfolio details out of the top portfolio card and into its own feature.

Add a feature called:

```text
Portfolio Details
```

This feature should show portfolio information such as:

```text
portfolio name
customer name
customer number
price area
product configuration
calendar id
```

The top portfolio selector should be compact and should not show all details inline.

## Feature navigation

The feature menu should now contain at least:

```text
Buy Baseloads
Baseloads Calloff List
Portfolio Details
Position Report
```

Keep feature labels clear and compact.

## Baseloads Calloff List change

Remove the `Component` column from the Baseloads calloff list UI.

The calloff list should now show:

```text
Datum
Derivatnamn
MWh
Pris
```

The underlying aggregation may still be per component, but the visible UI must not show a separate Component column.

If component distinction is needed in the derivative name, include it in the derivative name helper output rather than a separate column.

## New feature: Position Report

Add a new feature called:

```text
Position Report
```

The report shows the selected portfolio aggregated in monthly resolution per component.

The user selects a year from a dropdown.

The report table columns:

```text
Månad
Volym
Pris
Component
```

Column semantics:

```text
Månad = YYYY-MM
Volym = summed MWh for that month and component
Pris = volume-weighted average price for that month and component
Component = component code
```

## Year dropdown

The year dropdown should be based on available transaction data and/or seed data.

For current PoC data, it should support years in the seeded range, for example:

```text
2027
2028
2029
```

If a selected year has no positions, show an empty state.

## Position aggregation rules

Aggregate Transactions by:

```text
portfolio_id
month
productcomponent_id / component
```

For each group:

```text
Volym = sum(transaction.mw * calendar.total_h)
Pris = sum(mwh_i * price_i) / sum(mwh_i)
```

Use calendar total hours for Baseloads/base components.

If existing logic already has component-specific MWh calculation, reuse it. Otherwise use total monthly hours for this PoC and document the limitation.

Price source priority:

```text
1. transaction price if available
2. linked Price Component price
3. existing Price API result if already wired and deterministic
```

If price is unavailable, show a clear missing-price state rather than silently using zero.

## Required implementation

Use existing UI and TypeScript conventions.

Suggested modules, adapt to current structure:

```text
src/hedging/portfolioDetails.ts
src/hedging/positionReport.ts
src/hedging/HedgingToolView.*
tests/hedging/portfolioDetails.test.ts
tests/hedging/positionReport.test.ts
```

## Required functions

Add business logic functions separate from UI where practical:

```text
getPortfolioDetails
getPositionReportYears
getPositionReportRows
calculateMonthlyComponentPosition
```

## Tests

Add or update tests for:

1. large `Hedging Tool` heading is no longer rendered,
2. subtitle is no longer rendered,
3. top portfolio selector remains visible,
4. portfolio details are shown only in `Portfolio Details` feature,
5. feature menu includes `Portfolio Details`,
6. feature menu includes `Position Report`,
7. Baseloads calloff list does not render `Component` column,
8. position report renders year dropdown,
9. position report aggregates by month and component,
10. position report volume is summed MWh,
11. position report price is volume-weighted average,
12. position report shows empty state for year without positions.

## Documentation

Create or update:

```text
docs/hedging/hedging_tool_shell.md
docs/hedging/position_report.md
docs/hedging/baseloads_calloff_list.md
```

Document:

```text
minimal layout
Portfolio Details feature
Position Report feature
year selection
monthly component aggregation
MWh calculation
weighted average price
Baseloads calloff list column change
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
- UI changes made,
- Portfolio Details feature status,
- Position Report feature status,
- calloff list column change,
- tests added or updated,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
