# P0023 - Raw Data Viewer feature

## Purpose

Add a general Data Viewer feature for inspecting raw portfolio-linked data.

The first supported tables are Calloffs and Transactions.

This is a coding package.

## Context

The app now has application-configuration-specific features. Data Viewer should be a general/debug-style feature that can be available across application configurations, unless the current architecture requires explicit inclusion per app.

The feature is intended for PoC transparency: users can inspect the raw calloff and transaction records created by purchase/hedge flows.

## Feature name

Add feature:

```text
Data Viewer
```

## Availability

Data Viewer should be available for selected portfolios where calloff/transaction data can exist.

Recommended: make it a shared feature across at least:

```text
Baseloads
PeaksModern
```

If app configuration explicitly controls all features, add Data Viewer to both Baseloads and PeaksModern application configurations.

## User flow

1. User selects portfolio.
2. User opens Data Viewer.
3. User selects table:

```text
Calloffs
Transactions
```

4. User selects year.
5. App shows raw rows linked to the selected portfolio and year.

## Controls

Data Viewer controls:

```text
table selector
year selector
```

Table selector values:

```text
Calloffs
Transactions
```

Year selector should be derived from available data if possible. For seed data, support:

```text
2027
2028
2029
```

## Portfolio scoping

All data must be scoped to the selected portfolio.

### Calloffs

Show calloffs where:

```text
Calloff.portfolio_id = selected portfolio_id
```

Filter by year using calloff date.

Follow-up correction: this is a delivery-year selector. Filter calloffs by `delivery_start_month` year, not creation `date` year. Keep creation `date` visible as raw data.

### Transactions

Show transactions linked through calloff:

```text
Transaction.calloff_id -> Calloff.calloff_id
Calloff.portfolio_id = selected portfolio_id
```

Filter by year using Transaction.month.

## Raw table output

The output should show raw-ish columns, not aggregated business report rows.

### Calloffs table columns

Show at least:

```text
calloff_id
product_id
portfolio_id
date
```

If available and easy, also show:

```text
product name
portfolio name
```

But keep raw IDs visible.

### Transactions table columns

Show at least:

```text
transaction_id
calloff_id
month
productcomponent_id
mw
q_factor
```

If available and easy, also show:

```text
component
product name
```

But keep raw IDs visible.

## Sorting

Default sorting:

```text
Calloffs: date ascending, calloff_id ascending
Transactions: month ascending, calloff_id ascending, transaction_id ascending
```

## Empty states

If no portfolio is selected:

```text
Select a portfolio to view data.
```

If no rows exist for selected table/year:

```text
No rows for selected portfolio and year.
```

## Required implementation

Use existing TypeScript and UI conventions.

Suggested modules, adapt to current structure:

```text
src/hedging/dataViewer.ts
src/hedging/DataViewerView.*
tests/hedging/dataViewer.test.ts
```

## Required functions

Add business logic functions separate from UI where practical:

```text
getDataViewerTables
getDataViewerYears
getRawCalloffsForPortfolioYear
getRawTransactionsForPortfolioYear
getDataViewerRows
```

## Validation rules

Reject or clearly handle:

- no selected portfolio,
- unknown table name,
- invalid year,
- data access errors.

Do not show rows from other portfolios.

## Tests

Add tests for:

1. Data Viewer appears in shared/application feature list,
2. Data Viewer renders table selector,
3. Data Viewer renders year selector,
4. Calloffs table shows only calloffs for selected portfolio,
5. Calloffs table filters by calloff date year,
6. Transactions table shows only transactions linked to selected portfolio calloffs,
7. Transactions table filters by transaction month year,
8. Transactions table includes transaction_id, calloff_id, month, productcomponent_id, mw, q_factor,
9. Calloffs table includes calloff_id, product_id, portfolio_id, date,
10. empty state renders when no rows exist,
11. switching selected portfolio changes visible rows,
12. no rows from other portfolios leak into the table.

## Documentation

Create:

```text
docs/hedging/data_viewer.md
```

Document:

```text
purpose of Data Viewer
portfolio scoping
table selector
year selector
Calloffs raw view
Transactions raw view
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
- supported tables,
- portfolio scoping implementation,
- tests added or updated,
- tests run,
- test result,
- REPOSITORY_FILES.md status.
